"use server";

import { revalidatePath } from "next/cache";
import { getRequestContext } from "@/lib/auth/request-context";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CreateBeneficiarySchema, RecordPaymentSchema } from "../schemas/health-social.schema";
import { assertCanManageBeneficiaries, assertCanRecordPayment, assertCanAccessHamlet } from "./policy";
import { type Result, ok, fail } from "@/lib/types/result";

export async function createBeneficiaryAction(
  rawInput: unknown
): Promise<Result<{ id: string; code: string }>> {
  try {
    const ctx = await getRequestContext();
    assertCanManageBeneficiaries(ctx);

    const parsed = CreateBeneficiarySchema.safeParse(rawInput);
    if (!parsed.success) {
      return fail(
        "VALIDATION",
        parsed.error.issues.map((i) => i.message).join("; ")
      );
    }

    const { hamletId } = parsed.data;
    assertCanAccessHamlet(ctx, hamletId);

    // Release gate M06-F06: never create a sensitive beneficiary through a
    // direct INSERT followed by an unaudited/best-effort second request.
    // The approved, single-transaction RPC, data-source authority and
    // canonical M06 migration are not yet present in the active DB baseline.
    // Fail closed rather than potentially saving a real person's data without
    // an immutable audit record. Re-enable only after G-DB/G-SEC + owner review.
    return fail(
      "INTERNAL",
      "Tiếp nhận hồ sơ bảo trợ đang tạm khóa để hoàn thiện quy trình ghi nhận và nhật ký bắt buộc."
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Đã có lỗi xảy ra khi tạo đối tượng bảo trợ";
    return fail("INTERNAL", message);
  }
}

export async function recordSocialAidPaymentAction(
  rawInput: unknown
): Promise<Result<{ success: boolean; beneficiaryId: string }>> {
  try {
    const ctx = await getRequestContext();
    assertCanRecordPayment(ctx);

    const parsed = RecordPaymentSchema.safeParse(rawInput);
    if (!parsed.success) {
      return fail(
        "VALIDATION",
        parsed.error.issues.map((i) => i.message).join("; ")
      );
    }

    const { beneficiaryId, idempotencyKey } = parsed.data;
    const supabase = await createServerSupabaseClient();
    // Verify tenant and territorial scope before the RPC; errors must never imply success.
    const { data: beneficiary, error: lookupError } = await supabase
      .from("social_protection_beneficiaries")
      .select("hamlet_id")
      .eq("tenant_id", ctx.tenantId)
      .eq("id", beneficiaryId)
      .maybeSingle();
    if (lookupError) return fail("INTERNAL", "Không thể đối chiếu phạm vi hồ sơ.");
    if (!beneficiary) return fail("NOT_FOUND", "Không tìm thấy hồ sơ thuộc đơn vị hiện tại.");
    assertCanAccessHamlet(ctx, String(beneficiary.hamlet_id));

    // Only the audited RPC may record an external reconciliation
    const { error } = await supabase.rpc("record_social_aid_payment", {
      p_tenant_id: ctx.tenantId,
      p_beneficiary_id: beneficiaryId,
      p_idempotency_key: idempotencyKey ?? null,
    });

    if (error) {
      return fail("INTERNAL", "Không thể đối soát chi trả; không được tự ghi trạng thái PAID.");
    }

    revalidatePath("/y-te-an-sinh");
    return ok({
      success: true,
      beneficiaryId,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Đã có lỗi xảy ra khi chi trả trợ cấp";
    return fail("INTERNAL", message);
  }
}
