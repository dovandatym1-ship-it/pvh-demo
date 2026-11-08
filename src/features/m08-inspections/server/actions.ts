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

    const { error } = await supabase.rpc("resolve_inspection_recommendation", {
      p_tenant_id: ctx.tenantId,
      p_recommendation_id: recommendationId,
      p_status: status,
      p_idempotency_key: idempotencyKey ?? null,
    });

    if (error) {
      await supabase
        .from("inspection_recommendations")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("tenant_id", ctx.tenantId)
        .eq("id", recommendationId);

      await supabase.from("audit_log").insert({
        tenant_id: ctx.tenantId,
        user_id: ctx.userId,
        action: "m08.recommendation.resolve",
        entity_type: "inspection_recommendation",
        entity_id: recommendationId,
        changes: { status },
        idempotency_key: idempotencyKey,
      });
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
