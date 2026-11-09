import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { allowedTransitions, STATE_TRANSITIONS, WORKFLOW_VERSION, isOverdue } from "../src/features/m01-core-work/types/workflow.ts";

test("M01 state machine has 11 deterministic rules in version 1", () => {
  assert.equal(WORKFLOW_VERSION, 1);
  assert.equal(STATE_TRANSITIONS.length, 11);
  assert.equal(new Set(STATE_TRANSITIONS.map(r => `${r.from}:${r.to}`)).size, 11);
  assert.equal(STATE_TRANSITIONS.some(r => r.from === "COMPLETED"), false);
  assert.equal(STATE_TRANSITIONS.some(r => r.from === "CANCELLED"), false);
});

test("UI workflow projection matches canonical SQL rule table", () => {
  const sql = readFileSync(new URL("../supabase/migrations/20261108060000_m01_core_workflow.sql", import.meta.url), "utf8");
  const rows = [...sql.matchAll(/\(1,'([^']+)','([^']+)','([^']+)','([^']+)',(true|false),(true|false)\)/g)]
    .map(m => ({ from: m[1], to: m[2], permission: m[3], scope: m[4],
      reason: m[5] === "true", evidence: m[6] === "true" }));
  assert.equal(rows.length, STATE_TRANSITIONS.length);
  for (const r of STATE_TRANSITIONS) {
    assert.ok(rows.some(s => s.from === r.from && s.to === r.to && s.permission === r.permission &&
      s.scope === r.scope && s.reason === Boolean(r.reason) && s.evidence === Boolean(r.evidence)));
  }
});

test("officer may start assigned work but cannot approve it", () => {
  const rules = allowedTransitions("ASSIGNED", ["m01:work:update"], true, false);
  assert.deepEqual(rules.map(r => r.to), ["IN_PROGRESS"]);
  assert.deepEqual(allowedTransitions("UNDER_REVIEW", ["m01:work:review"], true, false), []);
  assert.deepEqual(allowedTransitions("UNDER_REVIEW", ["m01:work:review"], false, true).map(r=>r.to),
    ["RETURNED", "COMPLETED"]);
});

test("cancellation and return require reasons; submitting requires evidence", () => {
  assert.equal(STATE_TRANSITIONS.find(r => r.from === "UNDER_REVIEW" && r.to === "RETURNED")?.reason, true);
  assert.equal(STATE_TRANSITIONS.find(r => r.from === "IN_PROGRESS" && r.to === "UNDER_REVIEW")?.evidence, true);
  assert.equal(STATE_TRANSITIONS.filter(r => r.to === "CANCELLED").every(r => r.reason), true);
});

test("overdue uses the clock and terminal status, never priority", () => {
  const now = new Date("2026-11-08T12:00:00.000Z");
  assert.equal(isOverdue("2026-11-08T11:59:59.999Z", "ASSIGNED", now), true);
  assert.equal(isOverdue("2026-11-08T12:00:00.000Z", "ASSIGNED", now), false);
  assert.equal(isOverdue("2026-11-08T12:00:00.001Z", "IN_PROGRESS", now), false);
  assert.equal(isOverdue("2026-11-01T00:00:00.000Z", "COMPLETED", now), false);
  assert.equal(isOverdue("2026-11-01T00:00:00.000Z", "CANCELLED", now), false);
  assert.equal(isOverdue(null, "NEW", now), false);
});
