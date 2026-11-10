import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("account administration route has explicit manage permission", () => {
  const nav = read("src/config/navigation.ts");
  const subroute = nav.slice(nav.indexOf('route: "/quan-tri/tai-khoan"'));
  assert.ok(subroute.startsWith('route: "/quan-tri/tai-khoan"'));
  assert.match(subroute.slice(0, 170), /requiredPermission: "m00:membership:manage"/);
  assert.match(nav, /item\.route\.length > match\.route\.length/);
});

test("server page and account actions independently check membership management", () => {
  const page = read("src/app/(app)/quan-tri/tai-khoan/page.tsx");
  const actions = read("src/features/m00-platform/server/accounts.ts");
  assert.match(page, /assertPermission\(ctx,\s*"m00:membership:manage"\)/);
  assert.match(actions, /assertPermission\(ctx,\s*"m00:membership:manage"\)/);
  assert.doesNotMatch(actions, /NEXT_PUBLIC_.*SERVICE_ROLE/);
});

test("M00 account console offers Vietnamese search and role/status filters", () => {
  const console = read("src/features/m00-platform/components/accounts-console.tsx");
  assert.match(console, /Tìm theo họ và tên/);
  assert.match(console, /Tất cả vai trò/);
  assert.match(console, /Đã thu hồi/);
  assert.match(console, /filteredStaff\.map/);
  assert.match(console, /person\.roles\.includes\(roleFilter\)/);
  assert.match(console, /person\.isActive/);
  assert.match(console, /Không có cán bộ phù hợp/);
});

test("M00 invite derives hamlet access from current server-side org unit, not the form", () => {
  const page = read("src/app/(app)/quan-tri/tai-khoan/page.tsx");
  const ui = read("src/features/m00-platform/components/accounts-console.tsx");
  const actions = read("src/features/m00-platform/server/accounts.ts");
  assert.match(page, /eq\("tenant_id", ctx\.tenantId\)/);
  assert.match(page, /orgUnits=\{unitOptions\}/);
  assert.match(ui, /name="orgUnitId"/);
  assert.match(ui, /orgUnitId: String\(data\.get\("orgUnitId"\)/);
  assert.match(actions, /\.eq\("tenant_id", ctx\.tenantId\)\.eq\("id", parsed\.data\.orgUnitId\)/);
  assert.match(actions, /\.eq\("is_active", true\)\.maybeSingle\(\)/);
  assert.match(actions, /unit\.kind === "HAMLET"/);
  assert.match(actions, /assignedScopes = \{ org_unit_ids: \[unit\.id\] \}/);
  assert.match(actions, /p_scopes: assignedScopes/);
  assert.ok(actions.indexOf('select("id,kind")') < actions.indexOf("inviteUserByEmail"),
    "validate org scope before inviting an Auth user");
});
