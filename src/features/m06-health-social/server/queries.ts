import "server-only";
import { assertCanReadHealthSocial } from "./policy";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { RequestContext } from "@/lib/auth/request-context";
import type {
  SocialBeneficiaryDTO,
  FoodSafetyInspectionDTO,
  MedicalFacilityDTO,
  EpidemicLogDTO,
} from "../types";

export async function getSocialBeneficiaries(ctx: RequestContext): Promise<SocialBeneficiaryDTO[]> {
  assertCanReadHealthSocial(ctx);
  // Never SELECT raw beneficiary PII through public tables. The RPC verifies
  // the live membership, scoped hamlets and field-level unmask permission.
  const db = await createServerSupabaseClient();
  const { data, error } = await db.schema("app").rpc("list_social_beneficiaries", {p_limit:1000});
  if (error || !Array.isArray(data)) {
    throw new Error("Không thể tải hồ sơ bảo trợ xã hội theo quyền hiện hành.");
  }
  return data.map(row => ({
    id: String(row.id), code: String(row.code),
    fullName: String(row.full_name),
    cccd: typeof row.cccd === "string" ? row.cccd : "",
    phone: typeof row.phone === "string" ? row.phone : undefined,
    hamletId: String(row.hamlet_id),aidCategory: String(row.aid_category),
    monthlyAmount: row.monthly_amount === null ? 0 : Number(row.monthly_amount),
    diagnosis: typeof row.diagnosis === "string" ? row.diagnosis : undefined,
    paymentStatus: row.payment_status as SocialBeneficiaryDTO["paymentStatus"],
    healthInsuranceProvided: Boolean(row.health_insurance_provided),
    version: Number(row.version),
    createdAt: String(row.created_at),updatedAt: String(row.updated_at),
  }));
}

export async function getFoodSafetyInspections(ctx: RequestContext): Promise<FoodSafetyInspectionDTO[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("food_safety_inspections")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .order("inspection_date", { ascending: false });

  if (error) {
    throw new Error("Không thể tải dữ liệu chuyên ngành; vui lòng thử lại.");
  }
  if (!data) return [];

  return data.map((row) => ({
    id: String(row.id),
    facilityName: String(row.facility_name),
    inspectionType: (row.inspection_type as FoodSafetyInspectionDTO["inspectionType"]) || "STREET_FOOD",
    inspectionDate: String(row.inspection_date),
    totalScore: row.total_score === null ? null : Number(row.total_score),
    sampleRetention24hPassed: row.sample_retention_24h_passed === null ? null : Boolean(row.sample_retention_24h_passed),
    conclusion: (row.conclusion as FoodSafetyInspectionDTO["conclusion"]) || "PENDING",
  }));
}

export async function getMedicalFacilities(ctx: RequestContext): Promise<MedicalFacilityDTO[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("medical_facilities")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .order("facility_name", { ascending: true });

  if (error) {
    throw new Error("Không thể tải dữ liệu chuyên ngành; vui lòng thử lại.");
  }
  if (!data) return [];

  return data.map((row) => ({
    id: String(row.id),
    facilityName: String(row.facility_name),
    facilitySubType: (row.facility_sub_type as MedicalFacilityDTO["facilitySubType"]) || "DRUG_STORE",
    practitionerName: String(row.practitioner_name),
    licenseNumber: row.license_number ? String(row.license_number) : "",
    licenseIssueDate: row.license_issue_date ? String(row.license_issue_date) : "",
    gppCertified: Boolean(row.gpp_certified),
    controlledDrugsLedger: Boolean(row.controlled_drugs_ledger),
    inspectionStatus: (row.inspection_status as MedicalFacilityDTO["inspectionStatus"]) || "UNVERIFIED",
  }));
}

export async function getEpidemicLogs(ctx: RequestContext): Promise<EpidemicLogDTO[]> {
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("epidemic_logs")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .order("reported_date", { ascending: false });
  if (ctx.scopes.hamletIds) {
    if (ctx.scopes.hamletIds.length === 0) return [];
    query = query.in("hamlet_id", [...ctx.scopes.hamletIds]);
  }
  const { data, error } = await query;

  if (error) {
    throw new Error("Không thể tải dữ liệu chuyên ngành; vui lòng thử lại.");
  }
  if (!data) return [];

  return data.map((row) => ({
    id: String(row.id),
    hamletId: String(row.hamlet_id),
    diseaseGroup: (row.disease_group as EpidemicLogDTO["diseaseGroup"]) || "GROUP_B",
    diseaseName: String(row.disease_name),
    casesCount: Number(row.cases_count) || 0,
    hospitalizedCount: Number(row.hospitalized_count) || 0,
    deathsCount: Number(row.deaths_count) || 0,
    outbreakAlertFlag: Boolean(row.outbreak_alert_flag),
    logWeek: Number(row.log_week),
    logYear: Number(row.log_year),
    reportedDate: String(row.reported_date),
  }));
}


/** M06 địa bàn choices come from tenant-scoped, active org units and live RLS. */
export async function getSocialHamlets(ctx: RequestContext): Promise<{ id: string; name: string }[]> {
  assertCanReadHealthSocial(ctx);
  if (ctx.scopes.hamletIds && ctx.scopes.hamletIds.length === 0) return [];
  const db = await createServerSupabaseClient();
  const { data, error } = await db.from("org_units").select("id,name")
    .eq("tenant_id", ctx.tenantId).eq("kind", "HAMLET")
    .eq("is_active", true).order("name");
  if (error) throw new Error("Không thể tải danh mục thôn, xóm; vui lòng thử lại.");
  return (data || []).filter(row => !ctx.scopes.hamletIds || ctx.scopes.hamletIds.includes(row.id))
    .map(row => ({ id: row.id, name: row.name }));
}
