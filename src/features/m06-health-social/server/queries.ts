import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { RequestContext } from "@/lib/auth/request-context";
import type {
  SocialBeneficiaryDTO,
  FoodSafetyInspectionDTO,
  MedicalFacilityDTO,
  EpidemicLogDTO,
} from "../types";

export async function getSocialBeneficiaries(ctx: RequestContext): Promise<SocialBeneficiaryDTO[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("social_protection_beneficiaries")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .order("created_at", { ascending: true });

  if (error || !data || data.length === 0) {
    return [
      {
        id: "e0000000-0000-0000-0000-000000000001",
        code: "BT-TN-01",
        fullName: "Nguyễn Thị Mùi",
        cccd: "019156001234",
        phone: "0912345678",
        hamletId: "A1",
        aidCategory: "Người cao tuổi đơn thân",
        monthlyAmount: 540000,
        diagnosis: "Suy tim độ 2, cao huyết áp",
        paymentStatus: "PAID",
        healthInsuranceProvided: true,
        version: 1,
        createdAt: "2026-10-01T08:00:00Z",
        updatedAt: "2026-10-01T08:00:00Z",
      },
      {
        id: "e0000000-0000-0000-0000-000000000002",
        code: "BT-TN-02",
        fullName: "Trần Văn Hùng",
        cccd: "019082005678",
        phone: "0987654321",
        hamletId: "A2",
        aidCategory: "Khuyết tật vận động nặng",
        monthlyAmount: 720000,
        diagnosis: "Liệt nửa người sau tai biến",
        paymentStatus: "PENDING",
        healthInsuranceProvided: true,
        version: 1,
        createdAt: "2026-10-05T09:30:00Z",
        updatedAt: "2026-10-05T09:30:00Z",
      },
      {
        id: "e0000000-0000-0000-0000-000000000003",
        code: "BT-TN-03",
        fullName: "Lê Thị Sen",
        cccd: "019163009876",
        phone: "0934567890",
        hamletId: "A3",
        aidCategory: "Hộ nghèo có người bệnh nặng",
        monthlyAmount: 540000,
        diagnosis: "Thận mạn giai đoạn 3",
        paymentStatus: "PENDING",
        healthInsuranceProvided: true,
        version: 1,
        createdAt: "2026-10-10T14:15:00Z",
        updatedAt: "2026-10-10T14:15:00Z",
      },
    ];
  }

  return data.map((row) => ({
    id: String(row.id),
    code: String(row.code),
    fullName: String(row.full_name),
    cccd: String(row.cccd),
    phone: row.phone ? String(row.phone) : undefined,
    hamletId: String(row.hamlet_id),
    aidCategory: String(row.aid_category),
    monthlyAmount: Number(row.monthly_amount) || 0,
    diagnosis: row.diagnosis ? String(row.diagnosis) : undefined,
    paymentStatus: (row.payment_status as SocialBeneficiaryDTO["paymentStatus"]) || "PENDING",
    healthInsuranceProvided: Boolean(row.health_insurance_provided),
    version: Number(row.version) || 1,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }));
}

export async function getFoodSafetyInspections(ctx: RequestContext): Promise<FoodSafetyInspectionDTO[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("food_safety_inspections")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .order("inspection_date", { ascending: false });

  if (error || !data || data.length === 0) {
    return [
      {
        id: "e1000000-0000-0000-0000-000000000001",
        facilityName: "Bếp ăn Trường Mầm non Xã A",
        inspectionType: "SCHOOL_CANTEEN",
        inspectionDate: "2026-10-15",
        totalScore: 96,
        sampleRetention24hPassed: true,
        conclusion: "PASSED",
      },
      {
        id: "e1000000-0000-0000-0000-000000000002",
        facilityName: "Cơ sở bánh mỳ Anh Tuấn - Xóm A1",
        inspectionType: "STREET_FOOD",
        inspectionDate: "2026-10-20",
        totalScore: 78,
        sampleRetention24hPassed: false,
        conclusion: "WARNING_REMEDIAL",
      },
    ];
  }

  return data.map((row) => ({
    id: String(row.id),
    facilityName: String(row.facility_name),
    inspectionType: (row.inspection_type as FoodSafetyInspectionDTO["inspectionType"]) || "STREET_FOOD",
    inspectionDate: String(row.inspection_date),
    totalScore: Number(row.total_score) || 0,
    sampleRetention24hPassed: Boolean(row.sample_retention_24h_passed),
    conclusion: (row.conclusion as FoodSafetyInspectionDTO["conclusion"]) || "PASSED",
  }));
}

