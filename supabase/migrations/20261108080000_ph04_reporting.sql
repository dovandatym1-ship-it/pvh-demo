-- PH04 M09: reports are derived from database records, never seeded KPI values.
-- Additive and intentionally NOT applied to Demo-pvh cloud by this change.

create table public.report_catalog (
 code text primary key,
 title text not null,
 owner_role text not null,
 source_tables text[] not null,
 metric_definitions jsonb not null check (jsonb_typeof(metric_definitions)='array'),
 formula_version integer not null default 1 check(formula_version>0),
 active boolean not null default true
);
insert into public.report_catalog(code,title,owner_role,source_tables,metric_definitions) values
 ('RPT-WORK','Tiến độ công việc','CONG_CHUC_VHXH',array['work_items'],
  '[{"code":"tasksTotal","formula":"COUNT(work_items.created_in_period)","unit":"công việc"},{"code":"tasksCompleted","formula":"COUNT(status=COMPLETED)","unit":"công việc"},{"code":"tasksOverdue","formula":"COUNT(due_date<cutoff AND not terminal)","unit":"công việc"}]'::jsonb),
 ('RPT-CULTURE','Kết quả hồ sơ văn hóa (minh họa)','CONG_CHUC_VHXH',array['submissions'],
  '[{"code":"cultureSubmissions","formula":"COUNT(submissions.created_in_period)","unit":"hồ sơ"},{"code":"cultureEligible","formula":"COUNT(status=DAT)","unit":"hồ sơ"}]'::jsonb),
 ('RPT-DIGITAL','Kế hoạch và chỉ tiêu chuyển đổi số','CONG_CHUC_VHXH',array['digital_plans','digital_indicators','imported_indicator_values'],
  '[{"code":"plansTotal","formula":"COUNT(digital_plans.created_in_period)","unit":"kế hoạch"},{"code":"indicatorsConfirmed","formula":"COUNT(confirmed OR confirmed_zero)","unit":"chỉ tiêu"},{"code":"indicatorsNotReported","formula":"COUNT(status=NOT_REPORTED)","unit":"chỉ tiêu"},{"code":"importedValues","formula":"COUNT(imported_indicator_values)","unit":"bản ghi"}]'::jsonb),
 ('RPT-INSPECTION','Kiểm tra và khắc phục','CAN_BO_THANH_TRA',array['inspection_records','inspection_recommendations'],
  '[{"code":"inspectionsTotal","formula":"COUNT(inspections.in_period)","unit":"cuộc"},{"code":"recommendationsClosed","formula":"COUNT(status=RESOLVED_CLOSED)","unit":"kiến nghị"}]'::jsonb),
 ('RPT-SUMMARY','Tổng hợp VH-XH theo kỳ','CONG_CHUC_VHXH',array['work_items','submissions','digital_plans','digital_indicators','inspection_records','inspection_recommendations','imported_indicator_values'],
  '[{"code":"tasksTotal","formula":"COUNT(work_items.created_in_period)","unit":"công việc"},{"code":"cultureSubmissions","formula":"COUNT(submissions.created_in_period)","unit":"hồ sơ"},{"code":"indicatorsNotReported","formula":"COUNT(status=NOT_REPORTED)","unit":"chỉ tiêu"},{"code":"inspectionsTotal","formula":"COUNT(inspections.in_period)","unit":"cuộc"}]'::jsonb);

