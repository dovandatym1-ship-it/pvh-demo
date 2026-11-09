import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  campaignStatusLabel, dossierStatusLabel, ruleStatusLabel,
  planStatusLabel, indicatorStatusLabel, recommendationStatusLabel,
  vietnameseToday,
} from "../src/lib/presentation/ph03-labels.ts";

test("Every canonical PH03 status is rendered as understandable Vietnamese", () => {
  const groups = [
    [campaignStatusLabel, ["DRAFT", "OPEN", "CLOSED"]],
    [dossierStatusLabel, ["CHO_RA_SOAT", "THIEU_MINH_CHUNG", "YEU_CAU_BO_SUNG", "DAT", "KHONG_DAT"]],
    [ruleStatusLabel, ["ILLUSTRATIVE_ONLY", "UNVERIFIED", "VERIFIED"]],
    [planStatusLabel, ["DRAFT", "IN_REVIEW", "ACTIVE", "CLOSED"]],
    [indicatorStatusLabel, ["NOT_REPORTED", "UNVERIFIED", "CONFIRMED", "CONFIRMED_ZERO", "NOT_APPLICABLE"]],
    [recommendationStatusLabel, ["PENDING", "FEEDBACK_UNVERIFIED", "RESOLVED_CLOSED"]],
  ];
  for (const [label, codes] of groups) {
    for (const code of codes) {
      assert.notEqual(label(code), code);
      assert.notEqual(label(code), "Chưa xác định");
    }
    assert.equal(label("__UNKNOWN__"), "Chưa xác định");
  }
});

test("Vietnamese date is stable around UTC midnight", () => {
  assert.equal(vietnameseToday(new Date("2026-12-31T16:59:59Z")), "2026-12-31");
  assert.equal(vietnameseToday(new Date("2026-12-31T17:00:00Z")), "2027-01-01");
});

test("Independent indicator form does not borrow plan period or discard meaning", () => {
  const ui = readFileSync("src/features/m05-science-digital/components/ph03-digital-workspace.tsx", "utf8");
  const query = readFileSync("src/features/m05-science-digital/server/ph03-queries.ts", "utf8");
  assert.match(ui, /period:indicatorPeriod,meaning/);
  assert.match(ui, /setIndicatorPeriod/);
  assert.match(ui, /setIndicatorSource\(""\);setNaReason\(""\)/);
  assert.match(query, /na_reason,meaning,version/);
  assert.match(ui, /i.meaning\|\|"Chưa mô tả"/);
});
