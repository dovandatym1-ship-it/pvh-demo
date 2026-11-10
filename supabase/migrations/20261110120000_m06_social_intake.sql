-- M06: safe social-benefit intake and non-fabricated reconciliation receipts.
-- Source-only migration: never apply directly to Demo-pvh without staging approval.
-- No real or fictitious beneficiaries are seeded.

insert into public.roles(code,name) values
 ('SOCIAL_OFFICER','Cán bộ y tế và an sinh xã hội'),
 ('SOCIAL_MANAGER','Đầu mối quản lý y tế và an sinh xã hội')
on conflict(code) do nothing;
insert into public.permissions(code,description) values
 ('m06:social:read','Tra cứu hồ sơ an sinh trong phạm vi phân công'),
 ('m06:social:write','Tiếp nhận và lập yêu cầu đối soát hồ sơ an sinh'),
 ('m06:social:pii_unmask','Xem thông tin nhân thân và sức khỏe nhạy cảm được giao')
on conflict(code) do nothing;
insert into public.role_permissions(role_code,permission_code) values
 ('SOCIAL_OFFICER','m06:social:read'),
 ('SOCIAL_MANAGER','m06:social:read'),('SOCIAL_MANAGER','m06:social:write'),
 ('SOCIAL_MANAGER','m06:social:pii_unmask')
on conflict do nothing;

create table public.social_protection_beneficiaries (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id) on delete restrict,
 code text not null,
 full_name text not null check(length(btrim(full_name)) between 2 and 150),
 cccd text not null check(cccd ~ '^\d{12}$'),
 phone text check(phone is null or phone ~ '^\+?[0-9]{9,15}$'),
 hamlet_id uuid not null,
 aid_category text not null check(length(btrim(aid_category)) between 2 and 150),
 monthly_amount numeric(15,2) not null check(monthly_amount > 0),
 diagnosis text check(diagnosis is null or length(diagnosis)<=1000),
 payment_status text not null default 'PENDING' check(payment_status in ('PENDING','PAID','SUSPENDED')),
 health_insurance_provided boolean not null default false,
 version integer not null default 1 check(version>0),
 created_by uuid not null references auth.users(id) on delete restrict,
 updated_by uuid not null references auth.users(id) on delete restrict,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,id),unique(tenant_id,code),unique(tenant_id,cccd),
 foreign key(tenant_id,hamlet_id) references public.org_units(tenant_id,id) on delete restrict
);

create table public.food_safety_inspections (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id) on delete restrict,
 facility_name text not null,
 inspection_type text not null check(inspection_type in ('STREET_FOOD','SCHOOL_CANTEEN','ARTISAN_PRODUCER')),
 inspection_date date not null,
 total_score integer check(total_score between 0 and 100),
 sample_retention_24h_passed boolean,
 conclusion text not null default 'PENDING' check(conclusion in ('PENDING','PASSED','WARNING_REMEDIAL','FAILED_SUSPEND')),
 version integer not null default 1 check(version>0),
 created_by uuid references auth.users(id) on delete restrict,
 updated_by uuid references auth.users(id) on delete restrict,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,id)
);

create table public.medical_facilities (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id) on delete restrict,
 facility_name text not null,
 facility_sub_type text not null check(facility_sub_type in ('TRADITIONAL_CLINIC','SPECIALIZED_CLINIC','DRUG_STORE')),
 practitioner_name text not null,
 license_number text,
 license_issue_date date,
 gpp_certified boolean not null default false,
 controlled_drugs_ledger boolean not null default false,
 inspection_status text not null default 'UNVERIFIED'
  check(inspection_status in ('UNVERIFIED','NORMAL','WARNING')),
 version integer not null default 1 check(version>0),
 created_by uuid references auth.users(id) on delete restrict,
 updated_by uuid references auth.users(id) on delete restrict,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,id)
);
create table public.epidemic_logs (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id) on delete restrict,
 hamlet_id uuid not null,
 disease_group text not null check(disease_group in ('GROUP_A','GROUP_B','GROUP_C')),
 disease_name text not null,
 cases_count integer not null check(cases_count>=0),
 hospitalized_count integer not null check(hospitalized_count>=0),
 deaths_count integer not null check(deaths_count>=0),
 outbreak_alert_flag boolean not null default false,
 log_week integer not null check(log_week between 1 and 53),
 log_year integer not null check(log_year between 1900 and 2200),
 reported_date date not null,
 version integer not null default 1 check(version>0),
 created_by uuid references auth.users(id) on delete restrict,
 updated_by uuid references auth.users(id) on delete restrict,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,id),
 foreign key(tenant_id,hamlet_id) references public.org_units(tenant_id,id) on delete restrict
);
create table public.social_aid_reconciliation_requests (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id) on delete restrict,
 beneficiary_id uuid not null,
 source_reference text not null check(length(btrim(source_reference)) between 5 and 200),
 idempotency_key text not null,
 status text not null default 'REQUESTED' check(status in ('REQUESTED','CONFIRMED','REJECTED')),
 requested_by uuid not null references auth.users(id) on delete restrict,
 created_at timestamptz not null default now(),
 unique(tenant_id,id),unique(tenant_id,requested_by,idempotency_key),
 foreign key(tenant_id,beneficiary_id) references public.social_protection_beneficiaries(tenant_id,id) on delete restrict
);
create index social_beneficiaries_hamlet_idx on public.social_protection_beneficiaries(tenant_id,hamlet_id);
create index social_aid_reconciliation_beneficiary_idx on public.social_aid_reconciliation_requests(tenant_id,beneficiary_id,created_at desc);
create index epidemic_logs_hamlet_idx on public.epidemic_logs(tenant_id,hamlet_id,reported_date desc);

