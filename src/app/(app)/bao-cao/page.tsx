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
            Báo cáo thống kê và chỉ tiêu văn hóa – xã hội
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Xem số liệu trong hệ thống và đối chiếu các phiên bản chỉ tiêu đã chốt.
          </p>
        </div>
        <div className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Dữ liệu từ hệ thống
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
