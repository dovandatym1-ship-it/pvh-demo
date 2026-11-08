-- PH04 M10: one deliberately narrow external-indicator CSV import contract.
-- Sources are simulated and must never imply a government integration is live.
create table public.indicator_import_batches (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id),
 source_system text not null check(source_system='SIMULATED_INDICATOR_CSV'),
 source_owner text not null check(length(btrim(source_owner)) between 3 and 150),
 template_version integer not null check(template_version=1),
 file_sha256 text not null check(file_sha256 ~ '^[0-9a-f]{64}$'),
 import_policy text not null check(import_policy in ('REJECT_ALL','ACCEPT_VALID')),
 status text not null check(status in ('COMMITTED','PARTIAL','REJECTED')),
 total_rows integer not null check(total_rows>=0),valid_rows integer not null check(valid_rows>=0),
 invalid_rows integer not null check(invalid_rows>=0),inserted_rows integer not null check(inserted_rows>=0),
 receipt jsonb not null check(jsonb_typeof(receipt)='object'),
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 unique(tenant_id,id),unique(tenant_id,source_system,file_sha256),
 check(total_rows=valid_rows+invalid_rows)
);
create table public.imported_indicator_values (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id),
 batch_id uuid not null,
 source_system text not null,
 source_record_id text not null check(length(btrim(source_record_id)) between 1 and 120),
 source_version integer not null check(source_version>0),
 indicator_code text not null check(indicator_code ~ '^[A-Z][A-Z0-9_-]{1,39}$'),
 period text not null,
 status text not null check(status in ('CONFIRMED','CONFIRMED_ZERO','NOT_REPORTED','NOT_APPLICABLE')),
 numeric_value numeric,
 unit text not null check(length(btrim(unit)) between 1 and 50),
 source_ref text not null,
 source_owner text not null,
 content_sha256 text not null check(content_sha256 ~ '^[0-9a-f]{64}$'),
 imported_at timestamptz not null default now(),
 imported_by uuid not null references auth.users(id),
 unique(tenant_id,id),unique(tenant_id,source_system,source_record_id,source_version),
 foreign key(tenant_id,batch_id) references public.indicator_import_batches(tenant_id,id),
 check((status='CONFIRMED' and numeric_value is not null and numeric_value<>0)
    or (status='CONFIRMED_ZERO' and numeric_value=0)
    or (status in ('NOT_REPORTED','NOT_APPLICABLE') and numeric_value is null))
);
create table public.integration_ledger (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id),
 adapter_code text not null check(adapter_code='SIMULATED_ECHO_V1'),
 external_id text not null check(length(btrim(external_id)) between 1 and 150),
 status text not null check(status in ('SIMULATED_SUCCESS','SIMULATED_TIMEOUT','SIMULATED_SCHEMA_ERROR')),
 attempts integer not null default 1 check(attempts between 1 and 3),
 receipt jsonb not null,
 actor_id uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 unique(tenant_id,adapter_code,external_id)
);
create index import_batch_recent_idx on public.indicator_import_batches(tenant_id,created_at desc);
create index imported_indicator_period_idx on public.imported_indicator_values(tenant_id,period,indicator_code);
create index imported_indicator_batch_idx on public.imported_indicator_values(tenant_id,batch_id);
create index integration_ledger_recent_idx on public.integration_ledger(tenant_id,created_at desc);

