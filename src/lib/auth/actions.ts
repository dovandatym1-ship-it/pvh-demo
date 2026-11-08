"use server";

import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { logAuditEvent, TENANT_A_UUID, PERSONA_UUIDS } from "@/lib/audit/audit-logger";

export interface LoginActionResult {
  success?: boolean;
  error?: string;
}

/**
 * Server Action: Đăng nhập bằng tài khoản và mật khẩu thật qua Supabase Auth.
 * BẮT BUỘC ghi vết kiểm toán (Audit Log) vào CSDL dù thành công hay thất bại.
 */
export async function loginWithCredentialsAction(formData: FormData): Promise<LoginActionResult> {
  const email = formData.get("email")?.toString()?.trim() || "";
  const password = formData.get("password")?.toString() || "";

  if (!email || !password) {
    return { error: "Vui lòng nhập đầy đủ email và mật khẩu." };
  }

  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for") || headerList.get("x-real-ip") || "127.0.0.1";
  const userAgent = headerList.get("user-agent") || "unknown";

  const supabase = await createServerSupabaseClient();

  // 1. Xác thực danh tính người dùng qua Supabase Auth
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    // Ghi nhận Audit Log thất bại vào CSDL PostgreSQL
    await logAuditEvent({
      tenantId: TENANT_A_UUID,
      userId: PERSONA_UUIDS.P1,
      action: "AUTH_LOGIN_FAILED",
      entityType: "auth_session",
      entityId: email,
      details: {
        email,
        reason: error?.message || "Invalid credentials",
        ipAddress: ip,
        userAgent,
        timestamp: new Date().toISOString(),
      },
      ipAddress: ip,
    });

    return { error: "Email hoặc mật khẩu không chính xác. Vui lòng thử lại." };
  }

  const user = data.user;

  // 2. Truy vấn hồ sơ và phân công công tác trong database
  const { data: membership } = await supabase
    .from("memberships")
    .select("id, tenant_id, roles, permissions")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  const tenantId = membership?.tenant_id || TENANT_A_UUID;

  // 3. Ghi nhận Audit Log thành công vào CSDL PostgreSQL
  await logAuditEvent({
    tenantId,
    userId: user.id,
    action: "AUTH_LOGIN_SUCCESS",
    entityType: "auth_session",
    entityId: user.id,
    details: {
      email: user.email,
      roles: membership?.roles || [],
      permissions: membership?.permissions || [],
      membershipId: membership?.id,
      ipAddress: ip,
      userAgent,
      method: "supabase_auth_password",
      timestamp: new Date().toISOString(),
    },
    ipAddress: ip,
  });

  redirect("/ban-lam-viec");
}

/**
 * Server Action: Đăng nhập vai trò kiểm thử thử nghiệm (Persona Demo Session).
 * Ghi vết kiểm toán (Audit Log) trực tiếp vào bảng public.audit_log của CSDL.
 */
export async function loginDemoAction(personaCode: string) {
  const cookieStore = await cookies();
  cookieStore.set("pvh_demo_session", personaCode, { path: "/", httpOnly: true });

  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for") || headerList.get("x-real-ip") || "127.0.0.1";
  const userAgent = headerList.get("user-agent") || "demo-browser";

  const userId = PERSONA_UUIDS[personaCode] || PERSONA_UUIDS.P1;

  // Ghi nhật ký kiểm toán trực tiếp vào CSDL PostgreSQL
  await logAuditEvent({
    tenantId: TENANT_A_UUID,
    userId,
    personaCode,
    action: "AUTH_DEMO_LOGIN_SUCCESS",
    entityType: "auth_session",
    entityId: userId,
    details: {
      persona: personaCode,
      authMethod: "seed_persona_session",
      ipAddress: ip,
      userAgent,
      note: `Tài khoản kiểm thử ${personaCode} đăng nhập phiên tác nghiệp`,
      timestamp: new Date().toISOString(),
    },
    ipAddress: ip,
  });

  redirect("/ban-lam-viec");
}

/**
 * Server Action: Đăng xuất phiên làm việc.
 * BẮT BUỘC ghi vết kiểm toán (Audit Log) AUTH_LOGOUT vào CSDL trước khi xóa phiên.
 */
export async function logoutAction() {
  const cookieStore = await cookies();
  const demoPersona = cookieStore.get("pvh_demo_session")?.value;
  cookieStore.delete("pvh_demo_session");

  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for") || headerList.get("x-real-ip") || "127.0.0.1";

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const actorId = user?.id || (demoPersona ? PERSONA_UUIDS[demoPersona] : PERSONA_UUIDS.P1);

  // Ghi nhận Audit Log đăng xuất vào CSDL PostgreSQL
  await logAuditEvent({
    tenantId: TENANT_A_UUID,
    userId: actorId,
    personaCode: demoPersona,
    action: "AUTH_LOGOUT",
    entityType: "auth_session",
    entityId: actorId,
    details: {
      reason: "user_logout_button",
      ipAddress: ip,
      timestamp: new Date().toISOString(),
    },
    ipAddress: ip,
  });

  await supabase.auth.signOut();
  redirect("/login");
}
