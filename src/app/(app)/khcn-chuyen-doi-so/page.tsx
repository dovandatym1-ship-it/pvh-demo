import { getRequestContext } from "@/lib/auth/request-context";
import { assertCanReadDigital } from "@/features/m05-science-digital/server/policy";
import {
  getDigitalIndicators,
  getCommunityDigitalTeams,
} from "@/features/m05-science-digital/server/queries";
import { DTIIndicatorTable } from "@/features/m05-science-digital/components/dti-indicator-table";
import { DigitalTeamsPanel } from "@/features/m05-science-digital/components/digital-teams-panel";
import { Cpu } from "lucide-react";

export default async function KhcnChuyenDoiSoAppPage() {
  const ctx = await getRequestContext();
  assertCanReadDigital(ctx);

  const canManage =
    ctx.permissions.includes("m05:digital:write") ||
    ctx.roles.includes("chu_tich_xa") ||
    ctx.roles.includes("can_bo_chuyen_trach") ||
    ctx.permissions.includes("admin");

  const [indicators, digitalTeams] = await Promise.all([
    getDigitalIndicators(ctx),
    getCommunityDigitalTeams(ctx),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-6 h-6 text-[#1F633E]" />
            <h1 className="text-xl font-bold text-slate-900">
              Khoa học, công nghệ và chuyển đổi số
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-600">
            Theo dõi các chỉ tiêu chuyển đổi số cấp xã và hoạt động của tổ công nghệ số cộng đồng.
          </p>
        </div>
      </div>

      <DTIIndicatorTable items={indicators} canManage={canManage} />

      <div className="pt-4">
        <DigitalTeamsPanel items={digitalTeams} />
      </div>
    </div>
  );
}
