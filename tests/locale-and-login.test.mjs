import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Split-screen login is responsive, localized and deployment-branded", () => {
  const s = read("src/app/(auth)/login/page.tsx");
  assert.match(s, /lg:grid-cols-\[/);
  assert.match(s, /lg:min-h-\[/);
  assert.match(s, /deploymentBrand\.organizationName/);
  assert.match(s, /Địa chỉ email công vụ/);
  assert.match(s, /autoComplete="username"/);
  assert.match(s, /autoComplete="current-password"/);
  assert.match(s, /aria-label=\{showPassword/);
  assert.match(s, /type="submit" disabled=\{loading\}/);
  assert.match(s, /role="alert"/);
  assert.match(s, /NEXT_REDIRECT/);
  assert.doesNotMatch(s, /Định Hóa|Thái Nguyên|Phiên bản 1\.0\.0/);
});

test("Language standard does not rewrite permission or database enums", () => {
  const navigation = read("src/config/navigation.ts");
  assert.match(navigation, /requiredPermission/);
  assert.match(navigation, /hasExplicitPermission/);
  assert.match(navigation, /Điều hành và tác nghiệp/);
  assert.match(navigation, /Văn hóa, thông tin và giáo dục|Chuyên ngành văn hóa – xã hội/);
  const sidebar = read("src/components/layout/sidebar.tsx");
  assert.match(sidebar, /groups === undefined \? DEFAULT_GROUPS : groups/);
  assert.match(sidebar, /Quản trị hệ thống và cán bộ/);
});

test("Authenticated but unassigned users can open login instead of redirect-looping", () => {
  const middleware = read("src/lib/supabase/middleware.ts");
  const auth = read("src/lib/auth/actions.ts");
  const layout = read("src/app/(app)/layout.tsx");
  assert.match(middleware, /pathname === "\/login"/);
  assert.doesNotMatch(middleware, /if \(isAuthenticated && pathname\.startsWith\("\/login"\)\)/);
  assert.match(auth, /isMembershipCurrentlyActive\(membership\)/);
  assert.match(auth, /await supabase\.auth\.signOut\(\)/);
  assert.match(layout, /redirect\("\/login"\)/);
});

test("Recovery screens are public, but cannot change password from login session alone", () => {
  const middleware = read("src/lib/supabase/middleware.ts");
  const login = read("src/app/(auth)/login/page.tsx");
  const request = read("src/app/(auth)/quen-mat-khau/page.tsx");
  const resetPage = read("src/app/(auth)/dat-lai-mat-khau/page.tsx");
  const resetForm = read("src/features/auth/components/password-recovery-form.tsx");
  const actions = read("src/lib/auth/actions.ts");
  assert.match(middleware, /pathname === "\/quen-mat-khau"/);
  assert.match(middleware, /pathname === "\/dat-lai-mat-khau"/);
  assert.match(login, /href="\/quen-mat-khau"/);
  assert.match(request, /requestPasswordResetAction/);
  assert.match(resetPage, /<PasswordRecoveryForm code=\{token\}/);
  assert.match(resetForm, /completePasswordRecoveryAction/);
  assert.match(actions, /auth\.resetPasswordForEmail/);
  assert.match(actions, /auth\.exchangeCodeForSession\(parsed\.data\.code\)/);
  const recovery = actions.split("export async function completePasswordRecoveryAction")[1];
  assert.ok(recovery);
  assert.ok(recovery.indexOf("exchangeCodeForSession") < recovery.indexOf("auth.updateUser"));
  assert.match(recovery, /auth\.signOut\(\)/);
  assert.doesNotMatch(recovery, /getRequestContext\(/);
  assert.doesNotMatch(recovery, /createSupabaseAdminClient|service_role/);
  assert.match(actions, /url\.protocol !== "https:"/);
});