do $$ declare t text;begin
 foreach t in array array['social_protection_beneficiaries','food_safety_inspections',
 'medical_facilities','epidemic_logs','social_aid_reconciliation_requests'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('alter table public.%I force row level security',t);
  execute format('revoke all on table public.%I from public,anon,authenticated',t);
 end loop;
end $$;
-- Expose only non-medical record types to explicitly entitled members.
grant select on public.food_safety_inspections,public.medical_facilities,public.epidemic_logs to authenticated;
create policy pvh_food_safety_read on public.food_safety_inspections for select to authenticated
 using (pvh_private.has_permission(tenant_id,'m06:social:read'));
create policy pvh_medical_facilities_read on public.medical_facilities for select to authenticated
 using (pvh_private.has_permission(tenant_id,'m06:social:read'));
create policy pvh_epidemic_logs_read on public.epidemic_logs for select to authenticated
 using (pvh_private.has_permission(tenant_id,'m06:social:read') and exists(
 select 1 from public.memberships m where m.user_id=auth.uid() and m.tenant_id=epidemic_logs.tenant_id
 and m.is_active and m.valid_from<=now() and (m.valid_to is null or m.valid_to>now())
 and (not (m.scopes ? 'org_unit_ids') or hamlet_id::text in(select jsonb_array_elements_text(m.scopes->'org_unit_ids')))
 ));
-- Sensitive beneficiaries and reconciliation receipts are deliberately NOT
-- SELECT-granted to authenticated. Their data is mediated by guarded RPC.
create function app.list_social_beneficiaries(p_limit integer default 500)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_actor uuid:=auth.uid();v_tenant uuid;v_scope jsonb;v_unmask boolean;v_rows jsonb;
begin
 select id into strict v_tenant from public.tenants;
 if v_actor is null or not pvh_private.has_permission(v_tenant,'m06:social:read')
 then raise exception 'FORBIDDEN' using errcode='42501';end if;
 if p_limit is null or p_limit not between 1 and 1000
 then raise exception 'INVALID_LIMIT' using errcode='22023';end if;
 select scopes into v_scope from public.memberships where tenant_id=v_tenant and user_id=v_actor and is_active;
 v_unmask:=pvh_private.has_permission(v_tenant,'m06:social:pii_unmask');
 select coalesce(jsonb_agg(jsonb_build_object(
  'id',x.id,'tenant_id',x.tenant_id,'code',x.code,'full_name',x.full_name,
  'cccd',case when v_unmask then x.cccd else null end,
  'phone',case when v_unmask then x.phone else null end,
  'hamlet_id',x.hamlet_id,'aid_category',x.aid_category,
  'monthly_amount',case when v_unmask then x.monthly_amount else null end,
  'diagnosis',case when v_unmask then x.diagnosis else null end,
  'payment_status',x.payment_status,'health_insurance_provided',x.health_insurance_provided,
  'version',x.version,'created_at',x.created_at,'updated_at',x.updated_at
  ) order by x.created_at,x.id),'[]'::jsonb) into v_rows
 from (select * from public.social_protection_beneficiaries b
 where b.tenant_id=v_tenant and (not (v_scope ? 'org_unit_ids')
 or b.hamlet_id::text in(select jsonb_array_elements_text(v_scope->'org_unit_ids')))
 order by b.created_at,b.id limit p_limit) x;
 return v_rows;
end;$$;

create function app.create_social_beneficiary(
 p_full_name text,p_cccd text,p_phone text,p_hamlet_id uuid,p_aid_category text,
 p_monthly_amount numeric,p_diagnosis text,p_health_insurance_provided boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid();v_tenant uuid;v_scope jsonb;
 v_row public.social_protection_beneficiaries%rowtype;
begin
 select id into strict v_tenant from public.tenants;
 if v_actor is null or not pvh_private.has_permission(v_tenant,'m06:social:write')
 then raise exception 'FORBIDDEN' using errcode='42501';end if;
 select scopes into v_scope from public.memberships where tenant_id=v_tenant and user_id=v_actor and is_active;
 if v_scope ? 'org_unit_ids' and not (p_hamlet_id::text in(select jsonb_array_elements_text(v_scope->'org_unit_ids')))
 then raise exception 'FORBIDDEN_HAMLET' using errcode='42501';end if;
 if p_hamlet_id is null or not exists(select 1 from public.org_units
   where tenant_id=v_tenant and id=p_hamlet_id and kind='HAMLET' and is_active)
 then raise exception 'INVALID_HAMLET' using errcode='22023';end if;
 if p_full_name is null or length(btrim(p_full_name)) not between 2 and 150
 or p_cccd is null or p_cccd !~ '^\d{12}$'
 or p_aid_category is null or length(btrim(p_aid_category)) not between 2 and 150
 or p_monthly_amount is null or p_monthly_amount<=0 or p_health_insurance_provided is null
 or (p_phone is not null and p_phone !~ '^\+?[0-9]{9,15}$')
 or length(coalesce(p_diagnosis,''))>1000
 then raise exception 'INVALID_BENEFICIARY' using errcode='22023';end if;
 insert into public.social_protection_beneficiaries(
 tenant_id,code,full_name,cccd,phone,hamlet_id,aid_category,monthly_amount,diagnosis,
 health_insurance_provided,created_by,updated_by)
 values(v_tenant,'BT-'||upper(substring(replace(gen_random_uuid()::text,'-',''),1,12)),
 btrim(p_full_name),p_cccd,p_phone,p_hamlet_id,btrim(p_aid_category),p_monthly_amount,
 nullif(btrim(coalesce(p_diagnosis,'')),''),p_health_insurance_provided,v_actor,v_actor)
 returning * into v_row;
 insert into public.audit_log(tenant_id,actor_id,action,entity_type,entity_id,payload)
 values(v_tenant,v_actor,'M06_CREATE_SOCIAL_BENEFICIARY','social_protection_beneficiary',v_row.id::text,
 jsonb_build_object('code',v_row.code,'hamletId',v_row.hamlet_id,'status',v_row.payment_status));
 return jsonb_build_object('id',v_row.id,'code',v_row.code,'status',v_row.payment_status);
end;$$;

-- Capture a verifiable reconciliation request. Never mark a person PAID
-- simply because an operator pressed a button or pasted a reference.
create function app.request_social_aid_reconciliation(
 p_beneficiary_id uuid,p_source_reference text,p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid();v_tenant uuid;v_scope jsonb;
 v_beneficiary public.social_protection_beneficiaries%rowtype;
 v_row public.social_aid_reconciliation_requests%rowtype;
begin
 select id into strict v_tenant from public.tenants;
 if v_actor is null or not pvh_private.has_permission(v_tenant,'m06:social:write')
 then raise exception 'FORBIDDEN' using errcode='42501';end if;
 if p_source_reference is null or length(btrim(p_source_reference)) not between 5 and 200
 or p_idempotency_key is null or length(btrim(p_idempotency_key)) not between 8 and 100
 then raise exception 'INVALID_RECONCILIATION' using errcode='22023';end if;
 select * into v_beneficiary from public.social_protection_beneficiaries
 where id=p_beneficiary_id and tenant_id=v_tenant for update;
 if not found then raise exception 'NOT_FOUND' using errcode='P0002';end if;
 select scopes into v_scope from public.memberships where tenant_id=v_tenant and user_id=v_actor and is_active;
 if v_scope ? 'org_unit_ids' and not (v_beneficiary.hamlet_id::text in(select jsonb_array_elements_text(v_scope->'org_unit_ids')))
 then raise exception 'FORBIDDEN_HAMLET' using errcode='42501';end if;
 select * into v_row from public.social_aid_reconciliation_requests
 where tenant_id=v_tenant and requested_by=v_actor and idempotency_key=p_idempotency_key;
 if found then
  if v_row.beneficiary_id<>p_beneficiary_id or v_row.source_reference<>btrim(p_source_reference)
  then raise exception 'IDEMPOTENCY_CONFLICT' using errcode='PV409';end if;
  return jsonb_build_object('id',v_row.id,'status',v_row.status,'cached',true);
 end if;
 insert into public.social_aid_reconciliation_requests
 (tenant_id,beneficiary_id,source_reference,idempotency_key,requested_by)
 values(v_tenant,p_beneficiary_id,btrim(p_source_reference),p_idempotency_key,v_actor)
 returning * into v_row;
 insert into public.audit_log(tenant_id,actor_id,action,entity_type,entity_id,payload)
 values(v_tenant,v_actor,'M06_REQUEST_RECONCILIATION','social_aid_reconciliation',v_row.id::text,
 jsonb_build_object('beneficiaryId',v_row.beneficiary_id,'status',v_row.status));
 return jsonb_build_object('id',v_row.id,'status',v_row.status,'cached',false);
end;$$;

revoke execute on function app.list_social_beneficiaries(integer) from public,anon,authenticated;
revoke execute on function app.create_social_beneficiary(text,text,text,uuid,text,numeric,text,boolean) from public,anon,authenticated;
revoke execute on function app.request_social_aid_reconciliation(uuid,text,text) from public,anon,authenticated;
grant execute on function app.list_social_beneficiaries(integer) to authenticated;
grant execute on function app.create_social_beneficiary(text,text,text,uuid,text,numeric,text,boolean) to authenticated;
grant execute on function app.request_social_aid_reconciliation(uuid,text,text) to authenticated;
notify pgrst,'reload schema';
