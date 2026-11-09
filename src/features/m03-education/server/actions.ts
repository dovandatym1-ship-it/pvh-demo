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

    const { exemptionId, status, idempotencyKey } = parsed.data;
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase.rpc("approve_tuition_exemption", {
      p_tenant_id: ctx.tenantId,
      p_exemption_id: exemptionId,
      p_status: status,
      p_idempotency_key: idempotencyKey ?? null,
    });

    if (error) {
      return fail("INTERNAL", "Không thể xác nhận kết quả xử lý; dữ liệu chưa được thay đổi.");
    }

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
