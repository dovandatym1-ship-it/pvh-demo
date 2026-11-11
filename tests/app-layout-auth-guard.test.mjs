import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../src/app/(app)/layout.tsx", import.meta.url), "utf8");

test("protected app layout rejects missing/invalid request context before children render", () => {
  const ctx = source.indexOf("ctx = await getRequestContext()");
  const deny = source.indexOf('redirect("/login")');
  const render = source.indexOf("return <AppShell");
  assert.ok(ctx > -1 && deny > ctx && render > deny,
    "authentication must occur and fail closed before protected descendants are rendered");
  assert.match(source, /catch\s*\{\s*redirect\("\/login"\);\s*\}/);
  assert.doesNotMatch(source, /groups\s*=\s*filterNavigation\(\[\]\)/,
    "rendering an empty sidebar is not access control");
});

test("verified request context drives menu and optional header failures do not erase it", () => {
  assert.match(source, /filterNavigation\(ctx\.permissions, ctx\.roles\)/);
  const headerTry = source.indexOf("const db = await createServerSupabaseClient()");
  const render = source.indexOf("return <AppShell");
  assert.ok(headerTry > source.indexOf('redirect("/login")') && headerTry < render);
  assert.match(source, /notifications\s*=\s*inbox/);
});
