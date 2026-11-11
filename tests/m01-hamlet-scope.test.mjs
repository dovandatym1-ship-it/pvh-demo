import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { isHamletWithinScope } from "../src/features/m01-core-work/types/hamlet-scope.ts";

test("M01 hamlet scope respects undefined, explicit empty and assigned IDs", () => {
  assert.equal(isHamletWithinScope("h1", undefined), true);
  assert.equal(isHamletWithinScope("h1", []), false);
  assert.equal(isHamletWithinScope("h1", ["h1", "h2"]), true);
  assert.equal(isHamletWithinScope("h3", ["h1", "h2"]), false);
});

test("M01 hamlet options and filtered list read the current RequestContext scope contract", () => {
  const file = fs.readFileSync(new URL("../src/features/m01-core-work/server/queries.ts", import.meta.url), "utf8");
  assert.match(file, /const allowedHamlets = ctx\.scopes\.hamletIds/);
  assert.match(file, /if \(allowedHamlets && allowedHamlets\.length === 0\) return \[\]/);
  assert.match(file, /query\.in\("id", \[\.\.\.new Set\(allowedHamlets\)\]\)/);
  assert.match(file, /isHamletWithinScope\(opts\.hamletId, ctx\.scopes\.hamletIds\)/);
  assert.doesNotMatch(file, /\.org_unit_ids/);
});
