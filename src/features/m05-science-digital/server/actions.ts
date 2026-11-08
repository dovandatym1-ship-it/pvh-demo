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

    const { error } = await supabase.rpc("update_digital_indicator_status", {
      p_tenant_id: ctx.tenantId,
      p_indicator_id: indicatorId,
      p_status: status,
      p_value: value,
      p_idempotency_key: idempotencyKey ?? null,
    });

    if (error) {
      await supabase
        .from("digital_indicators")
        .update({
          status,
          value,
          is_confirmed_zero: status === "CONFIRMED_ZERO",
          updated_at: new Date().toISOString(),
        })
        .eq("tenant_id", ctx.tenantId)
        .eq("id", indicatorId);

      await supabase.from("audit_log").insert({
        tenant_id: ctx.tenantId,
        user_id: ctx.userId,
        action: "m05.indicator.update_status",
        entity_type: "digital_indicator",
        entity_id: indicatorId,
        changes: { status, value },
        idempotency_key: idempotencyKey,
      });
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
