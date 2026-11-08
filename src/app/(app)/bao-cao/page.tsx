import { getRequestContext } from "@/lib/auth/request-context";
import { assertRoutePermission } from "@/config/navigation";
import {
  getReportSnapshots,
  getSnapshotLineage,
} from "@/features/m09-reporting/server/queries";
import { ReportManager } from "@/features/m09-reporting/components/report-manager";

export const dynamic = "force-dynamic";

export default async function BaoCaoAppPage() {
  const ctx = await getRequestContext();
  assertRoutePermission("/bao-cao", ctx.permissions, ctx.roles);

  const snapshots = await getReportSnapshots(ctx);
  const initialLineage =
    snapshots.length > 0 ? await getSnapshotLineage(ctx, snapshots[0].id) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Báo cáo thống kê & Snapshot chỉ tiêu (M09 / DEM-R01)
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Truy xuất số liệu trực tiếp từ cơ sở dữ liệu hoặc kiểm tra các bản snapshot bất biến đã chốt ký số điện tử.
          </p>
        </div>
        <div className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-md font-medium">
          [MÔ PHỎNG DEMO — KHÔNG CÓ GIÁ TRỊ PHÁP LÝ]
        </div>
      </div>

      <ReportManager
        initialSnapshots={snapshots}
        initialLineage={initialLineage}
        userPermissions={ctx.permissions}
        userRoles={ctx.roles}
      />
    </div>
  );
}
