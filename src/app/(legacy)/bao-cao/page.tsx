"use client";

import * as React from "react";
import { useDemo } from "@/lib/tenancy/demo-context";
import { maskPII } from "@/lib/authorization/pii-mask";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Tabs, TabList, TabTrigger, TabContent } from "@/components/ui/tabs";
import { SlideOverDrawer } from "@/components/ui/slide-over";
import {
  BarChart3,
  FileCheck2,
  Lock,
  Download,
  Search,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  TrendingUp,
  ExternalLink,
  ShieldAlert,
  Check,
  Eye,
  AlertTriangle,
  FileText,
  Database,
  Layers,
  ArrowRight,
  Clock,
  Award,
  Building,
  Landmark,
  Cpu,
  Smartphone,
  Shield,
  FileSpreadsheet,
} from "lucide-react";

export type SnapshotRevisionType = "LIVE" | "REV_1" | "REV_2";

export default function BaoCaoPage() {
  const { tenant, persona, data, metrics, oracleMetrics } = useDemo();

  // Snapshot Revision state
  const [revision, setRevision] = React.useState<SnapshotRevisionType>("REV_1");

  // Active Report Tab: "r01" | "r02" | "r03" | "r04" | "r05"
  const [activeTab, setActiveTab] = React.useState<string>("r01");

  // Lineage Drawer state
  const [isLineageOpen, setIsLineageOpen] = React.useState<boolean>(false);
  const [lineageTab, setLineageTab] = React.useState<string>("r01");

  // Live data calculations
  const culturalTitles = data?.culturalTitles || [];
  const cdsMatrix = data?.cdsMatrix || [];
  const recommendations = data?.recommendations || data?.inspections || [];
  const tasks = data?.tasks || [];

  // Live DEM-R01
  const liveTasksTotal = tasks.length;
  const liveTasksOpen = tasks.filter((t) => t.status !== "Hoàn thành" && t.status !== "Đã hủy").length;
  const liveTasksOverdue = tasks.filter((t) => t.status !== "Hoàn thành" && t.status !== "Đã hủy" && t.isOverdue).length;
  const liveTasksClosed = tasks.filter((t) => t.status === "Hoàn thành").length;
  const liveTasksCancelled = tasks.filter((t) => t.status === "Đã hủy").length;

  // Live DEM-R02
  const liveSubmittedCultural = culturalTitles.filter((t) => t.status !== "DRAFT" && t.status !== "CANCELLED");
  const liveApprovedCultural = liveSubmittedCultural.filter((t) => t.status === "APPROVED");
  const liveCulturalRate =
    liveSubmittedCultural.length > 0
      ? `${((liveApprovedCultural.length / liveSubmittedCultural.length) * 100).toFixed(1)}%`
      : "0.0%";

  // Live DEM-R03
  const liveApplicableCds = cdsMatrix.filter((c) => c.status !== "NOT_APPLICABLE");
  const liveConfirmedCds = liveApplicableCds.filter((c) => c.status === "CONFIRMED" || c.status === "CONFIRMED_ZERO");
  const liveCdsRate =
    liveApplicableCds.length > 0
      ? `${Math.round((liveConfirmedCds.length / liveApplicableCds.length) * 100)}%`
      : "0%";

  // Live DEM-R04
  const liveOpenRecommendations = recommendations.filter((r) => r.status !== "RESOLVED_CLOSED").length;
  const liveClosedRecommendations = recommendations.filter((r) => r.status === "RESOLVED_CLOSED").length;

  // Rev 1 Frozen Golden Oracle Values (Immutable at Cutoff T 07/11/2026 17:00:00+07:00)
  const isRev1 = revision === "REV_1";
  const isLive = revision === "LIVE";
  const isRev2 = revision === "REV_2";

  // Data displayed according to revision selection
  // In Rev 1, numbers remain 100% frozen regardless of modifications in live view
  const displayR01 = isRev1
    ? { total: 6, open: 3, overdue: 1, closed: 2, cancelled: 1 }
    : isRev2
    ? { total: 6, open: 3, overdue: 1, closed: 2, cancelled: 1 }
    : { total: liveTasksTotal, open: liveTasksOpen, overdue: liveTasksOverdue, closed: liveTasksClosed, cancelled: liveTasksCancelled };

  const displayR02 = isRev1
    ? { submitted: 4, approved: 2, pending: 2, rate: "50.0%", excluded: 2 }
    : isRev2
    ? { submitted: 4, approved: 2, pending: 2, rate: "50.0%", excluded: 2 }
    : {
        submitted: liveSubmittedCultural.length,
        approved: liveApprovedCultural.length,
        pending: liveSubmittedCultural.length - liveApprovedCultural.length,
        rate: liveCulturalRate,
        excluded: culturalTitles.filter((t) => t.status === "DRAFT" || t.status === "CANCELLED").length,
      };

  const displayR03 = isRev1
    ? { applicable: 5, confirmed: 3, rate: "60.0%" }
    : isRev2
    ? { applicable: 5, confirmed: 3, rate: "60.0%" }
    : {
        applicable: liveApplicableCds.length,
        confirmed: liveConfirmedCds.length,
        rate: liveCdsRate,
      };

  const displayR04 = isRev1
    ? { facilities: 1, open: 2, closed: 1 }
    : isRev2
    ? { facilities: 1, open: 2, closed: 1 }
    : { facilities: 1, open: liveOpenRecommendations, closed: liveClosedRecommendations };

  // Can view PII flag for Lineage Drawer Guard (V12, AC-24)
  const canViewPII = Boolean(persona.canViewPII);

  // Open lineage drawer helper
  const handleOpenLineage = (tabKey: string) => {
    setLineageTab(tabKey);
    setIsLineageOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
              PHÂN HỆ M09
            </span>
            <span className="text-xs text-slate-500 font-medium">
              5 BÁO CÁO GOLDEN ORACLE • TRUY NGUYÊN NGUỒN TÍNH LINEAGE
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1 font-display">
            Thống kê, Báo cáo & Giám sát Chỉ số Quản trị
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Bộ 5 báo cáo Oracle DEM-R01..R05, chứng minh tính bất biến Snapshot Revision Rev 1 và kiểm soát bảo mật PII Lineage Drawer (V12, AC-24).
          </p>
        </div>

        {/* SNAPSHOT REVISION SELECTOR (RULE-13, AC-18, V11) */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 px-2">Kỳ chốt:</span>

          <button
            type="button"
            onClick={() => setRevision("LIVE")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              isLive
                ? "bg-white text-blue-700 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Live View (Thời gian thực)
          </button>

          <button
            type="button"
            onClick={() => setRevision("REV_1")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              isRev1
                ? "bg-white text-emerald-800 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Rev 1 (Chốt Cutoff T)
          </button>

          <button
            type="button"
            onClick={() => setRevision("REV_2")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              isRev2
                ? "bg-white text-amber-700 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Rev 2 (Điều chỉnh)
          </button>
        </div>
      </div>

      {/* SNAPSHOT REVISION BANNER (RULE-13, V11 IMMUTABILITY PROOF) */}
      <div
        className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          isRev1
            ? "bg-emerald-50 border-emerald-200 text-emerald-950"
            : isLive
            ? "bg-blue-50 border-blue-200 text-blue-950"
            : "bg-amber-50 border-amber-200 text-amber-950"
        }`}
      >
        <div className="flex items-start gap-3">
          {isRev1 ? (
            <Lock className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          ) : isLive ? (
            <TrendingUp className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
          ) : (
            <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          )}

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wide">
                {isRev1
                  ? "BẢN CHỐT SNAPSHOT KỲ THÁNG 10/2026 REVISION 1 (BẤT BIẾN / IMMUTABLE)"
                  : isLive
                  ? "CHẾ ĐỘ XEM TRỰC TIẾP (LIVE DATA VIEW)"
                  : "BẢN CHỐT ĐIỀU CHỈNH REVISION 2 (DỰ THẢO SAU PHÚC TRA)"}
              </h3>
            </div>
            <p className="text-xs leading-relaxed opacity-90">
              {isRev1
                ? "Số liệu đã đóng băng tại mốc Cutoff T (07/11/2026 17:00:00+07:00). Mọi sửa đổi tác nghiệp sau mốc T không làm sai lệch bản ghi này (RULE-13, V11)."
                : isLive
                ? "Dữ liệu được cập nhật tức thời theo các giao dịch nghiệp vụ đang diễn ra (phê duyệt GĐVH, đối soát ô CĐS, xác nhận khắc phục hiện trường)."
                : "Bản điều chỉnh số liệu có giải trình kèm theo quyết định phúc tra của đoàn kiểm toán sau kỳ báo cáo."}
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {isRev1 && (
            <span className="text-[11px] font-mono font-bold bg-emerald-700 text-white px-2.5 py-1 rounded shadow-xs">
              IMMUTABLE v1.0
            </span>
          )}
          {isLive && (
            <span className="text-[11px] font-mono font-bold bg-blue-600 text-white px-2.5 py-1 rounded shadow-xs">
              LIVE DYNAMIC
            </span>
          )}
          {isRev2 && (
            <span className="text-[11px] font-mono font-bold bg-amber-600 text-white px-2.5 py-1 rounded shadow-xs">
              AUDITED v2.0
            </span>
          )}
        </div>
      </div>

      {/* 5 TABS GOLDEN ORACLE (DEM-R01..R05) */}
      <Tabs defaultValue="r01" className="w-full">
        <TabList className="bg-slate-100 p-1 rounded-lg">
          <TabTrigger value="r01" className="gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-700" />
            <span>DEM-R01: Tiến độ Công việc</span>
          </TabTrigger>
          <TabTrigger value="r02" className="gap-1.5">
            <Award className="w-3.5 h-3.5 text-emerald-600" />
            <span>DEM-R02: Danh hiệu Gia đình VH (50%)</span>
          </TabTrigger>
          <TabTrigger value="r03" className="gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-blue-600" />
            <span>DEM-R03: Chỉ tiêu CĐS (MET-04: 60%)</span>
          </TabTrigger>
          <TabTrigger value="r04" className="gap-1.5">
            <Building className="w-3.5 h-3.5 text-amber-600" />
            <span>DEM-R04: Kiến nghị Kiểm tra (MET-05)</span>
          </TabTrigger>
          <TabTrigger value="r05" className="gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
            <span>DEM-R05: Tổng hợp Quản trị (Cockpit)</span>
          </TabTrigger>
        </TabList>

        {/* =========================================================================
            TAB 1: DEM-R01 TIẾN ĐỘ CÔNG VIỆC & NHIỆM VỤ (MET-01/02)
           ========================================================================= */}
        <TabContent value="r01" className="space-y-4 pt-2">
          <Card className="border border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  GOLDEN ORACLE DEM-R01
                </span>
                <CardTitle className="text-sm font-bold text-slate-900 mt-0.5">
                  Báo cáo Tiến độ thực hiện Kế hoạch & Nhiệm vụ tại mốc Cutoff T
                </CardTitle>
                <CardDescription className="text-xs">
                  Thời điểm chốt: 07/11/2026 17:00:00+07:00 • Chuẩn đếm RULE-08
                </CardDescription>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs text-slate-700"
                onClick={() => handleOpenLineage("r01")}
              >
                <ExternalLink className="w-3.5 h-3.5" /> Truy xuất nguồn tính (Lineage)
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-[11px] text-slate-500 font-medium">TỔNG NHIỆM VỤ</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1 font-display">
                    {displayR01.total < 10 ? `0${displayR01.total}` : displayR01.total}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Nhiệm vụ giao kỳ</div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="text-[11px] text-amber-800 font-semibold">ĐANG MỞ (MET-01)</div>
                  <div className="text-2xl font-bold text-amber-700 mt-1 font-display">
                    {displayR01.open < 10 ? `0${displayR01.open}` : displayR01.open}
                  </div>
                  <div className="text-[10px] text-amber-700 mt-1">Đang xử lý trong hạn</div>
                </div>

                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
                  <div className="text-[11px] text-rose-800 font-semibold">QUÁ HẠN TẠI T (MET-02)</div>
                  <div className="text-2xl font-bold text-rose-700 mt-1 font-display">
                    {displayR01.overdue < 10 ? `0${displayR01.overdue}` : displayR01.overdue}
                  </div>
                  <div className="text-[10px] text-rose-700 mt-1">Trễ hạn lúc 12:00 trưa</div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="text-[11px] text-emerald-800 font-semibold">HOÀN THÀNH</div>
                  <div className="text-2xl font-bold text-emerald-700 mt-1 font-display">
                    {displayR01.closed < 10 ? `0${displayR01.closed}` : displayR01.closed}
                  </div>
                  <div className="text-[10px] text-emerald-700 mt-1">Hoàn thành đúng hạn</div>
                </div>

                <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg">
                  <div className="text-[11px] text-slate-600 font-medium">ĐÃ HỦY</div>
                  <div className="text-2xl font-bold text-slate-700 mt-1 font-display">
                    {displayR01.cancelled < 10 ? `0${displayR01.cancelled}` : displayR01.cancelled}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Hoãn do kinh phí</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabContent>

        {/* =========================================================================
            TAB 2: DEM-R02 DANH HIỆU GIA ĐÌNH VĂN HÓA (50%)
           ========================================================================= */}
        <TabContent value="r02" className="space-y-4 pt-2">
          <Card className="border border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  GOLDEN ORACLE DEM-R02
                </span>
                <CardTitle className="text-sm font-bold text-slate-900 mt-0.5">
                  Báo cáo Đánh giá Danh hiệu Gia đình Văn hóa (Khống chế Trần 50%)
                </CardTitle>
                <CardDescription className="text-xs">
                  Quy tắc tính: Chỉ tính tỷ lệ trên hồ sơ ĐÃ NỘP (H1..H4). Hồ sơ nháp (H5) và hủy (H6) không tính vào mẫu số.
                </CardDescription>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs text-slate-700"
                onClick={() => handleOpenLineage("r02")}
              >
                <ExternalLink className="w-3.5 h-3.5" /> Công thức & Nguồn tính
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-[11px] text-slate-500 font-medium">TỔNG NỘP THEO DÕI</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1 font-display">
                    {displayR02.submitted < 10 ? `0${displayR02.submitted}` : displayR02.submitted}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Hồ sơ đã nộp</div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="text-[11px] text-emerald-800 font-semibold">KẾT QUẢ MÔ PHỎNG ĐẠT</div>
                  <div className="text-2xl font-bold text-emerald-700 mt-1 font-display">
                    {displayR02.approved < 10 ? `0${displayR02.approved}` : displayR02.approved}
                  </div>
                  <div className="text-[10px] text-emerald-700 mt-1">H1 (Đạt), H2 (Đạt)</div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="text-[11px] text-amber-800 font-semibold">CHỜ DUYỆT / BỔ SUNG</div>
                  <div className="text-2xl font-bold text-amber-700 mt-1 font-display">
                    {displayR02.pending < 10 ? `0${displayR02.pending}` : displayR02.pending}
                  </div>
                  <div className="text-[10px] text-amber-700 mt-1">H3 (Chờ), H4 (Bổ sung)</div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-[11px] text-blue-800 font-semibold">TỶ LỆ ĐẠT MÔ PHỎNG</div>
                  <div className="text-2xl font-bold text-blue-700 mt-1 font-display">
                    {displayR02.rate}
                  </div>
                  <div className="text-[10px] text-blue-700 mt-1">Đúng trần 50% theo QĐ 74</div>
                </div>

                <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg">
                  <div className="text-[11px] text-slate-600 font-medium">LOẠI NGOÀI MẪU SỐ</div>
                  <div className="text-2xl font-bold text-slate-700 mt-1 font-display">
                    {displayR02.excluded < 10 ? `0${displayR02.excluded}` : displayR02.excluded}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">H5 (Nháp) + H6 (Hủy)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabContent>

        {/* =========================================================================
            TAB 3: DEM-R03 CHỈ TIÊU CHUYỂN ĐỔI SỐ (MET-04: 60%)
           ========================================================================= */}
        <TabContent value="r03" className="space-y-4 pt-2">
          <Card className="border border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  GOLDEN ORACLE DEM-R03
                </span>
                <CardTitle className="text-sm font-bold text-slate-900 mt-0.5">
                  Báo cáo Chỉ tiêu Chuyển đổi số & 4 Trạng thái Dữ liệu (AC-17)
                </CardTitle>
                <CardDescription className="text-xs">
                  Độ phủ chỉ tiêu MET-04 = {displayR03.rate} ({displayR03.confirmed}/{displayR03.applicable} chỉ tiêu áp dụng đã xác nhận, có 1 chỉ tiêu mang giá trị 0).
                </CardDescription>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs text-slate-700"
                onClick={() => handleOpenLineage("r03")}
              >
                <ExternalLink className="w-3.5 h-3.5" /> Chi tiết độ phủ MET-04
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-[11px] text-slate-500 font-medium">Ô CHỈ TIÊU ÁP DỤNG</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1 font-display">
                    {displayR03.applicable} ô
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Tổng 6 ô trừ 1 ô N/A</div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="text-[11px] text-emerald-800 font-semibold">ĐÃ XÁC NHẬN ĐỐI SOÁT</div>
                  <div className="text-2xl font-bold text-emerald-700 mt-1 font-display">
                    {displayR03.confirmed} ô
                  </div>
                  <div className="text-[10px] text-emerald-700 mt-1">Bao gồm 1 ô = 0 hợp lệ (RULE-14)</div>
                </div>

                <div className="p-3 bg-emerald-950 text-white rounded-lg">
                  <div className="text-[11px] text-emerald-300 font-semibold">ĐỘ PHỦ MET-04</div>
                  <div className="text-2xl font-bold text-white mt-1 font-display">
                    {displayR03.rate}
                  </div>
                  <div className="text-[10px] text-emerald-300 mt-1">Khớp Golden Oracle DEM-R03</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabContent>

        {/* =========================================================================
            TAB 4: DEM-R04 KIẾN NGHỊ KIỂM TRA HIỆN TRƯỜNG (MET-05: 02 MỞ)
           ========================================================================= */}
        <TabContent value="r04" className="space-y-4 pt-2">
          <Card className="border border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  GOLDEN ORACLE DEM-R04
                </span>
                <CardTitle className="text-sm font-bold text-slate-900 mt-0.5">
                  Báo cáo Kết quả Kiểm tra Cơ sở & Xử lý Kiến nghị Hiện trường
                </CardTitle>
                <CardDescription className="text-xs">
                  Theo dõi khắc phục an toàn PCCC và thiết chế tại Nhà văn hóa thôn Đồng Tiến
                </CardDescription>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs text-slate-700"
                onClick={() => handleOpenLineage("r04")}
              >
                <ExternalLink className="w-3.5 h-3.5" /> Nguồn kiến nghị MET-05
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-[11px] text-slate-500 font-medium">CƠ SỞ KIỂM TRA</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1 font-display">
                    01 cơ sở
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">NVH Thôn Đồng Tiến (2 đợt)</div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="text-[11px] text-amber-800 font-semibold">KIẾN NGHỊ ĐANG MỞ (MET-05)</div>
                  <div className="text-2xl font-bold text-amber-700 mt-1 font-display">
                    {displayR04.open < 10 ? `0${displayR04.open}` : displayR04.open} kiến nghị
                  </div>
                  <div className="text-[10px] text-amber-700 mt-1">Gồm 1 quá hạn + 1 chờ xác minh</div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="text-[11px] text-emerald-800 font-semibold">ĐÃ XÁC MINH ĐÓNG</div>
                  <div className="text-2xl font-bold text-emerald-700 mt-1 font-display">
                    {displayR04.closed < 10 ? `0${displayR04.closed}` : displayR04.closed} kiến nghị
                  </div>
                  <div className="text-[10px] text-emerald-700 mt-1">KN-03 hoàn thành nghiệm thu</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabContent>

        {/* =========================================================================
            TAB 5: DEM-R05 BÁO CÁO TỔNG HỢP QUẢN TRỊ (EXECUTIVE COCKPIT)
           ========================================================================= */}
        <TabContent value="r05" className="space-y-4 pt-2">
          <Card className="border border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">
                  GOLDEN ORACLE DEM-R05
                </span>
                <CardTitle className="text-sm font-bold text-slate-900 mt-0.5">
                  Báo cáo Tổng hợp Quản trị (Executive Cockpit — 5 Chỉ số Then chốt)
                </CardTitle>
                <CardDescription className="text-xs">
                  Bảng điều khiển tập trung số liệu chỉ đạo điều hành của Lãnh đạo UBND xã
                </CardDescription>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs text-slate-700"
                onClick={() => handleOpenLineage("r05")}
              >
                <ExternalLink className="w-3.5 h-3.5" /> Tổng hợp nguồn dữ liệu
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <span className="text-[10px] font-mono font-bold text-slate-500">MET-01</span>
                  <div className="text-xl font-bold text-slate-900 mt-1 font-display">
                    {displayR01.open < 10 ? `0${displayR01.open}` : displayR01.open} việc
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Việc mở</p>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <span className="text-[10px] font-mono font-bold text-rose-600">MET-02</span>
                  <div className="text-xl font-bold text-rose-700 mt-1 font-display">
                    {displayR01.overdue < 10 ? `0${displayR01.overdue}` : displayR01.overdue} việc
                  </div>
                  <p className="text-[10px] text-rose-600 mt-1">Việc quá hạn</p>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <span className="text-[10px] font-mono font-bold text-emerald-600">MET-03</span>
                  <div className="text-xl font-bold text-emerald-700 mt-1 font-display">
                    {displayR02.rate}
                  </div>
                  <p className="text-[10px] text-emerald-700 mt-1">GĐVH đạt chuẩn</p>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <span className="text-[10px] font-mono font-bold text-blue-600">MET-04</span>
                  <div className="text-xl font-bold text-blue-700 mt-1 font-display">
                    {displayR03.rate}
                  </div>
                  <p className="text-[10px] text-blue-700 mt-1">Độ phủ CĐS</p>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <span className="text-[10px] font-mono font-bold text-amber-600">MET-05</span>
                  <div className="text-xl font-bold text-amber-700 mt-1 font-display">
                    {displayR04.open < 10 ? `0${displayR04.open}` : displayR04.open} kiến nghị
                  </div>
                  <p className="text-[10px] text-amber-700 mt-1">Kiến nghị KT mở</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabContent>
      </Tabs>

      {/* LINEAGE DRAWER (SlideOverDrawer) WITH AGGREGATE-ONLY GUARD (V12, AC-24) */}
      <SlideOverDrawer
        isOpen={isLineageOpen}
        onClose={() => setIsLineageOpen(false)}
        title="Truy nguyên Nguồn tính Chỉ tiêu (Lineage Explorer)"
        description={`Chỉ tiêu: ${lineageTab.toUpperCase()} • Phân quyền: ${persona.code} (${persona.name})`}
        badge={
          canViewPII ? (
            <Badge variant="success">PII Authorized</Badge>
          ) : (
            <Badge variant="warning">Aggregate-Only</Badge>
          )
        }
      >
        <div className="space-y-5 text-xs text-slate-700">
          {/* PII AGGREGATE-ONLY GUARD NOTICE (V12, AC-24) */}
          {!canViewPII ? (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-lg space-y-1.5 text-amber-900">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                <h4 className="font-bold uppercase tracking-wider text-[11px]">
                  BẢO VỆ DỮ LIỆU NHẠY CẢM (AGGREGATE-ONLY / RULE V12 / AC-24)
                </h4>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800">
                Tài khoản <strong>{persona.name} ({persona.code})</strong> có cờ <code>canViewPII: false</code>. Hệ thống kích hoạt hàng rào bảo mật Aggregate-Only: Bạn được quyền xem công thức toán học và số lượng tổng hợp, nhưng danh sách bản ghi cá nhân định danh (CCCD, Họ tên, Nạn nhân) bị che hoặc khóa xem chi tiết.
              </p>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="font-semibold text-[11px]">
                Tài khoản có quyền xem chi tiết danh sách nguồn tính (canViewPII: true).
              </span>
            </div>
          )}

          {/* Mathematical Formula Derivation */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              Công thức Toán học & Điều kiện Lọc Nguồn
            </h4>

            {lineageTab === "r01" && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px] space-y-1">
                <p className="text-slate-800">
                  <strong>MET-01:</strong> COUNT(tasks WHERE status != &apos;Hoàn thành&apos; AND status != &apos;Đã hủy&apos;) = {displayR01.open}
                </p>
                <p className="text-slate-800">
                  <strong>MET-02:</strong> COUNT(tasks WHERE status != &apos;Hoàn thành&apos; AND isOverdue == true) = {displayR01.overdue}
                </p>
                <p className="text-slate-500 mt-1">Bảng nguồn: <code>tasks_queue</code></p>
              </div>
            )}

            {lineageTab === "r02" && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px] space-y-1">
                <p className="text-slate-800">
                  <strong>Tỷ lệ GĐVH:</strong> (Hộ đạt / Hộ đã nộp theo dõi) × 100%
                </p>
                <p className="text-slate-800">
                  = ({displayR02.approved} / {displayR02.submitted}) × 100% = {displayR02.rate}
                </p>
                <p className="text-slate-500 mt-1">
                  Bảng nguồn: <code>cultural_titles</code> (Loại trừ DRAFT và CANCELLED)
                </p>
              </div>
            )}

            {lineageTab === "r03" && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px] space-y-1">
                <p className="text-slate-800">
                  <strong>MET-04:</strong> (Ô đã xác nhận / Ô áp dụng) × 100%
                </p>
                <p className="text-slate-800">
                  = ({displayR03.confirmed} / {displayR03.applicable}) × 100% = {displayR03.rate}
                </p>
                <p className="text-slate-500 mt-1">
                  Bảng nguồn: <code>digital_transformation_cells</code> (Trừ NOT_APPLICABLE)
                </p>
              </div>
            )}

            {lineageTab === "r04" && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px] space-y-1">
                <p className="text-slate-800">
                  <strong>MET-05:</strong> COUNT(recommendations WHERE status != &apos;RESOLVED_CLOSED&apos;) = {displayR04.open}
                </p>
                <p className="text-slate-500 mt-1">
                  Bảng nguồn: <code>inspection_recommendations</code>
                </p>
              </div>
            )}

            {lineageTab === "r05" && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px] space-y-1">
                <p className="text-slate-800">
                  Hội tụ 5 chỉ số: MET-01={displayR01.open}, MET-02={displayR01.overdue}, MET-03={displayR02.rate}, MET-04={displayR03.rate}, MET-05={displayR04.open}
                </p>
                <p className="text-slate-500 mt-1">
                  Bảng nguồn: <code>report_snapshots (DEM-R-OCT-2026)</code>
                </p>
              </div>
            )}
          </div>

          {/* Drill-down Records List */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center justify-between">
              <span>Danh sách Bản ghi Gốc (Origin Drill-down)</span>
              <span className="text-[10px] font-mono text-slate-500 font-normal">
                {canViewPII ? "Đầy đủ danh tính" : "Bị che PII theo luật"}
              </span>
            </h4>

            {lineageTab === "r02" && (
              <div className="space-y-1.5">
                {culturalTitles.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded border border-slate-200 bg-white flex items-center justify-between"
                  >
                    <div>
                      <div className="font-mono text-[11px] font-bold text-slate-800">{item.code}</div>
                      <div className="text-xs text-slate-700">
                        Chủ hộ: <strong>{canViewPII ? item.householdHead : maskPII(item.householdHead, "general", false)}</strong> ({item.hamlet})
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800">
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {lineageTab !== "r02" && (
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center text-slate-500 text-xs">
                {lineageTab === "r01" && `Đang có ${displayR01.open} nhiệm vụ đang mở tính vào MET-01.`}
                {lineageTab === "r03" && `Đang có ${displayR03.confirmed} ô chỉ tiêu đã xác nhận tính vào MET-04.`}
                {lineageTab === "r04" && `Đang có ${displayR04.open} kiến nghị hiện trường tính vào MET-05.`}
                {lineageTab === "r05" && `Hội tụ đầy đủ 5/5 chỉ tiêu quản trị cấp xã.`}
              </div>
            )}
          </div>
        </div>
      </SlideOverDrawer>
    </div>
  );
}
