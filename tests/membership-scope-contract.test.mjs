import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { normalizeMembershipScopes } from "../src/lib/auth/normalize-scopes.ts";

test("SQL org_unit_ids maps to the RequestContext hamletIds contract", () => {
  assert.deepEqual(normalizeMembershipScopes({ org_unit_ids: ["h1", "h2", "h1"] }).hamletIds, ["h1", "h2"]);
  assert.deepEqual(normalizeMembershipScopes({}).hamletIds, undefined);
  assert.deepEqual(normalizeMembershipScopes({ org_unit_ids: [] }).hamletIds, []);
  assert.deepEqual(normalizeMembershipScopes({ org_unit_ids: null }).hamletIds, []);
  assert.deepEqual(normalizeMembershipScopes(null).hamletIds, []);
});

test("dual scope keys cannot widen SQL RLS, and sectors remain mapped", () => {
  const scopes = normalizeMembershipScopes({org_unit_ids:["a","b"],hamletIds:["b","c"],sector_ids:["van-hoa"]});
  assert.deepEqual(scopes, {hamletIds:["b"],sectorIds:["van-hoa"]});
  assert.deepEqual(normalizeMembershipScopes({hamletIds:["h1"]}), {hamletIds:["h1"]});
  assert.deepEqual(normalizeMembershipScopes({org_unit_ids:["h1",42]}).hamletIds, []);
});

test("real request context uses normalization for Auth memberships", () => {
  const content = fs.readFileSync(new URL("../src/lib/auth/request-context.ts", import.meta.url), "utf8");
  assert.match(content, /scopes: normalizeMembershipScopes\(activeMembership\.scopes\)/);
  assert.doesNotMatch(content, /scopes: \(activeMembership\.scopes as RequestContext/);
});
