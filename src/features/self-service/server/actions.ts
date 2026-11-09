"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getRequestContext } from "@/lib/auth/request-context";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ok, fail, type Result } from "@/lib/types/result";

const ProfileInput = z.object({
  displayName: z.string().trim().min(2, "Họ tên hiển thị phải từ 2 ký tự").max(80).regex(/^[^<>\\r\\n]+$/, "Không được dùng ký tự đặc biệt này"),
  contactPhone: z.string().trim().max(20).regex(/^(?:|\\+?[0-9 ()-]{9,20})$/, "Số liên hệ không hợp lệ"),
}).strict();

const PasswordInput = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(12).max(72),
}).strict();

export async function updateOwnProfileAction(input: unknown): Promise<Result<{ displayName: string; contactPhone: string }>> {
  const parsed = ProfileInput.safeParse(input);
  if (!parsed.success) return fail("VALIDATION", "Dữ liệu cá nhân chưa hợp lệ", parsed.error.flatten());
  try {
    const ctx = await getRequestContext();
    const db = await createServerSupabaseClient();
    const { data: { user } } = await db.auth.getUser();
    // Never write official organization, role, permission or scope to user_metadata.
    if (!user || user.id !== ctx.userId) return fail("FORBIDDEN", "Tài khoản demo không thể thay đổi hồ sơ xác thực");
    const { error } = await db.auth.updateUser({ data: {
      display_name: parsed.data.displayName, contact_phone: parsed.data.contactPhone,
    } });
    if (error) return fail("INTERNAL", "Không lưu được thông tin liên hệ. Vui lòng thử lại.");
    revalidatePath("/thong-tin-ca-nhan");
    return ok(parsed.data);
  } catch {
    return fail("UNAUTHENTICATED", "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
  }
}

export async function changeOwnPasswordAction(input: unknown): Promise<Result<{ changed: true }>> {
  const parsed = PasswordInput.safeParse(input);
  if (!parsed.success) return fail("VALIDATION", "Mật khẩu mới phải từ 12 đến 72 ký tự");
  if (parsed.data.currentPassword === parsed.data.newPassword)
    return fail("VALIDATION", "Mật khẩu mới phải khác mật khẩu hiện tại");
  try {
    const ctx = await getRequestContext();
    const db = await createServerSupabaseClient();
    const { data: { user } } = await db.auth.getUser();
    if (!user || !user.email || user.id !== ctx.userId)
      return fail("FORBIDDEN", "Chỉ tài khoản xác thực thật mới đổi được mật khẩu");
    // Reauthenticate before a sensitive change. This must remain the SAME account.
    const { data: verified, error: authError } = await db.auth.signInWithPassword({
      email: user.email, password: parsed.data.currentPassword,
    });
    if (authError || !verified.user || verified.user.id !== ctx.userId)
      return fail("FORBIDDEN", "Mật khẩu hiện tại không đúng");
    const { error } = await db.auth.updateUser({ password: parsed.data.newPassword });
    if (error) return fail("INTERNAL", "Chưa đổi được mật khẩu. Có thể cần xác minh bảo mật bổ sung.");
    return ok({ changed: true });
  } catch {
    return fail("UNAUTHENTICATED", "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
  }
}
