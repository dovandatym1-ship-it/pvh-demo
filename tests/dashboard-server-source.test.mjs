import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolveWorkScope } from "../src/features/m01-core-work/server/work-scope.ts";
import { buildRolePresentation } from "../src/features/dashboard/role-semantics.mjs";
import { buildDashboardModel } from "../src/features/dashboard/metrics.mjs";

const base = { userId: "00000000-0000-4000-8000-000000000002", roles: ["CONG_CHUC_VHXH"], permissions: ["m01:work:read"], scopes: {} };
const hamlet = "00000000-0000-4000-8000-000000000003";

test("dashboard scope is fail-closed and does not grant tenant access from role alone", () => {
  assert.equal(resolveWorkScope({ ...base, roles: ["LANH_DAO_XA"] }).kind, "officer");
  assert.equal(resolveWorkScope({ ...base, roles: ["LANH_DAO_XA"], permissions: ["m01:work:read", "m01:work:read_all"] }).kind, "tenant");
  assert.deepEqual(resolveWorkScope({ ...base, roles: ["TRUONG_THON"] }), { kind: "hamlet", hamlets: [] });
  assert.deepEqual(resolveWorkScope({ ...base, roles: ["TRUONG_THON"], scopes: { hamletIds: [hamlet, hamlet, "bad"] } }), { kind: "hamlet", hamlets: [hamlet] });
});

test("dashboard uses server exact counts and bounded queue, not first 100 rows for KPI", () => {
  const server = readFileSync(new URL("../src/features/dashboard/server/get-m01-dashboard-snapshot.ts", import.meta.url), "utf8");
  const page = readFileSync(new URL("../src/app/(app)/dashboard/page.tsx", import.meta.url), "utf8");
  assert.match(server, /count: "exact", head: true/);
  assert.match(server, /scope = resolveWorkScope/);
  assert.match(server, /limit\(30\)/);
  assert.doesNotMatch(page, /getWorkItems\(/);
  assert.doesNotMatch(server, /return \{.*items: \[\].*total: 0/s);
});

test("role cards honor a complete 125-record server summary even with 1 preview item", () => {
  const ctx = { tenantId: "a", userId: "leader", roles: ["LANH_DAO_XA"], scopes: {} };
  const item = { id: "one", tenantId: "a", title: "Việc mẫu", status: "IN_PROGRESS", priority: "HIGH", category: "VAN_HOA", assignedTo: "leader", dueDate: null, createdAt: "2026-11-09", updatedAt: "2026-11-09" };
  const model = buildDashboardModel({ items: [item], ctx, now: "2026-11-09T12:00:00+07:00" });
  model.serverSummary = {
    total: 125, open: 105, overdue: 31, dueSoon: 21, returned: 8, unassigned: 13, review: 5,
    ages: [{ key: "overdue", label: "Quá hạn", count: 31 }, { key: "today", label: "Hôm nay", count: 4 },
      { key: "oneThree", label: "1-3", count: 7 }, { key: "fourSeven", label: "4-7", count: 10 },
      { key: "later", label: "Sau", count: 22 }, { key: "unset", label: "Chưa", count: 31 }],
    statuses: [{ code: "IN_PROGRESS", label: "Đang xử lý", color: "amber", count: 105 }, { code: "COMPLETED", label: "Hoàn thành", color: "green", count: 20 }],
    domains: [],
  };
  const output = buildRolePresentation(model);
  const cards = Object.fromEntries(output.cards.map(c => [c.id,c.value]));
  assert.deepEqual(cards, { overdue: 31, unassigned: 13, review: 5, open: 105 });
  assert.equal(output.totalFocus, 125);
  assert.equal(output.totalFocusOpen, 105);
  assert.equal(output.ageRanges.reduce((n,b) => n + b.count, 0), 105);
  assert.equal(output.focusItems.length, 1);
});
