import { getRequestContext } from "@/lib/auth/request-context";
import { assertCanReadInspections } from "@/features/m08-inspections/server/policy";
import {
  getInspectionRecords,
  getInspectionRecommendations,
} from "@/features/m08-inspections/server/queries";
import { InspectionTable } from "@/features/m08-inspections/components/inspection-table";
import { RecommendationsPanel } from "@/features/m08-inspections/components/recommendations-panel";
import { ClipboardList } from "lucide-react";

export default async function KiemTraAppPage() {
  const ctx = await getRequestContext();
  assertCanReadInspections(ctx);

  const canManage =
    ctx.permissions.includes("m08:inspection:write") ||
    ctx.roles.includes("chu_tich_xa") ||
    ctx.roles.includes("can_bo_chuyen_trach") ||
    ctx.permissions.includes("admin");

  const [records, recommendations] = await Promise.all([
    getInspectionRecords(ctx),
    getInspectionRecommendations(ctx),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-[#1F633E]" />
            <h1 className="text-xl font-bold text-slate-900">
              Kiểm tra & Xử lý Kiến nghị (M08 / DEM-KT)
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-600">
            Theo dõi các đợt kiểm tra liên ngành (ATTP, PCCC, Y tế), giám sát tiến độ khắc phục kiến nghị và chỉ tiêu MET-05.
          </p>
        </div>
      </div>

      <InspectionTable items={records} />

      <div className="pt-4">
        <RecommendationsPanel items={recommendations} canManage={canManage} />
      </div>
    </div>
  );
}