create table public.report_periods (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id),
 report_code text not null references public.report_catalog(code),
 period text not null, year integer not null check(year between 2020 and 2200),
 start_at timestamptz not null,end_at timestamptz not null,
 locked boolean not null default false,
 created_at timestamptz not null default now(),
 unique(tenant_id,id),unique(tenant_id,report_code,period,year),
 check(start_at<end_at)
);
create table public.report_snapshots (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id),
 report_period_id uuid not null,
 report_code text not null references public.report_catalog(code),
 title text not null check(length(btrim(title)) between 5 and 250),
 period text not null,year integer not null,
 revision integer not null check(revision>0),
 previous_snapshot_id uuid,
 status text not null default 'DRAFT' check(status in ('DRAFT','SUBMITTED','UNDER_REVIEW','FINALIZED')),
 version integer not null default 1 check(version>0),
 payload jsonb not null check(jsonb_typeof(payload)='object'),
 canonical_text text not null,
 sha256 text not null check(sha256 ~ '^[0-9a-f]{64}$'),
 hash_algorithm text not null default 'PG_JSONB_TEXT_V1' check(hash_algorithm='PG_JSONB_TEXT_V1'),
 watermark text not null default 'MÔ PHỎNG DEMO — KHÔNG CÓ GIÁ TRỊ PHÁP LÝ',
 is_finalized boolean generated always as (status='FINALIZED') stored,
 idempotency_key text not null,
 request_hash text not null,
 created_by uuid not null references auth.users(id),
 finalized_by uuid references auth.users(id),
 finalized_at timestamptz,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,id),
 unique(tenant_id,report_code,period,year,revision),
 unique(tenant_id,created_by,idempotency_key),
 foreign key(tenant_id,report_period_id) references public.report_periods(tenant_id,id),
 foreign key(tenant_id,previous_snapshot_id) references public.report_snapshots(tenant_id,id),
 check((status='FINALIZED')=(finalized_at is not null)),
 check(canonical_text=payload::text)
);
create table public.report_snapshot_lineage (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null,
 snapshot_id uuid not null,
 source_table text not null,
 source_id uuid not null,
 source_version integer not null check(source_version>0),
 metric_group text not null,
 contribution jsonb not null check(jsonb_typeof(contribution)='object'),
 created_at timestamptz not null default now(),
 foreign key(tenant_id,snapshot_id) references public.report_snapshots(tenant_id,id),
 unique(snapshot_id,source_table,source_id,metric_group)
);
create index report_snapshots_scope_idx on public.report_snapshots(tenant_id,report_code,year,period,revision desc);
create index report_lineage_parent_idx on public.report_snapshot_lineage(tenant_id,snapshot_id,metric_group);

-- A finalized payload, hash, contributor list and audit must remain immutable.
create function pvh_private.guard_report_snapshot()
returns trigger language plpgsql set search_path='' as $$
begin
 if tg_op='DELETE' then raise exception 'REPORT_APPEND_ONLY' using errcode='42501'; end if;
 if old.status='FINALIZED' or old.payload is distinct from new.payload
    or old.canonical_text is distinct from new.canonical_text
    or old.sha256 is distinct from new.sha256
    or old.previous_snapshot_id is distinct from new.previous_snapshot_id
    or old.revision is distinct from new.revision then
  raise exception 'REPORT_IMMUTABLE' using errcode='42501';
 end if;
 return new;
end; $$;
create trigger guard_report_snapshot before update or delete on public.report_snapshots
for each row execute function pvh_private.guard_report_snapshot();
create trigger guard_report_lineage before update or delete on public.report_snapshot_lineage
for each row execute function pvh_private.reject_log_mutation();

