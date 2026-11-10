-- M02: scoped labor cases, source-backed wage reporting and sensitive NCC records.
-- No fabricated entitlements, salary thresholds, legacy district decisions or private citizens are seeded.
insert into public.roles(code,name) values
 ('INTERNAL_OFFICER','Cán bộ nội vụ và lao động'),
 ('INTERNAL_REVIEWER','Người được phân công rà soát nội vụ và lao động')
on conflict(code) do nothing;
insert into public.permissions(code,description) values
 ('m02:internal:read','Tra cứu hồ sơ nội vụ và lao động được phân công'),
 ('m02:internal:write','Ghi nhận kết quả xử lý tranh chấp có nguồn'),
 ('m02:internal:pii_unmask','Xem trường nhân thân, phụ cấp người có công được giao')
on conflict(code) do nothing;
insert into public.role_permissions(role_code,permission_code) values
 ('INTERNAL_OFFICER','m02:internal:read'),
 ('INTERNAL_REVIEWER','m02:internal:read'),
 ('INTERNAL_REVIEWER','m02:internal:write'),
 ('INTERNAL_REVIEWER','m02:internal:pii_unmask')
on conflict do nothing;

create table public.ncc_beneficiaries (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id) on delete restrict,
 code text not null,
 full_name text not null check(length(btrim(full_name)) between 2 and 150),
 cccd text check(cccd is null or cccd ~ '^\d{12}$'),
 hamlet_id uuid not null,
 category text not null check(category in
 ('THUONG_BINH','LIET_SI','BENH_BINH','CHAT_DOC_HOA_HOC','BA_ME_VNAH')),
 medal_title text not null default '',
 monthly_allowance numeric(15,2) check(monthly_allowance>=0),
 has_deduplication_flag boolean not null default false,
 deduplication_warning text,
 status text not null default 'REVIEW_PENDING' check(status in ('ACTIVE','REVIEW_PENDING')),
 version integer not null default 1 check(version>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,id),unique(tenant_id,code),
 foreign key(tenant_id,hamlet_id) references public.org_units(tenant_id,id) on delete restrict
);
create table public.labor_contracts (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id) on delete restrict,
 business_name text not null,
 tax_code text not null check(length(btrim(tax_code)) between 10 and 14),
 total_workers integer not null check(total_workers>=0),
 min_wage_paid numeric(15,2) not null check(min_wage_paid>=0),
 regional_min_wage numeric(15,2) not null check(regional_min_wage>0),
 is_under_min_wage boolean generated always as (min_wage_paid<regional_min_wage) stored,
 seasonal_workers_count integer not null check(seasonal_workers_count>=0),
 bhxh_registered_count integer not null check(bhxh_registered_count>=0 and bhxh_registered_count<=total_workers),
 evaluation_period text not null,
 source_reference text not null check(length(btrim(source_reference)) between 5 and 200),
 version integer not null default 1 check(version>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,id)
);
create table public.labor_disputes (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id) on delete restrict,
 code text not null,
 requester_name text not null,
 requester_role text not null check(requester_role in ('EMPLOYEE','EMPLOYER','COLLECTIVE')),
 respondent_name text not null,
 dispute_content text not null,
 dispute_type text not null check(dispute_type in ('INDIVIDUAL','COLLECTIVE')),
 received_date date not null,
 status text not null default 'RECEIVED'
 check(status in ('RECEIVED','SCHEDULED','RESOLVED_SUCCESS','RESOLVED_FAILED','ESCALATED_DISTRICT')),
 outcome_summary text,
 source_reference text not null check(length(btrim(source_reference)) between 5 and 200),
 decision_reference text,
 version integer not null default 1 check(version>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,id),unique(tenant_id,code)
);
create index ncc_hamlet_idx on public.ncc_beneficiaries(tenant_id,hamlet_id);
create index labor_disputes_status_idx on public.labor_disputes(tenant_id,status,received_date desc);
do $$ declare t text;begin
 foreach t in array array['ncc_beneficiaries','labor_contracts','labor_disputes'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('alter table public.%I force row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated',t);
 end loop;
end $$;
grant select on public.labor_contracts,public.labor_disputes to authenticated;
create policy pvh_labor_contracts_read on public.labor_contracts for select to authenticated
 using (pvh_private.has_permission(tenant_id,'m02:internal:read'));
create policy pvh_labor_disputes_read on public.labor_disputes for select to authenticated
 using (pvh_private.has_permission(tenant_id,'m02:internal:read'));

create function app.list_ncc_beneficiaries(p_limit integer default 500)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_tenant uuid;v_actor uuid:=auth.uid();v_scope jsonb;v_sensitive boolean;v_rows jsonb;
begin
 select id into strict v_tenant from public.tenants;
 if v_actor is null or not pvh_private.has_permission(v_tenant,'m02:internal:read')
 then raise exception 'FORBIDDEN' using errcode='42501';end if;
 if p_limit is null or p_limit not between 1 and 1000
 then raise exception 'INVALID_LIMIT' using errcode='22023';end if;
 select scopes into v_scope from public.memberships where tenant_id=v_tenant and user_id=v_actor and is_active;
 v_sensitive:=pvh_private.has_permission(v_tenant,'m02:internal:pii_unmask');
 select coalesce(jsonb_agg(jsonb_build_object(
  'id',x.id,'code',x.code,'full_name',x.full_name,'hamlet_id',x.hamlet_id,
  'category',x.category,'medal_title',x.medal_title,'status',x.status,
  'has_deduplication_flag',x.has_deduplication_flag,
  'deduplication_warning',case when v_sensitive then x.deduplication_warning else null end,
  'cccd',case when v_sensitive then x.cccd else null end,
  'monthly_allowance',case when v_sensitive then x.monthly_allowance else null end
  ) order by x.code),'[]'::jsonb) into v_rows
 from (select * from public.ncc_beneficiaries n
 where n.tenant_id=v_tenant and (not (v_scope ? 'org_unit_ids')
  or n.hamlet_id::text in(select jsonb_array_elements_text(v_scope->'org_unit_ids')))
 order by n.code limit p_limit) x;
 return v_rows;
end;$$;

create function app.resolve_labor_dispute(
 p_tenant_id uuid,p_dispute_id uuid,p_status text,p_outcome text,p_idempotency_key text default null,
 p_expected_version integer default null,p_decision_reference text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid();v_tenant uuid;
 v_old public.labor_disputes%rowtype;v_new public.labor_disputes%rowtype;
begin
 select id into strict v_tenant from public.tenants;
 if v_actor is null or p_tenant_id is distinct from v_tenant
 or not pvh_private.has_permission(v_tenant,'m02:internal:write')
 then raise exception 'FORBIDDEN' using errcode='42501';end if;
 if p_status not in ('SCHEDULED','RESOLVED_SUCCESS','RESOLVED_FAILED')
 or p_expected_version is null
 or p_decision_reference is null or length(btrim(p_decision_reference)) not between 5 and 200
 or p_outcome is null or length(btrim(p_outcome)) not between 5 and 2000
 then raise exception 'INVALID_DISPUTE_RESOLUTION' using errcode='22023';end if;
 select * into v_old from public.labor_disputes
 where tenant_id=v_tenant and id=p_dispute_id for update;
 if not found then raise exception 'NOT_FOUND' using errcode='P0002';end if;
 if v_old.version<>p_expected_version then raise exception 'VERSION_CONFLICT' using errcode='PV409';end if;
 if v_old.status in ('RESOLVED_SUCCESS','RESOLVED_FAILED','ESCALATED_DISTRICT')
 then raise exception 'CLOSED_DISPUTE' using errcode='22023';end if;
 if v_old.status='RECEIVED' and p_status not in ('SCHEDULED','RESOLVED_SUCCESS','RESOLVED_FAILED')
 then raise exception 'INVALID_TRANSITION' using errcode='22023';end if;
 update public.labor_disputes set status=p_status,outcome_summary=btrim(p_outcome),
 decision_reference=btrim(p_decision_reference),version=version+1,updated_at=now()
 where tenant_id=v_tenant and id=p_dispute_id returning * into v_new;
 insert into public.audit_log(tenant_id,actor_id,action,entity_type,entity_id,payload)
 values(v_tenant,v_actor,'M02_RESOLVE_LABOR_DISPUTE','labor_dispute',v_new.id::text,
 jsonb_build_object('oldStatus',v_old.status,'newStatus',v_new.status,
 'reference',v_new.decision_reference,'version',v_new.version));
 return jsonb_build_object('id',v_new.id,'status',v_new.status,'version',v_new.version);
end;$$;
revoke execute on function app.list_ncc_beneficiaries(integer) from public,anon,authenticated;
revoke execute on function app.resolve_labor_dispute(uuid,uuid,text,text,text,integer,text) from public,anon,authenticated;
grant execute on function app.list_ncc_beneficiaries(integer) to authenticated;
grant execute on function app.resolve_labor_dispute(uuid,uuid,text,text,text,integer,text) to authenticated;
notify pgrst,'reload schema';
