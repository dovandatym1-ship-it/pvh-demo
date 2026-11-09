import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { reportSourceLabel, reportStatusLabel, qualityStatusLabel } from "../src/features/m09-reporting/types/presentation.ts";

const source = fs.readFileSync(new URL("../src/features/m09-reporting/server/export-service.ts", import.meta.url), "utf8");

test("M09 export writes Vietnamese report, source and quality status labels", () => {
  assert.equal(reportSourceLabel("DATABASE"), "Cơ sở dữ liệu hệ thống");
  assert.equal(reportSourceLabel("unverified"), "Chưa xác định nguồn");
  assert.equal(reportStatusLabel("FINALIZED"), "Đã chốt nội bộ");
  assert.equal(qualityStatusLabel("CONFIRMED_ZERO"), "Đã xác nhận số 0");
  assert.match(source, /reportStatusLabel\(snapshot\.status\)/);
  assert.match(source, /qualityStatusLabel\(String\(q\.status/);
  assert.match(source, /reportSourceLabel\(snapshot\.payload\.sourceType\)/);
  assert.match(source, /Mã kiểm chứng SHA-256/);
  assert.doesNotMatch(source, /\| Revision: /);
  assert.doesNotMatch(source, /\bkhông live\b/);
});
