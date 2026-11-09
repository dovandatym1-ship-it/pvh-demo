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