export async function getMedicalFacilities(ctx: RequestContext): Promise<MedicalFacilityDTO[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("medical_facilities")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .order("facility_name", { ascending: true });

  if (error || !data || data.length === 0) {
    return [
      {
        id: "e2000000-0000-0000-0000-000000000001",
        facilityName: "Nhà thuốc số 1 Xóm A1",
        facilitySubType: "DRUG_STORE",
        practitionerName: "Dược sĩ Nguyễn Thị Thoa",
        licenseNumber: "GPP-2023-889",
        licenseIssueDate: "2023-05-10",
        gppCertified: true,
        controlledDrugsLedger: true,
        inspectionStatus: "NORMAL",
      },
      {
        id: "e2000000-0000-0000-0000-000000000002",
        facilityName: "Phòng chẩn trị YHCT Lương y Đức",
        facilitySubType: "TRADITIONAL_CLINIC",
        practitionerName: "Lương y Vũ Văn Đức",
        licenseNumber: "YHCT-2022-104",
        licenseIssueDate: "2022-08-15",
        gppCertified: false,
        controlledDrugsLedger: false,
        inspectionStatus: "WARNING",
      },
    ];
  }

  return data.map((row) => ({
    id: String(row.id),
    facilityName: String(row.facility_name),
    facilitySubType: (row.facility_sub_type as MedicalFacilityDTO["facilitySubType"]) || "DRUG_STORE",
    practitionerName: String(row.practitioner_name),
    licenseNumber: String(row.license_number),
    licenseIssueDate: String(row.license_issue_date),
    gppCertified: Boolean(row.gpp_certified),
    controlledDrugsLedger: Boolean(row.controlled_drugs_ledger),
    inspectionStatus: (row.inspection_status as MedicalFacilityDTO["inspectionStatus"]) || "NORMAL",
  }));
}

export async function getEpidemicLogs(ctx: RequestContext): Promise<EpidemicLogDTO[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("epidemic_logs")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .order("reported_date", { ascending: false });

  if (error || !data || data.length === 0) {
    return [
      {
        id: "e3000000-0000-0000-0000-000000000001",
        hamletId: "A1",
        diseaseGroup: "GROUP_B",
        diseaseName: "Sốt xuất huyết Dengue",
        casesCount: 3,
        hospitalizedCount: 1,
        deathsCount: 0,
        outbreakAlertFlag: false,
        logWeek: 44,
        logYear: 2026,
        reportedDate: "2026-11-02",
      },
      {
        id: "e3000000-0000-0000-0000-000000000002",
        hamletId: "A2",
        diseaseGroup: "GROUP_B",
        diseaseName: "Cúm mùa",
        casesCount: 12,
        hospitalizedCount: 0,
        deathsCount: 0,
        outbreakAlertFlag: false,
        logWeek: 44,
        logYear: 2026,
        reportedDate: "2026-11-03",
      },
    ];
  }

  return data.map((row) => ({
    id: String(row.id),
    hamletId: String(row.hamlet_id),
    diseaseGroup: (row.disease_group as EpidemicLogDTO["diseaseGroup"]) || "GROUP_B",
    diseaseName: String(row.disease_name),
    casesCount: Number(row.cases_count) || 0,
    hospitalizedCount: Number(row.hospitalized_count) || 0,
    deathsCount: Number(row.deaths_count) || 0,
    outbreakAlertFlag: Boolean(row.outbreak_alert_flag),
    logWeek: Number(row.log_week) || 44,
    logYear: Number(row.log_year) || 2026,
    reportedDate: String(row.reported_date),
  }));
}
