"use server";

import { revalidatePath } from "next/cache";
import { getRequestContext } from "@/lib/auth/request-context";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ResolveRecommendationSchema } from "../schemas/resolve-recommendation.schema";
import { assertCanManageInspections } from "./policy";
import { type Result, ok, fail } from "@/lib/types/result";

export async function resolveInspectionRecommendationAction(
  rawInput: unknown
): Promise<Result<{ success: boolean; recommendationId: string; status: string }>> {
  try {
    const ctx = await getRequestContext();
    assertCanManageInspections(ctx);

    const parsed = ResolveRecommendationSchema.safeParse(rawInput);
    if (!parsed.success) {
      return fail(
        "VALIDATION",
        parsed.error.issues.map((i) => i.message).join("; ")
      );
    }

    const { recommendationId, status, idempotencyKey } = parsed.data;
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase.schema("app").rpc("resolve_inspection_recommendation", {
      p_tenant_id: ctx.tenantId,
      p_recommendation_id: recommendationId,
      p_status: status,
      p_idempotency_key: idempotencyKey ?? null,
    });

    if (error || !data) {
      return fail("INTERNAL", "CSDL chưa xác nhận xử lý kiến nghị; không có thay đổi được ghi nhận");
    }

    revalidatePath("/kiem-tra");
    return ok({
      success: true,
      recommendationId,
      status,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Đã có lỗi xảy ra khi xử lý kiến nghị";
    return fail("INTERNAL", message);
  }
}
