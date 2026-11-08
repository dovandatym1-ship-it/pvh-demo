-- PH02 / M01: canonical, atomic workflow on top of the PH01 cloud baseline.
-- This migration is NOT applied to the production Supabase project by a Git push.

alter table public.work_items
  add column workflow_version integer not null default 1 check (workflow_version > 0),
  add column source_ref text check (source_ref is null or length(btrim(source_ref)) between 1 and 500);

-- Supports tenant-scoped server paging and overdue counts without full scans.
create index work_items_tenant_created_at_idx on public.work_items(tenant_id,created_at desc);
create index work_items_open_due_idx on public.work_items(tenant_id,due_date)
  where due_date is not null and status not in ('COMPLETED','CANCELLED');

alter table public.evidence_files
  add column status text not null default 'PENDING' check (status in ('PENDING','UPLOADED')),
  add column content_type text,
  add column size_bytes bigint check (size_bytes is null or size_bytes between 1 and 52428800),
  add column claimed_sha256 text check (claimed_sha256 is null or claimed_sha256 ~ '^[0-9a-f]{64}$');

-- PH01 did not track upload completion. Preserve existing objects that were
-- actually uploaded; missing objects remain PENDING and cannot be downloaded.
update public.evidence_files f
set status = 'UPLOADED',
    size_bytes = nullif(o.metadata->>'size','')::bigint,
    content_type = o.metadata->>'mimetype'
from storage.objects o
where o.bucket_id = 'evidence' and o.name = f.object_path
  and o.owner_id = f.uploaded_by::text
  and (o.metadata->>'size') ~ '^[0-9]+$'
  and (o.metadata->>'size')::bigint between 1 and 52428800
  and o.metadata->>'mimetype' in
    ('application/pdf','image/png','image/jpeg',
     'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

-- These helpers are private: assignment and review eligibility must be checked
-- against the *recipient's* live membership, not only the acting manager's role.
create function pvh_private.member_has_work_permission(
  p_tenant uuid, p_user uuid, p_permission text
) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships m
    join public.membership_roles mr on mr.membership_id = m.id
    join public.role_permissions rp on rp.role_code = mr.role_code
    join public.module_entitlements ent on ent.tenant_id = m.tenant_id
      and ent.module_key = 'm01' and ent.enabled
    where m.tenant_id = p_tenant and m.user_id = p_user
      and m.is_active and m.valid_from <= now()
      and (m.valid_to is null or m.valid_to > now())
      and rp.permission_code = p_permission
  );
$$;

create function pvh_private.is_eligible_work_assignee(
  p_tenant uuid, p_user uuid, p_hamlet uuid
) returns boolean language sql stable security definer set search_path = '' as $$
  select pvh_private.member_has_work_permission(p_tenant,p_user,'m01:work:read')
    and pvh_private.member_has_work_permission(p_tenant,p_user,'m01:work:update')
    and exists (
      select 1 from public.memberships m
      where m.tenant_id=p_tenant and m.user_id=p_user
        and m.is_active and m.valid_from<=now()
        and (m.valid_to is null or m.valid_to>now())
        and (not (coalesce(m.scopes,'{}'::jsonb) ? 'org_unit_ids')
          or exists(select 1 from jsonb_array_elements_text(m.scopes->'org_unit_ids') s(value)
                    where s.value=p_hamlet::text))
    );
$$;

create function pvh_private.is_eligible_work_collaborator(
  p_tenant uuid, p_user uuid, p_hamlet uuid
) returns boolean language sql stable security definer set search_path = '' as $$
  select pvh_private.member_has_work_permission(p_tenant,p_user,'m01:work:read')
    and exists (
      select 1 from public.memberships m
      where m.tenant_id=p_tenant and m.user_id=p_user
        and m.is_active and m.valid_from<=now()
        and (m.valid_to is null or m.valid_to>now())
        and (not (coalesce(m.scopes,'{}'::jsonb) ? 'org_unit_ids')
          or exists(select 1 from jsonb_array_elements_text(m.scopes->'org_unit_ids') s(value)
                    where s.value=p_hamlet::text))
    );
$$;

create function pvh_private.validate_work_assignee()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.assigned_to is not null and not pvh_private.is_eligible_work_assignee(
    new.tenant_id,new.assigned_to,new.hamlet_id) then
    raise exception 'INVALID_ASSIGNEE_OR_SCOPE' using errcode='22023';
  end if;
  return new;
end; $$;
-- Protects both PH01 create_work_item and PH02 reassignment (including future RPCs).
create trigger work_item_assignee_guard before insert or update of assigned_to,hamlet_id
  on public.work_items for each row execute function pvh_private.validate_work_assignee();

-- A pending registration is authorized for upload but not for read/download.
create or replace function pvh_private.can_access_evidence(p_path text,p_action text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.evidence_files f
    where f.object_path=p_path
      and (p_action<>'read' or f.status='UPLOADED')
      and pvh_private.can_access_work(f.tenant_id,f.work_item_id,p_action));
$$;

-- A browser may inspect/delete only its own pending upload, allowing safe
-- retries and cleanup. Other users never see PENDING files.
create policy pvh_evidence_pending_owner_read on storage.objects for select to authenticated
  using(bucket_id='evidence' and owner_id=(select auth.uid())::text
    and exists(select 1 from public.evidence_files f where f.object_path=name
      and f.status='PENDING' and f.uploaded_by=(select auth.uid())
      and pvh_private.can_access_work(f.tenant_id,f.work_item_id,'update')));
create policy pvh_evidence_pending_owner_delete on storage.objects for delete to authenticated
  using(bucket_id='evidence' and owner_id=(select auth.uid())::text
    and exists(select 1 from public.evidence_files f where f.object_path=name
      and f.status='PENDING' and f.uploaded_by=(select auth.uid())
      and pvh_private.can_access_work(f.tenant_id,f.work_item_id,'update')));

create table public.work_item_assignments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  work_item_id uuid not null,
  previous_assignee uuid references auth.users(id) on delete restrict,
  assignee uuid not null references auth.users(id) on delete restrict,
  actor_id uuid not null references auth.users(id) on delete restrict,
  reason text,
  work_item_version integer not null check (work_item_version > 0),
  created_at timestamptz not null default now(),
  foreign key (tenant_id, work_item_id)
    references public.work_items(tenant_id, id) on delete restrict,
  unique (work_item_id, work_item_version)
);
create index work_item_assignments_work_idx
  on public.work_item_assignments(tenant_id, work_item_id, created_at);
