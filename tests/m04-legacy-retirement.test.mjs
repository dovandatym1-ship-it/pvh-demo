import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
const read = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
test("retired M04 modal cannot call unverified legacy create or hardcoded legal score", () => {
 const text = read("src/features/m04-culture-family/components/propose-household-modal.tsx");
 assert.doesNotMatch(text, /createCultureSubmissionAction|Bộ tiêu chí Gia đình văn hóa cấp xã|80\/100/);
 assert.match(text, /\/van-hoa\/gia-dinh-van-hoa/);
});

test("Legacy mock screens are gated at the server and cannot appear in production navigation", () => {
 const server = read("src/app/(legacy)/layout.tsx");
 const client = read("src/app/(legacy)/legacy-shell.tsx");
 const nav = read("src/config/navigation.ts");
 assert.match(server, /isDemoAuthEnabled\(\)/);
 assert.match(server, /notFound\(\)/);
 assert.doesNotMatch(server, /"use client"/);
 assert.match(client, /"use client"/);
 assert.match(client, /BẢN MÔ PHỎNG/);
 assert.match(nav, /item\.status === "LEGACY_MOCK"/);
 assert.match(nav, /item\.status === "DEFERRED"/);
});
