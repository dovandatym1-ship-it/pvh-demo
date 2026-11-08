import { getRequestContext } from "@/lib/auth/request-context";
import { assertRoutePermission } from "@/config/navigation";
import {
  getReportSnapshots,
  getReportCatalog,
} from "@/features/m09-reporting/server/queries";
import { ReportManager } from "@/features/m09-reporting/components/report-manager";

export const dynamic = "force-dynamic";

export default async function BaoCaoAppPage() {
  const ctx = await getRequestContext();
  assertRoutePermission("/bao-cao", ctx.permissions, ctx.roles);

  const [snapshots, catalog] = await Promise.all([
    getReportSnapshots(ctx), getReportCatalog(ctx),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Báo cáo thống kê & Chỉ tiêu phát triển văn hóa - xã hội
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Báo cáo có kỳ, nguồn, phiên bản và truy vết. Chỉ số được lấy từ CSDL khi tạo bản nháp và đóng băng theo phiên bản.
          </p>
        </div>
        <div className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5">
          MÔ PHỎNG DEMO — KHÔNG CÓ GIÁ TRỊ PHÁP LÝ
        </div>
      </div>

      {ctx.permissions.includes("m10:indicator:import") && (
        <a href="/nhap-chi-tieu" className="inline-flex rounded-md border border-indigo-200 bg-white px-3 py-2 text-sm font-medium text-indigo-700">
          Nhập chỉ tiêu từ CSV (M10)
        </a>
      )}

      <ReportManager
        initialSnapshots={snapshots}
        catalog={catalog}
        userId={ctx.userId}
        userPermissions={ctx.permissions}
      />
    </div>
  );
}
