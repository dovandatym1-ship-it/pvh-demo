"use server";

import { revalidatePath } from "next/cache";
import { getRequestContext } from "@/lib/auth/request-context";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { UpdateIndicatorStatusSchema } from "../schemas/digital.schema";
import { assertCanManageDigital } from "./policy";
import { type Result, ok, fail } from "@/lib/types/result";

export async function updateDigitalIndicatorStatusAction(
  rawInput: unknown
): Promise<Result<{ success: boolean; indicatorId: string; status: string }>> {
  try {
    const ctx = await getRequestContext();
    assertCanManageDigital(ctx);

    const parsed = UpdateIndicatorStatusSchema.safeParse(rawInput);
    if (!parsed.success) {
      return fail(
        "VALIDATION",
        parsed.error.issues.map((i) => i.message).join("; ")
      );
    }

    const { indicatorId, status, value, idempotencyKey } = parsed.data;
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase.schema("app").rpc("update_digital_indicator_status", {
      p_tenant_id: ctx.tenantId,
      p_indicator_id: indicatorId,
      p_status: status,
      p_value: value,
      p_idempotency_key: idempotencyKey ?? null,
    });

    if (error || !data) {
      return fail("INTERNAL", "CSDL chưa xác nhận cập nhật chỉ tiêu; không có thay đổi được ghi nhận");
    }

    revalidatePath("/khcn-chuyen-doi-so");
    return ok({
      success: true,
      indicatorId,
      status,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Đã có lỗi xảy ra khi cập nhật chỉ tiêu CĐS";
    return fail("INTERNAL", message);
  }
}
