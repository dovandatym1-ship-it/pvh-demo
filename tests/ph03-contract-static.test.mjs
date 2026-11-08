// STATIC CONTRACT ONLY: source assertions are not browser, RLS or DB E2E evidence.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration=readFileSync("supabase/migrations/20261108070000_ph03_domain_verticals.sql","utf8");
const action=(module)=>readFileSync("src/features/"+module+"/server/ph03-actions.ts","utf8");
test("PH03 domain tables are private writes with RLS read policies",()=>{
 for(const table of ["submissions","culture_rule_packs","campaigns","digital_indicators",
  "digital_plans","inspection_records","inspection_recommendations"]){
  assert.match(migration,new RegExp("create table public\\."+table+" \\("));
 }
 assert.match(migration,/force row level security/);
 assert.match(migration,/revoke all on public\.%I from public,anon,authenticated/);
 assert.match(migration,/grant select on public\.%I to authenticated/);
 assert.doesNotMatch(migration,/grant (?:insert|update|delete) on public\./i);
});
test("M04 is illustrative until a verified legal pack and evidence exist",()=>{
 assert.match(migration,/ILLUSTRATIVE_ONLY/);
 assert.match(migration,/v_pack\.status<>'VERIFIED'/);
 assert.match(migration,/VERIFIED_EVIDENCE_REQUIRED/);
 assert.match(migration,/SEPARATION_OF_DUTIES/);
 assert.doesNotMatch(action("m04-culture-family"),/85\s*(?:points|điểm|\)|,)/);
});
test("M05 treats zero, null and missing separately",()=>{
 assert.match(migration,/p_value<>0/);
 assert.match(migration,/VALUE_MUST_BE_NULL/);
 assert.match(migration,/REVIEWER_MUST_BE_DIFFERENT_ACTOR/);
 assert.match(action("m05-science-digital"),/numericValue!==0/);
 assert.doesNotMatch(action("m05-science-digital"),/from\("digital_indicators"\)\.update/);
});
test("M08 close requires completed M01 task, no fallback",()=>{
 assert.match(migration,/M01_WORK_NOT_COMPLETED/);
 assert.match(migration,/app\.create_work_item\(/);
 assert.match(migration,/p_expected_version is distinct from v_row.version/);
 assert.doesNotMatch(action("m08-inspections"),/from\("inspection_recommendations"\)\.update/);
});
test("legacy mutators are blocked",()=>{
 for(const module of ["m04-culture-family","m05-science-digital","m08-inspections"]){
  const source=readFileSync("src/features/"+module+"/server/actions.ts","utf8");
  assert.match(source,/return fail\(/);
  assert.doesNotMatch(source,/return ok\(/);
 }
});
