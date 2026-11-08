import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDashboardModel, deadlineState, roleKind, scopeWorkItems, vietnamDay,
} from "../src/features/dashboard/metrics.mjs";

const TODAY = "2026-11-08T10:30:00+07:00";
const P1 = { tenantId: "xa-a", userId: "p1", roles: ["LANH_DAO_XA"], scopes: {} };
const P2 = { tenantId: "xa-a", userId: "p2", roles: ["CONG_CHUC_VHXH"], scopes: { hamletIds: ["a1"] } };
const P4 = { tenantId: "xa-a", userId: "p4", roles: ["TRUONG_THON"], scopes: { hamletIds: ["a1"] } };

const fixture = [
  { id: "a", tenantId: "xa-a", title: "Quá hạn A1", status: "IN_PROGRESS", priority: "HIGH", category: "VAN_HOA", assignedTo: "p2", hamletId: "a1", dueDate: "2026-11-01", createdAt: "2026-11-02T08:00:00+07:00", updatedAt: "2026-11-05T08:00:00+07:00" },
  { id: "b", tenantId: "xa-a", title: "Chờ duyệt A2", status: "UNDER_REVIEW", priority: "HIGH", category: "LAO_DONG_XH", assignedTo: "p3", hamletId: "a2", dueDate: "2026-11-30", createdAt: "2026-11-03T08:00:00+07:00", updatedAt: "2026-11-07T08:00:00+07:00" },
  { id: "c", tenantId: "xa-a", title: "Đến hạn", status: "ASSIGNED", priority: "MEDIUM", category: "CHUYEN_DOI_SO", assignedTo: "p3", hamletId: "a1", dueDate: "2026-11-08", createdAt: "2026-11-06T08:00:00+07:00", updatedAt: "2026-11-07T08:00:00+07:00" },
  { id: "d", tenantId: "xa-a", title: "Hạn đúng 7 ngày", status: "RETURNED", priority: "LOW", category: "GIAO_DUC", assignedTo: "p2", hamletId: "a1", dueDate: "2026-11-15", createdAt: "2026-11-01T08:00:00+07:00", updatedAt: "2026-11-06T08:00:00+07:00" },
  { id: "e", tenantId: "xa-a", title: "Đã xong hạn cũ", status: "COMPLETED", priority: "URGENT", category: "VAN_HOA", assignedTo: "p2", hamletId: "a1", dueDate: "2026-10-01", createdAt: "2026-10-30T08:00:00+07:00", updatedAt: "2026-11-07T08:00:00+07:00" },
  { id: "f", tenantId: "xa-a", title: "Đã hủy", status: "CANCELLED", priority: "LOW", category: "CHUNG", assignedTo: null, hamletId: "a2", dueDate: "2026-10-31", createdAt: "2026-10-29T08:00:00+07:00", updatedAt: "2026-11-01T08:00:00+07:00" },
  { id: "g", tenantId: "xa-a", title: "Việc toàn xã được giao P2", status: "NEW", priority: "LOW", category: "CHUNG", assignedTo: "p2", hamletId: null, dueDate: null, createdAt: "2026-11-08T08:00:00+07:00", updatedAt: "2026-11-08T08:00:00+07:00" },
  { id: "secret", tenantId: "xa-b", title: "Không được lộ", status: "IN_PROGRESS", priority: "URGENT", category: "VAN_HOA", assignedTo: "p2", hamletId: "a1", dueDate: "2026-01-01", createdAt: "2026-11-01T08:00:00+07:00", updatedAt: "2026-11-01T08:00:00+07:00" },
];

test("Timezone Vietnam day boundary is deterministic", () => {
  assert.equal(vietnamDay("2026-11-07T18:00:00Z"), "2026-11-08");
  assert.equal(vietnamDay("2026-11-07T16:59:59Z"), "2026-11-07");
  assert.equal(deadlineState({ status: "IN_PROGRESS", dueDate: "2026-11-08" }, "2026-11-08").kind, "soon");
  assert.equal(deadlineState({ status: "IN_PROGRESS", dueDate: "2026-11-15" }, "2026-11-08").days, 7);
  assert.equal(deadlineState({ status: "IN_PROGRESS", dueDate: "2026-11-16" }, "2026-11-08").kind, "later");
  assert.equal(deadlineState({ status: "COMPLETED", dueDate: "2026-11-01" }, "2026-11-08").kind, "closed");
  assert.equal(deadlineState({ status: "CANCELLED", dueDate: "2026-11-01" }, "2026-11-08").kind, "closed");
  assert.equal(deadlineState({ status: "ASSIGNED", dueDate: "invalid" }, "2026-11-08").kind, "unset");
});

test("Tenant and role scopes are enforced before aggregation", () => {
  assert.equal(roleKind(P1), "leader");
  assert.equal(roleKind(P4), "hamlet");
  assert.equal(scopeWorkItems(fixture, P1).length, 7);
  assert.deepEqual(scopeWorkItems(fixture, P4).map((i) => i.id), ["a", "c", "d", "e"]);
  assert.deepEqual(scopeWorkItems(fixture, P2).map((i) => i.id), ["a", "c", "d", "e", "g"]);
  assert.equal(scopeWorkItems(fixture, { ...P4, scopes: {} }).length, 0);
  assert.ok(!scopeWorkItems(fixture, P1).some((i) => i.id === "secret"));
});

test("KPI are derived from a single visible dataset and include all statuses", () => {
  const model = buildDashboardModel({ items: fixture, ctx: P1, now: TODAY });
  assert.equal(model.total, 7);
  assert.equal(model.open, 5);
  assert.equal(model.overdue, 1);
  assert.equal(model.dueSoon, 2);
  assert.equal(model.review, 1);
  assert.equal(model.queueCount, 4);
  assert.deepEqual(model.queueIds, ["a", "d", "b", "c"]);
  assert.equal(model.statuses.reduce((n, status) => n + status.count, 0), model.total);
  assert.equal(model.focus.value, model.open);
  assert.equal(model.eventsAvailable, false);
});

test("Role-focused KPI and filters cannot see another hamlet", () => {
  const officer = buildDashboardModel({ items: fixture, ctx: P2, now: TODAY });
  assert.equal(officer.focus.label, "Việc của tôi chưa đóng");
  assert.equal(officer.focus.value, 3);
  assert.equal(officer.review, 0);
  const hamlet = buildDashboardModel({ items: fixture, ctx: P4, now: TODAY });
  assert.equal(hamlet.total, 4);
  assert.equal(hamlet.focus.value, 3);
  assert.equal(hamlet.review, 0);
  assert.ok(!hamlet.items.some((i) => i.id === "b" || i.id === "secret"));
});

test("Weekly completions use event history only for scoped work items", () => {
  const events = [
    { workItemId: "e", toStatus: "COMPLETED", createdAt: "2026-11-07T10:00:00+07:00" },
    { workItemId: "b", toStatus: "COMPLETED", createdAt: "2026-11-07T10:00:00+07:00" },
    { workItemId: "secret", toStatus: "COMPLETED", createdAt: "2026-11-07T10:00:00+07:00" },
  ];
  const model = buildDashboardModel({ items: fixture, ctx: P4, now: TODAY, completionEvents: events, eventsAvailable: true });
  assert.equal(model.weekly.at(-1).completed, 1);
  assert.equal(model.weekly.at(-1).created, 2);
  assert.equal(model.eventsAvailable, true);
  const limited = buildDashboardModel({ items: fixture, ctx: P4, now: TODAY, completionEvents: events, eventsAvailable: true, eventsTruncated: true });
  assert.equal(limited.eventsAvailable, false);
});
