import test from "node:test";
import assert from "node:assert/strict";
import { inspectionDeadlineState } from "../src/features/m08-inspections/deadline-state.ts";

test("M08 overdue is derived from due date and open status", () => {
  assert.equal(inspectionDeadlineState("PENDING", "2026-11-09", "2026-11-10"), "OVERDUE");
  assert.equal(inspectionDeadlineState("FEEDBACK_UNVERIFIED", "2026-11-10", "2026-11-10"), "DUE_TODAY");
  assert.equal(inspectionDeadlineState("PENDING", "2026-11-11", "2026-11-10"), "UPCOMING");
  assert.equal(inspectionDeadlineState("RESOLVED_CLOSED", "2026-11-01", "2026-11-10"), "CLOSED");
});

test("M08 missing or malformed dates never create a false overdue state", () => {
  assert.equal(inspectionDeadlineState("PENDING", null, "2026-11-10"), "UNKNOWN");
  assert.equal(inspectionDeadlineState("PENDING", "2026-02-30", "2026-11-10"), "UNKNOWN");
  assert.equal(inspectionDeadlineState("UNKNOWN_STATUS", "2026-11-01", "2026-11-10"), "UNKNOWN");
  assert.equal(inspectionDeadlineState("PENDING", "2026-11-11", "invalid"), "UNKNOWN");
});
