-- PH03 staged contract. Apply only after G1/G2 and an independent RLS review.
-- No legal recognition, penalty or inspection authority is inferred from a role.
-- Uses the canonical PH01/PH02 singleton-tenant/auth/membership baseline.

insert into public.permissions(code,description) values
 ('m04:culture:read','Tra cứu hồ sơ bình xét theo phạm vi'),
 ('m04:culture:create','Nộp hồ sơ bình xét theo phạm vi'),
 ('m04:culture:evaluate','Rà soát nội bộ hồ sơ bình xét'),
 ('m05:digital:read','Tra cứu kế hoạch và chỉ tiêu CĐS'),
 ('m05:digital:write','Cập nhật chỉ tiêu CĐS được giao'),
 ('m05:digital:review','Đối soát chỉ tiêu CĐS'),
 ('m08:inspection:read','Tra cứu hồ sơ kiểm tra được phân quyền'),
 ('m08:inspection:write','Ghi nhận kiểm tra và kiến nghị'),
 ('m08:inspection:review','Xác minh khắc phục kiến nghị')
on conflict(code) do nothing;

insert into public.roles(code,name) values
 ('CULTURE_REVIEWER','Cán bộ rà soát hồ sơ văn hóa'),
 ('CULTURE_SUBMITTER','Đầu mối gửi hồ sơ văn hóa'),
 ('DIGITAL_COORDINATOR','Đầu mối kế hoạch/CĐS'),
 ('INSPECTION_COORDINATOR','Đầu mối kiểm tra/kiến nghị')
on conflict(code) do nothing;
insert into public.role_permissions(role_code,permission_code) values
 ('CULTURE_REVIEWER','m04:culture:read'),
 ('CULTURE_REVIEWER','m04:culture:evaluate'),
 ('CULTURE_SUBMITTER','m04:culture:read'),
 ('CULTURE_SUBMITTER','m04:culture:create'),
 ('DIGITAL_COORDINATOR','m05:digital:read'),
 ('DIGITAL_COORDINATOR','m05:digital:write'),
 ('DIGITAL_COORDINATOR','m05:digital:review'),
 ('INSPECTION_COORDINATOR','m08:inspection:read'),
 ('INSPECTION_COORDINATOR','m08:inspection:write'),
 ('INSPECTION_COORDINATOR','m08:inspection:review')
on conflict do nothing;

-- PH01 evidence metadata has a UUID primary key but not the composite
-- tenant/id key required for a tenant-safe FK from M04 submissions.
alter table public.evidence_files
 add constraint evidence_files_tenant_id_id_key unique(tenant_id,id);

create function pvh_private.ph03_in_scope(p_tenant uuid,p_hamlet uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select exists (
  select 1 from public.memberships m
  where m.user_id=auth.uid() and m.tenant_id=p_tenant and m.is_active
    and m.valid_from<=now() and (m.valid_to is null or m.valid_to>now())
    and (not(m.scopes ? 'org_unit_ids') or
         (p_hamlet is not null and exists(
           select 1 from jsonb_array_elements_text(m.scopes->'org_unit_ids') s(value)
           where s.value=p_hamlet::text)))
 );
$$;
revoke all on function pvh_private.ph03_in_scope(uuid,uuid) from public,anon;
grant execute on function pvh_private.ph03_in_scope(uuid,uuid) to authenticated;

-- M04: rule pack is versioned and explicitly non-official until evidence verifies it.
create table public.culture_rule_packs (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id) on delete restrict,
 title_type text not null check(title_type in ('GIA_DINH','THON','XA_TIEU_BIEU')),
 version integer not null check(version>0),
 status text not null default 'ILLUSTRATIVE_ONLY'
   check(status in ('ILLUSTRATIVE_ONLY','UNVERIFIED','VERIFIED')),
 jurisdiction text not null, source_ref text,
 effective_from date, effective_to date,
 criteria jsonb not null default '[]'::jsonb check(jsonb_typeof(criteria)='array'),
 min_score numeric(7,2),
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 unique(tenant_id,id),unique(tenant_id,title_type,version),
 check(effective_to is null or effective_from is null or effective_to>=effective_from),
 check(min_score is null or (min_score>=0 and min_score::text not in ('NaN','Infinity','-Infinity')))
);
create table public.campaigns (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id) on delete restrict,
 rule_pack_id uuid not null,
 title_type text not null check(title_type in ('GIA_DINH','THON','XA_TIEU_BIEU')),
 year integer not null check(year between 2000 and 2200),
 title text not null check(length(btrim(title)) between 3 and 250),
 status text not null default 'OPEN' check(status in ('DRAFT','OPEN','CLOSED')),
 opens_at timestamptz not null default now(),
 closes_at timestamptz not null,
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 unique(tenant_id,id),unique(tenant_id,title_type,year),
 foreign key(tenant_id,rule_pack_id) references public.culture_rule_packs(tenant_id,id),
 check(closes_at>opens_at)
);
create table public.submissions (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id) on delete restrict,
 campaign_id uuid not null,
 rule_pack_id uuid not null,
 rule_pack_version integer not null,
 subject_ref text not null check(length(btrim(subject_ref)) between 2 and 150),
 household_head_name text not null check(length(btrim(household_head_name)) between 2 and 250),
 hamlet_id uuid not null,
 submission_type text not null check(submission_type in ('GIA_DINH','THON','XA_TIEU_BIEU')),
 status text not null default 'CHO_RA_SOAT'
   check(status in ('CHO_RA_SOAT','THIEU_MINH_CHUNG','YEU_CAU_BO_SUNG','DAT','KHONG_DAT')),
 score numeric(7,2), criteria_scores jsonb not null default '[]'::jsonb,
 work_item_id uuid, evidence_id uuid, reviewer_comment text, source_ref text not null,
 idempotency_key text not null check(length(btrim(idempotency_key)) between 1 and 200),
 request_hash text not null,
 version integer not null default 1 check(version>0),
 created_by uuid not null references auth.users(id),
 updated_by uuid references auth.users(id),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,id),unique(tenant_id,campaign_id,subject_ref),
 unique(tenant_id,created_by,idempotency_key),
 foreign key(tenant_id,campaign_id) references public.campaigns(tenant_id,id),
 foreign key(tenant_id,rule_pack_id) references public.culture_rule_packs(tenant_id,id),
 foreign key(tenant_id,hamlet_id) references public.org_units(tenant_id,id),
 foreign key(tenant_id,work_item_id) references public.work_items(tenant_id,id),
 foreign key(tenant_id,evidence_id) references public.evidence_files(tenant_id,id),
 check(jsonb_typeof(criteria_scores)='array')
);
create table public.culture_submission_events (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null, submission_id uuid not null,
 actor_id uuid not null references auth.users(id),
 from_status text,to_status text not null,reason text,version integer not null,
 created_at timestamptz not null default now(),
 foreign key(tenant_id,submission_id) references public.submissions(tenant_id,id)
);
create index culture_submissions_scope_idx on public.submissions(tenant_id,hamlet_id,campaign_id);
create index culture_submissions_campaign_idx on public.submissions(tenant_id,campaign_id,status);
create index culture_events_parent_idx on public.culture_submission_events(tenant_id,submission_id,created_at);

