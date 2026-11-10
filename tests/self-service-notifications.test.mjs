import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { notificationLabel } from "../src/features/notifications/presentation.ts";
import { normalizeNotificationFilters, notificationPageUrl } from "../src/features/notifications/filters.ts";
import { PersonalContactSchema, PasswordChangeSchema } from "../src/features/self-service/schemas.ts";
import { avatarObjectPath, validateNormalizedJpeg } from "../src/features/self-service/avatar-contract.ts";

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
  assert.match(shell, /<AppShell/);
  const appShell = read("src/components/layout/app-shell.tsx");
  assert.match(appShell, /<TopbarActions/);
  assert.match(appShell, /mobileNavOpen/);
  assert.match(shell, /avatarVersion=/);
  assert.match(appShell, /menuButton\.current\?\.focus/);
});

test("Shared contact validation rejects invalid fields in both client and server contract", () => {
  assert.equal(PersonalContactSchema.safeParse({ displayName: "  Mai  ", contactPhone: "0912 345 678" }).success, true);
  assert.equal(PersonalContactSchema.safeParse({ displayName: "<script>", contactPhone: "" }).success, false);
  assert.equal(PersonalContactSchema.safeParse({ displayName: "Mai", contactPhone: "abc-23" }).success, false);
  assert.equal(PersonalContactSchema.safeParse({ displayName: "Mai", contactPhone: "" , roles: ["SYSTEM_ADMIN"] }).success, false);
  assert.equal(PasswordChangeSchema.safeParse({
    currentPassword: "old-secret!", newPassword: "longnewpassword12", confirmPassword: "longnewpassword12",
  }).success, true);
  assert.equal(PasswordChangeSchema.safeParse({
    currentPassword: "old-secret!", newPassword: "longnewpassword12", confirmPassword: "not-same",
  }).success, false);
});

test("Notification filters have allowlist and preserve state over page links", () => {
  assert.deepEqual(normalizeNotificationFilters({ status: "unread", group: "deadline", period: "7d" }),
    { status: "unread", group: "deadline", period: "7d" });
  assert.deepEqual(normalizeNotificationFilters({ status: "forbidden", group: "hack", period: "year" }),
    { status: "all", group: "all", period: "all" });
  assert.equal(notificationPageUrl({ status: "unread", group: "deadline", period: "7d" }, 2),
    "/thong-bao?status=unread&group=deadline&period=7d&page=2");
  const query = read("src/features/notifications/server/queries.ts");
  assert.match(query, /query\.in\("event_code"/);
  assert.match(query, /query\.is\("read_at", null\)/);
  assert.match(query, /query\.gte\("created_at"/);
});

test("Private avatars require normalized JPEG and authenticated owner storage path", () => {
  assert.equal(avatarObjectPath("00000000-0000-0000-0000-000000000001"),
    "00000000-0000-0000-0000-000000000001/avatar.jpg");
  assert.throws(() => avatarObjectPath("other-user/../../avatar"));
  const fakeJpegHeader = Uint8Array.from([
    255,216,255,192,0,17,8,1,64,1,64,
    1,1,17,0,2,17,1,3,17,1,
    255,218,0,8,1,1,0,0,63,0,
    12,25,33,44,55,66,77,88,99,111,255,217,
  ]);
  assert.equal(validateNormalizedJpeg(fakeJpegHeader), null);
  const oversized = Uint8Array.from(fakeJpegHeader);
  oversized[9] = 4; oversized[10] = 1;
  assert.match(validateNormalizedJpeg(oversized), /1024/);
  const sql = read("supabase/migrations/20261109130000_pvh_user_notifications.sql");
  assert.match(sql, /'pvh-avatars'/);
  assert.match(sql, /storage\.objects for (?:select|insert) to authenticated/);
  assert.match(sql, /name=\(select auth\.uid\(\)\)::text \|\| '\/avatar\.jpg'/);
  assert.doesNotMatch(sql, /public\s*=\s*true/);
});

test("Mobile popovers dismiss on outside click, Escape, route changes and preserve focus", () => {
  const component = read("src/features/notifications/components/topbar-actions.tsx");
  assert.match(component, /document\.addEventListener\("pointerdown"/);
  assert.match(component, /document\.addEventListener\("keydown"/);
  assert.match(component, /event\.key !== "Escape"/);
  assert.match(component, /useEffect\(\(\) => setOpen\(null\), \[pathname\]\)/);
  assert.match(component, /original\.current\?\.focus/);
  assert.match(component, /sm:absolute/);
});

test("Bulk notification read remains restricted to authenticated own recipient and tenant", () => {
  const action = read("src/features/notifications/server/actions.ts").split("export async function markAllOwnNotificationsReadAction")[1];
  assert.ok(action, "bulk action is implemented");
  assert.match(action, /user\.id !== ctx\.userId/);
  assert.match(action, /eq\("tenant_id", ctx\.tenantId\)/);
  assert.match(action, /eq\("recipient_id", ctx\.userId\)/);
  assert.match(action, /is\("read_at", null\)/);
  assert.match(action, /if \(error\) return fail/);
  assert.doesNotMatch(action, /createSupabaseAdminClient|service_role/);

  const ui = read("src/features/notifications/components/notification-list.tsx");
  assert.match(ui, /markAllOwnNotificationsReadAction\(\)/);
  assert.match(ui, /Đánh dấu tất cả đã đọc/);
  assert.match(ui, /role=\{bulkFeedback\.ok \? "status" : "alert"\}/);
  assert.match(ui, /if \(result\.ok\) router\.refresh\(\)/);
});

test("Dashboard connects source-attributed domain counts without granting M01 role access", () => {
  const page = read("src/app/(app)/dashboard/page.tsx");
  const server = read("src/features/dashboard/server/get-domain-count-metrics.ts");
  assert.match(page, /getDomainCountMetrics\(ctx\)/);
  assert.match(page, /<DomainCountPanel metrics=\{domainMetrics\}/);
  assert.match(page, /hasWorkAccess \? await getM01DashboardSnapshot\(ctx\) : null/);
  assert.match(server, /ctx\.permissions\.includes\(item\.permission\)/);
  assert.match(server, /count:"exact",head:true/);
  assert.match(server, /eq\("tenant_id",ctx\.tenantId\)/);
  assert.match(server, /status:"unavailable"/);
  assert.doesNotMatch(server, /\bservice_role\b/);
});
