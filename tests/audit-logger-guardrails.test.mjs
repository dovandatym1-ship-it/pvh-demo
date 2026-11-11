import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/lib/audit/audit-logger.ts", import.meta.url), "utf8");
const writeBody = source.slice(
  source.indexOf("export async function logAuditEvent("),
  source.indexOf("export async function getRecentAuditLogs("),
);
const readBody = source.slice(source.indexOf("export async function getRecentAuditLogs("));

test("audit writes require a real authenticated actor and active membership", () => {
  assert.match(writeBody, /supabase\.auth\.getUser\(\)/);
  assert.match(writeBody, /user\.id !== entry\.userId/);
  assert.match(writeBody, /isMembershipCurrentlyActive\(membership\)/);
  assert.match(writeBody, /AUDIT_UNAUTHENTICATED/);
  assert.match(writeBody, /AUDIT_MEMBERSHIP_INVALID/);
});

test("audit writes never fabricate tenant, actor, or receipt identifiers", () => {
  assert.match(writeBody, /assertUuid\(entry\.tenantId, "TENANT"\)/);
  assert.match(writeBody, /assertUuid\(entry\.userId, "ACTOR"\)/);
  assert.doesNotMatch(writeBody, /toValidUuid|TENANT_A_UUID|PERSONA_UUIDS/);
  assert.doesNotMatch(writeBody, /id:\s*`audit-/);
  assert.match(writeBody, /AUDIT_WRITE_FAILED/);
});

test("audit reads are pinned to the authenticated tenant and bounded", () => {
  assert.match(readBody, /getRequestContext\(\)/);
  assert.match(readBody, /tenantId \?\? ctx\.tenantId/);
  assert.match(readBody, /selectedTenantId !== ctx\.tenantId/);
  assert.match(readBody, /Math\.min\(Math\.max\(limit, 1\), 100\)/);
  assert.match(readBody, /AUDIT_QUERY_FAILED/);
});
