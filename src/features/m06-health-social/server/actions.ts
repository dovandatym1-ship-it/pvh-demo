"use server";

import { revalidatePath } from "next/cache";
import { getRequestContext } from "@/lib/auth/request-context";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CreateBeneficiarySchema, RecordPaymentSchema } from "../schemas/health-social.schema";
import { assertCanManageBeneficiaries, assertCanRecordPayment } from "./policy";
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

    const { fullName, cccd, phone, hamletId, aidCategory, monthlyAmount, diagnosis, healthInsuranceProvided } = parsed.data;
    const generatedCode = `BT-${Date.now().toString().slice(-4)}`;

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("social_protection_beneficiaries")
      .insert({
        tenant_id: ctx.tenantId,
        code: generatedCode,
        full_name: fullName,
        cccd,
        phone: phone || null,
        hamlet_id: hamletId,
        aid_category: aidCategory,
        monthly_amount: monthlyAmount,
        diagnosis: diagnosis || null,
        payment_status: "PENDING",
        health_insurance_provided: healthInsuranceProvided,
      })
      .select("id, code")
      .single();

    if (error || !data) {
      return fail("INTERNAL", "Không thể lưu đối tượng bảo trợ; không tạo mã hoặc ID giả.");
    }

    // Insert audit log
    await supabase.from("audit_log").insert({
      tenant_id: ctx.tenantId,
      user_id: ctx.userId,
      action: "m06.beneficiary.create",
      entity_type: "social_protection_beneficiary",
      entity_id: data.id,
      changes: { code: data.code, fullName, aidCategory },
    });

    revalidatePath("/y-te-an-sinh");
    return ok({
      id: data.id,
      code: data.code,
    });
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

    // Call RPC or fallback direct update
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