-- M05: numeric zero is real data; missing, N/A, and unverified remain distinct.
create table public.digital_plans (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id),
 title text not null check(length(btrim(title)) between 3 and 250),
 period text not null check(length(btrim(period)) between 2 and 50),
 status text not null default 'DRAFT' check(status in ('DRAFT','IN_REVIEW','ACTIVE','CLOSED')),
 source_ref text not null,
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 unique(tenant_id,id),unique(tenant_id,title,period)
);
create table public.digital_plan_tasks (
 tenant_id uuid not null,plan_id uuid not null,work_item_id uuid not null,
 primary key(tenant_id,plan_id,work_item_id),
 unique(tenant_id,work_item_id),
 foreign key(tenant_id,plan_id) references public.digital_plans(tenant_id,id),
 foreign key(tenant_id,work_item_id) references public.work_items(tenant_id,id)
);
create table public.digital_indicators (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id),
 plan_id uuid,
 code text not null check(length(btrim(code)) between 1 and 60),
 name text not null check(length(btrim(name)) between 2 and 250),
 unit text not null check(length(btrim(unit)) between 1 and 50),
 evaluation_period text not null,
 numerator numeric, denominator numeric,
 numeric_value numeric,
 status text not null default 'NOT_REPORTED'
   check(status in ('NOT_REPORTED','UNVERIFIED','CONFIRMED','CONFIRMED_ZERO','NOT_APPLICABLE')),
 source_ref text, na_reason text, meaning text not null default '',
 version integer not null default 1 check(version>0),
 created_by uuid not null references auth.users(id),
 updated_by uuid references auth.users(id),
 updated_at timestamptz not null default now(),
 unique(tenant_id,id),unique(tenant_id,code,evaluation_period),
 foreign key(tenant_id,plan_id) references public.digital_plans(tenant_id,id),
 check(denominator is null or denominator>0),
 check(numeric_value is null or numeric_value::text not in ('NaN','Infinity','-Infinity')),
 check((status='CONFIRMED_ZERO' and numeric_value=0 and source_ref is not null)
    or (status='CONFIRMED' and numeric_value is not null and source_ref is not null)
    or (status='NOT_REPORTED' and numeric_value is null)
    or (status='NOT_APPLICABLE' and numeric_value is null and length(btrim(coalesce(na_reason,'')))>0)
    or (status='UNVERIFIED'))
);
create table public.digital_indicator_events (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null,indicator_id uuid not null,actor_id uuid not null references auth.users(id),
 status text not null,value numeric,source_ref text,version integer not null,
 created_at timestamptz not null default now(),
 foreign key(tenant_id,indicator_id) references public.digital_indicators(tenant_id,id)
);
create table public.community_digital_teams (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id),hamlet_id uuid not null,
 leader_name text not null,member_count integer not null default 0,
 citizens_supported integer not null default 0,vneid_level2_count integer not null default 0,
 status text not null default 'ACTIVE' check(status in ('ACTIVE','INACTIVE')),
 foreign key(tenant_id,hamlet_id) references public.org_units(tenant_id,id),
 unique(tenant_id,hamlet_id)
);
create index digital_indicators_period_idx on public.digital_indicators(tenant_id,evaluation_period,status);
create index digital_indicator_events_idx on public.digital_indicator_events(tenant_id,indicator_id,created_at);
create index digital_plan_tasks_work_idx on public.digital_plan_tasks(tenant_id,work_item_id);

