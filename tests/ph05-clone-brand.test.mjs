import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { normalizeDeploymentLabel } from "../src/config/deployment-brand.ts";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("commune branding uses configured Vietnamese labels and conservative defaults", () => {
  assert.equal(normalizeDeploymentLabel(" UBND xã A ", "Mặc định"), "UBND xã A");
  assert.equal(normalizeDeploymentLabel("UBND xã B", "Mặc định"), "UBND xã B");
  for (const invalid of [undefined, "", "A", "<script>x</script>", "x".repeat(101), "UBND" + String.fromCharCode(10) + "khác"]) {
    assert.equal(normalizeDeploymentLabel(invalid, "Mặc định"), "Mặc định");
  }
});

test("shared layout and login must not contain frozen Thái Nguyên / Định Hóa branding", () => {
  for (const file of [
    "src/app/(app)/layout.tsx",
    "src/app/(auth)/login/page.tsx",
    "src/components/layout/sidebar.tsx",
    "src/app/layout.tsx",
  ]) {
    const source = read(file);
    assert.doesNotMatch(source, /Định Hóa|Thái Nguyên/);
  }
});

test("explicit empty entitlement must never render full fallback navigation", () => {
  const source = read("src/components/layout/sidebar.tsx");
  assert.ok(/groups \?\? DEFAULT_GROUPS/.test(source) || /groups === undefined \? DEFAULT_GROUPS : groups/.test(source),
    "explicit empty group list must remain empty");
  assert.doesNotMatch(source, /groups\.length\s*>\s*0/);
});
