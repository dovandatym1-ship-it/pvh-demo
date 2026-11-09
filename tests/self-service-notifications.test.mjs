import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { notificationLabel } from "../src/features/notifications/presentation.ts";

function read(path) { return readFileSync(new URL(`../${path}`, import.meta.url), "utf8"); }

test("User-facing notifications have stable Vietnamese messages", () => {
  for (const code of [
    "WORK_ASSIGNED", "WORK_RETURNED", "WORK_COMPLETED", "WORK_CANCELLED",
    "WORK_REVIEW", "WORK_DEADLINE_CHANGED",
  ]) {
    assert.match(notificationLabel(code), /[À-ỹ]/u);
  }
  assert.match(notificationLabel("UNKNOWN"), /cập nhật/);
});

test("Self-service writes are bound to the authenticated account, not a client userId", () => {
  const actions = read("src/features/self-service/server/actions.ts");
  assert.match(actions, /user\.id !== ctx\.userId/);
  assert.match(actions, /auth\.updateUser/);
  assert.doesNotMatch(actions, /update\(\{\s*(roles|permissions|tenant_id)/);
  assert.match(actions, /signInWithPassword/);
});

test("Notification reads are recipient-scoped and do not synthesize data on DB errors", () => {
  const source = read("src/features/notifications/server/queries.ts");
  assert.match(source, /eq\("recipient_id", current\.userId\)/);
  assert.match(source, /eq\("tenant_id", current\.tenantId\)/);
  assert.match(source, /status: "unavailable"/);
  const action = read("src/features/notifications/server/actions.ts");
  assert.match(action, /eq\("recipient_id", ctx\.userId\)/);
});

test("Migration does not grant notification INSERT/DELETE to authenticated users", () => {
  const migration = read("supabase/migrations/20261109130000_pvh_user_notifications.sql");
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /grant update\(read_at\)/i);
  assert.match(migration, /recipient_id = \(select auth\.uid\(\)\)/i);
  assert.doesNotMatch(migration, /grant (?:all|insert|delete) on public\.pvh_user_notifications to authenticated/i);
});

test("Main navigation remains the baseline; empty permission-filtered groups do not reopen defaults", () => {
  const side = read("src/components/layout/sidebar.tsx");
  assert.match(side, /groups === undefined \? DEFAULT_GROUPS : groups/);
  const shell = read("src/app/(app)/layout.tsx");
  assert.match(shell, /<NotificationBell/);
  assert.match(shell, /<AccountMenu/);
});
