import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { toNccDisplayRows, toSocialDisplayRows } from "../src/lib/authorization/display-sensitive";

const source = (path: string) => fs.readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("unprivileged beneficiary browser payload never contains raw CCCD, financial amount, phone or diagnosis", () => {
  const result = toSocialDisplayRows([{
    id:"1", code:"BT-1", fullName:"Người mẫu", cccd:"019123456789", phone:"0912345678",
    diagnosis:"Bệnh nhạy cảm", monthlyAmount:540000, hamletId:"A1", aidCategory:"Mẫu",
    paymentStatus:"PENDING", healthInsuranceProvided:true, version:1, createdAt:"", updatedAt:"",
  }], false);
  const serialized = JSON.stringify(result);
  for (const secret of ["019123456789", "0912345678", "Bệnh nhạy cảm", "540000"]) {
    assert.equal(serialized.includes(secret), false, "Leaked " + secret);
  }
  assert.equal("phone" in result[0], false);
  assert.equal("diagnosis" in result[0], false);
  assert.match(result[0].amountDisplay, /\*/);
});

test("NCC browser payload similarly removes raw identity and allowance", () => {
  const result = toNccDisplayRows([{
    id:"1", code:"NCC-1", fullName:"Người mẫu", cccd:"019123456789", hamletId:"A1",
    category:"THUONG_BINH", medalTitle:"", monthlyAllowance:2850000,
    hasDeduplicationFlag:false,status:"ACTIVE",
  }], false);
  const serialized = JSON.stringify(result);
  assert.equal(serialized.includes("019123456789"),false);
  assert.equal(serialized.includes("2850000"),false);
  assert.equal("cccd" in result[0],false);
  assert.equal("monthlyAllowance" in result[0],false);
});

test("explicit field-level approval can reveal fields, but does not include unused phone data", () => {
  const result = toSocialDisplayRows([{
    id:"1", code:"BT-1", fullName:"Người mẫu", cccd:"019123456789", phone:"0912345678",
    diagnosis:"Nguồn thật", monthlyAmount:540000, hamletId:"A1", aidCategory:"Mẫu",
    paymentStatus:"PENDING", healthInsuranceProvided:true, version:1, createdAt:"", updatedAt:"",
  }], true);
  assert.equal(result[0].cccdDisplay, "019123456789");
  assert.equal(result[0].diagnosisDisplay, "Nguồn thật");
  assert.equal(JSON.stringify(result).includes("0912345678"),false);
});

test("four domain query modules have no fabricated successful datasets on empty/error", () => {
  for (const domain of ["m02-internal-affairs","m03-education","m06-health-social","m07-ethnicity-faith"]) {
    const code = source("src/features/" + domain + "/server/queries.ts");
    assert.doesNotMatch(code, /if\s*\(error\s*\|\|\s*!data\s*\|\|\s*data\.length\s*===\s*0\)/);
    assert.doesNotMatch(code, /c0000000-0000|d0000000-0000|e0000000-0000|019123456789/);
    assert.match(code, /if \(error\) \{/);
  }
});

test("M07 applies explicit route guard; education never sends private owner CCCD to client", () => {
  assert.match(source("src/app/(app)/dan-toc-ton-giao/page.tsx"), /assertCanViewFaith\(ctx\)/);
  assert.match(source("src/app/(app)/giao-duc/page.tsx"), /ownerCccd:\s*_secret/);
});

test("territorial boundaries checked for M02/M06 read queries and M06 writes", () => {
  for (const domain of ["m02-internal-affairs", "m06-health-social"]) {
    assert.match(source("src/features/" + domain + "/server/queries.ts"), /query\.in\("hamlet_id"/);
  }
  const actions = source("src/features/m06-health-social/server/actions.ts");
  const sql = source("supabase/migrations/20261110120000_m06_social_intake.sql");
  assert.match(actions, /assertCanAccessHamlet\(ctx,\s*parsed\.data\.hamletId\)/);
  assert.match(actions, /request_social_aid_reconciliation/);
  assert.match(sql, /FORBIDDEN_HAMLET/);
  assert.match(sql, /v_beneficiary\.hamlet_id/);
  assert.doesNotMatch(actions, /\.from\("social_protection_beneficiaries"\)/);
});
