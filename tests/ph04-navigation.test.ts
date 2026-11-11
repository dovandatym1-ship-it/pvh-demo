import test from "node:test";
import assert from "node:assert/strict";
import { canAccessRoute, filterNavigation, preferredLandingRoute } from "../src/config/navigation.ts";

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

test("post-login routing honors module permissions for every staff category", () => {
  assert.equal(preferredLandingRoute(["m01:work:read"]), "/dashboard");
  assert.equal(preferredLandingRoute(["m07:faith:read"]), "/dashboard");
  assert.equal(preferredLandingRoute(["m11:catalog:read"]), "/dashboard");
  assert.equal(preferredLandingRoute(["m00:membership:manage"]), "/quan-tri/tai-khoan");
  assert.equal(preferredLandingRoute(["m00:membership:read"]), "/thong-tin-ca-nhan");
  assert.equal(preferredLandingRoute(["fake:all"], ["SYSTEM_ADMIN"]), "/thong-tin-ca-nhan");
  assert.equal(preferredLandingRoute([]), "/thong-tin-ca-nhan");
});

test("production navigation never presents legacy mock workflows", () => {
  const all = filterNavigation([
    "m01:work:read", "m00:membership:read", "m10:integration:read",
  ]).flatMap(group => group.items.map(item => item.route));
  assert.ok(all.includes("/dashboard"));
  assert.ok(!all.includes("/quan-tri"));
  assert.ok(!all.includes("/tich-hop"));
  assert.equal(canAccessRoute("/quan-tri", ["m00:membership:read"]), false);
  assert.equal(canAccessRoute("/tich-hop", ["m10:integration:read"]), false);
});
