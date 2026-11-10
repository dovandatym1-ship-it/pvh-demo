"use server";

import { revalidatePath } from "next/cache";
import { getRequestContext } from "@/lib/auth/request-context";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ApproveExemptionSchema } from "../schemas/education.schema";
import { assertCanApproveExemption } from "./policy";
import { type Result, ok, fail } from "@/lib/types/result";

export async function approveTuitionExemptionAction(
  rawInput: unknown
): Promise<Result<{ success: boolean; exemptionId: string; status: string }>> {
  try {
    const ctx = await getRequestContext();
    assertCanApproveExemption(ctx);

    const parsed = ApproveExemptionSchema.safeParse(rawInput);
    if (!parsed.success) {
      return fail(
        "VALIDATION",
        parsed.error.issues.map((i) => i.message).join("; ")
      );
    }

    const { exemptionId, status, idempotencyKey, expectedVersion, decisionReference } = parsed.data;
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase.schema("app").rpc("approve_tuition_exemption", {
      p_tenant_id: ctx.tenantId,
      p_exemption_id: exemptionId,
      p_status: status,
      p_idempotency_key: idempotencyKey ?? null,
      p_expected_version: expectedVersion,
      p_decision_reference: decisionReference,
    });

    if (error) {
      if (error.code === "PV409") return fail("VERSION_CONFLICT", "Hồ sơ đã thay đổi, vui lòng tải lại.");
      if (error.code === "42501") return fail("FORBIDDEN", "Không đủ thẩm quyền xác nhận hồ sơ.");
      return fail("INTERNAL", "Không thể xác nhận kết quả xử lý; dữ liệu chưa được thay đổi.");
    }
    if (!data || data.status !== status || data.id !== exemptionId) return fail("INTERNAL", "Chưa nhận được biên nhận quyết định từ CSDL.");

    revalidatePath("/giao-duc");
    return ok({
      success: true,
      exemptionId,
      status,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Đã có lỗi xảy ra khi xét duyệt miễn giảm học phí";
    return fail("INTERNAL", message);
  }
}