-- M08: case/checklist source is separate from M01 task lifecycle.
create table public.inspection_records (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id),
 code text not null,target_name text not null,category text not null,
 hamlet_id uuid not null,inspector_name text not null,
 authority_ref text,checklist_version text not null,
 inspection_date date not null,
 notes text,remediation_deadline date,
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 unique(tenant_id,id),unique(tenant_id,code),
 foreign key(tenant_id,hamlet_id) references public.org_units(tenant_id,id)
);
create table public.inspection_recommendations (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null,inspection_id uuid not null,
 code text not null,title text not null,due_date date not null,
 work_item_id uuid not null,
 status text not null default 'PENDING'
   check(status in ('PENDING','FEEDBACK_UNVERIFIED','RESOLVED_CLOSED')),
 review_note text,version integer not null default 1 check(version>0),
 updated_at timestamptz not null default now(),
 created_by uuid not null references auth.users(id),
 unique(tenant_id,id),unique(tenant_id,inspection_id,code),unique(tenant_id,work_item_id),
 foreign key(tenant_id,inspection_id) references public.inspection_records(tenant_id,id),
 foreign key(tenant_id,work_item_id) references public.work_items(tenant_id,id)
);
create table public.inspection_events (
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,
 recommendation_id uuid not null,actor_id uuid not null references auth.users(id),
 status text not null,reason text,version integer not null,
 created_at timestamptz not null default now(),
 foreign key(tenant_id,recommendation_id) references public.inspection_recommendations(tenant_id,id)
);
create index inspection_scope_idx on public.inspection_records(tenant_id,hamlet_id,inspection_date);
create index inspection_recommendations_due_idx on public.inspection_recommendations(tenant_id,status,due_date);
create index inspection_events_parent_idx on public.inspection_events(tenant_id,recommendation_id,created_at);

-- Authenticated clients may SELECT scoped records, never bypass the workflow via direct INSERT/UPDATE.
do $ddl$
declare t text;
begin
 foreach t in array array[
  'culture_rule_packs','campaigns','submissions','culture_submission_events',
  'digital_plans','digital_plan_tasks','digital_indicators','digital_indicator_events',
  'community_digital_teams','inspection_records','inspection_recommendations','inspection_events'
 ] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('alter table public.%I force row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated',t);
  execute format('grant select on public.%I to authenticated',t);
 end loop;
end $ddl$;

create policy culture_rule_read on public.culture_rule_packs for select to authenticated
 using (pvh_private.has_permission(tenant_id,'m04:culture:read'));
create policy culture_campaign_read on public.campaigns for select to authenticated
 using (pvh_private.has_permission(tenant_id,'m04:culture:read'));
create policy culture_dossier_read on public.submissions for select to authenticated
 using (pvh_private.has_permission(tenant_id,'m04:culture:read')
        and pvh_private.ph03_in_scope(tenant_id,hamlet_id));
create policy culture_event_read on public.culture_submission_events for select to authenticated
 using (exists(select 1 from public.submissions s
               where s.id=public.culture_submission_events.submission_id
               and s.tenant_id=public.culture_submission_events.tenant_id));
create policy digital_plan_read on public.digital_plans for select to authenticated
 using (pvh_private.has_permission(tenant_id,'m05:digital:read'));
create policy digital_task_read on public.digital_plan_tasks for select to authenticated
 using (pvh_private.has_permission(tenant_id,'m05:digital:read')
        and pvh_private.can_access_work(tenant_id,work_item_id,'read'));
create policy digital_indicator_read on public.digital_indicators for select to authenticated
 using (pvh_private.has_permission(tenant_id,'m05:digital:read'));
create policy digital_indicator_event_read on public.digital_indicator_events for select to authenticated
 using (pvh_private.has_permission(tenant_id,'m05:digital:read'));
create policy digital_team_read on public.community_digital_teams for select to authenticated
 using (pvh_private.has_permission(tenant_id,'m05:digital:read')
        and pvh_private.ph03_in_scope(tenant_id,hamlet_id));
create policy inspection_record_read on public.inspection_records for select to authenticated
 using (pvh_private.has_permission(tenant_id,'m08:inspection:read')
        and pvh_private.ph03_in_scope(tenant_id,hamlet_id));
create policy inspection_recommendation_read on public.inspection_recommendations for select to authenticated
 using (exists(select 1 from public.inspection_records i
               where i.id=public.inspection_recommendations.inspection_id
               and i.tenant_id=public.inspection_recommendations.tenant_id));
create policy inspection_event_read on public.inspection_events for select to authenticated
 using (exists(select 1 from public.inspection_recommendations r
               where r.id=public.inspection_events.recommendation_id
               and r.tenant_id=public.inspection_events.tenant_id));

-- Do not seed population/PII and never grant new domain permissions to SYSTEM_ADMIN.

