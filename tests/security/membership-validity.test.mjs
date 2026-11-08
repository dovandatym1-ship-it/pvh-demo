import assert from "node:assert/strict";
import test from "node:test";
import { isMembershipCurrentlyActive } from "../../src/lib/auth/membership-validity.ts";

const NOW = Date.parse("2026-11-08T12:00:00Z");

test("active assignment must be inside the effective date interval", () => {
  const a = { is_active: true, valid_from: "2026-11-07T12:00:00Z", valid_to: "2026-11-09T12:00:00Z" };
  assert.equal(isMembershipCurrentlyActive(a, NOW), true);
  assert.equal(isMembershipCurrentlyActive({ ...a, is_active: false }, NOW), false);
  assert.equal(isMembershipCurrentlyActive({ ...a, valid_from: "2026-11-09T12:00:00Z" }, NOW), false);
  assert.equal(isMembershipCurrentlyActive({ ...a, valid_to: "2026-11-08T12:00:00Z" }, NOW), false);
});

test("malformed assignment windows fail closed", () => {
  assert.equal(isMembershipCurrentlyActive({ valid_from: "not-a-date" }, NOW), false);
  assert.equal(isMembershipCurrentlyActive({ valid_to: "not-a-date" }, NOW), false);
  assert.equal(isMembershipCurrentlyActive({}, Number.NaN), false);
});
