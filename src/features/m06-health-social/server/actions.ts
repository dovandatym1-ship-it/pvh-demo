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
    const supabase = await createServerSupabaseClient();
    // Domain module remains unavailable until its audited DB RPC is deployed.
    const { data, error } = await supabase.schema("app").rpc("create_social_beneficiary", {
      p_tenant_id: ctx.tenantId,
      p_full_name: fullName,
      p_cccd: cccd,
      p_phone: phone || null,
      p_hamlet_id: hamletId,
      p_aid_category: aidCategory,
      p_monthly_amount: monthlyAmount,
      p_diagnosis: diagnosis || null,
      p_health_insurance_provided: healthInsuranceProvided,
    });

    if (error || !data || !data.id || !data.code) {
      return fail("INTERNAL", "CSDL chưa xác nhận tạo đối tượng; không trả mã hồ sơ giả");
    }

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

    const { data, error } = await supabase.schema("app").rpc("record_social_aid_payment", {
      p_tenant_id: ctx.tenantId,
      p_beneficiary_id: beneficiaryId,
      p_idempotency_key: idempotencyKey ?? null,
    });

    if (error || !data) {
      return fail("INTERNAL", "CSDL chưa xác nhận chi trả; không được ghi nhận là đã thanh toán");
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