-- One active membership/tenant is required by the MVP contract.
create function pvh_private.ph03_tenant(p_permission text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_tenant uuid;
begin
 if auth.uid() is null then raise exception 'UNAUTHENTICATED' using errcode='28000'; end if;
 select m.tenant_id into strict v_tenant from public.memberships m
 where m.user_id=auth.uid() and m.is_active and m.valid_from<=now()
   and (m.valid_to is null or m.valid_to>now());
 if not pvh_private.has_permission(v_tenant,p_permission) then
   raise exception 'FORBIDDEN' using errcode='42501';
 end if;
 return v_tenant;
exception when no_data_found or too_many_rows then
 raise exception 'FORBIDDEN_MEMBERSHIP' using errcode='42501';
end; $$;
revoke all on function pvh_private.ph03_tenant(text) from public,anon,authenticated;

create function app.create_culture_rule_pack(
 p_title_type text,p_version integer,p_jurisdiction text,p_criteria jsonb,p_min_score numeric default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_tenant uuid;v_row public.culture_rule_packs%rowtype;
begin
 v_tenant:=pvh_private.ph03_tenant('m04:culture:evaluate');
 if p_title_type not in ('GIA_DINH','THON','XA_TIEU_BIEU') or p_version is null or p_version<1
 or p_jurisdiction is null or length(btrim(p_jurisdiction))<2
 or p_criteria is null or jsonb_typeof(p_criteria)<>'array'
 or (p_min_score is not null and (p_min_score<0 or
     p_min_score::text in ('NaN','Infinity','-Infinity'))) then
  raise exception 'VALIDATION' using errcode='22023';
 end if;
 insert into public.culture_rule_packs(tenant_id,title_type,version,jurisdiction,criteria,min_score,created_by)
 values(v_tenant,p_title_type,p_version,btrim(p_jurisdiction),p_criteria,p_min_score,auth.uid())
 returning * into v_row;
 insert into public.audit_log(tenant_id,actor_id,action,entity_type,entity_id,payload)
 values(v_tenant,auth.uid(),'M04_PACK_ILLUSTRATIVE','culture_rule_pack',v_row.id::text,
        jsonb_build_object('version',p_version,'legal_ready',false));
 return to_jsonb(v_row);
end; $$;

create function app.create_culture_campaign(
 p_rule_pack_id uuid,p_year integer,p_title text,p_closes_at timestamptz)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_tenant uuid;v_pack public.culture_rule_packs%rowtype;v_row public.campaigns%rowtype;
begin
 v_tenant:=pvh_private.ph03_tenant('m04:culture:evaluate');
 select * into strict v_pack from public.culture_rule_packs
 where id=p_rule_pack_id and tenant_id=v_tenant;
 if p_year not between 2000 and 2200 or length(btrim(coalesce(p_title,'')))<3
 or p_closes_at is null or p_closes_at<=now() then
   raise exception 'VALIDATION' using errcode='22023';
 end if;
 insert into public.campaigns(tenant_id,rule_pack_id,title_type,year,title,closes_at,created_by)
 values(v_tenant,v_pack.id,v_pack.title_type,p_year,btrim(p_title),p_closes_at,auth.uid())
 returning * into v_row;
 insert into public.audit_log(tenant_id,actor_id,action,entity_type,entity_id,payload)
 values(v_tenant,auth.uid(),'M04_CAMPAIGN_OPEN','culture_campaign',v_row.id::text,
        jsonb_build_object('rule_pack_id',v_pack.id,'rule_version',v_pack.version,'legal_ready',false));
 return to_jsonb(v_row);
exception when no_data_found then raise exception 'RULE_PACK_NOT_FOUND' using errcode='P0002';
end; $$;

-- A single RPC keeps pack creation and campaign opening atomic. A failed
-- campaign (e.g. duplicate year) must not leave an unused rule pack behind.
create function app.open_illustrative_culture_campaign(
 p_title_type text,p_year integer,p_title text,p_closes_at timestamptz)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_tenant uuid;v_version integer;v_pack jsonb;v_campaign jsonb;
begin
 v_tenant:=pvh_private.ph03_tenant('m04:culture:evaluate');
 if p_title_type is null or p_title_type not in ('GIA_DINH','THON','XA_TIEU_BIEU') or
    p_year is null or p_year not between 2000 and 2200 or
    length(btrim(coalesce(p_title,''))) not between 3 and 250 or
    p_closes_at is null or p_closes_at<=now() then
  raise exception 'VALIDATION' using errcode='22023';
 end if;
 perform pg_advisory_xact_lock(hashtextextended(v_tenant::text||':culture_pack:'||p_title_type,0));
 select coalesce(max(version),0)+1 into v_version from public.culture_rule_packs
 where tenant_id=v_tenant and title_type=p_title_type;
 v_pack:=app.create_culture_rule_pack(p_title_type,v_version,'MINH HỌA / CHƯA XÁC MINH',
  '[]'::jsonb,null);
 v_campaign:=app.create_culture_campaign((v_pack->>'id')::uuid,p_year,p_title,p_closes_at);
 return v_campaign;
end; $$;

create function app.submit_culture_dossier(
 p_campaign_id uuid,p_subject_ref text,p_subject_name text,p_hamlet_id uuid,
 p_source_ref text,p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_tenant uuid;v_campaign public.campaigns%rowtype;
        v_pack public.culture_rule_packs%rowtype;
        v_row public.submissions%rowtype;v_hash text;
begin
 v_tenant:=pvh_private.ph03_tenant('m04:culture:create');
 if length(btrim(coalesce(p_subject_ref,''))) not between 2 and 150
 or length(btrim(coalesce(p_subject_name,''))) not between 2 and 250
 or length(btrim(coalesce(p_source_ref,'')))<3
 or length(btrim(coalesce(p_idempotency_key,''))) not between 1 and 200 then
  raise exception 'VALIDATION' using errcode='22023';
 end if;
 select * into strict v_campaign from public.campaigns
 where id=p_campaign_id and tenant_id=v_tenant;
 select * into strict v_pack from public.culture_rule_packs
 where id=v_campaign.rule_pack_id and tenant_id=v_tenant;
 if p_hamlet_id is null or not pvh_private.ph03_in_scope(v_tenant,p_hamlet_id)
 or not exists(select 1 from public.org_units where tenant_id=v_tenant
 and id=p_hamlet_id and kind='HAMLET' and is_active) then
  raise exception 'FORBIDDEN_SCOPE' using errcode='42501';
 end if;
 v_hash:=encode(sha256(convert_to(jsonb_build_array(
 p_campaign_id,p_subject_ref,p_subject_name,p_hamlet_id,p_source_ref)::text,'UTF8')),'hex');
 perform pg_advisory_xact_lock(hashtextextended(v_tenant::text||auth.uid()::text||p_idempotency_key,0));
 select * into v_row from public.submissions
 where tenant_id=v_tenant and created_by=auth.uid() and idempotency_key=p_idempotency_key;
 if found then
  if v_row.request_hash<>v_hash then raise exception 'IDEMPOTENCY_CONFLICT' using errcode='PV409'; end if;
  return to_jsonb(v_row)||jsonb_build_object('cached',true);
 end if;
 -- An already accepted request can be retried even after the campaign closes;
 -- never accept a NEW submission once its intake window is closed.
 if v_campaign.status<>'OPEN' or v_campaign.opens_at>now() or v_campaign.closes_at<=now() then
  raise exception 'CAMPAIGN_CLOSED' using errcode='22023';
 end if;
 insert into public.submissions(tenant_id,campaign_id,rule_pack_id,rule_pack_version,subject_ref,
 household_head_name,hamlet_id,submission_type,source_ref,idempotency_key,request_hash,created_by)
 values(v_tenant,p_campaign_id,v_pack.id,v_pack.version,btrim(p_subject_ref),
 btrim(p_subject_name),p_hamlet_id,v_campaign.title_type,btrim(p_source_ref),p_idempotency_key,v_hash,auth.uid())
 returning * into v_row;
 insert into public.culture_submission_events(tenant_id,submission_id,actor_id,to_status,version)
 values(v_tenant,v_row.id,auth.uid(),v_row.status,1);
 insert into public.audit_log(tenant_id,actor_id,action,entity_type,entity_id,payload)
 values(v_tenant,auth.uid(),'M04_DOSSIER_SUBMIT','culture_submission',v_row.id::text,
        jsonb_build_object('campaign_id',p_campaign_id,'rule_version',v_row.rule_pack_version));
 return to_jsonb(v_row);
exception when no_data_found then raise exception 'CAMPAIGN_NOT_FOUND' using errcode='P0002';
end; $$;

create function app.review_culture_dossier(
 p_submission_id uuid,p_status text,p_score numeric,p_reason text,
 p_expected_version integer,p_evidence_id uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_tenant uuid;v_row public.submissions%rowtype;v_pack public.culture_rule_packs%rowtype;
begin
 v_tenant:=pvh_private.ph03_tenant('m04:culture:evaluate');
 select * into strict v_row from public.submissions
 where tenant_id=v_tenant and id=p_submission_id for update;
 if not pvh_private.ph03_in_scope(v_tenant,v_row.hamlet_id) then
   raise exception 'FORBIDDEN_SCOPE' using errcode='42501';
 end if;
 if p_expected_version is distinct from v_row.version then raise exception 'VERSION_CONFLICT' using errcode='PV409'; end if;
 if v_row.created_by=auth.uid() then raise exception 'SEPARATION_OF_DUTIES' using errcode='42501'; end if;
 if p_status not in ('THIEU_MINH_CHUNG','YEU_CAU_BO_SUNG','DAT','KHONG_DAT') then
  raise exception 'INVALID_TRANSITION' using errcode='22023';
 end if;
 if v_row.status not in ('CHO_RA_SOAT','THIEU_MINH_CHUNG','YEU_CAU_BO_SUNG') then
  raise exception 'INVALID_TRANSITION' using errcode='22023';
 end if;
 if length(btrim(coalesce(p_reason,'')))<5 then raise exception 'REASON_REQUIRED' using errcode='22023'; end if;
 if p_score is not null and (p_score<0 or p_score>99999 or
    p_score::text in ('NaN','Infinity','-Infinity')) then
   raise exception 'INVALID_SCORE' using errcode='22023';
 end if;
 select * into strict v_pack from public.culture_rule_packs
 where tenant_id=v_tenant and id=v_row.rule_pack_id and version=v_row.rule_pack_version;
 -- A file from any unrelated M01 work item must not satisfy M04 evidence.
 -- Linking a dedicated M04 case work item is a later, audited operation.
 if p_evidence_id is not null and (v_row.work_item_id is null or not exists(
  select 1 from public.evidence_files e
  where e.id=p_evidence_id and e.tenant_id=v_tenant and e.status='UPLOADED'
  and e.work_item_id=v_row.work_item_id
  and pvh_private.can_access_work(e.tenant_id,e.work_item_id,'read'))) then
  raise exception 'FORBIDDEN_EVIDENCE' using errcode='42501';
 end if;
 if p_status='DAT' then
  if v_pack.status<>'VERIFIED' or v_pack.min_score is null
     or p_score is null or p_score<v_pack.min_score then
   raise exception 'UNVERIFIED_LEGAL_RULE_OR_THRESHOLD' using errcode='42501';
  end if;
  if v_row.work_item_id is null or coalesce(p_evidence_id,v_row.evidence_id) is null or not exists(
   select 1 from public.evidence_files e where e.id=coalesce(p_evidence_id,v_row.evidence_id)
     and e.tenant_id=v_tenant and e.status='UPLOADED'
     and e.work_item_id=v_row.work_item_id
     and pvh_private.can_access_work(e.tenant_id,e.work_item_id,'read')) then
   raise exception 'VERIFIED_EVIDENCE_REQUIRED' using errcode='22023';
  end if;
 end if;
 update public.submissions set status=p_status,score=p_score,reviewer_comment=btrim(p_reason),
 evidence_id=coalesce(p_evidence_id,evidence_id),version=version+1,
 updated_by=auth.uid(),updated_at=now()
 where tenant_id=v_tenant and id=p_submission_id returning * into v_row;
 insert into public.culture_submission_events(tenant_id,submission_id,actor_id,
 from_status,to_status,reason,version)
 values(v_tenant,v_row.id,auth.uid(),null,p_status,btrim(p_reason),v_row.version);
 insert into public.audit_log(tenant_id,actor_id,action,entity_type,entity_id,payload)
 values(v_tenant,auth.uid(),'M04_INTERNAL_REVIEW','culture_submission',v_row.id::text,
        jsonb_build_object('status',p_status,'version',v_row.version,'official_decision',false));
 return to_jsonb(v_row);
exception when no_data_found then raise exception 'DOSSIER_NOT_FOUND' using errcode='P0002';
end; $$;

create function app.update_digital_indicator_status(
 p_indicator_id uuid,p_status text,p_value numeric,p_source_ref text,
 p_expected_version integer,p_na_reason text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_tenant uuid;v_row public.digital_indicators%rowtype;
begin
 v_tenant:=pvh_private.ph03_tenant('m05:digital:write');
 select * into strict v_row from public.digital_indicators
 where tenant_id=v_tenant and id=p_indicator_id for update;
 if p_expected_version is distinct from v_row.version then raise exception 'VERSION_CONFLICT' using errcode='PV409'; end if;
 if p_status not in ('UNVERIFIED','NOT_REPORTED','CONFIRMED','CONFIRMED_ZERO','NOT_APPLICABLE') then
  raise exception 'INVALID_STATUS' using errcode='22023';
 end if;
 if p_value is not null and p_value::text in ('NaN','Infinity','-Infinity') then
  raise exception 'INVALID_NUMERIC_VALUE' using errcode='22023';
 end if;
 if p_status='CONFIRMED_ZERO' and (p_value is null or p_value<>0) then
  raise exception 'ZERO_MUST_BE_NUMERIC_ZERO' using errcode='22023';
 end if;
 if p_status='CONFIRMED' and p_value is null then raise exception 'VALUE_REQUIRED' using errcode='22023'; end if;
 if p_status in ('NOT_REPORTED','NOT_APPLICABLE') and p_value is not null then
  raise exception 'VALUE_MUST_BE_NULL' using errcode='22023';
 end if;
 if p_status in ('CONFIRMED','CONFIRMED_ZERO') and length(btrim(coalesce(p_source_ref,'')))<3 then
  raise exception 'SOURCE_REQUIRED' using errcode='22023';
 end if;
 if p_status in ('CONFIRMED','CONFIRMED_ZERO') and
   (not pvh_private.has_permission(v_tenant,'m05:digital:review') or
    coalesce(v_row.updated_by,v_row.created_by)=auth.uid()) then
  raise exception 'REVIEWER_MUST_BE_DIFFERENT_ACTOR' using errcode='42501';
 end if;
 if p_status='NOT_APPLICABLE' and length(btrim(coalesce(p_na_reason,'')))<5 then
  raise exception 'NA_REASON_REQUIRED' using errcode='22023';
 end if;
 update public.digital_indicators set status=p_status,
 numeric_value=case when p_status in ('NOT_REPORTED','NOT_APPLICABLE') then null else p_value end,
 source_ref=case when p_status='NOT_REPORTED' then null
   else nullif(btrim(coalesce(p_source_ref,'')),'') end,
 na_reason=case when p_status='NOT_APPLICABLE' then p_na_reason else null end,
 version=version+1,updated_by=auth.uid(),updated_at=now()
 where tenant_id=v_tenant and id=p_indicator_id returning * into v_row;
 insert into public.digital_indicator_events(tenant_id,indicator_id,actor_id,status,value,source_ref,version)
 values(v_tenant,v_row.id,auth.uid(),v_row.status,v_row.numeric_value,v_row.source_ref,v_row.version);
 insert into public.audit_log(tenant_id,actor_id,action,entity_type,entity_id,payload)
 values(v_tenant,auth.uid(),'M05_INDICATOR_UPDATE','digital_indicator',v_row.id::text,
        jsonb_build_object('status',p_status,'version',v_row.version));
 return to_jsonb(v_row);
exception when no_data_found then raise exception 'INDICATOR_NOT_FOUND' using errcode='P0002';
end; $$;

create function app.create_digital_plan(p_title text,p_period text,p_source_ref text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_tenant uuid;v_row public.digital_plans%rowtype;
begin
 v_tenant:=pvh_private.ph03_tenant('m05:digital:write');
 if length(btrim(coalesce(p_title,'')))<3 or length(btrim(coalesce(p_period,'')))<2
 or length(btrim(coalesce(p_source_ref,'')))<3 then
  raise exception 'VALIDATION' using errcode='22023';
 end if;
 insert into public.digital_plans(tenant_id,title,period,source_ref,created_by)
 values(v_tenant,btrim(p_title),btrim(p_period),btrim(p_source_ref),auth.uid())
 returning * into v_row;
 insert into public.audit_log(tenant_id,actor_id,action,entity_type,entity_id)
 values(v_tenant,auth.uid(),'M05_PLAN_DRAFT','digital_plan',v_row.id::text);
 return to_jsonb(v_row);
end; $$;

create function app.link_digital_plan_work(p_plan_id uuid,p_work_item_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_tenant uuid;v_plan public.digital_plans%rowtype;
begin
 v_tenant:=pvh_private.ph03_tenant('m05:digital:write');
 select * into strict v_plan from public.digital_plans where tenant_id=v_tenant and id=p_plan_id;
 if v_plan.status='CLOSED' or not pvh_private.can_access_work(v_tenant,p_work_item_id,'read') then
  raise exception 'FORBIDDEN_WORK_SCOPE' using errcode='42501';
 end if;
 insert into public.digital_plan_tasks(tenant_id,plan_id,work_item_id)
 values(v_tenant,p_plan_id,p_work_item_id) on conflict do nothing;
 if not exists(select 1 from public.digital_plan_tasks where tenant_id=v_tenant
   and plan_id=p_plan_id and work_item_id=p_work_item_id) then
  raise exception 'WORK_LINKED_ELSEWHERE' using errcode='PV409';
 end if;
 insert into public.audit_log(tenant_id,actor_id,action,entity_type,entity_id,payload)
 values(v_tenant,auth.uid(),'M05_PLAN_LINK_WORK','digital_plan',p_plan_id::text,
        jsonb_build_object('work_item_id',p_work_item_id));
 return jsonb_build_object('plan_id',p_plan_id,'work_item_id',p_work_item_id);
exception when no_data_found then raise exception 'PLAN_NOT_FOUND' using errcode='P0002';
end; $$;

create function app.create_digital_indicator(
 p_plan_id uuid,p_code text,p_name text,p_unit text,p_period text,p_meaning text default '')
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_tenant uuid;v_row public.digital_indicators%rowtype;
begin
 v_tenant:=pvh_private.ph03_tenant('m05:digital:write');
 if length(btrim(coalesce(p_code,''))) not between 1 and 60
 or length(btrim(coalesce(p_name,''))) not between 2 and 250
 or length(btrim(coalesce(p_unit,''))) not between 1 and 50
 or length(btrim(coalesce(p_period,'')))<2 then
  raise exception 'VALIDATION' using errcode='22023';
 end if;
 if p_plan_id is not null and not exists(select 1 from public.digital_plans
   where tenant_id=v_tenant and id=p_plan_id and status<>'CLOSED') then
  raise exception 'INVALID_PLAN' using errcode='22023';
 end if;
 insert into public.digital_indicators(tenant_id,plan_id,code,name,unit,evaluation_period,meaning,created_by)
 values(v_tenant,p_plan_id,btrim(p_code),btrim(p_name),btrim(p_unit),btrim(p_period),
 coalesce(p_meaning,''),auth.uid()) returning * into v_row;
 insert into public.audit_log(tenant_id,actor_id,action,entity_type,entity_id)
 values(v_tenant,auth.uid(),'M05_INDICATOR_REGISTER','digital_indicator',v_row.id::text);
 return to_jsonb(v_row);
end; $$;

create function app.create_inspection_record(
 p_code text,p_target_name text,p_category text,p_hamlet_id uuid,
 p_inspector_name text,p_checklist_version text,p_inspection_date date,
 p_authority_ref text default null,p_notes text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_tenant uuid;v_row public.inspection_records%rowtype;
begin
 v_tenant:=pvh_private.ph03_tenant('m08:inspection:write');
 if length(btrim(coalesce(p_code,'')))<2 or length(btrim(coalesce(p_target_name,'')))<3
 or length(btrim(coalesce(p_category,'')))<2 or length(btrim(coalesce(p_inspector_name,'')))<3
 or length(btrim(coalesce(p_checklist_version,'')))<1 or p_inspection_date is null then
  raise exception 'VALIDATION' using errcode='22023';
 end if;
 if not pvh_private.ph03_in_scope(v_tenant,p_hamlet_id) or
 not exists(select 1 from public.org_units where tenant_id=v_tenant and id=p_hamlet_id
 and kind='HAMLET' and is_active) then
  raise exception 'FORBIDDEN_SCOPE' using errcode='42501';
 end if;
 insert into public.inspection_records(tenant_id,code,target_name,category,hamlet_id,
 inspector_name,checklist_version,inspection_date,authority_ref,notes,created_by)
 values(v_tenant,btrim(p_code),btrim(p_target_name),btrim(p_category),p_hamlet_id,
 btrim(p_inspector_name),btrim(p_checklist_version),p_inspection_date,p_authority_ref,p_notes,auth.uid())
 returning * into v_row;
 insert into public.audit_log(tenant_id,actor_id,action,entity_type,entity_id,payload)
 values(v_tenant,auth.uid(),'M08_INSPECTION_RECORD','inspection_record',v_row.id::text,
        jsonb_build_object('authority_verified',false));
 return to_jsonb(v_row);
end; $$;

create function app.create_inspection_recommendation(
 p_inspection_id uuid,p_code text,p_title text,p_due_date date,
 p_assigned_to uuid,p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_tenant uuid;v_case public.inspection_records%rowtype;
        v_work jsonb;v_item uuid;v_row public.inspection_recommendations%rowtype;
begin
 v_tenant:=pvh_private.ph03_tenant('m08:inspection:write');
 select * into strict v_case from public.inspection_records
 where tenant_id=v_tenant and id=p_inspection_id;
 if not pvh_private.ph03_in_scope(v_tenant,v_case.hamlet_id) then
  raise exception 'FORBIDDEN_SCOPE' using errcode='42501';
 end if;
 if length(btrim(coalesce(p_code,'')))<2 or length(btrim(coalesce(p_title,'')))<5
 or p_due_date is null or p_due_date<current_date or p_due_date<v_case.inspection_date
 or length(btrim(coalesce(p_idempotency_key,''))) not between 1 and 200 then
  raise exception 'VALIDATION' using errcode='22023';
 end if;
 -- Reuses M01's idempotency, assignee/scope checks, events and audit, in ONE transaction.
 v_work:=app.create_work_item(p_idempotency_key,btrim(p_title),
  'Kiến nghị khắc phục - '||v_case.code,'MEDIUM',p_assigned_to,
  (p_due_date::timestamp + interval '23 hours 59 minutes') at time zone 'Asia/Ho_Chi_Minh',
  'M08_REMEDIATION',v_case.hamlet_id,v_tenant);
 v_item:=(v_work->>'id')::uuid;
 insert into public.inspection_recommendations
 (tenant_id,inspection_id,code,title,due_date,work_item_id,created_by)
 values(v_tenant,p_inspection_id,btrim(p_code),btrim(p_title),p_due_date,v_item,auth.uid())
 on conflict(tenant_id,work_item_id) do nothing;
 select * into strict v_row from public.inspection_recommendations
 where tenant_id=v_tenant and work_item_id=v_item;
 if v_row.inspection_id<>p_inspection_id or v_row.code<>btrim(p_code)
 or v_row.title<>btrim(p_title) or v_row.due_date<>p_due_date then
  raise exception 'IDEMPOTENCY_CONFLICT' using errcode='PV409';
 end if;
 insert into public.audit_log(tenant_id,actor_id,action,entity_type,entity_id,payload)
 values(v_tenant,auth.uid(),'M08_RECOMMENDATION_CREATE','inspection_recommendation',v_row.id::text,
        jsonb_build_object('m01_work_item_id',v_item));
 return to_jsonb(v_row);
exception when no_data_found then raise exception 'INSPECTION_NOT_FOUND' using errcode='P0002';
end; $$;

create function app.resolve_inspection_recommendation(
 p_recommendation_id uuid,p_status text,p_reason text,p_expected_version integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_tenant uuid;v_row public.inspection_recommendations%rowtype;
        v_work public.work_items%rowtype;v_hamlet uuid;
begin
 v_tenant:=pvh_private.ph03_tenant('m08:inspection:review');
 select * into strict v_row from public.inspection_recommendations
 where tenant_id=v_tenant and id=p_recommendation_id for update;
 select hamlet_id into strict v_hamlet from public.inspection_records
 where tenant_id=v_tenant and id=v_row.inspection_id;
 if not pvh_private.ph03_in_scope(v_tenant,v_hamlet) then
  raise exception 'FORBIDDEN_SCOPE' using errcode='42501';
 end if;
 if p_expected_version is distinct from v_row.version then raise exception 'VERSION_CONFLICT' using errcode='PV409'; end if;
 if p_status not in ('FEEDBACK_UNVERIFIED','RESOLVED_CLOSED')
    or v_row.status='RESOLVED_CLOSED' then
  raise exception 'INVALID_TRANSITION' using errcode='22023';
 end if;
 if length(btrim(coalesce(p_reason,'')))<5 then raise exception 'REASON_REQUIRED' using errcode='22023'; end if;
 select * into strict v_work from public.work_items
 where id=v_row.work_item_id and tenant_id=v_tenant;
 if p_status='RESOLVED_CLOSED' and v_work.status<>'COMPLETED' then
  raise exception 'M01_WORK_NOT_COMPLETED' using errcode='22023';
 end if;
 if p_status='RESOLVED_CLOSED' and
   (v_row.created_by=auth.uid() or v_work.assigned_to=auth.uid()) then
  raise exception 'REVIEWER_MUST_BE_DIFFERENT_ACTOR' using errcode='42501';
 end if;
 update public.inspection_recommendations set status=p_status,review_note=btrim(p_reason),
 version=version+1,updated_at=now()
 where id=v_row.id and tenant_id=v_tenant returning * into v_row;
 insert into public.inspection_events(tenant_id,recommendation_id,actor_id,status,reason,version)
 values(v_tenant,v_row.id,auth.uid(),p_status,btrim(p_reason),v_row.version);
 insert into public.audit_log(tenant_id,actor_id,action,entity_type,entity_id,payload)
 values(v_tenant,auth.uid(),'M08_RECOMMENDATION_REVIEW','inspection_recommendation',v_row.id::text,
        jsonb_build_object('status',p_status,'m01_work_item',v_row.work_item_id));
 return to_jsonb(v_row);
exception when no_data_found then raise exception 'RECOMMENDATION_NOT_FOUND' using errcode='P0002';
end; $$;

revoke all on function
 app.create_culture_rule_pack(text,integer,text,jsonb,numeric),
 app.create_culture_campaign(uuid,integer,text,timestamptz),
 app.open_illustrative_culture_campaign(text,integer,text,timestamptz),
 app.submit_culture_dossier(uuid,text,text,uuid,text,text),
 app.review_culture_dossier(uuid,text,numeric,text,integer,uuid),
 app.create_digital_plan(text,text,text),
 app.link_digital_plan_work(uuid,uuid),
 app.create_digital_indicator(uuid,text,text,text,text,text),
 app.update_digital_indicator_status(uuid,text,numeric,text,integer,text),
 app.create_inspection_record(text,text,text,uuid,text,text,date,text,text),
 app.create_inspection_recommendation(uuid,text,text,date,uuid,text),
 app.resolve_inspection_recommendation(uuid,text,text,integer)
from public,anon,authenticated;
grant execute on function
 app.create_culture_rule_pack(text,integer,text,jsonb,numeric),
 app.create_culture_campaign(uuid,integer,text,timestamptz),
 app.open_illustrative_culture_campaign(text,integer,text,timestamptz),
 app.submit_culture_dossier(uuid,text,text,uuid,text,text),
 app.review_culture_dossier(uuid,text,numeric,text,integer,uuid),
 app.create_digital_plan(text,text,text),
 app.link_digital_plan_work(uuid,uuid),
 app.create_digital_indicator(uuid,text,text,text,text,text),
 app.update_digital_indicator_status(uuid,text,numeric,text,integer,text),
 app.create_inspection_record(text,text,text,uuid,text,text,date,text,text),
 app.create_inspection_recommendation(uuid,text,text,date,uuid,text),
 app.resolve_inspection_recommendation(uuid,text,text,integer)
to authenticated;
