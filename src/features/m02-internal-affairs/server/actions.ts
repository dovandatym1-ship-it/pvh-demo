"use server";

import { revalidatePath } from "next/cache";
import { getRequestContext } from "@/lib/auth/request-context";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ResolveDisputeSchema } from "../schemas/internal-affairs.schema";
import { assertCanResolveDispute } from "./policy";
import { type Result, ok, fail } from "@/lib/types/result";

export async function resolveLaborDisputeAction(
  rawInput: unknown
): Promise<Result<{ success: boolean; disputeId: string; status: string }>> {
  try {
    const ctx = await getRequestContext();
    assertCanResolveDispute(ctx);

    const parsed = ResolveDisputeSchema.safeParse(rawInput);
    if (!parsed.success) {
      return fail(
        "VALIDATION",
        parsed.error.issues.map((i) => i.message).join("; ")
      );
    }

    const { disputeId, status, outcome, idempotencyKey } = parsed.data;
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase.rpc("resolve_labor_dispute", {
      p_tenant_id: ctx.tenantId,
      p_dispute_id: disputeId,
      p_status: status,
      p_outcome: outcome,
      p_idempotency_key: idempotencyKey ?? null,
    });

    if (error) {
      await supabase
        .from("labor_disputes")
        .update({
          status,
          outcome_summary: outcome,
          updated_at: new Date().toISOString(),
        })
        .eq("tenant_id", ctx.tenantId)
        .eq("id", disputeId);

      await supabase.from("audit_log").insert({
        tenant_id: ctx.tenantId,
        user_id: ctx.userId,
        action: "m02.labor_dispute.resolve",
        entity_type: "labor_dispute",
        entity_id: disputeId,
        changes: { status, outcome },
        idempotency_key: idempotencyKey,
      });
    }

    revalidatePath("/noi-vu");
    return ok({
      success: true,
      disputeId,
      status,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Đã có lỗi xảy ra khi xử lý hòa giải tranh chấp";
    return fail("INTERNAL", message);
  }
}
