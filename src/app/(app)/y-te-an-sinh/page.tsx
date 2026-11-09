import { getRequestContext } from "@/lib/auth/request-context";
import { assertCanReadHealthSocial, canViewUnmaskedPII } from "@/features/m06-health-social/server/policy";
import {
  getSocialBeneficiaries,
  getFoodSafetyInspections,
  getMedicalFacilities,
  getEpidemicLogs,
  getSocialHamlets,
} from "@/features/m06-health-social/server/queries";
import { BeneficiaryTable } from "@/features/m06-health-social/components/beneficiary-table";
import { HealthInspectionPanels } from "@/features/m06-health-social/components/health-inspection-panels";
import { HeartHandshake } from "lucide-react";
import { toSocialDisplayRows } from "@/lib/authorization/display-sensitive";

export default async function YTeAnSinhAppPage() {
  const ctx = await getRequestContext();
  assertCanReadHealthSocial(ctx);

  const canUnmask = canViewUnmaskedPII(ctx);
  const canManage =
    ctx.permissions.includes("m06:social:write");

  const [beneficiaries, foodSafeties, medicalFacilities, epidemicLogs, hamlets] = await Promise.all([
    getSocialBeneficiaries(ctx),
    getFoodSafetyInspections(ctx),
    getMedicalFacilities(ctx),
    getEpidemicLogs(ctx),
    getSocialHamlets(ctx),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-6 h-6 text-[#1F633E]" />
            <h1 className="text-xl font-bold text-slate-900">
              Y tế và an sinh xã hội
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-600">
            Quản lý đối tượng bảo trợ xã hội, giám sát an toàn thực phẩm, cơ sở y dược và dịch bệnh cơ sở.
          </p>
        </div>
      </div>

      <BeneficiaryTable
        items={toSocialDisplayRows(beneficiaries, canUnmask)}
        hamlets={hamlets}
        canUnmaskPII={canUnmask}
        canManage={canManage}
      />

      <div className="pt-4">
        <HealthInspectionPanels
          foodSafeties={foodSafeties}
          medicalFacilities={medicalFacilities}
          epidemicLogs={epidemicLogs}
        />
      </div>
    </div>
  );
}
