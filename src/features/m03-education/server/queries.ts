import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { RequestContext } from "@/lib/auth/request-context";
import type { SchoolDTO, PrivateFacilityDTO, TuitionExemptionDTO } from "../types";

export async function getSchools(ctx: RequestContext): Promise<SchoolDTO[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("schools")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error("Không thể tải dữ liệu chuyên ngành; vui lòng thử lại.");
  }
  if (!data) return [];

  return data.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    level: (row.level as SchoolDTO["level"]) || "PRIMARY",
    principal: String(row.principal),
    totalStudents: Number(row.total_students) || 0,
    schoolYear: String(row.school_year),
    universalizationStandard: row.universalization_standard as SchoolDTO["universalizationStandard"],
  }));
}

export async function getPrivateChildcareFacilities(ctx: RequestContext): Promise<PrivateFacilityDTO[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("private_childcare_facilities")
    .select("id,name,facility_type,owner_name,capacity,current_enrolled,total_area_sqm,sqm_per_child,fire_safety_certified,food_safety_certified,licensing_status")
    .eq("tenant_id", ctx.tenantId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error("Không thể tải dữ liệu chuyên ngành; vui lòng thử lại.");
  }
  if (!data) return [];

  return data.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    facilityType: (row.facility_type as PrivateFacilityDTO["facilityType"]) || "INDEPENDENT_NURSERY_GROUP",
    ownerName: String(row.owner_name),
    ownerCccd: "", // PII intentionally never selected from browser-facing query.
    capacity: Number(row.capacity) || 0,
    currentEnrolled: Number(row.current_enrolled) || 0,
    totalAreaSqm: Number(row.total_area_sqm) || 0,
    sqmPerChild: Number(row.sqm_per_child) || 0,
    fireSafetyCertified: Boolean(row.fire_safety_certified),
    foodSafetyCertified: Boolean(row.food_safety_certified),
    licensingStatus: (row.licensing_status as PrivateFacilityDTO["licensingStatus"]) || "LICENSED",
  }));
}

export async function getTuitionExemptions(ctx: RequestContext): Promise<TuitionExemptionDTO[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("tuition_exemptions")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .order("student_name", { ascending: true });

  if (error) {
    throw new Error("Không thể tải dữ liệu chuyên ngành; vui lòng thử lại.");
  }
  if (!data) return [];

  return data.map((row) => ({
    id: String(row.id),
    studentName: String(row.student_name),
    schoolName: String(row.school_name),
    grade: String(row.grade),
    category: (row.category as TuitionExemptionDTO["category"]) || "POOR_HOUSEHOLD",
    exemptionPercent: Number(row.exemption_percent),
    supportAmount: Number(row.support_amount) || 0,
    status: (row.status as TuitionExemptionDTO["status"]) || "PENDING",
    semester: String(row.semester),
    version: Number(row.version),
    decisionReference: row.decision_reference ? String(row.decision_reference) : null,
  }));
}
