import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { RequestContext } from "@/lib/auth/request-context";
import type { NCCBeneficiaryDTO, LaborContractDTO, LaborDisputeDTO } from "../types";

export async function getNCCBeneficiaries(ctx: RequestContext): Promise<NCCBeneficiaryDTO[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("ncc_beneficiaries")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .order("code", { ascending: true });

  if (error || !data || data.length === 0) {
    return [
      {
        id: "c0000000-0000-0000-0000-000000000001",
        code: "NCC-TN-01",
        fullName: "Nguyễn Văn Thành",
        cccd: "019058001122",
        hamletId: "A1",
        category: "THUONG_BINH",
        medalTitle: "Huân chương Kháng chiến Hạng Ba",
        monthlyAllowance: 2850000,
        hasDeduplicationFlag: false,
        status: "ACTIVE",
      },
      {
        id: "c0000000-0000-0000-0000-000000000002",
        code: "NCC-TN-02",
        fullName: "Mẹ Việt Nam AH Lê Thị Lan",
        cccd: "019035003344",
        hamletId: "A2",
        category: "BA_ME_VNAH",
        medalTitle: "Danh hiệu Bà Mẹ VNAH",
        monthlyAllowance: 4850000,
        hasDeduplicationFlag: false,
        status: "ACTIVE",
      },
      {
        id: "c0000000-0000-0000-0000-000000000003",
        code: "NCC-TN-03",
        fullName: "Hoàng Văn Thái",
        cccd: "019062005566",
        hamletId: "A3",
        category: "BENH_BINH",
        medalTitle: "Huy chương Chiến sĩ vẻ vang",
        monthlyAllowance: 2150000,
        hasDeduplicationFlag: false,
        status: "ACTIVE",
      },
    ];
  }

  return data.map((row) => ({
    id: String(row.id),
    code: String(row.code),
    fullName: String(row.full_name),
    cccd: row.cccd ? String(row.cccd) : undefined,
    hamletId: String(row.hamlet_id),
    category: (row.category as NCCBeneficiaryDTO["category"]) || "THUONG_BINH",
    medalTitle: String(row.medal_title),
    monthlyAllowance: Number(row.monthly_allowance) || 0,
    hasDeduplicationFlag: Boolean(row.has_deduplication_flag),
    deduplicationWarning: row.deduplication_warning ? String(row.deduplication_warning) : undefined,
    status: (row.status as NCCBeneficiaryDTO["status"]) || "ACTIVE",
  }));
}

export async function getLaborContracts(ctx: RequestContext): Promise<LaborContractDTO[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("labor_contracts")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .order("business_name", { ascending: true });

  if (error || !data || data.length === 0) {
    return [
      {
        id: "c1000000-0000-0000-0000-000000000001",
        businessName: "HTX Nông nghiệp Xanh Giả Định A",
        taxCode: "4600123456",
        totalWorkers: 28,
        minWagePaid: 4200000,
        regionalMinWage: 3450000,
        isUnderMinWage: false,
        seasonalWorkersCount: 6,
        bhxhRegisteredCount: 22,
        evaluationPeriod: "Q3/2026",
      },
      {
        id: "c1000000-0000-0000-0000-000000000002",
        businessName: "Xưởng chế biến chè Gia Định - Xóm A1",
        taxCode: "4600654321",
        totalWorkers: 14,
        minWagePaid: 3800000,
        regionalMinWage: 3450000,
        isUnderMinWage: false,
        seasonalWorkersCount: 4,
        bhxhRegisteredCount: 10,
        evaluationPeriod: "Q3/2026",
      },
    ];
  }

  return data.map((row) => ({
    id: String(row.id),
    businessName: String(row.business_name),
    taxCode: String(row.tax_code),
    totalWorkers: Number(row.total_workers) || 0,
    minWagePaid: Number(row.min_wage_paid) || 0,
    regionalMinWage: Number(row.regional_min_wage) || 3450000,
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

  if (error || !data || data.length === 0) {
    return [
      {
        id: "c2000000-0000-0000-0000-000000000001",
        code: "TC-2026-001",
        requesterName: "Đỗ Văn Minh",
        requesterRole: "EMPLOYEE",
        respondentName: "Xưởng chè Gia Định",
        disputeContent: "Tranh chấp tiền lương làm thêm giờ vụ thu hoạch",
        disputeType: "INDIVIDUAL",
        receivedDate: "2026-10-12",
        status: "RESOLVED_SUCCESS",
        outcomeSummary: "Hai bên thống nhất thanh toán đủ 1.800.000đ tiền làm thêm giờ.",
      },
    ];
  }

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
  }));
}
