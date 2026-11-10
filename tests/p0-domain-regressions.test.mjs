import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { nccCategoryLabel } from "../src/features/m02-internal-affairs/types/presentation.ts";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const exists = (path) => existsSync(new URL("../" + path, import.meta.url));

test("M02 maps each person-with-merit category and fails closed on unknown values", () => {
  assert.equal(nccCategoryLabel("BA_ME_VNAH"), "Bà mẹ Việt Nam anh hùng");
  assert.equal(nccCategoryLabel("LIET_SI"), "Liệt sĩ");
  assert.equal(nccCategoryLabel("CHAT_DOC_HOA_HOC"), "Người hoạt động kháng chiến bị nhiễm chất độc hóa học");
  assert.equal(nccCategoryLabel("UNKNOWN"), "Chưa xác định diện chính sách");
});

test("M01 detail affordance targets the selected work item ID", () => {
  const table = read("src/features/m01-core-work/components/work-item-table.tsx");
  assert.match(table, /\/cong-viec\/\$\{encodeURIComponent\(item\.id\)\}/);
  assert.doesNotMatch(table, /<Link href="\/cong-viec">/);
});

test("M04 mock recognition and default-score components are retired", () => {
  for (const path of [
    "src/features/m04-culture-family/components/hamlet-culture-table.tsx",
    "src/features/m04-culture-family/components/evaluation-modal.tsx",
    "src/features/m04-culture-family/components/culture-dossier-manager.tsx",
  ]) assert.equal(exists(path), false, path);
  assert.doesNotMatch(read("src/features/m04-culture-family/server/queries.ts"), /getHamletCultureSummary|CÔNG NHẬN/);
});

test("M05 fabricated fallback is retired and active workspace preserves numeric zero", () => {
  assert.equal(exists("src/features/m05-science-digital/server/queries.ts"), false);
  assert.equal(exists("src/features/m05-science-digital/components/dti-indicator-table.tsx"), false);
  assert.match(read("src/features/m05-science-digital/server/ph03-queries.ts"), /numericValue:i\.numeric_value===null\?null:Number\(i\.numeric_value\)/);
  assert.match(read("src/features/m05-science-digital/components/ph03-digital-workspace.tsx"), /i\.numericValue===null\?"Chưa có số liệu"/);
});

test("M08 demo fallback path is retired and active workspace uses date-derived deadline state", () => {
  assert.equal(exists("src/features/m08-inspections/server/queries.ts"), false);
  assert.equal(exists("src/features/m08-inspections/components/inspection-table.tsx"), false);
  assert.match(read("src/features/m08-inspections/components/ph03-inspection-workspace.tsx"), /inspectionDeadlineState\(r\.status,r\.dueDate,today\)/);
});
