import { getRequestContext } from "@/lib/auth/request-context";
import { assertRoutePermission } from "@/config/navigation";
import { getWorkItems } from "@/features/m01-core-work/server/queries";

export default async function CongViecPage() {
  const ctx = await getRequestContext();
  assertRoutePermission("/cong-viec", ctx.permissions, ctx.roles);

  const workItems = await getWorkItems(ctx);

  const formatPriority = (p: string) => {
    switch (p) {
      case "URGENT": return { label: "Khẩn", cls: "bg-red-50 text-red-700 border border-red-200" };
      case "HIGH": return { label: "Cao", cls: "bg-orange-50 text-orange-700 border border-orange-200" };
      case "MEDIUM": return { label: "Trung bình", cls: "bg-blue-50 text-blue-700 border border-blue-200" };
      default: return { label: "Thấp", cls: "bg-slate-100 text-slate-700" };
    }
  };

  const formatStatus = (s: string) => {
    switch (s) {
      case "COMPLETED": return { label: "Hoàn thành", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" };
      case "IN_PROGRESS": return { label: "Đang thực hiện", cls: "bg-amber-50 text-amber-700 border border-amber-200" };
      case "UNDER_REVIEW": return { label: "Chờ phê duyệt", cls: "bg-purple-50 text-purple-700 border border-purple-200" };
      default: return { label: "Đã phân công", cls: "bg-slate-100 text-slate-700" };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Quản lý công việc</h1>
          <p className="text-xs text-slate-500">
            Danh sách nhiệm vụ điều hành và tác nghiệp chuyên môn cấp xã
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
            <tr>
              <th className="px-4 py-3">Tiêu đề công việc</th>
              <th className="px-4 py-3">Mức độ</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Hạn hoàn thành</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {workItems.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  Chưa có công việc nào trong hệ thống
                </td>
              </tr>
            ) : (
              workItems.map((item) => {
                const priorityInfo = formatPriority(item.priority);
                const statusInfo = formatStatus(item.status);

                return (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{item.title}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${priorityInfo.cls}`}>
                        {priorityInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${statusInfo.cls}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {item.dueDate ? new Date(item.dueDate).toLocaleDateString("vi-VN") : "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
