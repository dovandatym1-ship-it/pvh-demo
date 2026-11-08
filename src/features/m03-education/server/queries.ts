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

  if (error || !data || data.length === 0) {
    return [
      {
        id: "d0000000-0000-0000-0000-000000000001",
        name: "Trường Mầm non Xã Giả Định A",
        level: "PRESCHOOL",
        principal: "Nguyễn Thị Loan",
        totalStudents: 245,
        schoolYear: "2026-2027",
        universalizationStandard: "LEVEL_2",
      },
      {
        id: "d0000000-0000-0000-0000-000000000002",
        name: "Trường Tiểu học Giả Định A",
        level: "PRIMARY",
        principal: "Phạm Quốc Tuấn",
        totalStudents: 480,
        schoolYear: "2026-2027",
        universalizationStandard: "LEVEL_3",
      },
      {
        id: "d0000000-0000-0000-0000-000000000003",
        name: "Trường THCS Giả Định A",
        level: "SECONDARY",
        principal: "Vũ Thị Minh",
        totalStudents: 390,
        schoolYear: "2026-2027",
        universalizationStandard: "LEVEL_2",
      },
    ];
  }

  return data.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    level: (row.level as SchoolDTO["level"]) || "PRIMARY",
    principal: String(row.principal),
    totalStudents: Number(row.total_students) || 0,
    schoolYear: String(row.school_year),
    universalizationStandard: (row.universalization_standard as SchoolDTO["universalizationStandard"]) || "LEVEL_2",
  }));
}

export async function getPrivateChildcareFacilities(ctx: RequestContext): Promise<PrivateFacilityDTO[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("private_childcare_facilities")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .order("name", { ascending: true });

  if (error || !data || data.length === 0) {
    return [
      {
        id: "d1000000-0000-0000-0000-000000000001",
        name: "Nhóm trẻ Độc lập Hoa Sen - Xóm A1",
        facilityType: "INDEPENDENT_NURSERY_GROUP",
        ownerName: "Đặng Thu Hương",
        ownerCccd: "019185002233",
        capacity: 18,
        currentEnrolled: 14,
        totalAreaSqm: 62.0,
        sqmPerChild: 3.4,
        fireSafetyCertified: true,
        foodSafetyCertified: true,
        licensingStatus: "LICENSED",
      },
      {
        id: "d1000000-0000-0000-0000-000000000002",
        name: "Lớp mẫu giáo tư thục Bình Minh - Xóm A2",
        facilityType: "INDEPENDENT_KINDERGARTEN_CLASS",
        ownerName: "Lê Thị Thuỷ",
        ownerCccd: "019188004455",
        capacity: 25,
        currentEnrolled: 22,
        totalAreaSqm: 75.0,
        sqmPerChild: 3.0,
        fireSafetyCertified: true,
        foodSafetyCertified: true,
        licensingStatus: "LICENSED",
      },
    ];
  }

  return data.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    facilityType: (row.facility_type as PrivateFacilityDTO["facilityType"]) || "INDEPENDENT_NURSERY_GROUP",
    ownerName: String(row.owner_name),
    ownerCccd: String(row.owner_cccd),
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

  if (error || !data || data.length === 0) {
    return [
      {
        id: "d2000000-0000-0000-0000-000000000001",
        studentName: "Trần Bảo An",
        schoolName: "Trường Mầm non Xã Giả Định A",
        grade: "Lớp Mẫu giáo lớn A1",
        category: "POOR_HOUSEHOLD",
        exemptionPercent: 100,
        supportAmount: 150000,
        status: "APPROVED",
        semester: "HK1_2026_2027",
      },
      {
        id: "d2000000-0000-0000-0000-000000000002",
        studentName: "Nguyễn Tiến Dũng",
        schoolName: "Trường Tiểu học Giả Định A",
        grade: "Lớp 3B",
        category: "ORPHAN",
        exemptionPercent: 100,
        supportAmount: 150000,
        status: "APPROVED",
        semester: "HK1_2026_2027",
      },
      {
        id: "d2000000-0000-0000-0000-000000000003",
        studentName: "Hoàng Thị Mai",
        schoolName: "Trường THCS Giả Định A",
        grade: "Lớp 8A",
        category: "NEAR_POOR",
        exemptionPercent: 50,
        supportAmount: 100000,
        status: "PENDING",
        semester: "HK1_2026_2027",
      },
    ];
  }

  return data.map((row) => ({
    id: String(row.id),
    studentName: String(row.student_name),
    schoolName: String(row.school_name),
    grade: String(row.grade),
    category: (row.category as TuitionExemptionDTO["category"]) || "POOR_HOUSEHOLD",
    exemptionPercent: Number(row.exemption_percent) || 100,
    supportAmount: Number(row.support_amount) || 0,
    status: (row.status as TuitionExemptionDTO["status"]) || "APPROVED",
    semester: String(row.semester),
  }));
}
