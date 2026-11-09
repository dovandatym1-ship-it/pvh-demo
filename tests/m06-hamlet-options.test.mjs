import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { buildSocialHamletOptions } from "../src/features/m06-health-social/types/hamlet-options.ts";

const read = p => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("M06 hamlet filter uses real unit ids and names, not demo A1/A2 values", () => {
  const items = [{ hamletId: "h2" }, { hamletId: "h1" }, { hamletId: "h1" }];
  const hamlets = [{ id: "h1", name: "Xóm An" }, { id: "h2", name: "Xóm Bình" }];
  assert.deepEqual(buildSocialHamletOptions(items, hamlets), hamlets);
  assert.deepEqual(buildSocialHamletOptions([{ hamletId: "unknown" }], []),
    [{ id: "unknown", name: "Địa bàn chưa xác định" }]);
  const table = read("src/features/m06-health-social/components/beneficiary-table.tsx");
  assert.match(table, /hamletOptions\.map/);
  assert.doesNotMatch(table, /<option value="A[123]">/);
  assert.match(table, /SUSPENDED/);
  assert.match(table, /hamletNames\.get\(item\.hamletId\)/);
});

test("M06 hamlet names come from a tenant-filtered server query, not a client-side guess", () => {
  const query = read("src/features/m06-health-social/server/queries.ts");
  assert.match(query, /getSocialHamlets/);
  assert.match(query, /assertCanReadHealthSocial\(ctx\)/);
  assert.match(query, /eq\("tenant_id", ctx\.tenantId\)/);
  assert.match(query, /ctx\.scopes\.hamletIds/);
});
