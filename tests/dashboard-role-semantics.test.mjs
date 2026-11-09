import assert from "node:assert/strict";
import test from "node:test";
import { buildDashboardModel } from "../src/features/dashboard/metrics.mjs";
import { buildRolePresentation } from "../src/features/dashboard/role-semantics.mjs";

const TODAY = "2026-11-09T08:00:00+07:00";
const P1 = { tenantId: "commune-a", userId: "leader", roles: ["LANH_DAO_XA"], scopes: {} };
const P2 = { tenantId: "commune-a", userId: "officer", roles: ["CONG_CHUC_VHXH"], scopes: { hamletIds: ["a1"] } };
const P4 = { tenantId: "commune-a", userId: "hamlet", roles: ["TRUONG_THON"], scopes: { hamletIds: ["a1"] } };
const record = (id, status, dueDate, assignedTo, hamletId, category = "VAN_HOA", tenantId = "commune-a") => ({
  id, title: "Việc " + id, tenantId, status, priority: "HIGH", category, assignedTo, hamletId,
  dueDate, createdAt: "2026-11-05T10:00:00+07:00", updatedAt: "2026-11-06T10:00:00+07:00",
});
const fixtures = [
  record("overdue", "IN_PROGRESS", "2026-11-01", "officer", "a1"),
  record("today", "ASSIGNED", "2026-11-09", "other", "a1", "CHUYEN_DOI_SO"),
  record("returned", "RETURNED", "2026-11-14", "officer", "a1", "GIAO_DUC"),
  record("review", "UNDER_REVIEW", "2026-11-18", "other", "a2"),
  record("unassigned", "NEW", null, null, "a1", "NOI_VU"),
  record("closed", "COMPLETED", "2026-10-01", "officer", "a1"),
  record("cancelled", "CANCELLED", "2026-10-01", null, "a2"),
  record("outside", "IN_PROGRESS", "2026-01-01", "officer", "a1", "VAN_HOA", "commune-b"),
];
const presentation = (ctx) => buildRolePresentation(buildDashboardModel({ ctx, items: fixtures, now: TODAY }));
const byId = (p) => Object.fromEntries(p.cards.map((card) => [card.id, card.value]));

test("P1 sees management KPIs, outstanding unassigned work and all-domain denominators", () => {
  const p = presentation(P1);
  assert.equal(p.title, "Tổng quan điều hành");
  assert.deepEqual(byId(p), { overdue: 1, unassigned: 1, review: 1, open: 5 });
  assert.equal(p.totalFocus, 7);
  assert.equal(p.totalFocusOpen, 5);
  assert.equal(p.statuses.reduce((sum, status) => sum + status.count, 0), 7);
  assert.equal(p.ageRanges.reduce((sum, bucket) => sum + bucket.count, 0), 5);
  assert.ok(p.priorityIds.includes("unassigned"));
  assert.ok(!p.priorityIds.includes("outside"));
});

test("P2 only derives personal KPIs/charts from directly assigned tasks", () => {
  const p = presentation(P2);
  assert.equal(p.title, "Công việc được giao");
  assert.deepEqual(byId(p), { overdue: 1, soon: 1, returned: 1, open: 2 });
  assert.equal(p.totalFocus, 3);
  assert.equal(p.totalFocusOpen, 2);
  assert.deepEqual(p.priorityIds, ["overdue", "returned"]);
  assert.equal(p.statuses.reduce((sum, status) => sum + status.count, 0), 3);
  assert.equal(p.ageRanges.reduce((sum, bucket) => sum + bucket.count, 0), 2);
  assert.ok(p.focusItems.every((item) => item.assignedTo === P2.userId));
  assert.ok(!p.focusItems.some((item) => item.id === "today"));
});

test("P4 dashboard is scoped to hamlet, not mistaken for P4-owned assignments", () => {
  const p = presentation(P4);
  assert.equal(p.title, "Theo dõi công việc địa bàn");
  assert.deepEqual(byId(p), { open: 4, overdue: 1, returned: 1, soon: 2 });
  assert.equal(p.totalFocus, 5);
  assert.equal(p.totalFocusOpen, 4);
  assert.equal(p.ageRanges.reduce((sum, bucket) => sum + bucket.count, 0), 4);
  assert.ok(p.focusItems.every((item) => item.hamletId === "a1"));
  assert.ok(!p.focusItems.some((item) => item.id === "review" || item.id === "outside"));
});

test("empty scope and empty dataset never invent meaningful KPIs", () => {
  const p = presentation({ ...P4, scopes: {} });
  assert.equal(p.totalFocus, 0);
  assert.ok(p.cards.every((card) => card.value === 0));
  assert.ok(p.ageRanges.every((bucket) => bucket.count === 0));
  assert.equal(p.priorityIds.length, 0);
});
