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

    const { disputeId, status, outcome, idempotencyKey, expectedVersion, decisionReference } = parsed.data;
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase.schema("app").rpc("resolve_labor_dispute", {
      p_tenant_id: ctx.tenantId,
      p_dispute_id: disputeId,
      p_status: status,
      p_outcome: outcome,
      p_idempotency_key: idempotencyKey ?? null,
      p_expected_version: expectedVersion,
      p_decision_reference: decisionReference,
    });

    if (error) {
      if (error.code === "PV409") return fail("VERSION_CONFLICT", "Hồ sơ đã thay đổi, vui lòng tải lại.");
      if (error.code === "42501") return fail("FORBIDDEN", "Không đủ quyền ghi nhận kết quả tranh chấp.");
      return fail("INTERNAL", "Không thể xác nhận kết quả xử lý; dữ liệu chưa được thay đổi.");
    }
    if (!data || data.status !== status || data.id !== disputeId) {
      return fail("INTERNAL", "Chưa nhận được biên nhận kết quả từ CSDL.");
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
