import test from "node:test";
import assert from "node:assert/strict";
import {
  workStatusLabel, workPriorityLabel, workInboxLabel, workEventLabel,
  vietnameseLocalToIso,
} from "../src/features/m01-core-work/types/presentation.ts";

test("M01 UI renders every status and priority in Vietnamese", () => {
  for (const state of ["NEW", "ASSIGNED", "IN_PROGRESS", "UNDER_REVIEW", "RETURNED", "COMPLETED", "CANCELLED"]) {
    assert.notEqual(workStatusLabel(state), state);
    assert.notEqual(workStatusLabel(state), "Chưa xác định");
  }
  for (const priority of ["LOW", "MEDIUM", "HIGH", "URGENT"]) {
    assert.notEqual(workPriorityLabel(priority), priority);
  }
  assert.equal(workStatusLabel("__unknown__"), "Chưa xác định");
});

test("event and inbox labels express actions rather than raw codes", () => {
  assert.equal(workEventLabel(null, "NEW"), "Tạo công việc");
  assert.equal(workEventLabel("IN_PROGRESS", "IN_PROGRESS", { event: "DETAILS_UPDATED" }),
    "Điều chỉnh hạn xử lý hoặc địa bàn");
  assert.equal(workEventLabel("UNDER_REVIEW", "RETURNED"), "Chờ rà soát → Cần bổ sung");
  for (const kind of ["ASSIGNED", "REVIEW_REQUESTED", "RETURNED", "COMPLETED", "CANCELLED",
    "DETAILS_UPDATED", "COLLABORATOR_ADDED", "COLLABORATOR_REMOVED", "COLLABORATORS_UPDATED"]) {
    assert.notEqual(workInboxLabel(kind), kind);
  }
});

test("Vietnamese deadline input uses fixed UTC+07 independent of browser timezone", () => {
  assert.equal(vietnameseLocalToIso("2026-11-09T19:30"), "2026-11-09T12:30:00.000Z");
  assert.equal(vietnameseLocalToIso("2027-01-01T00:00"), "2026-12-31T17:00:00.000Z");
  assert.equal(vietnameseLocalToIso("2026-02-30T08:00"), null);
  assert.equal(vietnameseLocalToIso("2026-11-09T25:00"), null);
  assert.equal(vietnameseLocalToIso(""), null);
});
