import assert from "node:assert/strict";
import test from "node:test";
import { isDemoAuthEnabled, isValidDemoPersona } from "../../src/lib/auth/demo-mode.ts";

test("production cannot authenticate through demo cookies, even if flags are set", () => {
  const before = { ...process.env };
  try {
    process.env.NODE_ENV = "production";
    process.env.NEXT_PUBLIC_DEMO_MODE = "true";
    process.env.PVH_ALLOW_DEMO_AUTH = "true";
    assert.equal(isDemoAuthEnabled(), false);

    process.env.NODE_ENV = "development";
    delete process.env.PVH_ALLOW_DEMO_AUTH;
    assert.equal(isDemoAuthEnabled(), false);

    process.env.PVH_ALLOW_DEMO_AUTH = "true";
    assert.equal(isDemoAuthEnabled(), true);
  } finally {
    process.env.NODE_ENV = before.NODE_ENV;
    if (before.NEXT_PUBLIC_DEMO_MODE === undefined) delete process.env.NEXT_PUBLIC_DEMO_MODE;
    else process.env.NEXT_PUBLIC_DEMO_MODE = before.NEXT_PUBLIC_DEMO_MODE;
    if (before.PVH_ALLOW_DEMO_AUTH === undefined) delete process.env.PVH_ALLOW_DEMO_AUTH;
    else process.env.PVH_ALLOW_DEMO_AUTH = before.PVH_ALLOW_DEMO_AUTH;
  }
});

test("unrecognized persona never falls back to P1", () => {
  assert.equal(isValidDemoPersona("P1"), true);
  assert.equal(isValidDemoPersona("P6"), true);
  for (const value of [undefined, "ADMIN", "P7", "P2;P1", "", "p1"]) {
    assert.equal(isValidDemoPersona(value), false);
  }
});
