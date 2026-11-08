-- PH02 / M01: canonical, atomic workflow on top of the PH01 cloud baseline.
-- This migration is NOT applied to the production Supabase project by a Git push.

alter table public.work_items
  add column workflow_version integer not null default 1 check (workflow_version > 0);

-- Supports tenant-scoped server paging and overdue counts without full scans.
create index work_items_tenant_created_at_idx on public.work_items(tenant_id,created_at desc);
create index work_items_open_due_idx on public.work_items(tenant_id,due_date)
  where due_date is not null and status not in ('COMPLETED','CANCELLED');

alter table public.evidence_files
  add column status text not null default 'PENDING' check (status in ('PENDING','UPLOADED')),
  add column content_type text,
  add column size_bytes bigint check (size_bytes is null or size_bytes between 1 and 52428800),
  add column claimed_sha256 text check (claimed_sha256 is null or claimed_sha256 ~ '^[0-9a-f]{64}$');

-- A pending registration is authorized for upload but not for read/download.
create or replace function pvh_private.can_access_evidence(p_path text,p_action text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.evidence_files f
    where f.object_path=p_path
      and (p_action<>'read' or f.status='UPLOADED')
      and pvh_private.can_access_work(f.tenant_id,f.work_item_id,p_action));
$$;

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

-- Transactional in-app notifications; no external email/SMS is sent.
create table public.work_item_inbox (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  work_item_id uuid not null,
  recipient_id uuid not null references auth.users(id) on delete restrict,
  event_version integer not null,
  kind text not null check (kind in ('ASSIGNED','REVIEW_REQUESTED','RETURNED','COMPLETED','CANCELLED')),
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

-- Do not expose membership lists to ordinary read roles; allow only an
-- actor with the explicit assignment capability to discover viable assignees.
create function app.list_work_assignees()
returns table(user_id uuid, full_name text)
language plpgsql stable security definer set search_path = '' as $$
declare v_tenant uuid;
begin
  if auth.uid() is null then raise exception 'UNAUTHENTICATED' using errcode = '28000'; end if;
  select id into strict v_tenant from public.tenants;
  if not pvh_private.has_permission(v_tenant,'m01:work:assign') then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  return query
  select m.user_id,p.full_name from public.memberships m
  join public.profiles p on p.id=m.user_id and p.tenant_id=m.tenant_id
  where m.tenant_id=v_tenant and m.is_active and m.valid_from<=now()
    and (m.valid_to is null or m.valid_to>now())
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
  if not exists(select 1 from public.memberships m where m.tenant_id=v_tenant
    and m.user_id=p_assigned_to and m.is_active and m.valid_from<=now()
    and (m.valid_to is null or m.valid_to>now())) then
    raise exception 'INVALID_ASSIGNEE' using errcode='22023';
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
  v_hash text; v_result jsonb; v_old_status text;
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
  elsif p_to_state='UNDER_REVIEW' and v_item.created_by<>v_actor then
    insert into public.work_item_inbox(tenant_id,work_item_id,recipient_id,event_version,kind)
    values(v_tenant,p_id,v_item.created_by,v_item.version,'REVIEW_REQUESTED');
  elsif p_to_state in ('RETURNED','COMPLETED','CANCELLED') and v_item.assigned_to is not null then
    insert into public.work_item_inbox(tenant_id,work_item_id,recipient_id,event_version,kind)
    values(v_tenant,p_id,v_item.assigned_to,v_item.version,p_to_state);
  end if;
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

-- Never let authenticated users mutate business rows directly.
revoke all on function app.list_work_assignees() from public,anon,authenticated;
revoke all on function app.assign_work_item(uuid,uuid,integer,text,text) from public,anon,authenticated;
revoke all on function app.transition_work_item(uuid,text,integer,text,text) from public,anon,authenticated;
revoke all on function app.finalize_evidence(uuid,text) from public,anon,authenticated;
grant execute on function app.list_work_assignees() to authenticated;
grant execute on function app.assign_work_item(uuid,uuid,integer,text,text) to authenticated;
grant execute on function app.transition_work_item(uuid,text,integer,text,text) to authenticated;
grant execute on function app.finalize_evidence(uuid,text) to authenticated;
notify pgrst,'reload schema';