create index work_item_assignments_assignee_idx
  on public.work_item_assignments(tenant_id, assignee);
create index work_item_assignments_actor_idx on public.work_item_assignments(actor_id);
create index work_item_assignments_previous_idx on public.work_item_assignments(previous_assignee);

create table public.work_item_collaborators (
  tenant_id uuid not null,
  work_item_id uuid not null,
  user_id uuid not null references auth.users(id) on delete restrict,
  added_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key(tenant_id,work_item_id,user_id),
  foreign key(tenant_id,work_item_id) references public.work_items(tenant_id,id) on delete restrict
);
create index work_item_collaborators_user_idx on public.work_item_collaborators(tenant_id,user_id);

-- PH01 visibility was creator/assignee/read_all only; collaborators may now
-- READ within their existing org scope, but cannot UPDATE or REVIEW by joining.
create or replace function pvh_private.can_access_work(p_tenant uuid,p_id uuid,p_action text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.work_items w
    join public.memberships m on m.tenant_id=w.tenant_id and m.user_id=auth.uid()
    where w.tenant_id=p_tenant and w.id=p_id
      and pvh_private.has_permission(p_tenant,'m01:work:'||p_action)
      and (pvh_private.has_permission(p_tenant,'m01:work:'||p_action||'_all')
        or ((w.created_by=auth.uid() or w.assigned_to=auth.uid()
          or (p_action='read' and exists(select 1 from public.work_item_collaborators c
            where c.tenant_id=w.tenant_id and c.work_item_id=w.id and c.user_id=auth.uid())))
          and (not(m.scopes ? 'org_unit_ids') or exists(
            select 1 from jsonb_array_elements_text(m.scopes->'org_unit_ids') s(value)
            where s.value=w.hamlet_id::text)))));
$$;

alter table public.work_item_collaborators enable row level security;
alter table public.work_item_collaborators force row level security;
revoke all on public.work_item_collaborators from public,anon,authenticated;
grant select on public.work_item_collaborators to authenticated;
create policy collaborator_work_read on public.work_item_collaborators for select to authenticated
  using(pvh_private.can_access_work(tenant_id,work_item_id,'read'));

-- Transactional in-app notifications; no external email/SMS is sent.
create table public.work_item_inbox (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  work_item_id uuid not null,
  recipient_id uuid not null references auth.users(id) on delete restrict,
  event_version integer not null,
  kind text not null check (kind in ('ASSIGNED','REVIEW_REQUESTED','RETURNED','COMPLETED','CANCELLED','DETAILS_UPDATED','COLLABORATOR_ADDED')),
  created_at timestamptz not null default now(),
  foreign key (tenant_id,work_item_id) references public.work_items(tenant_id,id) on delete restrict,
  unique (tenant_id,work_item_id,recipient_id,event_version,kind)
);
create index work_item_inbox_user_idx
  on public.work_item_inbox(tenant_id,recipient_id,created_at desc);
create index work_item_inbox_recipient_idx on public.work_item_inbox(recipient_id);
alter table public.work_item_inbox enable row level security;
alter table public.work_item_inbox force row level security;
revoke all on public.work_item_inbox from public,anon,authenticated;
grant select on public.work_item_inbox to authenticated;
create policy inbox_own_read on public.work_item_inbox for select to authenticated
  using(recipient_id=(select auth.uid()) and tenant_id in (select app.user_tenant_ids()));
create trigger immutable_inbox before update or delete or truncate on public.work_item_inbox
  for each statement execute function pvh_private.reject_log_mutation();

-- Read markers live outside the append-only notification log. Marking an item
-- read does not rewrite or destroy the original business event.
create table public.work_item_inbox_reads (
  inbox_id uuid primary key references public.work_item_inbox(id) on delete restrict,
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  recipient_id uuid not null references auth.users(id) on delete restrict,
  read_at timestamptz not null default now()
);
create index work_item_inbox_reads_user_idx
  on public.work_item_inbox_reads(tenant_id,recipient_id,read_at desc);
alter table public.work_item_inbox_reads enable row level security;
alter table public.work_item_inbox_reads force row level security;
revoke all on public.work_item_inbox_reads from public,anon,authenticated;
grant select on public.work_item_inbox_reads to authenticated;
create policy own_inbox_receipts on public.work_item_inbox_reads for select to authenticated
  using(recipient_id=(select auth.uid()) and tenant_id in(select app.user_tenant_ids()));
create trigger immutable_inbox_reads before update or delete or truncate on public.work_item_inbox_reads
  for each statement execute function pvh_private.reject_log_mutation();

create table public.work_item_mutation_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  actor_id uuid not null references auth.users(id) on delete restrict,
  idempotency_key text not null check (length(btrim(idempotency_key)) between 1 and 200),
  request_hash text not null,
  response jsonb not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, actor_id, idempotency_key)
);
create index work_item_mutation_requests_actor_idx
  on public.work_item_mutation_requests(actor_id);

-- The DB is the authoritative source for allowed transitions and rule revision.
create table public.work_item_transition_rules (
  rule_version integer not null,
  from_status text not null,
  to_status text not null,
  required_permission text not null,
  actor_scope text not null check (actor_scope in ('ASSIGNEE', 'REVIEWER', 'MANAGER')),
  requires_reason boolean not null default false,
  requires_evidence boolean not null default false,
  primary key (rule_version, from_status, to_status)
);
insert into public.work_item_transition_rules values
  (1,'NEW','ASSIGNED','m01:work:assign','MANAGER',false,false),
  (1,'ASSIGNED','IN_PROGRESS','m01:work:update','ASSIGNEE',false,false),
  (1,'IN_PROGRESS','UNDER_REVIEW','m01:work:update','ASSIGNEE',false,true),
  (1,'UNDER_REVIEW','RETURNED','m01:work:review','REVIEWER',true,false),
  (1,'RETURNED','IN_PROGRESS','m01:work:update','ASSIGNEE',false,false),
  (1,'UNDER_REVIEW','COMPLETED','m01:work:review','REVIEWER',false,false),
  (1,'NEW','CANCELLED','m01:work:assign','MANAGER',true,false),
  (1,'ASSIGNED','CANCELLED','m01:work:assign','MANAGER',true,false),
  (1,'IN_PROGRESS','CANCELLED','m01:work:assign','MANAGER',true,false),
  (1,'RETURNED','CANCELLED','m01:work:assign','MANAGER',true,false),
  (1,'UNDER_REVIEW','CANCELLED','m01:work:assign','MANAGER',true,false);

