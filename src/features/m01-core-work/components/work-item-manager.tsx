"use client";

import * as React from "react";
import { Plus, Search, CheckCircle2, AlertCircle, RefreshCw, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { transitionWorkItemAction } from "../server/actions";
import { CreateWorkItemModal } from "./create-work-item-modal";
import { WorkItemDetailModal } from "./work-item-detail-modal";
import { WorkItemReturnModal } from "./work-item-return-modal";
import type { WorkItemDTO } from "../types";

interface WorkItemManagerProps {
  readonly initialItems: WorkItemDTO[];
  readonly userPermissions: readonly string[];
  readonly userRoles: readonly string[];
  readonly focusItemId?: string;
  readonly initialDashboardFilter?: string;
}

export function WorkItemManager({
  initialItems,
  userPermissions = [],
  userRoles = [],
  focusItemId,
  initialDashboardFilter,
}: WorkItemManagerProps) {
  const [items, setItems] = React.useState<WorkItemDTO[]>(initialItems);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = React.useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("ALL");
  const allowedDashboardFilters = ["all", "overdue", "soon", "returned", "review", "unassigned", "progress"];
  const [dashboardFilter, setDashboardFilter] = React.useState(() => allowedDashboardFilters.includes(initialDashboardFilter ?? "") ? initialDashboardFilter! : "all");

  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  // Deep links from Dashboard open only items already authorized by the server query.
  const [selectedItem, setSelectedItem] = React.useState<WorkItemDTO | null>(
    () => initialItems.find((item) => item.id === focusItemId) ?? null
  );
  const [returnModalItem, setReturnModalItem] = React.useState<WorkItemDTO | null>(null);

  const [transitionLoading, setTransitionLoading] = React.useState(false);
  const [conflictError, setConflictError] = React.useState<string | null>(null);
  const [successToast, setSuccessToast] = React.useState<string | null>(null);

  const canCreate = userPermissions.includes("m01:work:create") || userPermissions.includes("m01:full") || userRoles.includes("LANH_DAO_XA") || userRoles.includes("admin");
  const canEdit = userPermissions.includes("m01:work:update") || userPermissions.includes("m01:full") || userRoles.includes("CONG_CHUC_VHXH") || userRoles.includes("admin");
  const canApprove = userPermissions.includes("m01:work_item:approve") || userPermissions.includes("m01:full") || userRoles.includes("LANH_DAO_XA") || userRoles.includes("admin");

  const filteredItems = React.useMemo(() => {
    return items.filter((item) => {
      if (dashboardFilter !== "all") {
        const closed = item.status === "COMPLETED" || item.status === "CANCELLED";
        const now = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
        const due = item.dueDate?.slice(0, 10);
        if (dashboardFilter === "overdue" && (closed || !due || due >= now)) return false;
        if (dashboardFilter === "soon" && (closed || !due || due < now || (Date.parse(due + "T00:00:00Z") - Date.parse(now + "T00:00:00Z")) / 86400000 > 7)) return false;
        if (dashboardFilter === "returned" && item.status !== "RETURNED") return false;
        if (dashboardFilter === "review" && item.status !== "UNDER_REVIEW") return false;
        if (dashboardFilter === "unassigned" && (closed || item.assignedTo)) return false;
        if (dashboardFilter === "progress" && item.status !== "IN_PROGRESS") return false;
        if (dashboardFilter === "all" && closed) return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        if (!item.title.toLowerCase().includes(query) && !item.description?.toLowerCase().includes(query)) return false;
      }
      if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
      if (priorityFilter !== "ALL" && item.priority !== priorityFilter) return false;
      if (categoryFilter !== "ALL" && item.category !== categoryFilter) return false;
      return true;
    });
  }, [items, searchQuery, statusFilter, priorityFilter, categoryFilter, dashboardFilter]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleTransition = async (item: WorkItemDTO, toState: string, reason?: string | null) => {
    setTransitionLoading(true);
    setConflictError(null);
    try {
      const res = await transitionWorkItemAction({ id: item.id, toState, expectedVersion: item.version, reason: reason ?? null });
      if (!res.ok) {
        if (res.error?.code === "VERSION_CONFLICT") {
          setConflictError("Xung đột phiên bản (409 VERSION_CONFLICT): Dữ liệu công việc đã được cập nhật bởi một phiên làm việc khác. Vui lòng tải lại trang để nhận dữ liệu mới nhất.");
        } else {
          alert(res.error?.message || "Có lỗi xảy ra khi chuyển trạng thái.");
        }
        return;
      }
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: toState as WorkItemDTO["status"], version: res.data.version } : i));
      if (selectedItem?.id === item.id) {
        setSelectedItem((prev) => (prev ? { ...prev, status: toState as WorkItemDTO["status"], version: res.data.version } : null));
      }
      setReturnModalItem(null);
      showToast(`Chuyển trạng thái công việc sang [${toState}] thành công!`);
    } catch {
      setConflictError("Lỗi kết nối. Vui lòng kiểm tra lại đường truyền.");
    } finally {
      setTransitionLoading(false);
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "URGENT": return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">Khẩn cấp</span>;
      case "HIGH": return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-orange-100 text-orange-800 border border-orange-200">Cao</span>;
      case "LOW": return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">Thấp</span>;
      default: return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-100 text-blue-800 border border-blue-200">Bình thường</span>;
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "NEW": return <Badge variant="neutral">Mới tạo</Badge>;
      case "ASSIGNED": return <Badge variant="neutral">Đã giao việc</Badge>;
      case "IN_PROGRESS": return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">Đang xử lý</span>;
      case "UNDER_REVIEW": return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-100 text-purple-900 border border-purple-300">Chờ phê duyệt</span>;
      case "COMPLETED": return <Badge variant="success">Hoàn thành</Badge>;
      case "RETURNED": return <Badge variant="danger">Yêu cầu làm lại</Badge>;
      default: return <Badge variant="neutral">{s}</Badge>;
    }
  };

  const getCategoryLabel = (cat?: string | null) => {
    switch (cat) {
      case "VAN_HOA": return "Văn hóa - Gia đình";
      case "LAO_DONG_XH": return "Lao động - An sinh";
      case "CHUYEN_DOI_SO": return "Chuyển đổi số & KHCN";
      case "GIAO_DUC": return "Giáo dục & Đào tạo";
      default: return "Hành chính chung";
    }
  };

  return (
    <div className="space-y-6">
      {successToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-700 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{successToast}</span>
        </div>
      )}

      {conflictError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
            <span>{conflictError}</span>
          </div>
          <Button size="xs" variant="outline" onClick={() => window.location.reload()} className="shrink-0 ml-4">
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Tải lại trang
          </Button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Quản lý công việc điều hành & tác nghiệp</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Phân công, theo dõi tiến độ, kiểm soát hạn xử lý và ký duyệt hồ sơ công việc cấp xã
          </p>
        </div>
        {canCreate && (
          <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)} className="flex items-center gap-1.5 shadow-xs">
            <Plus className="w-4 h-4" />
            <span>Giao việc mới</span>
          </Button>
        )}
      </div>

      {dashboardFilter !== "all" && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-900 flex items-center justify-between gap-3"><span>Danh sách được lọc từ chỉ số Dashboard · {filteredItems.length} công việc phù hợp</span><button type="button" className="font-semibold underline" onClick={() => setDashboardFilter("all")}>Xóa lọc Dashboard</button></div>}
      <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tiêu đề hoặc nội dung công việc..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-700">
              <option value="ALL">Tất cả trạng thái</option>
              <option value="NEW">Mới tạo</option>
              <option value="IN_PROGRESS">Đang xử lý</option>
              <option value="UNDER_REVIEW">Chờ phê duyệt</option>
              <option value="COMPLETED">Đã hoàn thành</option>
              <option value="RETURNED">Yêu cầu làm lại</option>
            </select>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-700">
              <option value="ALL">Mọi độ ưu tiên</option>
              <option value="URGENT">Khẩn cấp</option>
              <option value="HIGH">Cao</option>
              <option value="MEDIUM">Bình thường</option>
              <option value="LOW">Thấp</option>
            </select>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-700">
              <option value="ALL">Tất cả lĩnh vực</option>
              <option value="VAN_HOA">Văn hóa - Gia đình</option>
              <option value="LAO_DONG_XH">Lao động - An sinh</option>
              <option value="CHUYEN_DOI_SO">Chuyển đổi số & KHCN</option>
              <option value="GIAO_DUC">Giáo dục & Đào tạo</option>
              <option value="CHUNG">Hành chính chung</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="px-4 py-3 w-28">Mã việc</th>
                <th className="px-4 py-3">Tiêu đề & Nội dung</th>
                <th className="px-4 py-3 w-36">Lĩnh vực</th>
                <th className="px-4 py-3 w-28">Độ ưu tiên</th>
                <th className="px-4 py-3 w-32">Hạn hoàn thành</th>
                <th className="px-4 py-3 w-32">Trạng thái</th>
                <th className="px-4 py-3 text-right w-44">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    Không tìm thấy nhiệm vụ công việc nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{item.id.slice(0, 8)}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 line-clamp-1">{item.title}</div>
                      {item.description && <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{item.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700">{getCategoryLabel(item.category)}</span>
                    </td>
                    <td className="px-4 py-3">{getPriorityBadge(item.priority)}</td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">
                      {item.dueDate ? new Date(item.dueDate).toLocaleDateString("vi-VN") : "—"}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(item.status)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button size="xs" variant="outline" onClick={() => setSelectedItem(item)} className="h-7 text-[11px] px-2">
                          <Eye className="w-3 h-3 mr-1" /> Chi tiết
                        </Button>
                        {item.status === "NEW" && canEdit && (
                          <Button size="xs" variant="primary" disabled={transitionLoading} onClick={() => handleTransition(item, "IN_PROGRESS")} className="h-7 text-[11px] px-2">
                            Tiếp nhận
                          </Button>
                        )}
                        {item.status === "IN_PROGRESS" && canEdit && (
                          <Button size="xs" variant="primary" disabled={transitionLoading} onClick={() => handleTransition(item, "UNDER_REVIEW")} className="h-7 text-[11px] px-2">
                            Trình duyệt
                          </Button>
                        )}
                        {item.status === "UNDER_REVIEW" && canApprove && (
                          <Button size="xs" variant="primary" disabled={transitionLoading} onClick={() => handleTransition(item, "COMPLETED")} className="h-7 text-[11px] px-2 bg-emerald-700 hover:bg-emerald-800">
                            Phê duyệt
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateWorkItemModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(newItem) => {
          setItems((prev) => [newItem, ...prev]);
          showToast("Tạo nhiệm vụ công việc mới thành công!");
        }}
      />

      <WorkItemDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        canEdit={canEdit}
        canApprove={canApprove}
        transitionLoading={transitionLoading}
        onTransition={handleTransition}
        onRequestReturn={(it) => setReturnModalItem(it)}
        getStatusBadge={getStatusBadge}
        getPriorityBadge={getPriorityBadge}
        getCategoryLabel={getCategoryLabel}
      />

      <WorkItemReturnModal
        item={returnModalItem}
        onClose={() => setReturnModalItem(null)}
        transitionLoading={transitionLoading}
        onConfirm={(it, reason) => handleTransition(it, "RETURNED", reason)}
      />
    </div>
  );
}
