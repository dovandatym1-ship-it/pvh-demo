-- M07: controlled faith / ethnicity domain foundation.
-- NO SEEDED PERSONS, no official decisions; records are intake-only.
-- Sensitive personal attributes are restricted to an explicitly assigned M07 role.

insert into public.roles(code,name) values
 ('FAITH_OFFICER','Cán bộ phụ trách dân tộc, tín ngưỡng và tôn giáo'),
 ('FAITH_MANAGER','Đầu mối quản lý dân tộc, tín ngưỡng và tôn giáo')
on conflict(code) do nothing;
insert into public.permissions(code,description) values
 ('m07:faith:read','Xem dữ liệu dân tộc, tín ngưỡng và tôn giáo được phân công'),
 ('m07:faith:manage','Ghi nhận hồ sơ tín ngưỡng, tôn giáo ở phạm vi được phân công')
on conflict(code) do nothing;
insert into public.role_permissions(role_code,permission_code) values
 ('FAITH_OFFICER','m07:faith:read'),
 ('FAITH_MANAGER','m07:faith:read'),('FAITH_MANAGER','m07:faith:manage')
on conflict do nothing;

create table public.religious_establishments (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id) on delete restrict,
 code text not null check(code ~ '^[A-Z0-9][A-Z0-9_-]{1,39}$'),
 name text not null check(length(btrim(name)) between 3 and 250),
 religion_type text not null check(religion_type in ('PHAT_GIAO','TIN_LANH','CONG_GIAO','TIN_NGUONG_DAN_GIAN')),
 representative_name text not null check(length(btrim(representative_name)) between 2 and 150),
 hamlet_id uuid not null,
 address text not null check(length(btrim(address)) between 3 and 300),
 status text not null default 'PENDING_REGISTRATION'
   check(status in ('PENDING_REGISTRATION','UNDER_REVIEW','ACTIVE')),
 follower_count integer not null default 0 check(follower_count>=0),
 version integer not null default 1 check(version>0),
 created_by uuid not null references auth.users(id) on delete restrict,
 updated_by uuid not null references auth.users(id) on delete restrict,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,id), unique(tenant_id,code),
 foreign key(tenant_id,hamlet_id) references public.org_units(tenant_id,id) on delete restrict
);
create table public.religious_events (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id) on delete restrict,
 establishment_id uuid not null,
 title text not null check(length(btrim(title)) between 3 and 250),
 event_date date not null,
 expected_attendees integer not null check(expected_attendees between 1 and 100000),
 status text not null default 'CHO_TIEP_NHAN' check(status in ('CHO_TIEP_NHAN','DA_TIEP_NHAN','TU_CHOI')),
 rejection_reason text,
 version integer not null default 1 check(version>0),
 created_by uuid not null references auth.users(id) on delete restrict,
 updated_by uuid not null references auth.users(id) on delete restrict,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,id),
 foreign key(tenant_id,establishment_id) references public.religious_establishments(tenant_id,id) on delete restrict
);
create table public.reputable_persons (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id) on delete restrict,
 full_name text not null check(length(btrim(full_name)) between 2 and 150),
 ethnic_group text not null,
 hamlet_id uuid not null,
 year_recognized integer not null check(year_recognized between 1945 and 2200),
 policy_status text not null default 'DANG_XAC_MINH' check(policy_status in ('DANG_XAC_MINH','DANG_HUONG','TAM_DUNG','THAY_THE')),
 monthly_allowance numeric(15,2) not null default 0 check(monthly_allowance>=0),
 version integer not null default 1 check(version>0),
 created_by uuid not null references auth.users(id) on delete restrict,
 updated_by uuid not null references auth.users(id) on delete restrict,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,id),
 foreign key(tenant_id,hamlet_id) references public.org_units(tenant_id,id) on delete restrict
);

create index religious_establishments_hamlet_idx on public.religious_establishments(tenant_id,hamlet_id,status);
create index reputable_persons_hamlet_idx on public.reputable_persons(tenant_id,hamlet_id);
create index religious_events_parent_idx on public.religious_events(tenant_id,establishment_id,event_date);