do $ddl$ declare t text; begin
 foreach t in array array['indicator_import_batches','imported_indicator_values','integration_ledger'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('alter table public.%I force row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated',t);
  execute format('grant select on public.%I to authenticated',t);
 end loop;
end $ddl$;
create policy import_batch_read on public.indicator_import_batches for select to authenticated
 using(pvh_private.has_permission(tenant_id,'m10:indicator:import'));
create policy imported_indicator_read on public.imported_indicator_values for select to authenticated
 using(pvh_private.has_permission(tenant_id,'m10:indicator:import') or pvh_private.has_permission(tenant_id,'m05:digital:read'));
create policy integration_ledger_read on public.integration_ledger for select to authenticated
 using(pvh_private.has_permission(tenant_id,'m10:integration:simulate'));

-- Invalid rows are returned in a receipt, not silently dropped. Everything is committed atomically.
create function app.commit_indicator_import(
 p_source_owner text,p_file_sha256 text,p_template_version integer,p_policy text,p_rows jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_tenant uuid;v_actor uuid:=auth.uid();v_batch public.indicator_import_batches%rowtype;
 v_row jsonb;v_valid jsonb:='[]'::jsonb;v_errors jsonb:='[]'::jsonb;
 v_count integer:=0;v_inserted integer:=0;v_status text;v_row_hash text;v_existing_hash text;
 v_source_id text;v_code text;v_period text;v_unit text;v_ref text;v_state text;v_value numeric;v_version integer;
begin
 v_tenant:=pvh_private.ph03_tenant('m10:indicator:import');
 if length(btrim(coalesce(p_source_owner,''))) not between 3 and 150 or p_source_owner ~ '^[[:space:]]*[=+@-]'
 or p_file_sha256 !~ '^[0-9a-f]{64}$' or p_template_version<>1
 or p_policy not in ('REJECT_ALL','ACCEPT_VALID')
 or p_rows is null or jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows) not between 1 and 5000 then
  raise exception 'INVALID_IMPORT_METADATA' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(hashtextextended(v_tenant::text||p_file_sha256,0));
 select * into v_batch from public.indicator_import_batches
 where tenant_id=v_tenant and source_system='SIMULATED_INDICATOR_CSV' and file_sha256=p_file_sha256;
 if found then
  if v_batch.import_policy<>p_policy or v_batch.source_owner<>btrim(p_source_owner) or v_batch.template_version<>p_template_version
  then raise exception 'IMPORT_REPLAY_CONFLICT' using errcode='22023'; end if;
  return to_jsonb(v_batch)||jsonb_build_object('cached',true);
 end if;
 for v_row in select value from jsonb_array_elements(p_rows) loop
  v_count:=v_count+1;
  begin
   if jsonb_typeof(v_row)<>'object' or v_row ? '__invalid' then raise exception 'ROW_NOT_VALID'; end if;
   v_source_id:=btrim(coalesce(v_row->>'source_record_id',''));
   v_code:=btrim(coalesce(v_row->>'indicator_code',''));
   v_period:=btrim(coalesce(v_row->>'period',''));
   v_unit:=btrim(coalesce(v_row->>'unit',''));
   v_ref:=btrim(coalesce(v_row->>'source_ref',''));
   v_state:=btrim(coalesce(v_row->>'status',''));
   v_version:=(v_row->>'source_version')::integer;
   v_value:=nullif(v_row->>'numeric_value','')::numeric;
   if v_source_id !~ '^[A-Za-z0-9_:./-]{1,120}$'
    or v_code !~ '^[A-Z][A-Z0-9_-]{1,39}$' or v_unit !~ '^[[:alnum:]_%/ .]{1,50}$'
    or v_ref !~ '^SIM-[A-Za-z0-9_:/.-]{3,100}$' or v_version<1
    or v_period !~ '^(Q[1-4]/[0-9]{4}|[0-9]{4}-(0[1-9]|1[0-2]))$'
    or v_state not in ('CONFIRMED','CONFIRMED_ZERO','NOT_REPORTED','NOT_APPLICABLE')
    or (v_state='CONFIRMED' and (v_value is null or v_value=0))
    or (v_state='CONFIRMED_ZERO' and v_value is distinct from 0)
    or (v_state in ('NOT_REPORTED','NOT_APPLICABLE') and v_value is not null)
    or (v_value is not null and (v_value::text in ('NaN','Infinity','-Infinity') or abs(v_value)>1000000000))
    then raise exception 'INVALID_ROW_FIELDS'; end if;
   v_valid:=v_valid||jsonb_build_array(jsonb_build_object('source_record_id',v_source_id,'indicator_code',v_code,
    'period',v_period,'unit',v_unit,'source_ref',v_ref,'status',v_state,'source_version',v_version,'numeric_value',v_value));
  exception when others then
   v_errors:=v_errors||jsonb_build_array(jsonb_build_object('line',v_count+1,'reason','VALIDATION_ERROR'));
  end;
 end loop;
 if jsonb_array_length(v_errors)>0 and p_policy='REJECT_ALL' then v_status:='REJECTED';
 elsif jsonb_array_length(v_errors)>0 then v_status:='PARTIAL';
 else v_status:='COMMITTED'; end if;
 insert into public.indicator_import_batches(tenant_id,source_system,source_owner,template_version,file_sha256,import_policy,
  status,total_rows,valid_rows,invalid_rows,inserted_rows,receipt,created_by)
 values(v_tenant,'SIMULATED_INDICATOR_CSV',btrim(p_source_owner),p_template_version,p_file_sha256,p_policy,
  v_status,v_count,jsonb_array_length(v_valid),jsonb_array_length(v_errors),0,
  jsonb_build_object('status',v_status,'errors',v_errors,'templateVersion',p_template_version,'fileSha256',p_file_sha256),v_actor)
 returning * into v_batch;
 if v_status<>'REJECTED' then
  for v_row in select value from jsonb_array_elements(v_valid) loop
   v_row_hash:=encode(sha256(convert_to(v_row::text,'UTF8')),'hex');
   v_source_id:=v_row->>'source_record_id'; v_version:=(v_row->>'source_version')::integer;
   select content_sha256 into v_existing_hash from public.imported_indicator_values
    where tenant_id=v_tenant and source_system='SIMULATED_INDICATOR_CSV'
     and source_record_id=v_source_id and source_version=v_version;
   if found then
    if v_existing_hash<>v_row_hash then raise exception 'SOURCE_VERSION_CONFLICT' using errcode='22023'; end if;
   else
    insert into public.imported_indicator_values(tenant_id,batch_id,source_system,source_record_id,source_version,
     indicator_code,period,status,numeric_value,unit,source_ref,source_owner,content_sha256,imported_by)
    values(v_tenant,v_batch.id,'SIMULATED_INDICATOR_CSV',v_source_id,v_version,
     v_row->>'indicator_code',v_row->>'period',v_row->>'status',nullif(v_row->>'numeric_value','')::numeric,
     v_row->>'unit',v_row->>'source_ref',btrim(p_source_owner),v_row_hash,v_actor);
    v_inserted:=v_inserted+1;
   end if;
  end loop;
 end if;
 update public.indicator_import_batches set inserted_rows=v_inserted,
  receipt=receipt||jsonb_build_object('inserted',v_inserted,'duplicates',jsonb_array_length(v_valid)-v_inserted)
 where id=v_batch.id returning * into v_batch;
 insert into public.audit_log(tenant_id,actor_id,action,entity_type,entity_id,payload)
 values(v_tenant,v_actor,'M10_INDICATOR_IMPORT','indicator_import_batch',v_batch.id::text,
  jsonb_build_object('status',v_status,'inserted',v_inserted,'invalid',jsonb_array_length(v_errors)));
 return to_jsonb(v_batch);
end; $$;

create function app.record_simulated_integration(p_external_id text,p_outcome text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_tenant uuid;v_row public.integration_ledger%rowtype;v_status text;
begin
 v_tenant:=pvh_private.ph03_tenant('m10:integration:simulate');
 if length(btrim(coalesce(p_external_id,''))) not between 1 and 150 or p_outcome not in ('SUCCESS','TIMEOUT','SCHEMA_ERROR')
 then raise exception 'INVALID_SIMULATED_REQUEST' using errcode='22023'; end if;
 v_status:='SIMULATED_'||p_outcome;
 insert into public.integration_ledger(tenant_id,adapter_code,external_id,status,receipt,actor_id)
 values(v_tenant,'SIMULATED_ECHO_V1',p_external_id,v_status,
  jsonb_build_object('adapter','SIMULATED_ECHO_V1','liveConnection',false,'outcome',p_outcome),auth.uid())
 on conflict(tenant_id,adapter_code,external_id) do nothing;
 select * into v_row from public.integration_ledger where tenant_id=v_tenant and adapter_code='SIMULATED_ECHO_V1' and external_id=p_external_id;
 if v_row.status<>v_status then raise exception 'SIMULATION_REPLAY_CONFLICT' using errcode='22023'; end if;
 insert into public.audit_log(tenant_id,actor_id,action,entity_type,entity_id,payload)
 values(v_tenant,auth.uid(),'M10_SIMULATED_ADAPTER','integration_ledger',v_row.id::text,
  jsonb_build_object('outcome',p_outcome,'liveConnection',false));
 return to_jsonb(v_row);
end; $$;
-- Explicit bounded retry on a simulated timeout. Expected attempts is a concurrency
-- token; duplicate requests cannot silently bump the attempt counter twice.
create function app.retry_simulated_integration(p_external_id text,p_expected_attempts integer,p_outcome text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_tenant uuid;v_row public.integration_ledger%rowtype;v_status text;
begin
 v_tenant:=pvh_private.ph03_tenant('m10:integration:simulate');
 if length(btrim(coalesce(p_external_id,''))) not between 1 and 150
  or p_expected_attempts not between 1 and 2
  or p_outcome not in ('SUCCESS','TIMEOUT','SCHEMA_ERROR')
 then raise exception 'INVALID_SIMULATED_RETRY' using errcode='22023'; end if;
 select * into v_row from public.integration_ledger
 where tenant_id=v_tenant and adapter_code='SIMULATED_ECHO_V1' and external_id=p_external_id for update;
 if not found then raise exception 'SIMULATION_NOT_FOUND' using errcode='P0002'; end if;
 if v_row.attempts<>p_expected_attempts then raise exception 'SIMULATION_VERSION_CONFLICT' using errcode='40001'; end if;
 if v_row.status<>'SIMULATED_TIMEOUT' or v_row.attempts>=3
 then raise exception 'SIMULATION_NOT_RETRYABLE' using errcode='22023'; end if;
 v_status:='SIMULATED_'||p_outcome;
 update public.integration_ledger set status=v_status,attempts=attempts+1,
  receipt=receipt||jsonb_build_object('retryAt',now(),'retryOutcome',p_outcome,'attempts',attempts+1)
 where id=v_row.id returning * into v_row;
 insert into public.audit_log(tenant_id,actor_id,action,entity_type,entity_id,payload)
 values(v_tenant,auth.uid(),'M10_SIMULATED_RETRY','integration_ledger',v_row.id::text,
  jsonb_build_object('attempts',v_row.attempts,'status',v_status,'liveConnection',false));
 return to_jsonb(v_row);
end; $$;
revoke all on function app.commit_indicator_import(text,text,integer,text,jsonb),
 app.record_simulated_integration(text,text),
 app.retry_simulated_integration(text,integer,text) from public,anon;
grant execute on function app.commit_indicator_import(text,text,integer,text,jsonb),
 app.record_simulated_integration(text,text),
 app.retry_simulated_integration(text,integer,text) to authenticated;
