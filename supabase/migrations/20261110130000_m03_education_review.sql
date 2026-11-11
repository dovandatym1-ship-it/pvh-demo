-- M03: education records, tenant-scoped reads and audited decision receipts.
-- No source data, student identities or official decisions are seeded.
insert into public.roles(code,name) values
 ('EDUCATION_OFFICER','Cán bộ phụ trách giáo dục'),
 ('EDUCATION_REVIEWER','Cán bộ được phân công rà soát hồ sơ giáo dục')
on conflict(code) do nothing;
insert into public.permissions(code,description) values
 ('m03:education:read','Xem hồ sơ giáo dục được phân công'),
 ('m03:education:write','Ghi nhận kết quả rà soát hồ sơ giáo dục có chứng từ')
on conflict(code) do nothing;
insert into public.role_permissions(role_code,permission_code) values
 ('EDUCATION_OFFICER','m03:education:read'),
 ('EDUCATION_REVIEWER','m03:education:read'),
 ('EDUCATION_REVIEWER','m03:education:write')
on conflict do nothing;

create table public.schools (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id) on delete restrict,
 name text not null check(length(btrim(name)) between 3 and 250),
 level text not null check(level in ('PRESCHOOL','PRIMARY','SECONDARY')),
 principal text not null check(length(btrim(principal))>=2),
 total_students integer not null check(total_students>=0),
 school_year text not null check(school_year ~ '^\d{4}-\d{4}$'),
 universalization_standard text not null check(universalization_standard in ('LEVEL_1','LEVEL_2','LEVEL_3')),
 version integer not null default 1 check(version>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,id)
);
create table public.private_childcare_facilities (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id) on delete restrict,
 name text not null check(length(btrim(name))>=3),
 facility_type text not null check(facility_type in ('INDEPENDENT_NURSERY_GROUP','INDEPENDENT_KINDERGARTEN_CLASS')),
 owner_name text not null,
 owner_cccd text check(owner_cccd is null or owner_cccd ~ '^\d{12}$'),
 capacity integer not null check(capacity>=0),
 current_enrolled integer not null check(current_enrolled>=0 and current_enrolled<=capacity),
 total_area_sqm numeric(12,2) check(total_area_sqm>=0),
 sqm_per_child numeric(10,2) check(sqm_per_child>=0),
 fire_safety_certified boolean not null default false,
 food_safety_certified boolean not null default false,
 licensing_status text not null default 'PROBATION'
 check(licensing_status in ('LICENSED','PROBATION','SUSPENDED','DISSOLVED')),
 version integer not null default 1 check(version>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,id)
);
create table public.tuition_exemptions (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id) on delete restrict,
 student_name text not null check(length(btrim(student_name)) between 2 and 150),
 school_name text not null,
 grade text not null,
 category text not null check(category in ('POOR_HOUSEHOLD','NEAR_POOR','DISABILITY','ORPHAN')),
 exemption_percent integer not null check(exemption_percent between 0 and 100),
 support_amount numeric(15,2) not null check(support_amount>=0),
 status text not null default 'PENDING' check(status in ('PENDING','APPROVED','REJECTED')),
 semester text not null,
 version integer not null default 1 check(version>0),
 decision_reference text,
 decision_by uuid references auth.users(id) on delete restrict,
 decision_at timestamptz,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,id),
 check((status='PENDING' and decision_reference is null and decision_by is null and decision_at is null)
   or (status<>'PENDING' and decision_reference is not null and decision_by is not null and decision_at is not null))
);
create index tuition_exemptions_status_idx on public.tuition_exemptions(tenant_id,status,created_at desc);

do $$ declare t text;begin
 foreach t in array array['schools','private_childcare_facilities','tuition_exemptions'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('alter table public.%I force row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated',t);
 end loop;
end $$;
grant select on public.schools,public.tuition_exemptions to authenticated;
-- Grant non-PII columns only for school group representatives; never owner_cccd.
grant select(id,tenant_id,name,facility_type,owner_name,capacity,current_enrolled,
 total_area_sqm,sqm_per_child,fire_safety_certified,food_safety_certified,
 licensing_status,version,created_at,updated_at)
 on public.private_childcare_facilities to authenticated;
create policy schools_pvh_read on public.schools for select to authenticated
 using (pvh_private.has_permission(tenant_id,'m03:education:read'));
create policy childcare_pvh_read on public.private_childcare_facilities for select to authenticated
 using (pvh_private.has_permission(tenant_id,'m03:education:read'));
create policy tuition_pvh_read on public.tuition_exemptions for select to authenticated
 using (pvh_private.has_permission(tenant_id,'m03:education:read'));

create function app.approve_tuition_exemption(
 p_tenant_id uuid,p_exemption_id uuid,p_status text,
 p_idempotency_key text default null,p_expected_version integer default null,
 p_decision_reference text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_tenant uuid;v_actor uuid:=auth.uid();
 v_old public.tuition_exemptions%rowtype;v_new public.tuition_exemptions%rowtype;
begin
 select id into strict v_tenant from public.tenants;
 if v_actor is null or p_tenant_id is distinct from v_tenant
 or not pvh_private.has_permission(v_tenant,'m03:education:write')
 then raise exception 'FORBIDDEN' using errcode='42501';end if;
 if p_status not in ('APPROVED','REJECTED') or p_expected_version is null
 or p_decision_reference is null or length(btrim(p_decision_reference)) not between 5 and 200
 then raise exception 'DECISION_REQUIRES_AUTHORITY_AND_VERSION' using errcode='22023';end if;
 select * into v_old from public.tuition_exemptions
 where tenant_id=v_tenant and id=p_exemption_id for update;
 if not found then raise exception 'NOT_FOUND' using errcode='P0002';end if;
 if v_old.version<>p_expected_version then raise exception 'VERSION_CONFLICT' using errcode='PV409';end if;
 if v_old.status<>'PENDING' then raise exception 'ALREADY_DECIDED' using errcode='22023';end if;
 update public.tuition_exemptions set status=p_status,decision_reference=btrim(p_decision_reference),
 decision_by=v_actor,decision_at=now(),updated_at=now(),version=version+1
 where tenant_id=v_tenant and id=p_exemption_id returning * into v_new;
 insert into public.audit_log(tenant_id,actor_id,action,entity_type,entity_id,payload)
 values(v_tenant,v_actor,'M03_REVIEW_TUITION_EXEMPTION','tuition_exemption',v_new.id::text,
 jsonb_build_object('oldStatus',v_old.status,'status',v_new.status,
   'version',v_new.version,'decisionReference',v_new.decision_reference));
 return jsonb_build_object('id',v_new.id,'status',v_new.status,'version',v_new.version);
end;$$;
revoke execute on function app.approve_tuition_exemption(uuid,uuid,text,text,integer,text)
 from public,anon,authenticated;
grant execute on function app.approve_tuition_exemption(uuid,uuid,text,text,integer,text)
 to authenticated;
notify pgrst,'reload schema';
