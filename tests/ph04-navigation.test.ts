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

test("specialist dashboards are visible without inventing M01 work permission", () => {
  const routes = (permissions: string[]) =>
    filterNavigation(permissions).flatMap(group => group.items.map(item => item.route));
  const specialist = ["m07:faith:read"];
  assert.ok(routes(specialist).includes("/dashboard"));
  assert.ok(routes(specialist).includes("/dan-toc-ton-giao"));
  assert.ok(!routes(specialist).includes("/ban-lam-viec"));
  assert.ok(!routes(specialist).includes("/cong-viec"));
  assert.equal(canAccessRoute("/dashboard", specialist), true);
  assert.equal(canAccessRoute("/cong-viec", specialist), false);
  assert.equal(canAccessRoute("/dashboard", []), false);
  assert.equal(canAccessRoute("/quan-tri/tai-khoan", specialist), false);
});

test("unregistered paths are denied rather than silently authorized", () => {
  assert.equal(canAccessRoute("/unknown-system-screen", ["m01:work:read"]), false);
  assert.equal(canAccessRoute("/dashboard/unrecognized", ["m07:faith:read"]), true);
  assert.equal(canAccessRoute("/quan-tri/tai-khoan/another-user", ["m00:membership:read"]), false);
  assert.equal(canAccessRoute("/quan-tri/tai-khoan/another-user", ["m00:membership:manage"]), true);
});
