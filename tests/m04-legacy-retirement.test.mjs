import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
const read = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
test("retired M04 modal cannot call unverified legacy create or hardcoded legal score", () => {
 const text = read("src/features/m04-culture-family/components/propose-household-modal.tsx");
 assert.doesNotMatch(text, /createCultureSubmissionAction|Bộ tiêu chí Gia đình văn hóa cấp xã|80\/100/);
 assert.match(text, /\/van-hoa\/gia-dinh-van-hoa/);
});
