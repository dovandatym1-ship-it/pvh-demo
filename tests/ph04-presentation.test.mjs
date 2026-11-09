import test from "node:test";
import assert from "node:assert/strict";
import { metricDelta, metricNameLabel, metricValueLabel, qualityStatusLabel, reportStatusLabel } from "../src/features/m09-reporting/types/presentation.ts";

test("Missing values and zero are not interchangeable", () => {
  assert.equal(metricValueLabel(0), "0");
  assert.equal(metricNameLabel("tasksTotal"), "Tổng công việc");
  assert.equal(metricValueLabel(null), "Chưa có số liệu");
  assert.equal(metricValueLabel(undefined), "Chưa có số liệu");
  assert.equal(metricDelta(5, 0), 5);
  assert.equal(metricDelta(5, null), null);
  assert.equal(metricDelta(null, 0), null);
  assert.equal(metricDelta(1, Number.NaN), null);
});

test("Report and quality statuses are displayed in Vietnamese", () => {
  for (const code of ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "FINALIZED"]) {
    assert.notEqual(reportStatusLabel(code), code);
  }
  for (const code of ["NOT_REPORTED", "NOT_APPLICABLE", "UNVERIFIED", "CONFIRMED", "CONFIRMED_ZERO"]) {
    assert.notEqual(qualityStatusLabel(code), code);
  }
});