do $ddl$ declare t text; begin
 foreach t in array array['report_catalog','report_periods','report_snapshots','report_snapshot_lineage'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('alter table public.%I force row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated',t);
  execute format('grant select on public.%I to authenticated',t);
 end loop;
end $ddl$;
create policy report_catalog_read on public.report_catalog for select to authenticated
 using(exists(select 1 from app.user_tenant_ids()));
create policy report_period_read on public.report_periods for select to authenticated
 using(pvh_private.has_permission(tenant_id,'m09:report:read'));
create policy report_snapshot_read on public.report_snapshots for select to authenticated
 using(pvh_private.has_permission(tenant_id,'m09:report:read'));
-- Report access is not an entitlement to source-level IDs or sensitive case records.
create policy report_lineage_read on public.report_snapshot_lineage for select to authenticated
 using(pvh_private.has_permission(tenant_id,'m09:report:read') and
  case source_table
   when 'work_items' then pvh_private.can_access_work(tenant_id,source_id,'read')
   when 'submissions' then pvh_private.has_permission(tenant_id,'m04:culture:read')
    and exists(select 1 from public.submissions s where s.id=source_id and s.tenant_id=public.report_snapshot_lineage.tenant_id
               and pvh_private.ph03_in_scope(public.report_snapshot_lineage.tenant_id,s.hamlet_id))
   when 'digital_plans' then pvh_private.has_permission(tenant_id,'m05:digital:read')
   when 'digital_indicators' then pvh_private.has_permission(tenant_id,'m05:digital:read')
   when 'inspection_records' then pvh_private.has_permission(tenant_id,'m08:inspection:read')
    and exists(select 1 from public.inspection_records s where s.id=source_id and s.tenant_id=public.report_snapshot_lineage.tenant_id
               and pvh_private.ph03_in_scope(public.report_snapshot_lineage.tenant_id,s.hamlet_id))
   when 'inspection_recommendations' then pvh_private.has_permission(tenant_id,'m08:inspection:read')
    and exists(select 1 from public.inspection_recommendations r
               join public.inspection_records s on s.id=r.inspection_id and s.tenant_id=r.tenant_id
               where r.id=source_id and r.tenant_id=public.report_snapshot_lineage.tenant_id
                 and pvh_private.ph03_in_scope(public.report_snapshot_lineage.tenant_id,s.hamlet_id))
   when 'imported_indicator_values' then pvh_private.has_permission(tenant_id,'m10:indicator:import')
   else false end);

insert into public.permissions(code,description) values
 ('m09:report:read','Đọc số liệu tổng hợp và snapshot'),
 ('m09:report:draft','Tạo bản nháp thống kê'),
 ('m09:report:review','Rà soát báo cáo'),
 ('m09:report:finalize','Chốt báo cáo nội bộ'),
 ('m09:report:export','Xuất báo cáo được phép'),
 ('m10:indicator:import','Nhập chỉ tiêu có nguồn'),
 ('m10:integration:simulate','Chạy adapter mô phỏng')
on conflict(code) do nothing;
insert into public.role_permissions(role_code,permission_code)
select r.code,p.code from public.roles r cross join public.permissions p
where (r.code='WORK_OFFICER' and p.code in ('m09:report:read','m09:report:draft','m09:report:export','m10:indicator:import','m10:integration:simulate'))
   or (r.code='WORK_MANAGER' and p.code in ('m09:report:read','m09:report:draft','m09:report:review','m09:report:finalize','m09:report:export'))
   or (r.code='AUDITOR' and p.code='m09:report:read')
on conflict do nothing;
update public.module_entitlements set enabled=true where module_key in ('m09','m10');

create function pvh_private.report_window(p_period text,p_year integer)
returns tstzrange language plpgsql immutable set search_path='' as $$
declare v_month integer;v_start timestamptz;
begin
 if p_year is null or p_year not between 2020 and 2200 then raise exception 'INVALID_YEAR' using errcode='22023'; end if;
 if p_period ~ '^Q[1-4]/[0-9]{4}$' and split_part(p_period,'/',2)::integer=p_year then
  v_month:=((substring(p_period,2,1)::integer-1)*3)+1;
  v_start:=make_timestamptz(p_year,v_month,1,0,0,0,'Asia/Ho_Chi_Minh');
  return tstzrange(v_start,v_start+interval '3 months','[)');
 elsif p_period ~ '^[0-9]{4}-(0[1-9]|1[0-2])$' and substring(p_period,1,4)::integer=p_year then
  v_month:=substring(p_period,6,2)::integer;
  v_start:=make_timestamptz(p_year,v_month,1,0,0,0,'Asia/Ho_Chi_Minh');
  return tstzrange(v_start,v_start+interval '1 month','[)');
 end if;
 raise exception 'INVALID_PERIOD' using errcode='22023';
end; $$;

-- One materialized contributor set drives both totals and lineage; never LIMIT 3.
create function pvh_private.report_contributors(p_tenant uuid,p_code text,p_window tstzrange,p_period text)
returns table(source_table text,source_id uuid,source_version integer,metric_group text,contribution jsonb)
language sql stable security definer set search_path='' as $$
 select 'work_items'::text,w.id,w.version,'work'::text,
  jsonb_build_object('status',w.status,'overdue',w.due_date<least(now(),upper(p_window)) and w.status not in ('COMPLETED','CANCELLED'))
 from public.work_items w where w.tenant_id=p_tenant and w.created_at<@p_window and p_code in ('RPT-WORK','RPT-SUMMARY')
 union all
 select 'submissions',s.id,s.version,'culture',
  jsonb_build_object('status',s.status,'rulePackVersion',s.rule_pack_version)
 from public.submissions s where s.tenant_id=p_tenant and s.created_at<@p_window and p_code in ('RPT-CULTURE','RPT-SUMMARY')
 union all
 select 'digital_plans',d.id,1,'digital_plan',jsonb_build_object('status',d.status)
 from public.digital_plans d where d.tenant_id=p_tenant and d.created_at<@p_window and p_code in ('RPT-DIGITAL','RPT-SUMMARY')
 union all
 select 'digital_indicators',i.id,i.version,'digital_indicator',
  jsonb_build_object('status',i.status,'value',i.numeric_value,'unit',i.unit,'code',i.code,'sourceRef',i.source_ref)
 from public.digital_indicators i where i.tenant_id=p_tenant and i.evaluation_period=p_period and p_code in ('RPT-DIGITAL','RPT-SUMMARY')
 union all
 select 'inspection_records',a.id,1,'inspection',jsonb_build_object('code',a.code)
 from public.inspection_records a where a.tenant_id=p_tenant
  and a.inspection_date>=(lower(p_window) at time zone 'Asia/Ho_Chi_Minh')::date
  and a.inspection_date<(upper(p_window) at time zone 'Asia/Ho_Chi_Minh')::date
  and p_code in ('RPT-INSPECTION','RPT-SUMMARY')
 union all
 select 'inspection_recommendations',r.id,r.version,'recommendation',jsonb_build_object('status',r.status)
 from public.inspection_recommendations r join public.inspection_records a on a.id=r.inspection_id and a.tenant_id=r.tenant_id
 where r.tenant_id=p_tenant
  and a.inspection_date>=(lower(p_window) at time zone 'Asia/Ho_Chi_Minh')::date
  and a.inspection_date<(upper(p_window) at time zone 'Asia/Ho_Chi_Minh')::date
  and p_code in ('RPT-INSPECTION','RPT-SUMMARY')
 union all
 select 'imported_indicator_values',v.id,1,'imported_indicator',
  jsonb_build_object('status',v.status,'value',v.numeric_value,'unit',v.unit,'code',v.indicator_code,'batchId',v.batch_id)
 from public.imported_indicator_values v where v.tenant_id=p_tenant and v.period=p_period and p_code in ('RPT-DIGITAL','RPT-SUMMARY');
$$;

-- Draft creation, source extraction, hash, full lineage and audit share one DB transaction.
create function app.create_report_snapshot(
 p_report_code text,p_title text,p_period text,p_year integer,p_idempotency_key text,
 p_previous_snapshot_id uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_tenant uuid;v_actor uuid:=auth.uid();v_window tstzrange;v_period public.report_periods%rowtype;
 v_prev public.report_snapshots%rowtype;v_row public.report_snapshots%rowtype;
 v_lineage jsonb;v_metrics jsonb;v_payload jsonb;v_hash text;v_request_hash text;v_revision integer:=1;
begin
 v_tenant:=pvh_private.ph03_tenant('m09:report:draft');
 if not exists(select 1 from public.report_catalog where code=p_report_code and active) then raise exception 'REPORT_CODE_UNKNOWN' using errcode='22023'; end if;
 if length(btrim(coalesce(p_title,''))) not between 5 and 250 or length(btrim(coalesce(p_idempotency_key,''))) not between 8 and 200 then
  raise exception 'VALIDATION' using errcode='22023'; end if;
 v_window:=pvh_private.report_window(p_period,p_year);
 v_request_hash:=encode(sha256(convert_to(jsonb_build_array(p_report_code,p_title,p_period,p_year,p_previous_snapshot_id)::text,'UTF8')),'hex');
 perform pg_advisory_xact_lock(hashtextextended(v_tenant::text||v_actor::text||p_idempotency_key,0));
 select * into v_row from public.report_snapshots where tenant_id=v_tenant and created_by=v_actor and idempotency_key=p_idempotency_key;
 if found then
  if v_row.request_hash<>v_request_hash then raise exception 'IDEMPOTENCY_CONFLICT' using errcode='22023'; end if;
  return to_jsonb(v_row)||jsonb_build_object('cached',true);
 end if;
 insert into public.report_periods(tenant_id,report_code,period,year,start_at,end_at)
 values(v_tenant,p_report_code,p_period,p_year,lower(v_window),upper(v_window))
 on conflict(tenant_id,report_code,period,year) do nothing;
 select * into v_period from public.report_periods where tenant_id=v_tenant and report_code=p_report_code
  and period=p_period and year=p_year for update;
 if p_previous_snapshot_id is not null then
  select * into v_prev from public.report_snapshots where tenant_id=v_tenant and id=p_previous_snapshot_id and status='FINALIZED';
  if not found or v_prev.report_period_id<>v_period.id then raise exception 'INVALID_REVISION_SOURCE' using errcode='22023'; end if;
  select coalesce(max(revision),0)+1 into v_revision from public.report_snapshots where report_period_id=v_period.id;
 elsif v_period.locked then
  raise exception 'PERIOD_LOCKED_USE_REVISION' using errcode='42501';
 else
  select coalesce(max(revision),0)+1 into v_revision from public.report_snapshots where report_period_id=v_period.id;
 end if;

 select coalesce(jsonb_agg(jsonb_build_object('table',c.source_table,'id',c.source_id,'version',c.source_version,
  'group',c.metric_group,'details',c.contribution) order by c.source_table,c.source_id),'[]'::jsonb)
 into v_lineage from pvh_private.report_contributors(v_tenant,p_report_code,v_window,p_period) c;
 select jsonb_build_object(
  'tasksTotal',count(*) filter(where x->>'group'='work'),
  'tasksCompleted',count(*) filter(where x->>'group'='work' and x->'details'->>'status'='COMPLETED'),
  'tasksOverdue',count(*) filter(where x->>'group'='work' and x->'details'->>'overdue'='true'),
  'cultureSubmissions',count(*) filter(where x->>'group'='culture'),
  'cultureEligible',count(*) filter(where x->>'group'='culture' and x->'details'->>'status'='DAT'),
  'plansTotal',count(*) filter(where x->>'group'='digital_plan'),
  'indicatorsConfirmed',count(*) filter(where x->>'group'='digital_indicator' and x->'details'->>'status' in ('CONFIRMED','CONFIRMED_ZERO')),
  'indicatorsConfirmedZero',count(*) filter(where x->>'group'='digital_indicator' and x->'details'->>'status'='CONFIRMED_ZERO'),
  'indicatorsNotReported',count(*) filter(where x->>'group'='digital_indicator' and x->'details'->>'status'='NOT_REPORTED'),
  'indicatorsNotApplicable',count(*) filter(where x->>'group'='digital_indicator' and x->'details'->>'status'='NOT_APPLICABLE'),
  'inspectionsTotal',count(*) filter(where x->>'group'='inspection'),
  'recommendationsTotal',count(*) filter(where x->>'group'='recommendation'),
  'recommendationsClosed',count(*) filter(where x->>'group'='recommendation' and x->'details'->>'status'='RESOLVED_CLOSED'),
  'importedValues',count(*) filter(where x->>'group'='imported_indicator')) into v_metrics
 from jsonb_array_elements(v_lineage) x;
 v_payload:=jsonb_build_object('reportCode',p_report_code,'period',p_period,'year',p_year,
  'timezone','Asia/Ho_Chi_Minh','includedWindow',jsonb_build_object('start',lower(v_window),'endExclusive',upper(v_window)),
  'capturedAt',clock_timestamp(),'formulaVersion',1,'metrics',v_metrics,
  'quality',jsonb_build_object('cdsIndex',jsonb_build_object('value',null,'status','NOT_REPORTED')),
  'sourceRecords',jsonb_array_length(v_lineage),'sourceType','DATABASE','simulated',true);
 v_hash:=encode(sha256(convert_to(v_payload::text,'UTF8')),'hex');
 insert into public.report_snapshots(tenant_id,report_period_id,report_code,title,period,year,revision,previous_snapshot_id,
  payload,canonical_text,sha256,idempotency_key,request_hash,created_by)
 values(v_tenant,v_period.id,p_report_code,btrim(p_title),p_period,p_year,v_revision,p_previous_snapshot_id,
  v_payload,v_payload::text,v_hash,p_idempotency_key,v_request_hash,v_actor) returning * into v_row;
 insert into public.report_snapshot_lineage(tenant_id,snapshot_id,source_table,source_id,source_version,metric_group,contribution)
 select v_tenant,v_row.id,x->>'table',(x->>'id')::uuid,(x->>'version')::integer,x->>'group',x->'details'
 from jsonb_array_elements(v_lineage) x;
 insert into public.audit_log(tenant_id,actor_id,action,entity_type,entity_id,payload)
 values(v_tenant,v_actor,'M09_REPORT_DRAFT','report_snapshot',v_row.id::text,
  jsonb_build_object('hash',v_hash,'contributorCount',jsonb_array_length(v_lineage),'revision',v_revision));
 return to_jsonb(v_row);
end; $$;

create function app.advance_report_snapshot(p_snapshot_id uuid,p_expected_version integer,p_transition text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_tenant uuid;v_actor uuid:=auth.uid();v_row public.report_snapshots%rowtype;v_target text;v_permission text;
begin
 v_permission:=case p_transition when 'SUBMIT' then 'm09:report:draft'
   when 'START_REVIEW' then 'm09:report:review'
   when 'FINALIZE' then 'm09:report:finalize' else null end;
 if v_permission is null then raise exception 'INVALID_TRANSITION' using errcode='22023'; end if;
 v_tenant:=pvh_private.ph03_tenant(v_permission);
 select * into v_row from public.report_snapshots where id=p_snapshot_id and tenant_id=v_tenant for update;
 if not found then raise exception 'NOT_FOUND' using errcode='P0002'; end if;
 if v_row.version<>p_expected_version then raise exception 'VERSION_CONFLICT' using errcode='40001'; end if;
 if (p_transition='SUBMIT' and v_row.status='DRAFT') then v_target:='SUBMITTED';
 elsif (p_transition='START_REVIEW' and v_row.status='SUBMITTED') then v_target:='UNDER_REVIEW';
 elsif (p_transition='FINALIZE' and v_row.status='UNDER_REVIEW') then v_target:='FINALIZED';
 else raise exception 'INVALID_TRANSITION' using errcode='22023'; end if;
 if p_transition='SUBMIT' and v_row.created_by<>v_actor then raise exception 'FORBIDDEN_SCOPE' using errcode='42501'; end if;
 update public.report_snapshots set status=v_target,version=version+1,updated_at=now(),
  finalized_at=case when v_target='FINALIZED' then now() else null end,
  finalized_by=case when v_target='FINALIZED' then v_actor else null end
 where id=v_row.id returning * into v_row;
 if v_target='FINALIZED' then update public.report_periods set locked=true where id=v_row.report_period_id; end if;
 insert into public.audit_log(tenant_id,actor_id,action,entity_type,entity_id,payload)
 values(v_tenant,v_actor,'M09_REPORT_'||p_transition,'report_snapshot',v_row.id::text,
  jsonb_build_object('version',v_row.version,'hash',v_row.sha256));
 return to_jsonb(v_row);
end; $$;

revoke all on function pvh_private.report_window(text,integer),
 pvh_private.report_contributors(uuid,text,tstzrange,text),
 pvh_private.guard_report_snapshot() from public,anon,authenticated;
revoke all on function app.create_report_snapshot(text,text,text,integer,text,uuid),
 app.advance_report_snapshot(uuid,integer,text) from public,anon;
grant execute on function app.create_report_snapshot(text,text,text,integer,text,uuid),
 app.advance_report_snapshot(uuid,integer,text) to authenticated;
