"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getRequestContext } from "@/lib/auth/request-context";
import { assertPermission } from "@/lib/authorization/assert-permission";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { type Result, ok, fail } from "@/lib/types/result";

const RoleCode = z.enum(["SYSTEM_ADMIN", "WORK_MANAGER", "WORK_OFFICER", "WORK_VIEWER", "AUDITOR"]);
const Uuid = z.string().uuid();
const InviteInput = z.object({
  email: z.string().trim().email().max(254),
  fullName: z.string().trim().min(1).max(150),
  roleCode: RoleCode,
  orgUnitId: Uuid.nullish(),
});

export async function inviteStaffAction(raw: unknown): Promise<Result<{ userId: string; membershipId: string }>> {
  const parsed = InviteInput.safeParse(raw);
  if (!parsed.success) return fail("VALIDATION", "Thông tin mời cán bộ không hợp lệ");
  try {
    const ctx = await getRequestContext();
    assertPermission(ctx, "m00:membership:manage");
    const admin = createSupabaseAdminClient();

    // This sends an actual email ONLY when an authorized admin calls the action.
    const { data, error } = await admin.auth.admin.inviteUserByEmail(parsed.data.email);
    if (error || !data.user) {
      return fail("INTERNAL", "Không gửi được lời mời. Kiểm tra email hoặc tài khoản đã tồn tại.");
    }

    // Membership and its audit are committed in one controlled database RPC.
    const supabase = await createServerSupabaseClient();
    const { data: receipt, error: provisionError } = await supabase.schema("app").rpc("provision_membership", {
      p_user_id: data.user.id,
      p_full_name: parsed.data.fullName,
      p_role_code: parsed.data.roleCode,
      p_org_unit_id: parsed.data.orgUnitId ?? null,
      p_scopes: {},
    });
    if (provisionError || !receipt?.membershipId) {
      // Do not silently delete the Auth account: it remains safely unassigned.
      return fail("INTERNAL", "Đã mời tài khoản Auth nhưng phân công chưa hoàn tất. Cần đối soát ID trước khi mời lại.");
    }
    revalidatePath("/quan-tri/tai-khoan");
    return ok({ userId: data.user.id, membershipId: String(receipt.membershipId) });
  } catch {
    return fail("FORBIDDEN", "Không có quyền mời hoặc chưa cấu hình kết nối quản trị Supabase");
  }
}

export async function setStaffRoleAction(userId: string, roleCode: string, grant: boolean): Promise<Result<{ role: string }>> {
  if (!Uuid.safeParse(userId).success || !RoleCode.safeParse(roleCode).success || typeof grant !== "boolean") {
    return fail("VALIDATION", "Yêu cầu điều chỉnh vai trò không hợp lệ");
  }
  try {
    const ctx = await getRequestContext();
    assertPermission(ctx, "m00:membership:manage");
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.schema("app").rpc("set_membership_role", {
      p_user_id: userId, p_role_code: roleCode, p_grant: grant,
    });
    if (error || !data) return fail("FORBIDDEN", "CSDL từ chối điều chỉnh vai trò");
    revalidatePath("/quan-tri/tai-khoan");
    return ok({ role: roleCode });
  } catch { return fail("FORBIDDEN", "Không đủ quyền quản trị tài khoản"); }
}

export async function revokeStaffAction(userId: string): Promise<Result<{ revoked: boolean }>> {
  if (!Uuid.safeParse(userId).success) return fail("VALIDATION", "Mã tài khoản không hợp lệ");
  try {
    const ctx = await getRequestContext();
    assertPermission(ctx, "m00:membership:manage");
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.schema("app").rpc("revoke_membership", { p_user_id: userId });
    if (error || data?.revoked !== true) return fail("FORBIDDEN", "Không thể thu hồi phân công (có thể là quản trị viên cuối cùng)");
    revalidatePath("/quan-tri/tai-khoan");
    return ok({ revoked: true });
  } catch { return fail("FORBIDDEN", "Không đủ quyền thu hồi phân công"); }
}
