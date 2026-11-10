import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("../src/features/m06-health-social/server/actions.ts", import.meta.url), "utf8"
);
const create = source.split("export async function recordSocialAidPaymentAction")[0];

test("M06 sensitive beneficiary creation is fail-closed until audited RPC is available", () => {
  assert.match(create, /assertCanManageBeneficiaries\(ctx\)/);
  assert.match(create, /assertCanAccessHamlet\(ctx, hamletId\)/);
  assert.doesNotMatch(create, /\.insert\s*\(/,
    "never perform a direct beneficiary write followed by a separate audit request");
  assert.match(create, /return fail\(\s*"INTERNAL"/);
  assert.match(create, /tạm khóa/);
});

test("payment action still requires explicit permission and territorial validation", () => {
  const payment = source.split("export async function recordSocialAidPaymentAction")[1];
  assert.match(payment, /assertCanRecordPayment\(ctx\)/);
  assert.match(payment, /assertCanAccessHamlet\(ctx, String\(beneficiary\.hamlet_id\)\)/);
  assert.match(payment, /if \(error\)\s*\{/);
});