alter table public.work_item_assignments enable row level security;
alter table public.work_item_assignments force row level security;
revoke all on public.work_item_assignments from public, anon, authenticated;
grant select on public.work_item_assignments to authenticated;
create policy work_assignment_read on public.work_item_assignments
  for select to authenticated
  using (pvh_private.can_access_work(tenant_id, work_item_id, 'read'));

alter table public.work_item_mutation_requests enable row level security;
alter table public.work_item_mutation_requests force row level security;
revoke all on public.work_item_mutation_requests from public, anon, authenticated;

alter table public.work_item_transition_rules enable row level security;
alter table public.work_item_transition_rules force row level security;
revoke all on public.work_item_transition_rules from public, anon, authenticated;
grant select on public.work_item_transition_rules to authenticated;
create policy workflow_rules_read on public.work_item_transition_rules
  for select to authenticated
  using (exists(select 1 from app.user_tenant_ids()));

create trigger immutable_assignments before update or delete or truncate
  on public.work_item_assignments for each statement
  execute function pvh_private.reject_log_mutation();
create trigger immutable_mutation_requests before update or delete or truncate
  on public.work_item_mutation_requests for each statement
  execute function pvh_private.reject_log_mutation();

-- Existing PH01 create RPC writes a task atomically but did not record the
-- initial assignment. A trigger records it in the same transaction.
create function pvh_private.record_initial_assignment()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.assigned_to is not null then
    insert into public.work_item_assignments
      (tenant_id,work_item_id,previous_assignee,assignee,actor_id,work_item_version)
    values (new.tenant_id,new.id,null,new.assigned_to,new.created_by,new.version);
  end if;
  return new;
end; $$;
create trigger work_item_initial_assignment after insert on public.work_items
  for each row execute function pvh_private.record_initial_assignment();

-- Populate assignment history for existing tasks without claiming an
-- event occurred at migration time.
insert into public.work_item_assignments
  (tenant_id,work_item_id,previous_assignee,assignee,actor_id,work_item_version,created_at)
select tenant_id,id,null,assigned_to,created_by,1,created_at
from public.work_items where assigned_to is not null;

