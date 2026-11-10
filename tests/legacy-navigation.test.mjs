import test from "node:test";
import assert from "node:assert/strict";
import { filterLegacyNavigation } from "../src/components/layout/legacy-navigation.ts";

const groups = [
  { title: "A", items: [{ route: "/cong-viec" }, { route: "/noi-vu" }] },
  { title: "B", items: [{ route: "/dan-toc-ton-giao" }] },
];

test("legacy demo navigation exposes only exact module permissions", () => {
  assert.deepEqual(filterLegacyNavigation(groups, ["m02:full"]), [
    { title: "A", items: [{ route: "/noi-vu" }] },
  ]);
  assert.deepEqual(filterLegacyNavigation(groups, ["m00:admin"]), []);
  assert.deepEqual(filterLegacyNavigation(groups, ["m01:view", "m07:view"]), [
    { title: "A", items: [{ route: "/cong-viec" }] },
    { title: "B", items: [{ route: "/dan-toc-ton-giao" }] },
  ]);
});

test("empty permissions and wildcard-like labels do not reopen the legacy menu", () => {
  for (const permissions of [[], ["all"], ["*"], ["m00:admin"]]) {
    assert.deepEqual(filterLegacyNavigation(groups, permissions), []);
  }
});
