import assert from "node:assert/strict";
import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const db=new PGlite();
const files=[
 "20261108054202_pvh_single_commune_account_foundation.sql",
 "20261108054701_pvh_single_commune_scope_context.sql",
 "20261108060000_m01_core_workflow.sql",
 "20261108070000_ph03_domain_verticals.sql",
 "20261108075000_ph04_imports.sql",
 "20261108080000_ph04_reporting.sql",
 "20261108081000_ph04_jobs.sql",
];
const uuid="00000000-0000-4000-8000-000000000901";
const one=async(sql,params=[])=>{
 const res=await db.query(sql,params);return res.rows[0];
};
try{
 await db.exec([
  "create role anon; create role authenticated; create role service_role; create role authenticator;",
  "create schema auth; create table auth.users(id uuid primary key);",
  "create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;",
  "create schema storage;",
  "create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);",
  "create table storage.objects(bucket_id text,name text,owner_id text);",
  "alter table storage.objects enable row level security;",
 ].join("\n"));
 for(const file of files){
  try{await db.exec(readFileSync(new URL("../supabase/migrations/"+file,import.meta.url),"utf8"));}
  catch(e){throw new Error("Migration failed: "+file+": "+String(e.message),{cause:e});}
 }
 console.log("Migrations applied to isolated PGlite: "+files.length);
 const tenant=(await one("select id from public.tenants")).id;
 await db.query("insert into auth.users(id) values($1)",[uuid]);
 await db.query("insert into public.profiles(id,tenant_id,full_name) values($1,$2,'Cán bộ kiểm thử')",[uuid,tenant]);
 const member=await one("insert into public.memberships(tenant_id,user_id) values($1,$2) returning id",[tenant,uuid]);
 await db.query("insert into public.membership_roles(membership_id,role_code) values($1,'WORK_OFFICER'),($1,'WORK_MANAGER')",[member.id]);
 await db.query("select set_config('request.jwt.claim.sub',$1,false)",[uuid]);
 const permissions=await one("select permissions from public.memberships where id=$1",[member.id]);
 assert.ok(permissions.permissions.includes("m09:report:draft"));
 assert.ok(permissions.permissions.includes("m10:indicator:import"));
 for(const [index,status] of ["COMPLETED","IN_PROGRESS"].entries()){
  await db.query("insert into public.work_items(tenant_id,title,status,idempotency_key,request_hash,created_by,updated_by) values($1,$2,$3,$4,$5,$6,$6)",
   [tenant,"Việc giả lập "+index,status,"fixture-work-"+index,"fixture-hash-"+index,uuid]);
 }
 const first=await one("select app.create_report_snapshot('RPT-WORK','Báo cáo công việc quý','Q4/2026',2026,'snapshot-idem-0001',null) as s");
 const snap=first.s;
 assert.equal(crypto.createHash("sha256").update(snap.canonical_text).digest("hex"),snap.sha256);
 const hashVectors=await one("select ($1::jsonb)::text as a,($2::jsonb)::text as b,($3::jsonb)::text as c",
  ['{"z":"Tiếng Việt","a":[1,{"n":2}]}','{"a":[1,{"n":2}],"z":"Tiếng Việt"}',
   '{"a":[1,{"n":3}],"z":"Tiếng Việt"}']);
 assert.equal(hashVectors.a,hashVectors.b,"PostgreSQL JSONB normalizes property order");
 assert.notEqual(hashVectors.a,hashVectors.c,"Changed nested data changes canonical text");
 assert.equal(Number(snap.payload.metrics.tasksTotal),2);
 assert.equal(Number(snap.payload.metrics.tasksCompleted),1);
 assert.equal(Number(snap.payload.metrics.tasksOverdue),0);
 const count=await one("select count(*)::integer as n from public.report_snapshot_lineage where snapshot_id=$1",[snap.id]);
 assert.equal(count.n,2);
 const empty=await one("select app.create_report_snapshot('RPT-WORK','Báo cáo kỳ không dữ liệu','2020-01',2020,'snapshot-empty-0001',null) as s");
 assert.equal(Number(empty.s.payload.metrics.tasksTotal),0);
 assert.equal(empty.s.payload.quality.cdsIndex.status,"NOT_REPORTED");
 assert.equal(empty.s.payload.quality.cdsIndex.value,null);
 const orgId=(await one("select id from public.org_units where tenant_id=$1 limit 1",[tenant])).id;
 const pack=(await one("insert into public.culture_rule_packs(tenant_id,title_type,version,jurisdiction,created_by) values($1,'GIA_DINH',4,'DEMO',$2) returning id",[tenant,uuid])).id;
 const campaign=(await one("insert into public.campaigns(tenant_id,rule_pack_id,title_type,year,title,opens_at,closes_at,created_by) values($1,$2,'GIA_DINH',2026,'Đợt rà soát minh họa','2026-01-01','2027-01-01',$3) returning id",[tenant,pack,uuid])).id;
 for(const [i,status] of ["DAT","KHONG_DAT"].entries()){
  await db.query("insert into public.submissions(tenant_id,campaign_id,rule_pack_id,rule_pack_version,subject_ref,household_head_name,hamlet_id,submission_type,status,source_ref,idempotency_key,request_hash,created_by) values($1,$2,$3,4,$4,$5,$6,'GIA_DINH',$7,$8,$9,$10,$11)",
   [tenant,campaign,pack,"SUB-"+i,"Người mô phỏng "+i,orgId,status,"SIM-CULTURE/"+i,"fixture-culture-"+i,"hash-culture-"+i,uuid]);
 }
 const culture=await one("select app.create_report_snapshot('RPT-CULTURE','Kết quả văn hóa minh họa','Q4/2026',2026,'snapshot-culture-01',null) as s");
 assert.equal(Number(culture.s.payload.metrics.cultureSubmissions),2);
 assert.equal(Number(culture.s.payload.metrics.cultureEligible),1);
 const cultureContrib=await db.query("select contribution,source_version from public.report_snapshot_lineage where snapshot_id=$1",[culture.s.id]);
 assert.equal(cultureContrib.rows.length,2);
 assert.ok(cultureContrib.rows.every(x=>x.contribution.rulePackVersion===4));
 assert.ok(cultureContrib.rows.every(x=>!JSON.stringify(x.contribution).includes("Người mô phỏng")));
 const replay=await one("select app.create_report_snapshot('RPT-WORK','Báo cáo công việc quý','Q4/2026',2026,'snapshot-idem-0001',null) as s");
 assert.equal(replay.s.id,snap.id);assert.equal(replay.s.cached,true);
 let current=snap;
 for(const transition of ["SUBMIT","START_REVIEW","FINALIZE"]){
  const advanced=await one("select app.advance_report_snapshot($1,$2,$3) as s",[snap.id,current.version,transition]);
  current=advanced.s;
 }
 assert.equal(current.status,"FINALIZED");
 await assert.rejects(db.query("select app.advance_report_snapshot($1,1,'SUBMIT')",[snap.id]),/VERSION_CONFLICT/);
 await assert.rejects(db.query("update public.report_snapshots set title='Modified' where id=$1",[snap.id]),/REPORT_IMMUTABLE/);
 await db.query("update public.work_items set status='COMPLETED' where status='IN_PROGRESS'");
 const revised=await one("select app.create_report_snapshot('RPT-WORK','Báo cáo công việc cập nhật','Q4/2026',2026,'snapshot-idem-0002',$1) as s",[snap.id]);
 assert.equal(revised.s.revision,2);
 assert.equal(Number(revised.s.payload.metrics.tasksCompleted),2);
 const stored=await one("select payload from public.report_snapshots where id=$1",[snap.id]);
 assert.equal(Number(stored.payload.metrics.tasksCompleted),1);
 const rows=[
  {source_record_id:"DEMO-001",source_version:"1",indicator_code:"CDS_A",period:"Q4/2026",status:"CONFIRMED",numeric_value:"12",unit:"hoso",source_ref:"SIM-DEMO/001"},
  {source_record_id:"DEMO-002",source_version:"1",indicator_code:"CDS_B",period:"Q4/2026",status:"CONFIRMED_ZERO",numeric_value:"0",unit:"hoso",source_ref:"SIM-DEMO/002"},
  {source_record_id:"DEMO-003",source_version:"1",indicator_code:"CDS_C",period:"Q4/2026",status:"NOT_REPORTED",numeric_value:"",unit:"hoso",source_ref:"SIM-DEMO/003"},
  {source_record_id:"=EVAL",__invalid:true},{source_record_id:"BAD",status:"CONFIRMED_ZERO",numeric_value:"8"},
 ];
 const sha="a".repeat(64);
 const imported=await one("select app.commit_indicator_import('Nguồn kiểm thử',$1,1,'ACCEPT_VALID',$2::jsonb) as r",
  [sha,JSON.stringify(rows)]);
 assert.equal(imported.r.valid_rows,3);assert.equal(imported.r.invalid_rows,2);
 assert.equal(imported.r.inserted_rows,3);assert.equal(imported.r.status,"PARTIAL");
 const again=await one("select app.commit_indicator_import('Nguồn kiểm thử',$1,1,'ACCEPT_VALID',$2::jsonb) as r",
  [sha,JSON.stringify(rows)]);
 assert.equal(again.r.id,imported.r.id);assert.equal(again.r.cached,true);
 await assert.rejects(db.query("select app.commit_indicator_import('Nguồn kiểm thử',$1,1,'REJECT_ALL',$2::jsonb)",
  [sha,JSON.stringify(rows)]),/IMPORT_REPLAY_CONFLICT/);
 const digital=await one("select app.create_report_snapshot('RPT-DIGITAL','Báo cáo chỉ tiêu quý','Q4/2026',2026,'snapshot-digital-1',null) as s");
 assert.equal(Number(digital.s.payload.metrics.importedValues),3);
 const adapter=await one("select app.record_simulated_integration('external-demo-1','TIMEOUT') as s");
 assert.equal(adapter.s.status,"SIMULATED_TIMEOUT");
 await assert.rejects(db.query("select app.record_simulated_integration('external-demo-1','SUCCESS')"),
  /SIMULATION_REPLAY_CONFLICT/);
 const retried=await one("select app.retry_simulated_integration('external-demo-1',1,'SUCCESS') as s");
 assert.equal(retried.s.status,"SIMULATED_SUCCESS");
 assert.equal(retried.s.attempts,2);
 await assert.rejects(db.query("select app.retry_simulated_integration('external-demo-1',1,'SUCCESS')"),
  /SIMULATION_VERSION_CONFLICT/);
 await assert.rejects(db.query("select app.retry_simulated_integration('external-demo-1',2,'TIMEOUT')"),
  /SIMULATION_NOT_RETRYABLE/);
 const queued=await one("select app.enqueue_report_export($1,'XLSX','export-idem-00001') as j",[snap.id]);
 assert.equal(queued.j.status,"PENDING");
 // Other module's jobs are out of scope for PH04 worker and must remain pending.
 await db.query("insert into public.system_jobs(tenant_id,kind,idempotency_key,created_by) values($1,'OTHER_MODULE','other-module-task-1',$2)",[tenant,uuid]);
 const claimed=await one("select app.claim_next_system_job('local-db-smoke') as j");
 assert.equal(claimed.j.claimed,true);
 assert.equal(claimed.j.jobId,queued.j.id);
 await assert.rejects(db.query("select app.complete_system_job($1,'local-db-smoke','{}'::jsonb)",[queued.j.id]),/ARTIFACT_RECEIPT_REQUIRED/);
 const receipt={storagePath:tenant+"/report_exports/"+queued.j.id+"/report.xlsx",sha256:"b".repeat(64),bytes:1000};
 await assert.rejects(db.query("select app.complete_system_job($1,'stale-worker',$2::jsonb)",[queued.j.id,JSON.stringify(receipt)]),/JOB_LEASE_MISMATCH/);
 const completed=await one("select app.complete_system_job($1,'local-db-smoke',$2::jsonb) as j",[queued.j.id,JSON.stringify(receipt)]);
 assert.equal(completed.j.status,"SUCCEEDED");
 assert.equal((await one("select status from public.system_jobs where kind='OTHER_MODULE'")).status,"PENDING");
 const checks=await one("select count(*)::integer as n from public.audit_log where action like 'M09_%' or action like 'M10_%'");
 assert.ok(checks.n>=6);
 // Actual Postgres role/RLS check: an authenticated user cannot mutate tables or claim jobs.
 await db.exec("set role authenticated");
 assert.equal((await one("select count(*)::integer as n from public.report_snapshots")).n,5);
 await assert.rejects(db.query("delete from public.report_snapshots where id=$1",[snap.id]),
  /permission denied/);
 await assert.rejects(db.query("select app.claim_next_system_job('forged-worker')"),/permission denied/);
 await db.exec("reset role");
 const auditor="00000000-0000-4000-8000-000000000902";
 await db.query("insert into auth.users(id) values($1)",[auditor]);
 await db.query("insert into public.profiles(id,tenant_id,full_name) values($1,$2,'Người kiểm tra giả lập')",[auditor,tenant]);
 const auditorMembership=await one("insert into public.memberships(tenant_id,user_id) values($1,$2) returning id",[tenant,auditor]);
 await db.query("insert into public.membership_roles(membership_id,role_code) values($1,'AUDITOR')",[auditorMembership.id]);
 await db.query("select set_config('request.jwt.claim.sub',$1,false)",[auditor]);
 await db.exec("set role authenticated");
 assert.ok((await one("select count(*)::integer as n from public.report_snapshots")).n>=1);
 assert.equal((await one("select count(*)::integer as n from public.report_snapshot_lineage")).n,0);
 await assert.rejects(db.query("select app.create_report_snapshot('RPT-WORK','Truy cập sai quyền','Q4/2026',2026,'no-permission-0001',null)"),
  /FORBIDDEN/);
 await assert.rejects(db.query("select app.retry_simulated_integration('external-demo-1',2,'TIMEOUT')"),
  /FORBIDDEN/);
 await db.exec("reset role");
 console.log("G4 local SQL tests: 7 migrations, RPT-001/002/003/004, full lineage/hash, imports 3+2/replay, simulation, job lease/isolation, audit, roles/RLS PASS");
}catch(error){
 console.error(error);
 process.exitCode=1;
}finally{
 await db.close();
}
