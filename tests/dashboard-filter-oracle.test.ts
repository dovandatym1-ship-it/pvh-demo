import assert from "node:assert/strict";
import test from "node:test";
import { getInitialGoldenSeed, TaskItem } from "../src/lib/store/demo-state";
import { MetricFilter } from "../src/lib/tenancy/demo-context";

// Pure logic matching filteredTasks in src/app/(legacy)/ban-lam-viec/page.tsx
function filterQueue(
  tasks: TaskItem[],
  recommendations: any[] = [],
  activeFilter: MetricFilter
): TaskItem[] {
  if (!activeFilter) {
    return tasks;
  }
  if (activeFilter === "MET-01") {
    return tasks.filter(
      (t) => t.status !== "Hoàn thành" && t.status !== "Đã hủy"
    );
  }
  if (activeFilter === "MET-02") {
    return tasks.filter(
      (t) => t.isOverdue && t.status !== "Hoàn thành" && t.status !== "Đã hủy"
    );
  }
  if (activeFilter === "MET-04") {
    return tasks.filter(
      (t) =>
        t.domain.includes("CĐS") ||
        t.entityTag === "CĐS" ||
        t.metric === "MET-04" ||
        t.code === "TASK-A-005"
    );
  }
  if (activeFilter === "MET-05") {
    // Return open inspection recommendations formatted as tasks
    return recommendations
      .filter((r) => r.status !== "RESOLVED_CLOSED")
      .map((r) => ({
        id: r.id,
        code: r.code,
        title: r.title,
        domain: "Kiểm tra cơ sở (M08)",
        entityTag: r.facilityName,
        assignee: r.assignee,
        dueDate: undefined,
        dueText: r.dueText,
        isOverdue: r.isOverdue,
        status:
          r.status === "WAITING_OVERDUE"
            ? ("Quá hạn" as const)
            : r.status === "FEEDBACK_UNVERIFIED"
            ? ("Chờ phản hồi" as const)
            : ("Hoàn thành" as const),
        statusBg:
          r.status === "WAITING_OVERDUE"
            ? "bg-rose-50"
            : r.status === "FEEDBACK_UNVERIFIED"
            ? "bg-amber-50"
            : "bg-emerald-50",
        statusColor:
          r.status === "WAITING_OVERDUE"
            ? "text-rose-700"
            : r.status === "FEEDBACK_UNVERIFIED"
            ? "text-amber-700"
            : "text-emerald-700",
        statusBorder:
          r.status === "WAITING_OVERDUE"
            ? "border-rose-200"
            : r.status === "FEEDBACK_UNVERIFIED"
            ? "border-amber-200"
            : "border-emerald-200",
        icon: "FileCheck2",
        metric: "MET-05" as const,
        tenantCode: r.tenantCode,
        targetUrl: "/kiem-tra",
      }));
  }
  return tasks;
}

test("Dashboard Filter: Unfiltered queue returns all items", () => {
  const seedA = getInitialGoldenSeed("XA_A");
  const queue = filterQueue(seedA.tasks, seedA.recommendations, null);
  assert.equal(queue.length, 6, "Total tasks for Xã A must be 6");
});

test("Dashboard Filter: MET-01 filters to exactly 3 open tasks", () => {
  const seedA = getInitialGoldenSeed("XA_A");
  const queue = filterQueue(seedA.tasks, seedA.recommendations, "MET-01");
  assert.equal(queue.length, 3, "MET-01 filtered queue must contain exactly 3 tasks");
  assert.deepEqual(
    queue.map((t) => t.id),
    ["T3", "T4", "T5"]
  );
});

test("Dashboard Filter: MET-02 filters to exactly 1 overdue open task", () => {
  const seedA = getInitialGoldenSeed("XA_A");
  const queue = filterQueue(seedA.tasks, seedA.recommendations, "MET-02");
  assert.equal(queue.length, 1, "MET-02 filtered queue must contain exactly 1 task");
  assert.equal(queue[0].id, "T3");
  assert.equal(queue[0].isOverdue, true);
});

test("Dashboard Filter: MET-04 filters to CĐS tasks", () => {
  const seedA = getInitialGoldenSeed("XA_A");
  const queue = filterQueue(seedA.tasks, seedA.recommendations, "MET-04");
  assert.ok(queue.length >= 1, "MET-04 filtered queue must contain at least 1 CĐS task");
  assert.ok(queue.some((t) => t.code === "TASK-A-005"));
});

test("Dashboard Filter: MET-05 maps open inspection recommendations into queue", () => {
  const seedA = getInitialGoldenSeed("XA_A");
  const queue = filterQueue(seedA.tasks, seedA.recommendations, "MET-05");
  assert.equal(queue.length, 2, "MET-05 filtered queue must contain exactly 2 recommendations");
  assert.equal(queue[0].id, "KN-01");
  assert.equal(queue[0].code, "INSP-2026-001");
  assert.equal(queue[0].status, "Quá hạn");
  assert.equal(queue[1].id, "KN-02");
  assert.equal(queue[1].code, "INSP-2026-002");
  assert.equal(queue[1].status, "Chờ phản hồi");
});
