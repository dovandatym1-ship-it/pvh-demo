import { getRequestContext } from "@/lib/auth/request-context";
import { assertCanReadInternalAffairs, canViewUnmaskedPII } from "@/features/m02-internal-affairs/server/policy";
import {
  getNCCBeneficiaries,
  getLaborContracts,
  getLaborDisputes,
} from "@/features/m02-internal-affairs/server/queries";
import { NCCTable } from "@/features/m02-internal-affairs/components/ncc-table";
import { LaborPanels } from "@/features/m02-internal-affairs/components/labor-panels";
import { Building } from "lucide-react";

export default async function NoiVuAppPage() {
  const ctx = await getRequestContext();
  assertCanReadInternalAffairs(ctx);

  const canUnmask = canViewUnmaskedPII(ctx);

  const [nccBeneficiaries, laborContracts, laborDisputes] = await Promise.all([
    getNCCBeneficiaries(ctx),
    getLaborContracts(ctx),
    getLaborDisputes(ctx),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Building className="w-6 h-6 text-[#1F633E]" />
            <h1 className="text-xl font-bold text-slate-900">
              Nội vụ, Lao động & Người có công
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-600">
            Quản lý hồ sơ chính sách người có công, thi đua khen thưởng, giám sát tiền lương tối thiểu và hòa giải tranh chấp lao động cơ sở.
          </p>
        </div>
      </div>

      <NCCTable items={nccBeneficiaries} canUnmaskPII={canUnmask} />

      <div className="pt-4">
        <LaborPanels contracts={laborContracts} disputes={laborDisputes} />
      </div>
    </div>
  );
}
