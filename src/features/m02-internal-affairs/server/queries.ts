import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { RequestContext } from "@/lib/auth/request-context";
import type { NCCBeneficiaryDTO, LaborContractDTO, LaborDisputeDTO } from "../types";

export async function getNCCBeneficiaries(ctx: RequestContext): Promise<NCCBeneficiaryDTO[]> {
  // Sensitive identity and allowance fields are not SELECT-granted on the
  // underlying table. The RPC enforces live role, hamlet scope and field mask.
  const db=await createServerSupabaseClient();
  const {data,error}=await db.schema("app").rpc("list_ncc_beneficiaries",{p_limit:1000});
  if(error||!Array.isArray(data))throw new Error("Không thể tải hồ sơ người có công theo phân quyền.");
  return data.map(row=>({
    id:String(row.id),code:String(row.code),fullName:String(row.full_name),
    cccd:typeof row.cccd==="string"?row.cccd:undefined,
    hamletId:String(row.hamlet_id),
    category:row.category as NCCBeneficiaryDTO["category"],
    medalTitle:String(row.medal_title),
    monthlyAllowance:row.monthly_allowance===null?0:Number(row.monthly_allowance),
    hasDeduplicationFlag:Boolean(row.has_deduplication_flag),
    deduplicationWarning:typeof row.deduplication_warning==="string"?row.deduplication_warning:undefined,
    status:row.status as NCCBeneficiaryDTO["status"],
  }));
}

export async function getLaborContracts(ctx: RequestContext): Promise<LaborContractDTO[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("labor_contracts")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .order("business_name", { ascending: true });

  if (error) {
    throw new Error("Không thể tải dữ liệu chuyên ngành; vui lòng thử lại.");
  }
  if (!data) return [];

  return data.map((row) => ({
    id: String(row.id),
    businessName: String(row.business_name),
    taxCode: String(row.tax_code),
    totalWorkers: Number(row.total_workers) || 0,
    minWagePaid: Number(row.min_wage_paid) || 0,
    regionalMinWage: Number(row.regional_min_wage),
    isUnderMinWage: Boolean(row.is_under_min_wage),
    seasonalWorkersCount: Number(row.seasonal_workers_count) || 0,
    bhxhRegisteredCount: Number(row.bhxh_registered_count) || 0,
    evaluationPeriod: String(row.evaluation_period),
  }));
}

export async function getLaborDisputes(ctx: RequestContext): Promise<LaborDisputeDTO[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("labor_disputes")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .order("received_date", { ascending: false });

  if (error) {
    throw new Error("Không thể tải dữ liệu chuyên ngành; vui lòng thử lại.");
  }
  if (!data) return [];

  return data.map((row) => ({
    id: String(row.id),
    code: String(row.code),
    requesterName: String(row.requester_name),
    requesterRole: (row.requester_role as LaborDisputeDTO["requesterRole"]) || "EMPLOYEE",
    respondentName: String(row.respondent_name),
    disputeContent: String(row.dispute_content),
    disputeType: (row.dispute_type as LaborDisputeDTO["disputeType"]) || "INDIVIDUAL",
    receivedDate: String(row.received_date),
    status: (row.status as LaborDisputeDTO["status"]) || "RECEIVED",
    outcomeSummary: row.outcome_summary ? String(row.outcome_summary) : undefined,
    version: Number(row.version),
    decisionReference: row.decision_reference ? String(row.decision_reference) : null,
  }));
}
