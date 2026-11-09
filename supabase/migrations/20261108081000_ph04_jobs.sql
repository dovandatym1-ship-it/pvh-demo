-- PH04 P04-12: queued export jobs with real artifact receipts.
-- Service role access is server-only, never a browser key.
alter table public.system_jobs
 add column payload jsonb not null default '{}'::jsonb,
 add column max_attempts integer not null default 3 check(max_attempts between 1 and 5),
 add column error_message text,
 add column available_at timestamptz not null default now(),
 add column started_at timestamptz,
 add column locked_by text;
create index system_jobs_retry_idx on public.system_jobs(status,available_at,created_at)
 where status in ('PENDING','RUNNING');
create policy jobs_owner_read on public.system_jobs for select to authenticated
 using(created_by=(select auth.uid()) and pvh_private.has_permission(tenant_id,'m09:report:export'));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('pvh-report-exports','pvh-report-exports',false,10485760,
 array['application/pdf','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict(id) do nothing;

create function app.enqueue_report_export(p_snapshot_id uuid,p_format text,p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_tenant uuid;v_job public.system_jobs%rowtype;v_snapshot public.report_snapshots%rowtype;
begin
 v_tenant:=pvh_private.ph03_tenant('m09:report:export');
 if p_format not in ('PDF','XLSX') or length(btrim(coalesce(p_idempotency_key,''))) not between 8 and 200
 then raise exception 'VALIDATION' using errcode='22023'; end if;
 select * into v_snapshot from public.report_snapshots
 where tenant_id=v_tenant and id=p_snapshot_id;
 if not found then raise exception 'NOT_FOUND' using errcode='P0002'; end if;
 perform pg_advisory_xact_lock(hashtextextended(v_tenant::text||auth.uid()::text||p_idempotency_key,0));
 select * into v_job from public.system_jobs
 where tenant_id=v_tenant and kind='REPORT_EXPORT_ASYNC' and idempotency_key=p_idempotency_key;
 if found then
  if v_job.payload<>jsonb_build_object('snapshotId',p_snapshot_id,'format',p_format) or v_job.created_by<>auth.uid()
  then raise exception 'IDEMPOTENCY_CONFLICT' using errcode='22023'; end if;
  return to_jsonb(v_job)||jsonb_build_object('cached',true);
 end if;
 insert into public.system_jobs(tenant_id,kind,status,payload,idempotency_key,created_by)
 values(v_tenant,'REPORT_EXPORT_ASYNC','PENDING',
  jsonb_build_object('snapshotId',p_snapshot_id,'format',p_format),p_idempotency_key,auth.uid())
 returning * into v_job;
 insert into public.audit_log(tenant_id,actor_id,action,entity_type,entity_id,payload)
 values(v_tenant,auth.uid(),'M09_EXPORT_ENQUEUE','system_job',v_job.id::text,
  jsonb_build_object('snapshotId',p_snapshot_id,'format',p_format));
 return to_jsonb(v_job);
end; $$;

create function app.claim_next_system_job(p_worker_id text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_job public.system_jobs%rowtype;
begin
 if length(btrim(coalesce(p_worker_id,''))) not between 3 and 100 then
  raise exception 'INVALID_WORKER' using errcode='22023'; end if;
 -- Crashed workers are retried, and exhausted jobs go to a visible terminal failure.
 update public.system_jobs set status='FAILED',error_message='WORKER_LEASE_EXPIRED',updated_at=now()
 where kind='REPORT_EXPORT_ASYNC' and status='RUNNING'
  and started_at<now()-interval '10 minutes' and attempts>=max_attempts;
 update public.system_jobs set status='PENDING',available_at=now(),updated_at=now(),locked_by=null
 where kind='REPORT_EXPORT_ASYNC' and status='RUNNING'
  and started_at<now()-interval '10 minutes' and attempts<max_attempts;
 select * into v_job from public.system_jobs
 where kind='REPORT_EXPORT_ASYNC' and status='PENDING' and available_at<=now()
 order by created_at,id for update skip locked limit 1;
 if not found then return jsonb_build_object('ok',true,'claimed',false); end if;
 update public.system_jobs set status='RUNNING',attempts=attempts+1,
  started_at=now(),locked_by=p_worker_id,updated_at=now()
 where id=v_job.id returning * into v_job;
 return jsonb_build_object('ok',true,'claimed',true,'jobId',v_job.id,'tenantId',v_job.tenant_id,
  'kind',v_job.kind,'payload',v_job.payload,'attempts',v_job.attempts);
end; $$;

create function app.complete_system_job(p_job_id uuid,p_worker_id text,p_receipt jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_job public.system_jobs%rowtype;
begin
 if p_receipt is null or jsonb_typeof(p_receipt)<>'object'
  or p_receipt->>'storagePath' is null or p_receipt->>'sha256' !~ '^[0-9a-f]{64}$'
  or coalesce((p_receipt->>'bytes')::integer,0)<1 then
  raise exception 'ARTIFACT_RECEIPT_REQUIRED' using errcode='22023'; end if;
 update public.system_jobs set status='SUCCEEDED',receipt=p_receipt,
  error_message=null,locked_by=null,updated_at=now()
 where id=p_job_id and kind='REPORT_EXPORT_ASYNC' and status='RUNNING'
  and locked_by=p_worker_id returning * into v_job;
 if not found then raise exception 'JOB_LEASE_MISMATCH' using errcode='22023'; end if;
 return to_jsonb(v_job);
end; $$;

create function app.fail_system_job(p_job_id uuid,p_worker_id text,p_error text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_job public.system_jobs%rowtype;
begin
 update public.system_jobs set
  status=case when attempts>=max_attempts then 'FAILED' else 'PENDING' end,
  available_at=now()+((power(2,least(attempts,5)))::integer||' minutes')::interval,
  error_message=left(coalesce(p_error,'UNKNOWN_ERROR'),500),locked_by=null,updated_at=now()
 where id=p_job_id and kind='REPORT_EXPORT_ASYNC' and status='RUNNING'
  and locked_by=p_worker_id returning * into v_job;
 if not found then raise exception 'JOB_LEASE_MISMATCH' using errcode='22023'; end if;
 return to_jsonb(v_job);
end; $$;

-- Never expose machine job claiming/receipt RPCs to anonymous or authenticated roles.
revoke all on function app.enqueue_report_export(uuid,text,text) from public,anon;
grant execute on function app.enqueue_report_export(uuid,text,text) to authenticated;
revoke all on function app.claim_next_system_job(text),
 app.complete_system_job(uuid,text,jsonb),app.fail_system_job(uuid,text,text) from public,anon,authenticated;
grant execute on function app.claim_next_system_job(text),
 app.complete_system_job(uuid,text,jsonb),app.fail_system_job(uuid,text,text) to service_role;
