import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
const read = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
test("M04 exposes no legacy scoring path and keeps old actions fail-closed", () => {
 const retiredPaths = [
  "src/features/m04-culture-family/components/propose-household-modal.tsx",
  "src/features/m04-culture-family/schemas/index.ts",
  "src/features/m04-culture-family/server/policy.ts",
  "src/features/m04-culture-family/server/queries.ts",
  "src/features/m04-culture-family/server/repository.ts",
  "src/features/m04-culture-family/server/service.ts",
  "src/features/m04-culture-family/server/workflow.ts",
 ];
 for (const path of retiredPaths) assert.equal(fs.existsSync(new URL("../" + path, import.meta.url)), false, path);
 const actions = read("src/features/m04-culture-family/server/actions.ts");
 assert.match(actions, /return fail<never>\(/);
 assert.doesNotMatch(actions, /return ok\(/);
});

test("Legacy mock screens are gated at the server and cannot appear in production navigation", () => {
 const server = read("src/app/(legacy)/layout.tsx");
 const client = read("src/app/(legacy)/legacy-shell.tsx");
 const nav = read("src/config/navigation.ts");
 assert.match(server, /isDemoAuthEnabled\(\)/);
 assert.match(server, /notFound\(\)/);
 assert.doesNotMatch(server, /"use client"/);
 assert.match(client, /"use client"/);
 assert.match(client, /BẢN MÔ PHỎNG/);
 assert.match(nav, /item\.status === "LEGACY_MOCK"/);
 assert.match(nav, /item\.status === "DEFERRED"/);
});