-- Wrap PH01 create in the same database transaction so source_ref is recorded
-- before the response. On replay, detect changes to source_ref even though the
-- PH01 request hash predates this additional structured field.
create function app.create_work_item_v2(
  p_idempotency_key text,p_title text,p_description text,p_priority text,
  p_assigned_to uuid,p_due_date timestamptz,p_category text,p_hamlet_id uuid,
  p_tenant_id uuid,p_source_ref text
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_original jsonb; v_id uuid; v_source_ref text; v_current text; v_result jsonb;
begin
  v_source_ref:=nullif(btrim(p_source_ref),'');
  if p_source_ref is not null and (v_source_ref is null or length(v_source_ref)>500) then
    raise exception 'VALIDATION: source reference invalid' using errcode='22023';
  end if;
  v_original:=app.create_work_item(p_idempotency_key,p_title,p_description,p_priority,
    p_assigned_to,p_due_date,p_category,p_hamlet_id,p_tenant_id);
  v_id:=(v_original->>'id')::uuid;
  select source_ref into v_current from public.work_items where id=v_id for update;
  if coalesce((v_original->>'cached')::boolean,false) then
    if v_current is distinct from v_source_ref then
      raise exception 'IDEMPOTENCY_CONFLICT' using errcode='PV409';
    end if;
  else
    update public.work_items set source_ref=v_source_ref where id=v_id;
  end if;
  select to_jsonb(w) into v_result from public.work_items w where w.id=v_id;
  if coalesce((v_original->>'cached')::boolean,false) then
    return v_result || jsonb_build_object('cached',true);
  end if;
  return v_result;
end; $$;

-- Do not expose membership lists to ordinary read roles; allow only an
-- actor with the explicit assignment capability to discover viable assignees.
create function app.list_work_assignees(p_work_item_id uuid default null)
returns table(user_id uuid, full_name text, allowed_hamlets text[])
language plpgsql stable security definer set search_path = '' as $$
declare v_tenant uuid; v_hamlet uuid;
begin
  if auth.uid() is null then raise exception 'UNAUTHENTICATED' using errcode = '28000'; end if;
  select id into strict v_tenant from public.tenants;
  if not pvh_private.has_permission(v_tenant,'m01:work:assign') then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_work_item_id is not null then
    select w.hamlet_id into v_hamlet from public.work_items w
      where w.id=p_work_item_id and w.tenant_id=v_tenant;
    if not found or not pvh_private.can_access_work(v_tenant,p_work_item_id,'read') then
      raise exception 'FORBIDDEN_SCOPE' using errcode='42501';
    end if;
  end if;
  return query
  select m.user_id,p.full_name,
    case when coalesce(m.scopes,'{}'::jsonb) ? 'org_unit_ids' then
      array(select jsonb_array_elements_text(m.scopes->'org_unit_ids'))
    else null::text[] end as allowed_hamlets
  from public.memberships m
  join public.profiles p on p.id=m.user_id and p.tenant_id=m.tenant_id
  where m.tenant_id=v_tenant and m.is_active and m.valid_from<=now()
    and (m.valid_to is null or m.valid_to>now())
    and pvh_private.member_has_work_permission(v_tenant,m.user_id,'m01:work:read')
    and pvh_private.member_has_work_permission(v_tenant,m.user_id,'m01:work:update')
    and (p_work_item_id is null or
      pvh_private.is_eligible_work_assignee(v_tenant,m.user_id,v_hamlet))
  order by p.full_name;
end; $$;

create function app.list_work_collaborator_candidates(p_work_item_id uuid)
returns table(user_id uuid,full_name text)
language plpgsql stable security definer set search_path='' as $$
declare v_tenant uuid; v_item public.work_items%rowtype;
begin
  if auth.uid() is null then raise exception 'UNAUTHENTICATED' using errcode='28000'; end if;
  select id into strict v_tenant from public.tenants;
  if not pvh_private.has_permission(v_tenant,'m01:work:assign') then
    raise exception 'FORBIDDEN' using errcode='42501';
  end if;
  select * into v_item from public.work_items where id=p_work_item_id and tenant_id=v_tenant;
  if not found or not pvh_private.can_access_work(v_tenant,p_work_item_id,'read') then
    raise exception 'FORBIDDEN_SCOPE' using errcode='42501';
  end if;
  return query select m.user_id,p.full_name from public.memberships m
    join public.profiles p on p.id=m.user_id and p.tenant_id=m.tenant_id
    where m.tenant_id=v_tenant and m.user_id<>v_item.created_by
      and m.user_id is distinct from v_item.assigned_to
      and pvh_private.is_eligible_work_collaborator(v_tenant,m.user_id,v_item.hamlet_id)
    order by p.full_name;
end; $$;

-- Reassignment and first assignment are both versioned, audited mutations.
create function app.assign_work_item(
  p_id uuid, p_assigned_to uuid, p_expected_version integer,
  p_reason text, p_idempotency_key text
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := auth.uid(); v_tenant uuid; v_item public.work_items%rowtype;
  v_previous public.work_item_mutation_requests%rowtype;
  v_hash text; v_result jsonb; v_new_status text;
  v_old_assignee uuid; v_old_status text;
begin
  if v_actor is null then raise exception 'UNAUTHENTICATED' using errcode='28000'; end if;
  select id into strict v_tenant from public.tenants;
  if not pvh_private.has_permission(v_tenant,'m01:work:assign') then
    raise exception 'FORBIDDEN' using errcode='42501';
  end if;
  if p_id is null or p_assigned_to is null or p_expected_version is null or p_expected_version<1
     or p_idempotency_key is null or length(btrim(p_idempotency_key)) not between 1 and 200 then
    raise exception 'VALIDATION' using errcode='22023';
  end if;
  v_hash := encode(sha256(convert_to(jsonb_build_array('ASSIGN',p_id,p_assigned_to,p_expected_version,
    nullif(btrim(p_reason),''))::text,'UTF8')),'hex');
  perform pg_advisory_xact_lock(hashtextextended(v_tenant::text||v_actor::text||p_idempotency_key,0));
  select * into v_previous from public.work_item_mutation_requests
  where tenant_id=v_tenant and actor_id=v_actor and idempotency_key=p_idempotency_key;
  if found then
    if v_previous.request_hash<>v_hash then
      raise exception 'IDEMPOTENCY_CONFLICT' using errcode='PV409';
    end if;
    if not pvh_private.can_access_work(v_tenant,p_id,'read') then
      raise exception 'FORBIDDEN_SCOPE' using errcode='42501';
    end if;
    return v_previous.response || jsonb_build_object('cached',true);
  end if;
  select * into v_item from public.work_items where id=p_id and tenant_id=v_tenant for update;
  if not found then raise exception 'NOT_FOUND' using errcode='P0002'; end if;
  if not pvh_private.can_access_work(v_tenant,p_id,'read') then
    raise exception 'FORBIDDEN_SCOPE' using errcode='42501';
  end if;
  if v_item.version<>p_expected_version then
    raise exception 'VERSION_CONFLICT' using errcode='PV409';
  end if;
  if v_item.status in ('COMPLETED','CANCELLED','UNDER_REVIEW') then
    raise exception 'INVALID_TRANSITION' using errcode='22023';
  end if;
  if v_item.assigned_to=p_assigned_to then
    raise exception 'VALIDATION: already assigned to user' using errcode='22023';
  end if;
  if v_item.assigned_to is not null and nullif(btrim(p_reason),'') is null then
    raise exception 'VALIDATION: reassignment requires a reason' using errcode='22023';
  end if;
   if not pvh_private.is_eligible_work_assignee(v_tenant,p_assigned_to,v_item.hamlet_id) then
     raise exception 'INVALID_ASSIGNEE_OR_SCOPE' using errcode='22023';
   end if;
  v_new_status := 'ASSIGNED';
  v_old_assignee := v_item.assigned_to;
  v_old_status := v_item.status;
  update public.work_items set assigned_to=p_assigned_to,status=v_new_status,
    version=version+1, updated_at=now(), updated_by=v_actor
  where id=p_id returning * into v_item;
  insert into public.work_item_assignments
    (tenant_id,work_item_id,previous_assignee,assignee,actor_id,reason,work_item_version)
  values(v_tenant,p_id,v_old_assignee,p_assigned_to,v_actor,p_reason,v_item.version);
  insert into public.work_item_events
    (tenant_id,work_item_id,from_status,to_status,actor_id,reason,payload,version,created_by)
  values(v_tenant,p_id,v_old_status,v_new_status,v_actor,p_reason,
    jsonb_build_object('event','ASSIGNED','previous_assignee',v_old_assignee,'assignee',p_assigned_to),v_item.version,v_actor);
  insert into public.audit_log(tenant_id,actor_id,action,entity_type,entity_id,payload)
  values(v_tenant,v_actor,'ASSIGN_WORK_ITEM','work_item',p_id::text,
    jsonb_build_object('version',v_item.version,'assignee',p_assigned_to));
  insert into public.work_item_inbox(tenant_id,work_item_id,recipient_id,event_version,kind)
  values(v_tenant,p_id,p_assigned_to,v_item.version,'ASSIGNED');
  v_result := jsonb_build_object('id',p_id,'status',v_item.status,'version',v_item.version);
  insert into public.work_item_mutation_requests(tenant_id,actor_id,idempotency_key,request_hash,response)
  values(v_tenant,v_actor,p_idempotency_key,v_hash,v_result);
  return v_result;
end; $$;

create function app.transition_work_item(
  p_id uuid, p_to_state text, p_expected_version integer,
  p_idempotency_key text, p_reason text default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := auth.uid(); v_tenant uuid; v_item public.work_items%rowtype;
  v_rule public.work_item_transition_rules%rowtype;
  v_previous public.work_item_mutation_requests%rowtype;
  v_hash text; v_result jsonb; v_old_status text; v_reviewer_count integer;
begin
  if v_actor is null then raise exception 'UNAUTHENTICATED' using errcode='28000'; end if;
  select id into strict v_tenant from public.tenants;
  if p_id is null or p_expected_version is null or p_expected_version<1
    or p_to_state is null or p_idempotency_key is null
    or length(btrim(p_idempotency_key)) not between 1 and 200 then
    raise exception 'VALIDATION' using errcode='22023';
  end if;
  v_hash := encode(sha256(convert_to(jsonb_build_array('TRANSITION',p_id,p_to_state,
    p_expected_version,nullif(btrim(p_reason),''))::text,'UTF8')),'hex');
  perform pg_advisory_xact_lock(hashtextextended(v_tenant::text||v_actor::text||p_idempotency_key,0));
  select * into v_previous from public.work_item_mutation_requests
    where tenant_id=v_tenant and actor_id=v_actor and idempotency_key=p_idempotency_key;
  if found then
    if v_previous.request_hash<>v_hash then
      raise exception 'IDEMPOTENCY_CONFLICT' using errcode='PV409';
    end if;
    if not pvh_private.can_access_work(v_tenant,p_id,'read') then
      raise exception 'FORBIDDEN_SCOPE' using errcode='42501';
    end if;
    return v_previous.response || jsonb_build_object('cached',true);
  end if;
  select * into v_item from public.work_items where id=p_id and tenant_id=v_tenant for update;
  if not found then raise exception 'NOT_FOUND' using errcode='P0002'; end if;
  -- SECURITY DEFINER bypasses RLS: check record visibility before version and
  -- state-specific errors, otherwise an out-of-scope actor can probe metadata.
  if not pvh_private.can_access_work(v_tenant,p_id,'read') then
    raise exception 'FORBIDDEN_SCOPE' using errcode='42501';
  end if;
  if v_item.version<>p_expected_version then
    raise exception 'VERSION_CONFLICT' using errcode='PV409';
  end if;
  select * into v_rule from public.work_item_transition_rules
    where rule_version=v_item.workflow_version and from_status=v_item.status and to_status=p_to_state;
  if not found then raise exception 'INVALID_TRANSITION' using errcode='22023'; end if;
  if not pvh_private.has_permission(v_tenant,v_rule.required_permission)
    or not pvh_private.can_access_work(v_tenant,p_id,'read') then
    raise exception 'FORBIDDEN' using errcode='42501';
  end if;
  if v_rule.actor_scope='ASSIGNEE' and v_item.assigned_to is distinct from v_actor then
    raise exception 'FORBIDDEN_ASSIGNEE' using errcode='42501';
  end if;
  if v_rule.actor_scope='REVIEWER' and (v_item.assigned_to=v_actor or
      not (v_item.created_by=v_actor or pvh_private.has_permission(v_tenant,'m01:work:read_all'))) then
    raise exception 'FORBIDDEN_REVIEWER' using errcode='42501';
  end if;
  if v_rule.actor_scope='MANAGER' and pvh_private.has_permission(v_tenant,'m01:work:assign') is false then
    raise exception 'FORBIDDEN_MANAGER' using errcode='42501';
  end if;
  if v_rule.requires_reason and nullif(btrim(p_reason),'') is null then
    raise exception 'VALIDATION: reason required' using errcode='22023';
  end if;
  if v_rule.requires_evidence and not exists(select 1 from public.evidence_files
    where tenant_id=v_tenant and work_item_id=p_id and status='UPLOADED') then
    raise exception 'VALIDATION: evidence required' using errcode='22023';
  end if;
  if p_to_state='UNDER_REVIEW' then
    select count(*) into v_reviewer_count from public.memberships m
    where m.tenant_id=v_tenant and m.is_active and m.valid_from<=now()
      and (m.valid_to is null or m.valid_to>now())
      and m.user_id is distinct from v_item.assigned_to
      and pvh_private.member_has_work_permission(v_tenant,m.user_id,'m01:work:review')
      and pvh_private.member_has_work_permission(v_tenant,m.user_id,'m01:work:read')
      and (m.user_id=v_item.created_by or
        pvh_private.member_has_work_permission(v_tenant,m.user_id,'m01:work:read_all'));
    if v_reviewer_count=0 then
      raise exception 'VALIDATION_NO_ELIGIBLE_REVIEWER' using errcode='22023';
    end if;
  end if;
  if p_to_state='ASSIGNED' and v_item.assigned_to is null then
    raise exception 'VALIDATION: assignee required' using errcode='22023';
  end if;
  v_old_status:=v_item.status;
  update public.work_items set status=p_to_state,version=version+1,
    updated_at=now(),updated_by=v_actor where id=p_id returning * into v_item;
  insert into public.work_item_events
    (tenant_id,work_item_id,from_status,to_status,actor_id,reason,payload,version,created_by)
  values(v_tenant,p_id,v_old_status,p_to_state,v_actor,p_reason,
    jsonb_build_object('workflow_version',v_item.workflow_version),v_item.version,v_actor);
  insert into public.audit_log(tenant_id,actor_id,action,entity_type,entity_id,payload)
  values(v_tenant,v_actor,'TRANSITION_WORK_ITEM','work_item',p_id::text,
    jsonb_build_object('from',v_old_status,'to',p_to_state,'version',v_item.version));
  if p_to_state='ASSIGNED' and v_item.assigned_to is not null then
    insert into public.work_item_inbox(tenant_id,work_item_id,recipient_id,event_version,kind)
    values(v_tenant,p_id,v_item.assigned_to,v_item.version,'ASSIGNED');
  elsif p_to_state='UNDER_REVIEW' then
    -- Notify only reviewers who can actually open and approve the item:
    -- its creator with review permission, or a cross-unit reviewer with read_all.
    insert into public.work_item_inbox(tenant_id,work_item_id,recipient_id,event_version,kind)
    select distinct v_tenant,p_id,m.user_id,v_item.version,'REVIEW_REQUESTED'
    from public.memberships m
    where m.tenant_id=v_tenant and m.is_active and m.valid_from<=now()
      and (m.valid_to is null or m.valid_to>now())
      and m.user_id is distinct from v_item.assigned_to
      and pvh_private.member_has_work_permission(v_tenant,m.user_id,'m01:work:review')
      and pvh_private.member_has_work_permission(v_tenant,m.user_id,'m01:work:read')
      and (m.user_id=v_item.created_by or
        pvh_private.member_has_work_permission(v_tenant,m.user_id,'m01:work:read_all'));
  elsif p_to_state in ('RETURNED','COMPLETED','CANCELLED') and v_item.assigned_to is not null then
    insert into public.work_item_inbox(tenant_id,work_item_id,recipient_id,event_version,kind)
    values(v_tenant,p_id,v_item.assigned_to,v_item.version,p_to_state);
  end if;
  v_result:=jsonb_build_object('id',p_id,'status',v_item.status,'version',v_item.version);
  insert into public.work_item_mutation_requests(tenant_id,actor_id,idempotency_key,request_hash,response)
  values(v_tenant,v_actor,p_idempotency_key,v_hash,v_result);
  return v_result;
end; $$;

-- Managers may adjust deadline or hamlet, with mandatory reason, OCC and an
-- immutable same-state event. A scope transfer must still leave the assignee
-- eligible for the destination hamlet (enforced by work_item_assignee_guard).
create function app.update_work_item_details(
  p_id uuid,p_expected_version integer,p_due_date timestamptz,p_hamlet_id uuid,
  p_reason text,p_idempotency_key text
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid:=auth.uid(); v_tenant uuid; v_item public.work_items%rowtype;
  v_previous public.work_item_mutation_requests%rowtype; v_hash text; v_result jsonb;
  v_old_due timestamptz; v_old_hamlet uuid; v_actor_scopes jsonb;
begin
  if v_actor is null then raise exception 'UNAUTHENTICATED' using errcode='28000'; end if;
  select id into strict v_tenant from public.tenants;
  if not pvh_private.has_permission(v_tenant,'m01:work:assign') then
    raise exception 'FORBIDDEN' using errcode='42501';
  end if;
  if p_id is null or p_expected_version is null or p_expected_version<1
    or p_idempotency_key is null or length(btrim(p_idempotency_key)) not between 1 and 200
    or nullif(btrim(p_reason),'') is null or length(p_reason)>2000 then
    raise exception 'VALIDATION: reason and idempotency key required' using errcode='22023';
  end if;
  v_hash:=encode(sha256(convert_to(jsonb_build_array('DETAILS',p_id,p_expected_version,
    p_due_date,p_hamlet_id,btrim(p_reason))::text,'UTF8')),'hex');
  perform pg_advisory_xact_lock(hashtextextended(v_tenant::text||v_actor::text||p_idempotency_key,0));
  select * into v_previous from public.work_item_mutation_requests
    where tenant_id=v_tenant and actor_id=v_actor and idempotency_key=p_idempotency_key;
  if found then
    if v_previous.request_hash<>v_hash then
      raise exception 'IDEMPOTENCY_CONFLICT' using errcode='PV409';
    end if;
    if not pvh_private.can_access_work(v_tenant,p_id,'read') then
      raise exception 'FORBIDDEN_SCOPE' using errcode='42501';
    end if;
    return v_previous.response || jsonb_build_object('cached',true);
  end if;
  select * into v_item from public.work_items where id=p_id and tenant_id=v_tenant for update;
  if not found then raise exception 'NOT_FOUND' using errcode='P0002'; end if;
  if not pvh_private.can_access_work(v_tenant,p_id,'read') then
    raise exception 'FORBIDDEN_SCOPE' using errcode='42501';
  end if;
  if v_item.version<>p_expected_version then raise exception 'VERSION_CONFLICT' using errcode='PV409'; end if;
  if v_item.status in ('COMPLETED','CANCELLED') then
    raise exception 'INVALID_TRANSITION' using errcode='22023';
  end if;
  if v_item.due_date is not distinct from p_due_date
    and v_item.hamlet_id is not distinct from p_hamlet_id then
    raise exception 'VALIDATION: no change' using errcode='22023';
  end if;
  if p_hamlet_id is not null and not exists(select 1 from public.org_units
    where tenant_id=v_tenant and id=p_hamlet_id and kind='HAMLET' and is_active) then
    raise exception 'INVALID_HAMLET' using errcode='22023';
  end if;
  select scopes into v_actor_scopes from public.memberships
    where tenant_id=v_tenant and user_id=v_actor and is_active;
  if coalesce(v_actor_scopes,'{}'::jsonb) ? 'org_unit_ids' and
    (p_hamlet_id is null or not exists(
      select 1 from jsonb_array_elements_text(v_actor_scopes->'org_unit_ids') s(value)
      where s.value=p_hamlet_id::text)) then
    raise exception 'FORBIDDEN_SCOPE' using errcode='42501';
  end if;
  v_old_due:=v_item.due_date; v_old_hamlet:=v_item.hamlet_id;
  update public.work_items set due_date=p_due_date,hamlet_id=p_hamlet_id,
    version=version+1,updated_at=now(),updated_by=v_actor where id=p_id
    returning * into v_item;
  insert into public.work_item_events
    (tenant_id,work_item_id,from_status,to_status,actor_id,reason,payload,version,created_by)
  values(v_tenant,p_id,v_item.status,v_item.status,v_actor,p_reason,
    jsonb_build_object('event','DETAILS_UPDATED','old_due_date',v_old_due,
      'new_due_date',p_due_date,'old_hamlet_id',v_old_hamlet,'new_hamlet_id',p_hamlet_id),
    v_item.version,v_actor);
  insert into public.audit_log(tenant_id,actor_id,action,entity_type,entity_id,payload)
  values(v_tenant,v_actor,'UPDATE_WORK_DETAILS','work_item',p_id::text,
    jsonb_build_object('version',v_item.version,'reason',p_reason));
  if v_item.assigned_to is not null then
    insert into public.work_item_inbox(tenant_id,work_item_id,recipient_id,event_version,kind)
    values(v_tenant,p_id,v_item.assigned_to,v_item.version,'DETAILS_UPDATED');
  end if;
  v_result:=jsonb_build_object('id',p_id,'status',v_item.status,'version',v_item.version);
  insert into public.work_item_mutation_requests(tenant_id,actor_id,idempotency_key,request_hash,response)
  values(v_tenant,v_actor,p_idempotency_key,v_hash,v_result);
  return v_result;
end; $$;

-- Replaces the collaboration set in one versioned, audited transaction. This
-- is a READ-only relationship and grants no update/review authority.
create function app.set_work_collaborators(
  p_id uuid,p_expected_version integer,p_user_ids uuid[],
  p_reason text,p_idempotency_key text
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  v_actor uuid:=auth.uid(); v_tenant uuid; v_item public.work_items%rowtype;
  v_previous public.work_item_mutation_requests%rowtype;
  v_user uuid; v_new uuid[]; v_old uuid[]; v_hash text; v_result jsonb;
begin
  if v_actor is null then raise exception 'UNAUTHENTICATED' using errcode='28000'; end if;
  select id into strict v_tenant from public.tenants;
  if not pvh_private.has_permission(v_tenant,'m01:work:assign') then
    raise exception 'FORBIDDEN' using errcode='42501';
  end if;
  if p_id is null or p_expected_version is null or p_expected_version<1
    or nullif(btrim(p_reason),'') is null or length(p_reason)>2000
    or p_idempotency_key is null or length(btrim(p_idempotency_key)) not between 1 and 200 then
    raise exception 'VALIDATION' using errcode='22023';
  end if;
  v_new:=coalesce((select array_agg(x order by x) from
    (select distinct x from unnest(coalesce(p_user_ids,array[]::uuid[])) u(x)) ids),array[]::uuid[]);
  if cardinality(v_new)>20 or array_position(v_new,null) is not null then
    raise exception 'VALIDATION: invalid collaborators' using errcode='22023';
  end if;
  v_hash:=encode(sha256(convert_to(jsonb_build_array('COLLABORATORS',p_id,p_expected_version,
    v_new,btrim(p_reason))::text,'UTF8')),'hex');
  perform pg_advisory_xact_lock(hashtextextended(v_tenant::text||v_actor::text||p_idempotency_key,0));
  select * into v_previous from public.work_item_mutation_requests
    where tenant_id=v_tenant and actor_id=v_actor and idempotency_key=p_idempotency_key;
  if found then
    if v_previous.request_hash<>v_hash then raise exception 'IDEMPOTENCY_CONFLICT' using errcode='PV409'; end if;
    if not pvh_private.can_access_work(v_tenant,p_id,'read') then
      raise exception 'FORBIDDEN_SCOPE' using errcode='42501';
    end if;
    return v_previous.response || jsonb_build_object('cached',true);
  end if;
  select * into v_item from public.work_items where id=p_id and tenant_id=v_tenant for update;
  if not found then raise exception 'NOT_FOUND' using errcode='P0002'; end if;
  if not pvh_private.can_access_work(v_tenant,p_id,'read') then
    raise exception 'FORBIDDEN_SCOPE' using errcode='42501';
  end if;
  if v_item.version<>p_expected_version then raise exception 'VERSION_CONFLICT' using errcode='PV409'; end if;
  if v_item.status in ('COMPLETED','CANCELLED') then raise exception 'INVALID_TRANSITION' using errcode='22023'; end if;
  for v_user in select unnest(v_new) loop
    if v_user=v_item.created_by or v_user is not distinct from v_item.assigned_to
      or not pvh_private.is_eligible_work_collaborator(v_tenant,v_user,v_item.hamlet_id) then
      raise exception 'INVALID_COLLABORATOR_OR_SCOPE' using errcode='22023';
    end if;
  end loop;
  v_old:=coalesce((select array_agg(user_id order by user_id)
    from public.work_item_collaborators where tenant_id=v_tenant and work_item_id=p_id),array[]::uuid[]);
  if v_old=v_new then raise exception 'VALIDATION: collaborators unchanged' using errcode='22023'; end if;
  delete from public.work_item_collaborators where tenant_id=v_tenant and work_item_id=p_id
    and user_id<>all(v_new);
  insert into public.work_item_collaborators(tenant_id,work_item_id,user_id,added_by)
    select v_tenant,p_id,u.user_id,v_actor from unnest(v_new) u(user_id)
    on conflict(tenant_id,work_item_id,user_id) do nothing;
  update public.work_items set version=version+1,updated_at=now(),updated_by=v_actor
    where id=p_id returning * into v_item;
  insert into public.work_item_events
    (tenant_id,work_item_id,from_status,to_status,actor_id,reason,payload,version,created_by)
  values(v_tenant,p_id,v_item.status,v_item.status,v_actor,p_reason,
    jsonb_build_object('event','COLLABORATORS_UPDATED','old_user_ids',v_old,'new_user_ids',v_new),
    v_item.version,v_actor);
  insert into public.audit_log(tenant_id,actor_id,action,entity_type,entity_id,payload)
  values(v_tenant,v_actor,'SET_WORK_COLLABORATORS','work_item',p_id::text,
    jsonb_build_object('version',v_item.version,'count',cardinality(v_new)));
  insert into public.work_item_inbox(tenant_id,work_item_id,recipient_id,event_version,kind)
    select v_tenant,p_id,u.user_id,v_item.version,'COLLABORATOR_ADDED'
      from unnest(v_new) u(user_id) where u.user_id<>all(v_old);
  v_result:=jsonb_build_object('id',p_id,'status',v_item.status,'version',v_item.version);
  insert into public.work_item_mutation_requests(tenant_id,actor_id,idempotency_key,request_hash,response)
    values(v_tenant,v_actor,p_idempotency_key,v_hash,v_result);
  return v_result;
end; $$;

-- Upload completes only when the private Storage object really exists.
-- The sha256 is explicitly a client claim (not a server-verified digest).
create function app.finalize_evidence(p_id uuid,p_sha256 text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_file public.evidence_files%rowtype; v_object storage.objects%rowtype;
  v_size bigint; v_mime text;
begin
  if auth.uid() is null then raise exception 'UNAUTHENTICATED' using errcode='28000'; end if;
  select * into v_file from public.evidence_files where id=p_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode='P0002'; end if;
  if v_file.uploaded_by<>auth.uid() or not pvh_private.can_access_work(v_file.tenant_id,v_file.work_item_id,'update') then
    raise exception 'FORBIDDEN' using errcode='42501';
  end if;
  if p_sha256 is null or p_sha256 !~ '^[0-9a-f]{64}$' then
    raise exception 'VALIDATION' using errcode='22023';
  end if;
  select * into v_object from storage.objects where bucket_id='evidence' and name=v_file.object_path;
  if not found or v_object.owner_id<>auth.uid()::text then
    raise exception 'EVIDENCE_NOT_UPLOADED' using errcode='22023';
  end if;
  v_size:=nullif(v_object.metadata->>'size','')::bigint;
  v_mime:=v_object.metadata->>'mimetype';
  if v_size is null or v_size<1 or v_size>52428800 or v_mime not in
    ('application/pdf','image/png','image/jpeg','application/vnd.openxmlformats-officedocument.wordprocessingml.document') then
    raise exception 'INVALID_EVIDENCE_FILE' using errcode='22023';
  end if;
  if v_file.status='PENDING' then
    update public.evidence_files set status='UPLOADED',size_bytes=v_size,
      content_type=v_mime,claimed_sha256=p_sha256 where id=p_id;
    insert into public.audit_log(tenant_id,actor_id,action,entity_type,entity_id,payload)
    values(v_file.tenant_id,auth.uid(),'FINALIZE_EVIDENCE','evidence_file',p_id::text,
      jsonb_build_object('size',v_size,'mime',v_mime,'sha256_claimed',p_sha256));
  elsif v_file.claimed_sha256<>p_sha256 then
    raise exception 'IDEMPOTENCY_CONFLICT' using errcode='PV409';
  end if;
  return jsonb_build_object('id',p_id,'status','UPLOADED');
end; $$;

-- Called after an attempted Storage removal. Metadata can only be deleted for
-- a failed, still-PENDING upload whose object no longer exists.
create function app.abandon_pending_evidence(p_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_file public.evidence_files%rowtype;
begin
  if auth.uid() is null then raise exception 'UNAUTHENTICATED' using errcode='28000'; end if;
  select * into v_file from public.evidence_files where id=p_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode='P0002'; end if;
  if v_file.status<>'PENDING' or v_file.uploaded_by<>auth.uid()
    or not pvh_private.can_access_work(v_file.tenant_id,v_file.work_item_id,'update') then
    raise exception 'FORBIDDEN' using errcode='42501';
  end if;
  if exists(select 1 from storage.objects where bucket_id='evidence' and name=v_file.object_path) then
    raise exception 'EVIDENCE_OBJECT_STILL_PRESENT' using errcode='22023';
  end if;
  delete from public.evidence_files where id=p_id;
  insert into public.audit_log(tenant_id,actor_id,action,entity_type,entity_id)
    values(v_file.tenant_id,auth.uid(),'ABANDON_PENDING_EVIDENCE','evidence_file',p_id::text);
  return jsonb_build_object('id',p_id,'abandoned',true);
end; $$;

create function app.mark_work_inbox_read(p_inbox_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_inbox public.work_item_inbox%rowtype; v_count integer;
begin
  if auth.uid() is null then raise exception 'UNAUTHENTICATED' using errcode='28000'; end if;
  select * into v_inbox from public.work_item_inbox
  where id=p_inbox_id and recipient_id=auth.uid()
    and tenant_id in(select app.user_tenant_ids());
  if not found then raise exception 'NOT_FOUND' using errcode='P0002'; end if;
  insert into public.work_item_inbox_reads(inbox_id,tenant_id,recipient_id)
    values(v_inbox.id,v_inbox.tenant_id,auth.uid()) on conflict(inbox_id) do nothing;
  get diagnostics v_count = row_count;
  if v_count>0 then
    insert into public.audit_log(tenant_id,actor_id,action,entity_type,entity_id)
    values(v_inbox.tenant_id,auth.uid(),'MARK_INBOX_READ','work_item_inbox',p_inbox_id::text);
  end if;
  return jsonb_build_object('id',p_inbox_id,'read',true,'cached',v_count=0);
end; $$;

-- Never let authenticated users mutate business rows directly.
revoke all on function pvh_private.member_has_work_permission(uuid,uuid,text) from public,anon,authenticated;
revoke all on function pvh_private.is_eligible_work_assignee(uuid,uuid,uuid) from public,anon,authenticated;
revoke all on function pvh_private.is_eligible_work_collaborator(uuid,uuid,uuid) from public,anon,authenticated;
revoke all on function pvh_private.validate_work_assignee() from public,anon,authenticated;
revoke all on function app.list_work_assignees(uuid) from public,anon,authenticated;
revoke all on function app.list_work_collaborator_candidates(uuid) from public,anon,authenticated;
revoke all on function app.create_work_item_v2(text,text,text,text,uuid,timestamptz,text,uuid,uuid,text) from public,anon,authenticated;
revoke all on function app.assign_work_item(uuid,uuid,integer,text,text) from public,anon,authenticated;
revoke all on function app.transition_work_item(uuid,text,integer,text,text) from public,anon,authenticated;
revoke all on function app.update_work_item_details(uuid,integer,timestamptz,uuid,text,text) from public,anon,authenticated;
revoke all on function app.set_work_collaborators(uuid,integer,uuid[],text,text) from public,anon,authenticated;
revoke all on function app.finalize_evidence(uuid,text) from public,anon,authenticated;
revoke all on function app.abandon_pending_evidence(uuid) from public,anon,authenticated;
revoke all on function app.mark_work_inbox_read(uuid) from public,anon,authenticated;
grant execute on function app.list_work_assignees(uuid) to authenticated;
grant execute on function app.list_work_collaborator_candidates(uuid) to authenticated;
grant execute on function app.create_work_item_v2(text,text,text,text,uuid,timestamptz,text,uuid,uuid,text) to authenticated;
grant execute on function app.assign_work_item(uuid,uuid,integer,text,text) to authenticated;
grant execute on function app.transition_work_item(uuid,text,integer,text,text) to authenticated;
grant execute on function app.update_work_item_details(uuid,integer,timestamptz,uuid,text,text) to authenticated;
grant execute on function app.set_work_collaborators(uuid,integer,uuid[],text,text) to authenticated;
grant execute on function app.finalize_evidence(uuid,text) to authenticated;
grant execute on function app.abandon_pending_evidence(uuid) to authenticated;
grant execute on function app.mark_work_inbox_read(uuid) to authenticated;
notify pgrst,'reload schema';
