"use client";

import * as React from "react";
import { useDemoContext, MetricFilter } from "@/lib/tenancy/demo-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Filter,
  X,
  FileCheck2,
} from "lucide-react";
import Link from "next/link";
import { TaskItem } from "@/lib/store/demo-state";

export default function BanLamViecPage() {
  const {
    tenant,
    persona,
    data,
    metrics,
    oracleMetrics,
    activeFilter,
    setActiveFilter,
  } = useDemoContext();

  const handleToggleFilter = (filter: MetricFilter) => {
    setActiveFilter(activeFilter === filter ? null : filter);
  };

  const getFilterName = (filter: MetricFilter): string => {
    switch (filter) {
      case "MET-01":
        return "Việc đang mở tại T";
      case "MET-02":
        return "Mở quá hạn tại T";
      case "MET-04":
        return "Độ phủ chỉ tiêu CĐS";
      case "MET-05":
        return "Kiến nghị kiểm tra hiện trường mở";
      default:
        return "";
    }
  };

  // Filtered task items based on active metric card selection (F01 Truy nguyên)
  const filteredTasks: TaskItem[] = React.useMemo(() => {
    if (!activeFilter) {
      return data.tasks;
    }
    if (activeFilter === "MET-01") {
      return data.tasks.filter(
        (t) => t.status !== "Hoàn thành" && t.status !== "Đã hủy"
      );
    }
    if (activeFilter === "MET-02") {
      return data.tasks.filter(
        (t) => t.isOverdue && t.status !== "Hoàn thành" && t.status !== "Đã hủy"
      );
    }
    if (activeFilter === "MET-04") {
      return data.tasks.filter(
        (t) =>
          t.domain.includes("CĐS") ||
          t.entityTag === "CĐS" ||
          t.metric === "MET-04" ||
          t.code === "TASK-A-005"
      );
    }
    if (activeFilter === "MET-05") {
      // Return open inspection recommendations formatted as tasks
      const recTasks: TaskItem[] = (data.recommendations || []).map((r) => ({
        id: r.id,
        code: r.code,
        title: r.title,
        domain: "Kiểm tra cơ sở (M08)",
        entityTag: r.facilityName,
        assignee: r.assignee,
        dueDate: undefined,
        dueText: r.dueText,
        isOverdue: r.isOverdue,
        status:
          r.status === "WAITING_OVERDUE"
            ? ("Quá hạn" as const)
            : r.status === "FEEDBACK_UNVERIFIED"
            ? ("Chờ phản hồi" as const)
            : ("Hoàn thành" as const),
        statusBg:
          r.status === "WAITING_OVERDUE"
            ? "bg-rose-50"
            : r.status === "FEEDBACK_UNVERIFIED"
            ? "bg-amber-50"
            : "bg-emerald-50",
        statusColor:
          r.status === "WAITING_OVERDUE"
            ? "text-rose-700"
            : r.status === "FEEDBACK_UNVERIFIED"
            ? "text-amber-700"
            : "text-emerald-700",
        statusBorder:
          r.status === "WAITING_OVERDUE"
            ? "border-rose-200"
            : r.status === "FEEDBACK_UNVERIFIED"
            ? "border-amber-200"
            : "border-emerald-200",
        icon: "ShieldAlert",
        metric: "MET-05" as const,
        tenantCode: r.tenantCode,
        targetUrl: "/kiem-tra",
      }));
      return recTasks.filter((t) => t.status !== "Hoàn thành");
    }
    return data.tasks;
  }, [data.tasks, data.recommendations, activeFilter]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1F633E]">
              {tenant.name}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">Hệ thống tác nghiệp số</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1 font-display">
            Bàn làm việc điều hành — {persona.roleTitle}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Chào mừng đồng chí <strong>{persona.name}</strong> ({persona.code}). Phân hệ tác nghiệp theo dõi hồ sơ, công việc và chỉ tiêu VH-XH cấp xã.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/ke-hoach-cong-viec">
            <Button variant="primary">
              <Calendar className="w-4 h-4 mr-1.5" />
              Lập kế hoạch công việc
            </Button>
          </Link>
        </div>
      </div>

      {/* P1 Security Guardrail Banner (Nguyên tắc D03 & AC-10) */}
      {persona.code === "P1" && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3 text-xs text-rose-900 shadow-xs">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Rào chắn bảo vệ dữ liệu P1 (Nguyên tắc D03 & AC-10):</span> Tài khoản Quản trị hệ thống P1 thuộc nhóm kỹ thuật nền tảng, <strong>không có thẩm quyền tra cứu dữ liệu cá nhân nhạy cảm (PII)</strong> hoặc hồ sơ bệnh án/an sinh chi tiết của công dân nếu chưa có căn cứ công vụ được phê duyệt bằng văn bản.
          </div>
        </div>
      )}

      {/* 4 Actionable KPI Cards with Reactive Metrics & Click-to-Filter (F01 Truy nguyên) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: MET-01 */}
        <Card
          onClick={() => handleToggleFilter("MET-01")}
          className={`cursor-pointer transition-all border ${
            activeFilter === "MET-01"
              ? "ring-2 ring-[#1F633E] border-[#1F633E] bg-emerald-50/40 shadow-sm"
              : "hover:border-[#95C7A8] hover:shadow-xs bg-white"
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                MET-01
              </span>
              <CardTitle className="text-xs font-semibold text-slate-700 mt-1">
                VIỆC ĐANG MỞ TẠI T
              </CardTitle>
            </div>
            <Clock className="w-4 h-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 font-display">
              {oracleMetrics.met01_openTasks}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {tenant.code === "XA_A"
                ? "01 quá hạn • 01 đến hạn T • 01 chưa hạn"
                : "02 việc đúng hạn • 00 quá hạn"}
            </p>
          </CardContent>
        </Card>

        {/* Card 2: MET-02 */}
        <Card
          onClick={() => handleToggleFilter("MET-02")}
          className={`cursor-pointer transition-all border ${
            activeFilter === "MET-02"
              ? "ring-2 ring-rose-600 border-rose-600 bg-rose-50/40 shadow-sm"
              : "hover:border-rose-300 hover:shadow-xs bg-white"
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-900">
                MET-02
              </span>
              <CardTitle className="text-xs font-semibold text-slate-700 mt-1">
                MỞ QUÁ HẠN TẠI T
              </CardTitle>
            </div>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 font-display">
              {oracleMetrics.met02_overdueTasks}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {tenant.code === "XA_A"
                ? "Task T3 quá hạn lúc 12:00 (RULE-08)"
                : "Không có việc quá hạn"}
            </p>
          </CardContent>
        </Card>

        {/* Card 3: MET-04 */}
        <Card
          onClick={() => {
            if (tenant.features.digitalTransformation) {
              handleToggleFilter("MET-04");
            }
          }}
          className={`transition-all border ${
            !tenant.features.digitalTransformation
              ? "opacity-60 cursor-not-allowed bg-slate-50"
              : activeFilter === "MET-04"
              ? "ring-2 ring-blue-600 border-blue-600 bg-blue-50/40 shadow-sm cursor-pointer"
              : "hover:border-blue-300 hover:shadow-xs bg-white cursor-pointer"
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-900">
                MET-04
              </span>
              <CardTitle className="text-xs font-semibold text-slate-700 mt-1">
                ĐỘ PHỦ CHỈ TIÊU CĐS
              </CardTitle>
            </div>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 font-display">
              {oracleMetrics.met04_cdsCoverage}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {tenant.features.digitalTransformation
                ? "3/5 ô xác nhận (1 ô = 0; 1 ô N/A)"
                : "Module M05 tắt tại xã B (READ_ONLY)"}
            </p>
          </CardContent>
        </Card>

        {/* Card 4: MET-05 */}
        <Card
          onClick={() => {
            if (tenant.features.fieldInspection) {
              handleToggleFilter("MET-05");
            }
          }}
          className={`transition-all border ${
            !tenant.features.fieldInspection
              ? "opacity-60 cursor-not-allowed bg-slate-50"
              : activeFilter === "MET-05"
              ? "ring-2 ring-indigo-600 border-indigo-600 bg-indigo-50/40 shadow-sm cursor-pointer"
              : "hover:border-indigo-300 hover:shadow-xs bg-white cursor-pointer"
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-900">
                MET-05
              </span>
              <CardTitle className="text-xs font-semibold text-slate-700 mt-1">
                KIẾN NGHỊ KIỂM TRA MỞ
              </CardTitle>
            </div>
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 font-display">
              {oracleMetrics.met05_openInspections}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {tenant.features.fieldInspection
                ? "1 chờ phản hồi quá hạn • 1 chờ xác minh"
                : "Module M08 tắt tại xã B (READ_ONLY)"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Filter Notification Bar */}
      {activeFilter && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-950 shadow-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              Đang lọc hàng đợi công việc theo chỉ số <strong>{activeFilter}</strong> ({getFilterName(activeFilter)}) • <strong>F01 Truy nguyên nghiệp vụ</strong>
            </span>
          </div>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setActiveFilter(null)}
            className="text-emerald-800 hover:bg-emerald-100/80 gap-1 font-semibold"
          >
            <X className="w-3.5 h-3.5" /> Bỏ lọc ({filteredTasks.length} kết quả)
          </Button>
        </div>
      )}

      {/* Main Grid: Priority Queues & Recent Work */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Hồ sơ & Việc cần làm */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <span>Hàng đợi hồ sơ & Nhiệm vụ ưu tiên giải quyết</span>
                  {activeFilter && (
                    <Badge variant="success" className="text-[10px]">
                      {activeFilter}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {activeFilter
                    ? `Danh sách việc tương ứng với chỉ số ${activeFilter}`
                    : `Danh sách hồ sơ thuộc thẩm quyền xử lý của ${persona.roleTitle}`}
                </CardDescription>
              </div>
              <Link
                href="/ke-hoach-cong-viec"
                className="text-xs text-[#1F633E] hover:underline font-semibold flex items-center gap-1"
              >
                Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              {filteredTasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  Không có công việc nào phù hợp với bộ lọc {activeFilter}.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredTasks.map((item) => (
                    <div
                      key={item.id}
                      className="py-3.5 flex items-start justify-between gap-3 hover:bg-slate-50/50 rounded-lg px-2 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${item.statusBg} ${item.statusColor} ${item.statusBorder}`}
                          >
                            {item.status}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {item.code}
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            {item.title}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Lĩnh vực: <strong>{item.domain}</strong> • Đơn vị/Thẻ: {item.entityTag} • Người xử lý: {item.assignee}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span>Hạn định: <strong className={item.isOverdue ? "text-rose-600 font-semibold" : "text-slate-600"}>{item.dueText}</strong></span>
                        </div>
                      </div>
                      <Link href={item.targetUrl || "/ke-hoach-cong-viec"}>
                        <Button
                          size="xs"
                          variant={item.isOverdue ? "danger" : "secondary"}
                        >
                          Xử lý
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Access to Domains */}
          <Card>
            <CardHeader>
              <CardTitle>Không gian nghiệp vụ chuyên ngành</CardTitle>
              <CardDescription>Truy cập trực tiếp các mảng chuyên môn theo phân quyền</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Link
                  href="/van-hoa-gia-dinh"
                  className="p-3 rounded-lg border border-slate-200 hover:border-[#1F633E] hover:bg-slate-50 transition-all flex flex-col gap-1.5"
                >
                  <span className="text-xs font-bold text-slate-800">Văn hóa & Gia đình</span>
                  <span className="text-[11px] text-slate-500">Bình xét GĐVH, di tích, lễ hội</span>
                </Link>
                <Link
                  href="/noi-vu"
                  className="p-3 rounded-lg border border-slate-200 hover:border-[#1F633E] hover:bg-slate-50 transition-all flex flex-col gap-1.5"
                >
                  <span className="text-xs font-bold text-slate-800">Nội vụ & CCHC</span>
                  <span className="text-[11px] text-slate-500">Cán bộ, thi đua, người có công</span>
                </Link>
                <Link
                  href="/y-te-an-sinh"
                  className="p-3 rounded-lg border border-slate-200 hover:border-[#1F633E] hover:bg-slate-50 transition-all flex flex-col gap-1.5"
                >
                  <span className="text-xs font-bold text-slate-800">Y tế & An sinh</span>
                  <span className="text-[11px] text-slate-500">Bảo trợ, hộ nghèo, y tế cơ sở</span>
                </Link>
                <Link
                  href="/kiem-tra"
                  className="p-3 rounded-lg border border-slate-200 hover:border-[#1F633E] hover:bg-slate-50 transition-all flex flex-col gap-1.5"
                >
                  <span className="text-xs font-bold text-slate-800">Kiểm tra & Kiến nghị</span>
                  <span className="text-[11px] text-slate-500">Hiện trường, biên bản, khắc phục</span>
                </Link>
                <Link
                  href="/bao-cao"
                  className="p-3 rounded-lg border border-slate-200 hover:border-[#1F633E] hover:bg-slate-50 transition-all flex flex-col gap-1.5"
                >
                  <span className="text-xs font-bold text-slate-800">Báo cáo & Snapshot</span>
                  <span className="text-[11px] text-slate-500">Tổng hợp chỉ tiêu, khóa kỳ số liệu</span>
                </Link>
                <Link
                  href="/du-lieu-dung-chung"
                  className="p-3 rounded-lg border border-slate-200 hover:border-[#1F633E] hover:bg-slate-50 transition-all flex flex-col gap-1.5"
                >
                  <span className="text-xs font-bold text-slate-800">Dữ liệu dùng chung</span>
                  <span className="text-[11px] text-slate-500">Chủ thể, cơ sở, danh mục địa bàn</span>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Thông báo & Cấu hình Tenant */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cấu hình mô phỏng (Tenant Info)</CardTitle>
              <CardDescription>Thông tin đơn vị hành chính đang thao tác</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Mã đơn vị:</span>
                <span className="font-semibold text-slate-800 font-mono">{tenant.code}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Tên đơn vị:</span>
                <span className="font-semibold text-slate-800">{tenant.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Tỉnh/Thành:</span>
                <span className="font-semibold text-slate-800">{tenant.province}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Số lượng xóm/thôn:</span>
                <span className="font-semibold text-slate-800">{tenant.hamlets.length} xóm</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Mô hình cán bộ:</span>
                <Badge variant={tenant.officerMode === "CONCURRENT" ? "info" : "neutral"}>
                  {tenant.officerMode === "CONCURRENT" ? "Kiêm nhiệm nhiều mảng" : "Phân nhiệm chuyên trách"}
                </Badge>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Chuyển đổi số:</span>
                <Badge variant={tenant.features.digitalTransformation ? "success" : "neutral"}>
                  {tenant.features.digitalTransformation ? "Đang bật" : "Tắt theo cấu hình"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#F2F8F4] border-[#95C7A8]">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-[#1F633E]">
                <ShieldCheck className="w-4 h-4" />
                <CardTitle className="text-xs uppercase tracking-wide">Nguyên tắc tác nghiệp D03</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-slate-700 space-y-2">
              <p>
                • <strong>Không tự cấp quyền/xử phạt:</strong> Kết quả trên hệ thống mang tính ghi nhận tham mưu, không thay thế quyết định hành chính có thẩm quyền.
              </p>
              <p>
                • <strong>Bảo vệ dữ liệu cá nhân:</strong> Lãnh đạo chung không mặc nhiên truy cập PII chi tiết nếu chưa có căn cứ công vụ.
              </p>
              <p>
                • <strong>Tính liên thông:</strong> Bấm vào 4 thẻ KPI phía trên để lọc hàng đợi công việc tương ứng theo mã chỉ tiêu Oracle.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
