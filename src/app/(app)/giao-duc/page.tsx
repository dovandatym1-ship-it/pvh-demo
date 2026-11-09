import { getRequestContext } from "@/lib/auth/request-context";
import { assertCanReadEducation } from "@/features/m03-education/server/policy";
import {
  getSchools,
  getPrivateChildcareFacilities,
  getTuitionExemptions,
} from "@/features/m03-education/server/queries";
import { SchoolTable } from "@/features/m03-education/components/school-table";
import { ExemptionTable } from "@/features/m03-education/components/exemption-table";
import { GraduationCap } from "lucide-react";

export default async function GiaoDucAppPage() {
  const ctx = await getRequestContext();
  assertCanReadEducation(ctx);

  const canManage =
    ctx.permissions.includes("m03:education:write") ||
    ctx.roles.includes("chu_tich_xa") ||
    ctx.roles.includes("can_bo_chuyen_trach") ||
    ctx.permissions.includes("admin");

  const [schools, privateFacilities, exemptions] = await Promise.all([
    getSchools(ctx),
    getPrivateChildcareFacilities(ctx),
    getTuitionExemptions(ctx),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-[#1F633E]" />
            <h1 className="text-xl font-bold text-slate-900">
              Giáo dục và đào tạo
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-600">
            Theo dõi phổ cập giáo dục, mạng lưới trường mầm non, tiểu học và trung học cơ sở và chính sách miễn giảm học phí.
          </p>
        </div>
      </div>

      <SchoolTable schools={schools} privateFacilities={privateFacilities} />

      <div className="pt-4">
        <ExemptionTable items={exemptions} canManage={canManage} />
      </div>
    </div>
  );
}
