import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source=readFileSync(new URL("../src/features/m06-health-social/server/actions.ts",import.meta.url),"utf8");
const create=source.split("export async function recordSocialAidPaymentAction")[0];
const reconcile=source.split("export async function recordSocialAidPaymentAction")[1];

test("M06 beneficiary intake is a single audited RPC, not direct insert + separate audit",()=>{
  assert.match(create,/assertCanManageBeneficiaries\(ctx\)/);
  assert.match(create,/assertCanAccessHamlet\(ctx,parsed\.data\.hamletId\)/);
  assert.match(create,/\.schema\("app"\)\.rpc\("create_social_beneficiary"/);
  assert.doesNotMatch(create,/\.insert\s*\(/);
  assert.doesNotMatch(create,/\.from\("audit_log"\)/);
  assert.match(create,/data\.status!=="PENDING"/);
});

test("M06 reconciliation requires source reference and never marks PAID on a button press",()=>{
  assert.match(reconcile,/assertCanRecordPayment\(ctx\)/);
  assert.match(reconcile,/\.schema\("app"\)\.rpc\("request_social_aid_reconciliation"/);
  assert.match(reconcile,/p_source_reference:parsed\.data\.sourceReference/);
  assert.match(reconcile,/data\.status!=="REQUESTED"/);
  assert.doesNotMatch(reconcile,/\.update\(\{\s*payment_status/);
});

test("Beneficiary public direct SELECT is absent from server query implementation",()=>{
  const queries=readFileSync(new URL("../src/features/m06-health-social/server/queries.ts",import.meta.url),"utf8");
  const beneficiary=queries.split("export async function getFoodSafetyInspections")[0];
  assert.match(beneficiary,/list_social_beneficiaries/);
  assert.doesNotMatch(beneficiary,/\.from\("social_protection_beneficiaries"\)/);
});
