"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ForbiddenError } from "@/lib/errors/app-error";
import { isDemoAuthEnabled, isValidDemoPersona } from "@/lib/auth/demo-mode";
import { isMembershipCurrentlyActive } from "@/lib/auth/membership-validity";
import { PasswordRecoverySchema } from "@/features/self-service/schemas";
import { preferredLandingRoute } from "@/config/navigation";
import { z } from "zod";

export interface LoginActionResult {
  success?: boolean;
  error?: string;
}

/**
 * Server Action: Đăng nhập bằng tài khoản và mật khẩu thật qua Supabase Auth.
 * Auth failures are audited by Supabase Auth. Do not forge an actor ID to insert
 * into public.audit_log: that table requires a real auth.users foreign key.
 */
export async function loginWithCredentialsAction(formData: FormData): Promise<LoginActionResult> {
  const email = formData.get("email")?.toString()?.trim() || "";
  const password = formData.get("password")?.toString() || "";

  if (!email || !password) {
    return { error: "Vui lòng nhập đầy đủ email và mật khẩu." };
  }

  const supabase = await createServerSupabaseClient();

  // 1. Xác thực danh tính người dùng qua Supabase Auth
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { error: "Email hoặc mật khẩu không chính xác. Vui lòng thử lại." };
  }

  const user = data.user;

  // 2. Truy vấn hồ sơ và phân công công tác trong database
  const { data: membership, error: memberError } = await supabase
    .from("memberships")
    .select("id, tenant_id, roles, permissions, is_active, valid_from, valid_to")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (memberError || !membership || !isMembershipCurrentlyActive(membership)) {
    // A valid Auth identity is not sufficient without an active commune assignment.
    await supabase.auth.signOut();
    return { error: "Tài khoản chưa được phân công hợp lệ tại đơn vị. Liên hệ quản trị viên." };
  }

  redirect(preferredLandingRoute(
    Array.isArray(membership.permissions) ? membership.permissions : [],
    Array.isArray(membership.roles) ? membership.roles : [],
  ));
}

/**
 * Server Action: Đăng nhập vai trò kiểm thử thử nghiệm (Persona Demo Session).
 * Restricted to explicitly opted-in local development. Never trusted on staging.
 */
export async function loginDemoAction(personaCode: string) {
  if (!isDemoAuthEnabled() || !isValidDemoPersona(personaCode)) {
    throw new ForbiddenError("Chức năng phiên kiểm thử không khả dụng (FORBIDDEN)");
  }
  const cookieStore = await cookies();
  cookieStore.set("pvh_demo_session", personaCode, {
    path: "/", httpOnly: true, sameSite: "lax", secure: false, maxAge: 60 * 60,
  });

  redirect("/ban-lam-viec");
}

/**
 * Server Action: Đăng xuất phiên làm việc.
 * End both the local demo cookie (if any) and the actual Auth session.
 */
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("pvh_demo_session");
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}

const RecoveryEmailSchema = z.string().trim().email().max(254);

/** Only an approved public application origin may receive Supabase recovery codes. */
function passwordRecoveryRedirectUrl(): string | null {
  try {
    const configured = process.env.NEXT_PUBLIC_APP_URL;
    if (!configured) return null;
    const url = new URL(configured);
    const local = process.env.NODE_ENV !== "production"
      && url.protocol === "http:"
      && (url.hostname === "localhost" || url.hostname === "127.0.0.1");
    if (!local && url.protocol !== "https:") return null;
    if (url.username || url.password || url.search || url.hash || url.pathname !== "/") return null;
    return new URL("/dat-lai-mat-khau", url).toString();
  } catch {
    return null;
  }
}

/**
 * Send an account recovery email without disclosing whether an address exists.
 * The user's browser stores the PKCE verifier; the email delivers a short-lived
 * code which is verified only at completePasswordRecoveryAction.
 */
export async function requestPasswordResetAction(formData: FormData): Promise<LoginActionResult> {
  const parsed = RecoveryEmailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: "Địa chỉ email công vụ chưa hợp lệ." };
  const redirectTo = passwordRecoveryRedirectUrl();
  if (!redirectTo) return { error: "Chưa cấu hình địa chỉ ứng dụng an toàn để khôi phục mật khẩu." };
  try {
    const db = await createServerSupabaseClient();
    // Do not branch on the Auth response: user existence and mail throttling
    // must never be distinguishable in the public UI.
    await db.auth.resetPasswordForEmail(parsed.data, { redirectTo });
    return { success: true };
  } catch {
    return { error: "Dịch vụ xác thực hiện không khả dụng. Vui lòng thử lại sau." };
  }
}

/**
 * Atomically consume the user's one-time PKCE recovery code BEFORE calling
 * updateUser. A pre-existing login session is never accepted as proof of
 * password recovery; no arbitrary client user ID or service-role key is used.
 */
export async function completePasswordRecoveryAction(input: unknown): Promise<LoginActionResult> {
  const parsed = PasswordRecoverySchema.safeParse(input);
  if (!parsed.success) return { error: "Liên kết hoặc mật khẩu chưa hợp lệ (tối thiểu 12 ký tự)." };
  try {
    const db = await createServerSupabaseClient();
    const { data: verified, error: exchangeError } =
      await db.auth.exchangeCodeForSession(parsed.data.code);
    if (exchangeError || !verified.user || !verified.session) {
      return { error: "Liên kết khôi phục đã hết hạn hoặc đã được sử dụng. Vui lòng yêu cầu liên kết mới." };
    }
    const { error: updateError } = await db.auth.updateUser({ password: parsed.data.newPassword });
    if (updateError) {
      await db.auth.signOut();
      return { error: "Không đổi được mật khẩu. Vui lòng yêu cầu liên kết mới hoặc liên hệ quản trị viên." };
    }
    await db.auth.signOut();
    return { success: true };
  } catch {
    return { error: "Không xác minh được liên kết khôi phục. Vui lòng yêu cầu liên kết mới." };
  }
}
