-- PVH: single-commune foundation. Account identity comes exclusively from auth.uid().
-- No demo Auth accounts, passwords, or real personal data are seeded.
create schema app;
create schema pvh_private;
revoke all on schema app, pvh_private from public, anon;
grant usage on schema app, pvh_private to authenticated, service_role;
alter default privileges in schema app revoke execute on functions from public;
alter default privileges in schema pvh_private revoke execute on functions from public;

create table public.tenants (
 id uuid primary key default gen_random_uuid(),
 code text not null unique check (length(btrim(code)) > 0),
 name text not null check (length(btrim(name)) > 0),
 province text not null default 'Thái Nguyên',
 officer_mode text not null default 'CONCURRENT' check (officer_mode in ('CONCURRENT','SPECIALIZED')),
 features jsonb not null default '{}'::jsonb,
 singleton boolean not null default true check (singleton),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(singleton)
);
create table public.org_units (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete restrict,
 parent_id uuid, code text not null, name text not null,
 kind text not null check (kind in ('COMMUNE','DEPARTMENT','HAMLET')), is_active boolean not null default true,
 unique(tenant_id,id), unique(tenant_id,code),
 foreign key(tenant_id,parent_id) references public.org_units(tenant_id,id) on delete restrict
);
create table public.profiles (
 id uuid primary key references auth.users(id) on delete restrict,
 tenant_id uuid not null references public.tenants(id) on delete restrict,
 full_name text not null check(length(btrim(full_name)) > 0),
 email text, phone text, persona_code text,
 can_view_pii boolean not null default false,
 version integer not null default 1 check(version>0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(tenant_id,id)
);
comment on column public.profiles.persona_code is 'Optional test label only; never an authorization source.';
comment on column public.profiles.can_view_pii is 'Legacy compatibility only; use scoped permission checks, never this flag.';
create table public.roles (code text primary key, name text not null);
create table public.permissions (code text primary key, description text not null);
create table public.role_permissions (
 role_code text references public.roles(code) on delete restrict,
 permission_code text references public.permissions(code) on delete restrict,
 primary key(role_code,permission_code)
);
create table public.memberships (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete restrict,
 user_id uuid not null references auth.users(id) on delete restrict,
 roles text[] not null default '{}', permissions text[] not null default '{}',
 scopes jsonb not null default '{}'::jsonb check(jsonb_typeof(scopes)='object'),
 org_unit_id uuid, valid_from timestamptz not null default now(), valid_to timestamptz,
 is_active boolean not null default true, version integer not null default 1 check(version>0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid references auth.users(id) on delete restrict, updated_by uuid references auth.users(id) on delete restrict,
 unique(tenant_id,id), unique(tenant_id,user_id),
 check(valid_to is null or valid_to > valid_from),
 foreign key(tenant_id,user_id) references public.profiles(tenant_id,id) on delete restrict,
 foreign key(tenant_id,org_unit_id) references public.org_units(tenant_id,id) on delete restrict
);
create table public.membership_roles (
 membership_id uuid references public.memberships(id) on delete restrict,
 role_code text references public.roles(code) on delete restrict,
 primary key(membership_id,role_code)
);
comment on column public.memberships.permissions is 'DB-maintained role projection for server RequestContext. Never client-writable.';
create table public.module_entitlements (
 tenant_id uuid references public.tenants(id) on delete restrict, module_key text not null,
 enabled boolean not null default false, primary key(tenant_id,module_key)
);
create table public.work_items (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete restrict,
 title text not null check(length(btrim(title)) between 1 and 500), description text,
 category text not null default 'CHUNG', priority text not null default 'MEDIUM' check(priority in ('LOW','MEDIUM','HIGH','URGENT')),
 status text not null default 'NEW' check(status in ('NEW','ASSIGNED','IN_PROGRESS','UNDER_REVIEW','COMPLETED','RETURNED','CANCELLED')),
 assigned_to uuid, due_date timestamptz, hamlet_id uuid,
 version integer not null default 1 check(version>0), idempotency_key text not null check(length(btrim(idempotency_key)) between 1 and 200),
 request_hash text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid not null references auth.users(id) on delete restrict, updated_by uuid not null references auth.users(id) on delete restrict,
 unique(tenant_id,id), unique(tenant_id,created_by,idempotency_key),
 foreign key(tenant_id,assigned_to) references public.memberships(tenant_id,user_id) on delete restrict,
 foreign key(tenant_id,hamlet_id) references public.org_units(tenant_id,id) on delete restrict
);
create table public.work_item_events (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null, work_item_id uuid not null,
 from_status text, to_status text not null, actor_id uuid not null references auth.users(id) on delete restrict,
 reason text, payload jsonb not null default '{}', version integer not null default 1,
 created_at timestamptz not null default now(), created_by uuid not null references auth.users(id) on delete restrict,
 foreign key(tenant_id,work_item_id) references public.work_items(tenant_id,id) on delete restrict
);
create table public.audit_log (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete restrict,
 actor_id uuid not null references auth.users(id) on delete restrict,
 action text not null, entity_type text not null, entity_id text not null,
 payload jsonb not null default '{}', details jsonb not null default '{}', created_at timestamptz not null default now()
);
create table public.evidence_files (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null, work_item_id uuid not null,
 object_path text not null unique, original_name text not null,
 uploaded_by uuid not null references auth.users(id) on delete restrict, created_at timestamptz not null default now(),
 foreign key(tenant_id,work_item_id) references public.work_items(tenant_id,id) on delete restrict,
 check(object_path = tenant_id::text || '/work_items/' || work_item_id::text || '/' || id::text),
 check(length(btrim(original_name)) between 1 and 255)
);
create table public.system_jobs (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete restrict,
 kind text not null, status text not null default 'PENDING' check(status in ('PENDING','RUNNING','SUCCEEDED','FAILED')),
 idempotency_key text not null, attempts integer not null default 0 check(attempts>=0), receipt jsonb,
 created_by uuid not null references auth.users(id) on delete restrict,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(tenant_id,kind,idempotency_key)
);
create index memberships_user_idx on public.memberships(user_id);
create index memberships_org_idx on public.memberships(tenant_id,org_unit_id);
create index org_units_parent_idx on public.org_units(tenant_id,parent_id);
create index role_permissions_permission_idx on public.role_permissions(permission_code);
create index membership_roles_role_idx on public.membership_roles(role_code);
create index work_items_assignee_idx on public.work_items(tenant_id,assigned_to,status);
create index work_items_hamlet_idx on public.work_items(tenant_id,hamlet_id);
create index work_items_creator_idx on public.work_items(created_by);
create index work_items_updater_idx on public.work_items(updated_by);
create index work_item_events_parent_idx on public.work_item_events(tenant_id,work_item_id,created_at);
create index audit_log_entity_idx on public.audit_log(tenant_id,entity_type,entity_id,created_at);
create index evidence_files_parent_idx on public.evidence_files(tenant_id,work_item_id);
create index system_jobs_claim_idx on public.system_jobs(status,created_at) where status='PENDING';

-- Live DB grants: no wildcard role and no implicit leader/admin -> sensitive permissions.
create function pvh_private.has_permission(p_tenant_id uuid,p_permission text)
returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists (
 select 1 from public.memberships m
 join public.membership_roles mr on mr.membership_id=m.id
 join public.role_permissions rp on rp.role_code=mr.role_code
 where m.user_id=auth.uid() and m.tenant_id=p_tenant_id and m.is_active
 and m.valid_from<=now() and (m.valid_to is null or m.valid_to>now())
 and rp.permission_code=replace(p_permission,'m01:work_item:','m01:work:')
 and (p_permission not like 'm01:%' or exists(select 1 from public.module_entitlements e where e.tenant_id=m.tenant_id and e.module_key='m01' and e.enabled))
 );
$$;
create function app.has_permission(p_tenant_id uuid,p_permission text)
returns boolean language sql stable security invoker set search_path='' as $$
 select pvh_private.has_permission(p_tenant_id,p_permission);
$$;
create function app.user_tenant_ids()
returns setof uuid language sql stable security definer set search_path='' as $$
 select m.tenant_id from public.memberships m where m.user_id=auth.uid() and m.is_active
 and m.valid_from<=now() and (m.valid_to is null or m.valid_to>now());
$$;
create function pvh_private.can_access_work(p_tenant uuid,p_id uuid,p_action text)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.work_items w join public.memberships m on m.tenant_id=w.tenant_id and m.user_id=auth.uid()
 where w.tenant_id=p_tenant and w.id=p_id and pvh_private.has_permission(p_tenant,'m01:work:'||p_action)
 and (pvh_private.has_permission(p_tenant,'m01:work:'||p_action||'_all')
 or ((w.created_by=auth.uid() or w.assigned_to=auth.uid())
 and (not(m.scopes ? 'org_unit_ids') or exists(select 1 from jsonb_array_elements_text(m.scopes->'org_unit_ids') s(value) where s.value=w.hamlet_id::text)))));
$$;
create function pvh_private.refresh_membership_projection()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 update public.memberships m set
 roles=coalesce((select array_agg(mr.role_code order by mr.role_code) from public.membership_roles mr where mr.membership_id=m.id),'{}'),
 permissions=coalesce((select array_agg(distinct rp.permission_code order by rp.permission_code) from public.membership_roles mr join public.role_permissions rp on rp.role_code=mr.role_code where mr.membership_id=m.id),'{}'),
 updated_at=now(),version=version+1;
 return null;
end; $$;
create trigger membership_roles_projection after insert or update or delete on public.membership_roles for each statement execute function pvh_private.refresh_membership_projection();
create trigger role_permissions_projection after insert or update or delete on public.role_permissions for each statement execute function pvh_private.refresh_membership_projection();
create function pvh_private.reject_log_mutation()
returns trigger language plpgsql set search_path='' as $$ begin raise exception 'APPEND_ONLY' using errcode='42501'; end; $$;
create trigger immutable_audit before update or delete or truncate on public.audit_log for each statement execute function pvh_private.reject_log_mutation();
create trigger immutable_events before update or delete or truncate on public.work_item_events for each statement execute function pvh_private.reject_log_mutation();

-- Deny direct business mutations; all writes must use audited RPC or controlled provisioning.
do $$ declare t text; begin
 foreach t in array array['tenants','org_units','profiles','roles','permissions','role_permissions','memberships','membership_roles','module_entitlements','work_items','work_item_events','audit_log','evidence_files','system_jobs'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('alter table public.%I force row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 end loop;
end $$;
create policy tenant_read on public.tenants for select to authenticated using(id in(select app.user_tenant_ids()));
create policy org_read on public.org_units for select to authenticated using(tenant_id in(select app.user_tenant_ids()));
create policy own_profile on public.profiles for select to authenticated using(id=(select auth.uid()) or pvh_private.has_permission(tenant_id,'m00:membership:read'));
create policy own_membership on public.memberships for select to authenticated using(user_id=(select auth.uid()) or pvh_private.has_permission(tenant_id,'m00:membership:read'));
create policy roles_read on public.roles for select to authenticated using(exists(select 1 from app.user_tenant_ids()));
create policy permissions_read on public.permissions for select to authenticated using(exists(select 1 from app.user_tenant_ids()));
create policy role_permissions_read on public.role_permissions for select to authenticated using(exists(select 1 from app.user_tenant_ids()));
create policy own_membership_roles on public.membership_roles for select to authenticated using(exists(select 1 from public.memberships m where m.id=membership_id and (m.user_id=(select auth.uid()) or pvh_private.has_permission(m.tenant_id,'m00:membership:read'))));
create policy entitlement_read on public.module_entitlements for select to authenticated using(tenant_id in(select app.user_tenant_ids()));
create policy work_read on public.work_items for select to authenticated using(pvh_private.can_access_work(tenant_id,id,'read'));
create policy events_read on public.work_item_events for select to authenticated using(pvh_private.can_access_work(tenant_id,work_item_id,'read'));
create policy audit_read on public.audit_log for select to authenticated using(pvh_private.has_permission(tenant_id,'m00:audit:read'));
create policy evidence_read on public.evidence_files for select to authenticated using(pvh_private.can_access_work(tenant_id,work_item_id,'read'));
create policy jobs_read on public.system_jobs for select to authenticated using(pvh_private.has_permission(tenant_id,'m00:jobs:read'));

create function app.create_work_item(p_idempotency_key text,p_title text,p_description text default null,p_priority text default 'MEDIUM',p_assigned_to uuid default null,p_due_date timestamptz default null,p_category text default 'CHUNG',p_hamlet_id uuid default null,p_tenant_id uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid(); v_tenant uuid; v_hash text; v_item public.work_items%rowtype; v_scope jsonb;
begin
 if v_actor is null then raise exception 'UNAUTHENTICATED' using errcode='28000'; end if;
 select id into strict v_tenant from public.tenants;
 if p_tenant_id is not null and p_tenant_id<>v_tenant then raise exception 'FORBIDDEN' using errcode='42501'; end if;
 if not pvh_private.has_permission(v_tenant,'m01:work:create') then raise exception 'FORBIDDEN' using errcode='42501'; end if;
 if p_idempotency_key is null or length(btrim(p_idempotency_key)) not between 1 and 200 or p_title is null or length(btrim(p_title)) not between 1 and 500 or p_priority is null or p_priority not in ('LOW','MEDIUM','HIGH','URGENT') then raise exception 'VALIDATION_ERROR' using errcode='22023'; end if;
 select scopes into v_scope from public.memberships where tenant_id=v_tenant and user_id=v_actor;
 if v_scope ? 'org_unit_ids' and (p_hamlet_id is null or not exists(select 1 from jsonb_array_elements_text(v_scope->'org_unit_ids') s(value) where s.value=p_hamlet_id::text)) then raise exception 'FORBIDDEN_SCOPE' using errcode='42501'; end if;
 if p_assigned_to is not null and p_assigned_to<>v_actor and not pvh_private.has_permission(v_tenant,'m01:work:assign') then raise exception 'FORBIDDEN_ASSIGN' using errcode='42501'; end if;
 if p_assigned_to is not null and not exists(select 1 from public.memberships where tenant_id=v_tenant and user_id=p_assigned_to and is_active and valid_from<=now() and (valid_to is null or valid_to>now())) then raise exception 'INVALID_ASSIGNEE' using errcode='22023'; end if;
 if p_hamlet_id is not null and not exists(select 1 from public.org_units where id=p_hamlet_id and tenant_id=v_tenant and kind='HAMLET' and is_active) then raise exception 'INVALID_HAMLET' using errcode='22023'; end if;
 v_hash:=encode(sha256(convert_to(jsonb_build_array(btrim(p_title),p_description,p_priority,p_assigned_to,p_due_date,coalesce(p_category,'CHUNG'),p_hamlet_id)::text,'UTF8')),'hex');
 perform pg_advisory_xact_lock(hashtextextended(v_tenant::text||v_actor::text||p_idempotency_key,0));
 select * into v_item from public.work_items where tenant_id=v_tenant and created_by=v_actor and idempotency_key=p_idempotency_key;
 if found then
 if v_item.request_hash<>v_hash then raise exception 'IDEMPOTENCY_CONFLICT' using errcode='22023'; end if;
 return to_jsonb(v_item)||jsonb_build_object('cached',true);
 end if;
 insert into public.work_items(tenant_id,title,description,priority,assigned_to,due_date,category,hamlet_id,idempotency_key,request_hash,created_by,updated_by)
 values(v_tenant,btrim(p_title),p_description,p_priority,p_assigned_to,p_due_date,coalesce(p_category,'CHUNG'),p_hamlet_id,p_idempotency_key,v_hash,v_actor,v_actor) returning * into v_item;
 insert into public.work_item_events(tenant_id,work_item_id,to_status,actor_id,created_by) values(v_tenant,v_item.id,v_item.status,v_actor,v_actor);
 insert into public.audit_log(tenant_id,actor_id,action,entity_type,entity_id,payload) values(v_tenant,v_actor,'CREATE_WORK_ITEM','work_item',v_item.id::text,jsonb_build_object('version',1));
 return to_jsonb(v_item);
end; $$;

-- File metadata can only be registered for a work item the account may update.
create function app.register_evidence(p_work_item_id uuid,p_original_name text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_tenant uuid; v_file public.evidence_files%rowtype; v_id uuid:=gen_random_uuid();
begin
 select id into strict v_tenant from public.tenants;
 if not pvh_private.can_access_work(v_tenant,p_work_item_id,'update') then raise exception 'FORBIDDEN' using errcode='42501'; end if;
 insert into public.evidence_files(id,tenant_id,work_item_id,object_path,original_name,uploaded_by)
 values(v_id,v_tenant,p_work_item_id,v_tenant::text||'/work_items/'||p_work_item_id::text||'/'||v_id::text,p_original_name,auth.uid()) returning * into v_file;
 insert into public.audit_log(tenant_id,actor_id,action,entity_type,entity_id) values(v_tenant,auth.uid(),'REGISTER_EVIDENCE','evidence_file',v_id::text);
 return to_jsonb(v_file);
end; $$;
create function pvh_private.can_access_evidence(p_path text,p_action text)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.evidence_files f where f.object_path=p_path and pvh_private.can_access_work(f.tenant_id,f.work_item_id,p_action));
$$;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('evidence','evidence',false,52428800,array['application/pdf','image/png','image/jpeg','application/vnd.openxmlformats-officedocument.wordprocessingml.document']);
create policy pvh_evidence_read on storage.objects for select to authenticated using(bucket_id='evidence' and pvh_private.can_access_evidence(name,'read'));
create policy pvh_evidence_insert on storage.objects for insert to authenticated with check(bucket_id='evidence' and owner_id=(select auth.uid())::text and pvh_private.can_access_evidence(name,'update'));

revoke execute on all functions in schema app,pvh_private from public,anon,authenticated;
grant execute on function pvh_private.has_permission(uuid,text),pvh_private.can_access_work(uuid,uuid,text),pvh_private.can_access_evidence(text,text) to authenticated;
grant execute on function app.user_tenant_ids(),app.has_permission(uuid,text),app.create_work_item(text,text,text,text,uuid,timestamptz,text,uuid,uuid),app.register_evidence(uuid,text) to authenticated;
-- Ensure project-created event-trigger helper cannot be invoked over REST.
do $guard_rls$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke execute on function public.rls_auto_enable() from public,anon,authenticated';
  end if;
end $guard_rls$;

-- Expose the explicitly granted API schema used by the Next.js repository.
alter role authenticator set pgrst.db_schemas='public,graphql_public,app';
notify pgrst,'reload config';
notify pgrst,'reload schema';
-- Initial configuration only: one anonymous demo commune, no account or password seed.
insert into public.tenants(code,name,features)
values('TN-DEMO-A','Xã cấu hình demo', '{"singleCommune":true,"accountBasedAuthorization":true}'::jsonb);
insert into public.org_units(tenant_id,code,name,kind)
select id,'VHXH','Phòng Văn hóa – Xã hội','DEPARTMENT' from public.tenants;
insert into public.module_entitlements(tenant_id,module_key,enabled)
select t.id,'m'||lpad(n::text,2,'0'),n in(0,1) from public.tenants t cross join generate_series(0,10) n;
insert into public.roles(code,name) values
('SYSTEM_ADMIN','Quản trị tài khoản và kiểm toán; không mặc định đọc hồ sơ nghiệp vụ'),
('WORK_MANAGER','Điều phối công việc'),('WORK_OFFICER','Cán bộ xử lý công việc được giao hoặc tự lập'),
('WORK_VIEWER','Chỉ xem công việc'),('AUDITOR','Tra cứu kiểm toán');
insert into public.permissions(code,description) values
('m00:membership:read','Đọc danh sách tài khoản và phân công'),
('m00:audit:read','Đọc nhật ký kiểm toán'),('m00:jobs:read','Đọc trạng thái tác vụ hệ thống'),
('m01:work:read','Đọc công việc trong phạm vi'),('m01:work:read_all','Đọc toàn bộ công việc của xã'),
('m01:work:create','Tạo công việc trong phạm vi'),('m01:work:update','Sửa công việc trong phạm vi'),
('m01:work:update_all','Sửa công việc toàn xã'),('m01:work:assign','Giao công việc cho người khác'),
('m01:work:review','Rà soát kết quả công việc');
insert into public.role_permissions(role_code,permission_code)
select 'SYSTEM_ADMIN',code from public.permissions where code like 'm00:%';
insert into public.role_permissions(role_code,permission_code)
select 'WORK_MANAGER',code from public.permissions where code like 'm01:%';
insert into public.role_permissions(role_code,permission_code)
select 'WORK_OFFICER',code from public.permissions where code in ('m01:work:read','m01:work:create','m01:work:update');
insert into public.role_permissions(role_code,permission_code)
select 'WORK_VIEWER',code from public.permissions where code in('m01:work:read','m01:work:read_all');
insert into public.role_permissions values('AUDITOR','m00:audit:read');
