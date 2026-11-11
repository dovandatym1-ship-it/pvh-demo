import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";

const server = readFileSync(new URL("../../src/features/m00-platform/server/accounts.ts", import.meta.url), "utf8");
const ui = readFileSync(new URL("../../src/features/m00-platform/components/accounts-console.tsx", import.meta.url), "utf8");
const migrationDirectory = new URL("../../supabase/migrations/", import.meta.url);
const migrations = readdirSync(migrationDirectory)
  .filter((name) => name.endsWith(".sql"))
  .map((name) => readFileSync(new URL(name, migrationDirectory), "utf8"))
  .join("\n");

const serverRoleEnum = server.match(/const RoleCode\s*=\s*z\.enum\(\[(.*?)\]\)/s)?.[1] ?? "";
const serverRoles = [...serverRoleEnum.matchAll(/"([A-Z][A-Z0-9_]*)"/g)].map((match) => match[1]);
const uiRoles = [...ui.matchAll(/\bcode\s*:\s*"([A-Z][A-Z0-9_]*)"/g)].map((match) => match[1]);

test("account role choices match server validation and seeded database roles", () => {
  assert.ok(serverRoles.length > 0, "server role enum is present");
  assert.equal(new Set(serverRoles).size, serverRoles.length, "server roles are unique");
  assert.equal(new Set(uiRoles).size, uiRoles.length, "UI role options are unique");
  assert.deepEqual([...uiRoles].sort(), [...serverRoles].sort(), "UI and server role lists match");

  for (const role of serverRoles) {
    assert.match(migrations, new RegExp("\\(\\s*'" + role + "'\\s*,"), `${role} is seeded in a migration`);
  }
});
