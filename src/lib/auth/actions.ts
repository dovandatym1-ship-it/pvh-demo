"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ForbiddenError } from "@/lib/errors/app-error";
import { isDemoAuthEnabled, isValidDemoPersona } from "@/lib/auth/demo-mode";
import { isMembershipCurrentlyActive } from "@/lib/auth/membership-validity";

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

  redirect("/ban-lam-viec");
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