do $$ declare t text;begin
 foreach t in array array['religious_establishments','religious_events','reputable_persons'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('alter table public.%I force row level security',t);
  execute format('revoke all on table public.%I from public,anon,authenticated',t);
  execute format('grant select on table public.%I to authenticated',t);
 end loop;
end $$;
-- Match the role-based permission AND currently assigned hamlet. Empty scope
-- means no access, while absent scope means commune-wide only for explicit M07 roles.
create policy pvh_faith_establishments_read on public.religious_establishments for select to authenticated
using (pvh_private.has_permission(tenant_id,'m07:faith:read') and exists (
 select 1 from public.memberships m where m.user_id=auth.uid() and m.tenant_id=religious_establishments.tenant_id
 and m.is_active and m.valid_from<=now() and (m.valid_to is null or m.valid_to>now())
 and (not (m.scopes ? 'org_unit_ids') or hamlet_id::text in
   (select jsonb_array_elements_text(m.scopes->'org_unit_ids')))
));
create policy pvh_faith_events_read on public.religious_events for select to authenticated
using (pvh_private.has_permission(tenant_id,'m07:faith:read') and exists (
 select 1 from public.religious_establishments e where e.tenant_id=religious_events.tenant_id
 and e.id=religious_events.establishment_id
));
create policy pvh_faith_reputable_read on public.reputable_persons for select to authenticated
using (pvh_private.has_permission(tenant_id,'m07:faith:read') and exists (
 select 1 from public.memberships m where m.user_id=auth.uid() and m.tenant_id=reputable_persons.tenant_id
 and m.is_active and m.valid_from<=now() and (m.valid_to is null or m.valid_to>now())
 and (not (m.scopes ? 'org_unit_ids') or hamlet_id::text in
   (select jsonb_array_elements_text(m.scopes->'org_unit_ids')))
));

create function app.create_faith_establishment(p_code text,p_name text,p_religion_type text,
 p_representative_name text,p_hamlet_id uuid,p_address text,p_follower_count integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid();v_tenant uuid;v_scope jsonb;
 v_row public.religious_establishments%rowtype;
begin
 select id into strict v_tenant from public.tenants;
 if v_actor is null or not pvh_private.has_permission(v_tenant,'m07:faith:manage')
 then raise exception 'FORBIDDEN' using errcode='42501';end if;
 select scopes into v_scope from public.memberships where tenant_id=v_tenant and user_id=v_actor and is_active;
 if v_scope ? 'org_unit_ids' and not (p_hamlet_id::text in (select jsonb_array_elements_text(v_scope->'org_unit_ids')))
 then raise exception 'FORBIDDEN_HAMLET' using errcode='42501';end if;
 if p_hamlet_id is null or not exists(select 1 from public.org_units
 where tenant_id=v_tenant and id=p_hamlet_id and kind='HAMLET' and is_active)
 then raise exception 'INVALID_HAMLET' using errcode='22023';end if;
 if p_code is null or upper(btrim(p_code)) !~ '^[A-Z0-9][A-Z0-9_-]{1,39}$'
 or p_name is null or length(btrim(p_name)) not between 3 and 250
 or p_religion_type not in ('PHAT_GIAO','TIN_LANH','CONG_GIAO','TIN_NGUONG_DAN_GIAN')
 or p_representative_name is null or length(btrim(p_representative_name)) not between 2 and 150
 or p_address is null or length(btrim(p_address)) not between 3 and 300
 or p_follower_count is null or p_follower_count<0
 then raise exception 'INVALID_ESTABLISHMENT' using errcode='22023';end if;
 insert into public.religious_establishments
 (tenant_id,code,name,religion_type,representative_name,hamlet_id,address,follower_count,created_by,updated_by)
 values (v_tenant,upper(btrim(p_code)),btrim(p_name),p_religion_type,btrim(p_representative_name),
 p_hamlet_id,btrim(p_address),p_follower_count,v_actor,v_actor) returning * into v_row;
 insert into public.audit_log(tenant_id,actor_id,action,entity_type,entity_id,payload)
 values(v_tenant,v_actor,'M07_CREATE_FAITH_ESTABLISHMENT','religious_establishment',v_row.id::text,
   jsonb_build_object('code',v_row.code,'hamletId',v_row.hamlet_id,'status',v_row.status));
 return to_jsonb(v_row);
end;$$;

create function app.register_faith_event(p_establishment_id uuid,p_title text,
 p_event_date date,p_expected_attendees integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid();v_tenant uuid;v_est public.religious_establishments%rowtype;
 v_row public.religious_events%rowtype;v_scope jsonb;
begin
 select id into strict v_tenant from public.tenants;
 if v_actor is null or not pvh_private.has_permission(v_tenant,'m07:faith:manage')
 then raise exception 'FORBIDDEN' using errcode='42501';end if;
 select * into v_est from public.religious_establishments
 where tenant_id=v_tenant and id=p_establishment_id;
 if not found then raise exception 'NOT_FOUND' using errcode='P0002';end if;
 select scopes into v_scope from public.memberships where tenant_id=v_tenant and user_id=v_actor and is_active;
 if v_scope ? 'org_unit_ids' and not (v_est.hamlet_id::text in(select jsonb_array_elements_text(v_scope->'org_unit_ids')))
 then raise exception 'FORBIDDEN_HAMLET' using errcode='42501';end if;
 if p_title is null or length(btrim(p_title)) not between 3 and 250
 or p_event_date is null or p_expected_attendees is null or p_expected_attendees not between 1 and 100000
 then raise exception 'INVALID_EVENT' using errcode='22023';end if;
 insert into public.religious_events(tenant_id,establishment_id,title,event_date,expected_attendees,created_by,updated_by)
 values(v_tenant,p_establishment_id,btrim(p_title),p_event_date,p_expected_attendees,v_actor,v_actor)
 returning * into v_row;
 insert into public.audit_log(tenant_id,actor_id,action,entity_type,entity_id,payload)
 values(v_tenant,v_actor,'M07_REGISTER_FAITH_EVENT','religious_event',v_row.id::text,
   jsonb_build_object('establishmentId',v_row.establishment_id,'status',v_row.status));
 return to_jsonb(v_row);
end;$$;

revoke execute on function app.create_faith_establishment(text,text,text,text,uuid,text,integer) from public,anon,authenticated;
revoke execute on function app.register_faith_event(uuid,text,date,integer) from public,anon,authenticated;
grant execute on function app.create_faith_establishment(text,text,text,text,uuid,text,integer) to authenticated;
grant execute on function app.register_faith_event(uuid,text,date,integer) to authenticated;
notify pgrst,'reload schema';
