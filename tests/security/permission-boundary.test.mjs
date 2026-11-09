import assert from "node:assert/strict";
import test from "node:test";
import { hasExplicitPermission } from "../../src/lib/authorization/permission-check.ts";

test("granted action requires the precise permission", () => {
  assert.equal(hasExplicitPermission(["m01:work:create"], "m01:work:create"), true);
  assert.equal(hasExplicitPermission(["m01:work:read"], "m01:work:create"), false);
});

test("admin, full, wildcard, and leader labels never imply a business permission", () => {
  for (const label of ["m00:admin", "all", "*", "m01:*", "m01:full", "LANH_DAO_XA", "SYSTEM_ADMIN"]) {
    assert.equal(hasExplicitPermission([label], "m06:social:read_pii"), false, label);
  }
});

test("an empty or malformed requested permission never passes", () => {
  assert.equal(hasExplicitPermission([""], ""), false);
  assert.equal(hasExplicitPermission([], "m00:admin"), false);
});
