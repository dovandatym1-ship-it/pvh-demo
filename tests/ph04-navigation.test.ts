import test from "node:test";
import assert from "node:assert/strict";
import { canAccessRoute,filterNavigation } from "../src/config/navigation.ts";

test("PH04 navigation exposes reporting and imports only with explicit permissions",()=>{
  const withRights=filterNavigation(["m09:report:read","m10:indicator:import"]);
  const routes=withRights.flatMap(group=>group.items.map(item=>item.route));
  assert.ok(routes.includes("/bao-cao"));
  assert.ok(routes.includes("/nhap-chi-tieu"));
  const withoutImport=filterNavigation(["m09:report:read"]);
  assert.ok(!withoutImport.flatMap(g=>g.items).some(item=>item.route==="/nhap-chi-tieu"));
  assert.equal(canAccessRoute("/nhap-chi-tieu",["m09:report:read"]),false);
  assert.equal(canAccessRoute("/nhap-chi-tieu",["m10:indicator:import"]),true);
});
