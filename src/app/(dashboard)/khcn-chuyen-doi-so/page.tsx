"use client";

import * as React from "react";
import { useDemo } from "@/lib/tenancy/demo-context";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import {
  Cpu,
  Smartphone,
  ShieldAlert,
  CheckCircle2,
  QrCode,
  Info,
  Check,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Play,
  RotateCcw,
  Plus,
  BarChart3,
  Lock,
  ExternalLink,
  Users,
  Radio,
  FileCheck2,
} from "lucide-react";
import type { CdsCellItem } from "@/lib/store/demo-state";

interface StepperStep {
  number: number;
  code: string;
  name: string;
  role: string;
  desc: string;
  rule: string;
}

const KH_STEPS: StepperStep[] = [
  {
    number: 1,
    code: "KH1",
    name: "Lập kế hoạch",
    role: "P4 (Phó Chủ tịch UBND)",
    desc: "Thiết lập kế hoạch CĐS năm, lựa chọn bộ chỉ tiêu cấp xã và phê duyệt danh mục giao việc.",
    rule: "Nghị quyết 01-NQ/TU Thái Nguyên; Kế hoạch CĐS xã 2026",
  },
  {
    number: 2,
    code: "KH2",
    name: "Giao việc Tổ CNS",
    role: "P5 (Cán bộ phụ trách CĐS)",
    desc: "Phân bổ 6 chỉ tiêu thu thập cho các Tổ CNSCĐ theo từng thôn/xóm và bộ phận Một cửa.",
    rule: "QĐ thành lập Tổ CNSCĐ 08 thôn; REQ-M05-01",
  },
  {
    number: 3,
    code: "KH3",
    name: "Tuyên truyền cơ sở",
    role: "P6 (Trưởng thôn / Tổ trưởng CNS)",
    desc: "Đi từng ngõ, gõ từng nhà hướng dẫn cài đặt VNeID Mức 2 và ứng dụng C-ThaiNguyen.",
    rule: "Chỉ đạo Đề án 06/CP; mô hình Thôn thông minh",
  },
  {
    number: 4,
    code: "KH4",
    name: "Thu thập số liệu",
    role: "P6 (Tổ CNSCĐ)",
    desc: "Nhập biểu mẫu thu thập số liệu định kỳ kỳ tháng 10/2026, đính kèm biên bản đối soát CA xã.",
    rule: "Biểu mẫu BM-CDS-02; kiểm tra nguồn số liệu",
  },
  {
    number: 5,
    code: "KH5",
    name: "Đối soát số 0",
    role: "P5 (Cán bộ đối soát)",
    desc: "Kiểm tra kỹ lưỡng ô có giá trị = 0; phân biệt rõ số 0 là kết quả đạt chuẩn với tình trạng thiếu số liệu.",
    rule: "RULE-14: Số 0 là dữ liệu hợp lệ (CONFIRMED_ZERO), cấm nhầm lẫn với Missing",
  },
  {
    number: 6,
    code: "KH6",
    name: "Duyệt ma trận",
    role: "P5 (Cán bộ chuyên môn)",
    desc: "Duyệt từng ô chỉ tiêu đạt yêu cầu minh chứng, kích hoạt tính toán tự động độ phủ MET-04 (60.0%).",
    rule: "AC-17: 4 trạng thái dữ liệu; MET-04 = Confirmed / (Total - N/A)",
  },
  {
    number: 7,
    code: "KH7",
    name: "Thẩm tra tổng hợp",
    role: "P4 (Lãnh đạo phụ trách)",
    desc: "Kiểm tra toàn diện ma trận số liệu 6 ô trước khi chuyển ký số báo cáo định kỳ.",
    rule: "Quy chế làm việc UBND xã; D03 trách nhiệm công vụ",
  },
  {
    number: 8,
    code: "KH8",
    name: "Chốt DEM-R03",
    role: "P3 / P1 (Lãnh đạo UBND xã)",
    desc: "Ký số phát hành Báo cáo Chỉ tiêu CĐS Tháng 10/2026, niêm phong snapshot bất biến lúc 17:00 ngày 07/11.",
    rule: "Báo cáo Golden Oracle DEM-R03; Cutoff T bất biến",
  },
];

export default function KhcnChuyenDoiSoPage() {
  const { tenant, persona, data, updateTenantData, addAuditLog, metrics, oracleMetrics } = useDemo();

  // Active step in Stepper
  const [activeStep, setActiveStep] = React.useState<number>(6); // Default at Step 6 (Maker-Checker approval)

  // Modals
  const [selectedCell, setSelectedCell] = React.useState<CdsCellItem | null>(null);
  const [isNewCycleModalOpen, setIsNewCycleModalOpen] = React.useState(false);

  // Read-only history flag for Xã B
  const isReadOnlyHistory = tenant.code === "XA_B" || !tenant.features.digitalTransformation;

  // CDS Matrix from reactive context
  const cdsMatrix: CdsCellItem[] = data?.cdsMatrix || [];

  // MET-04 Auto-Calculation
  const applicableCells = cdsMatrix.filter((c) => c.status !== "NOT_APPLICABLE");
  const confirmedCells = applicableCells.filter(
    (c) => c.status === "CONFIRMED" || c.status === "CONFIRMED_ZERO"
  );
  const calculatedMet04 =
    applicableCells.length > 0
      ? Math.round((confirmedCells.length / applicableCells.length) * 100)
      : 0;

  // Action: Approve Cell (Specifically CDS-04: raises coverage from 60% to 80%)
  const handleApproveCell = (code: string) => {
    if (isReadOnlyHistory) return;

    updateTenantData((prev) => {
      const updatedMatrix = prev.cdsMatrix.map((cell) =>
        cell.code === code ? { ...cell, status: "CONFIRMED" as const } : cell
      );
      return {
        ...prev,
        cdsMatrix: updatedMatrix,
      };
    });

    addAuditLog({
      action: "APPROVE_CDS_CELL",
      entityType: "CDS_MATRIX_CELL",
      entityId: code,
      details: {
        code,
        note: `Duyệt xác nhận ô chỉ tiêu CĐS ${code}, tăng độ phủ MET-04 lên ${Math.round(
          ((confirmedCells.length + 1) / applicableCells.length) * 100
        )}%`,
      },
    });

    if (selectedCell && selectedCell.code === code) {
      setSelectedCell({ ...selectedCell, status: "CONFIRMED" });
    }
  };

  // Action: Prompt Submission for Missing Cell (CDS-05)
  const handlePromptSubmission = (code: string) => {
    if (isReadOnlyHistory) return;

    addAuditLog({
      action: "PROMPT_CDS_SUBMISSION",
      entityType: "CDS_MATRIX_CELL",
      entityId: code,
      details: {
        code,
        targetHamlet: "Thôn Tân Thịnh",
        note: "Gửi thông báo đôn đốc Tổ CNSCĐ nộp biểu mẫu chỉ tiêu kỳ tháng 10/2026. CẤM tự ý quy về số 0 khi chưa có minh chứng đối soát.",
      },
    });

    alert(
      `Đã phát thông báo đôn đốc Tổ CNSCĐ Thôn Tân Thịnh khẩn trương nộp số liệu chỉ tiêu ${code}. Nguyên tắc RULE-14 nghiêm cấm tự ý gán số 0 cho ô thiếu số liệu!`
    );
  };

  const activeStepDetail = KH_STEPS.find((s) => s.number === activeStep) || KH_STEPS[5];

  // Digital groups fixture
  const digitalGroups = [
    {
      id: "g-1",
      hamlet: "Xóm Tân Thịnh",
      members: "5 thành viên",
      leader: "Hoàng Văn Tuấn (Xóm trưởng)",
      activeSupport: "128 người dân",
      status: "Tích cực",
    },
    {
      id: "g-2",
      hamlet: "Xóm Đồng Thịnh",
      members: "4 thành viên",
      leader: "Lê Văn Tiến (Bí thư Chi đoàn)",
      activeSupport: "95 người dân",
      status: "Đạt yêu cầu",
    },
    {
      id: "g-3",
      hamlet: "Xóm Đức Hòa",
      members: "4 thành viên",
      leader: "Nguyễn Thị Phương",
      activeSupport: "82 người dân",
      status: "Đạt yêu cầu",
    },
  ];

  return (
    <div className="space-y-6">
      {/* HISTORICAL READ-ONLY BANNER FOR XÃ B (AC-16 / V13) */}
      {isReadOnlyHistory && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-3.5 text-amber-900 shadow-xs">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded">
                [READ_ONLY_HISTORY] (AC-16)
              </span>
              <h4 className="text-xs font-bold uppercase tracking-wide text-amber-800">
                CHẾ ĐỘ XEM LỊCH SỬ • PHÂN HỆ CĐS CHƯA KÍCH HOẠT TẠI {tenant.name}
              </h4>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              Theo chính sách phân vùng thuê bao độc lập, phân hệ <strong>M05 (Khoa học công nghệ & Chuyển đổi số)</strong> chưa đăng ký vận hành tại đơn vị này. Toàn bộ ma trận chỉ tiêu và dữ liệu được hiển thị ở chế độ <strong>chỉ đọc lịch sử</strong>; các thao tác phê duyệt, giao việc và mở kỳ thu thập mới bị tạm khóa.
            </p>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
              PHÂN HỆ M05
            </span>
            <span className="text-xs text-slate-500 font-medium">
              KỲ THÁNG 10/2026 • LUỒNG SÂU DEM-KH • KHỚP ORACLE DEM-R03
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1 font-display">
            Khoa học, Công nghệ & Chuyển đổi số Cấp Xã
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Thu thập ma trận 6 ô dữ liệu (<code>Đơn vị × Chỉ tiêu × Kỳ</code>), phân định 4 trạng thái dữ liệu (AC-17), tự động tính độ phủ MET-04 (60.0%) và quản lý Tổ CNSCĐ.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsNewCycleModalOpen(true)}
            disabled={isReadOnlyHistory}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" /> Mở kỳ thu thập mới
          </Button>
        </div>
      </div>

      {/* 4 Golden Oracle Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: MET-04 (60.0%) */}
        <Card className="bg-emerald-950 border-emerald-900 text-white shadow-xs">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-300">
                MET-04 • ĐỘ PHỦ CHỈ TIÊU CĐS
              </span>
              <span className="text-[10px] font-mono font-bold bg-white/10 text-emerald-100 px-2 py-0.5 rounded">
                ORACLE DEM-R03
              </span>
            </div>
            <div className="my-3 flex items-baseline gap-2">
              <div className="text-3xl font-extrabold font-display tabular-nums tracking-tight">
                {isReadOnlyHistory ? "N/A" : `${calculatedMet04}.0%`}
              </div>
              <div className="text-xs text-emerald-300">
                ({isReadOnlyHistory ? "0/0" : `${confirmedCells.length} / ${applicableCells.length} ô áp dụng`})
              </div>
            </div>
            <p className="text-[11px] text-emerald-300/80 leading-snug">
              {confirmedCells.length} ô xác nhận (1 ô=0) / {applicableCells.length} ô áp dụng • Khớp 100% Golden Oracle
            </p>
          </CardContent>
        </Card>

        {/* Metric 2: 6 Chỉ tiêu theo dõi */}
        <Card className="border border-slate-200 shadow-xs">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                MA TRẬN Ô CHỈ TIÊU KỲ
              </span>
              <Badge variant="neutral" className="text-[10px] font-mono">
                6 Ô DỮ LIỆU
              </Badge>
            </div>
            <div className="my-3 flex items-baseline gap-2">
              <div className="text-3xl font-bold text-slate-900 font-display tabular-nums">
                06
              </div>
              <div className="text-xs text-slate-500">ô theo dõi</div>
            </div>
            <p className="text-[11px] text-slate-500">
              3 xác nhận • 1 chưa duyệt • 1 thiếu • 1 N/A
            </p>
          </CardContent>
        </Card>

        {/* Metric 3: Tổ CNSCĐ */}
        <Card className="border border-slate-200 shadow-xs">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                TỔ CNS CỘNG ĐỒNG (M05-02)
              </span>
              <Badge variant="success" className="text-[10px]">
                100% THÔN
              </Badge>
            </div>
            <div className="my-3 flex items-baseline gap-2">
              <div className="text-3xl font-bold text-slate-900 font-display tabular-nums">
                03/03
              </div>
              <div className="text-xs text-slate-500">thôn có tổ</div>
            </div>
            <p className="text-[11px] text-slate-500">
              13 thành viên • 305 lượt hỗ trợ công dân cài đặt
            </p>
          </CardContent>
        </Card>

        {/* Metric 4: Hạ tầng số */}
        <Card className="border border-slate-200 shadow-xs">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                HẠ TẦNG VIỄN THÔNG (M05-03)
              </span>
              <Badge variant="warning" className="text-[10px]">
                5 ĐIỂM CƠ SỞ
              </Badge>
            </div>
            <div className="my-3 flex items-baseline gap-2">
              <div className="text-3xl font-bold text-slate-900 font-display tabular-nums">
                05
              </div>
              <div className="text-xs text-slate-500">điểm phục vụ</div>
            </div>
            <p className="text-[11px] text-slate-500">
              01 bưu cục • 02 bưu điện VH • 01 internet • 01 trạm BTS
            </p>
          </CardContent>
        </Card>
      </div>

      {/* LUỒNG SÂU DEM-KH: INTERACTIVE 8-STEP STEPPER */}
      <Card className="border border-slate-200 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                Luồng sâu DEM-KH: Kế hoạch, Giao việc & Đối soát Chỉ tiêu CĐS (8 Bước)
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Bấm vào từng bước để kiểm tra vai trò (P4/P5/P6), tiền điều kiện, hành vi đối soát và quy tắc ràng buộc số liệu.
              </CardDescription>
            </div>
            <Badge variant="neutral" className="text-emerald-700 border-emerald-200 font-mono">
              Bước đang xem: {activeStepDetail.code} ({activeStepDetail.name})
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {/* 8 Stepper Buttons Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-1.5">
            {KH_STEPS.map((step) => {
              const isCurrent = step.number === activeStep;
              return (
                <button
                  key={step.code}
                  type="button"
                  onClick={() => setActiveStep(step.number)}
                  className={`p-2 rounded-lg border text-center transition-all flex flex-col items-center gap-1 ${
                    isCurrent
                      ? "bg-emerald-800 text-white border-emerald-900 shadow-sm ring-2 ring-emerald-600/30 font-bold"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 font-medium"
                  }`}
                >
                  <span
                    className={`text-[10px] font-mono px-1 rounded ${
                      isCurrent ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {step.code}
                  </span>
                  <span className="text-[11px] leading-tight line-clamp-1">{step.name}</span>
                </button>
              );
            })}
          </div>

          {/* Stepper Detail View */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <span className="font-mono text-emerald-800 font-extrabold">{activeStepDetail.code}:</span>
                {activeStepDetail.name}
              </h4>
              <span className="text-[11px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                Vai trò thực hiện: <strong className="text-emerald-700">{activeStepDetail.role}</strong>
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">{activeStepDetail.desc}</p>
            <div className="pt-1 text-[11px] text-emerald-800 font-medium flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Quy tắc nghiệp vụ: <strong>{activeStepDetail.rule}</strong></span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 6-CELL CDS MATRIX TABLE SHOWCASING 4 DATA STATES (AC-17 & RULE-14) */}
      <Card className="border border-slate-200 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                Ma trận Chỉ tiêu CĐS 6 Ô Dữ liệu (Đơn vị × Chỉ tiêu × Kỳ Tháng 10/2026)
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Minh họa chuẩn 4 trạng thái dữ liệu (AC-17): Nhập số thông thường, Số 0 đã xác nhận (RULE-14), Chưa xác nhận, Thiếu dữ liệu (Missing) và Không áp dụng (N/A)
              </CardDescription>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded">
                MET-04: {confirmedCells.length}/{applicableCells.length} = {calculatedMet04}%
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-36">Mã & Chỉ tiêu CĐS</TableHead>
                <TableHead>Địa bàn / Đơn vị</TableHead>
                <TableHead className="text-center">Giá trị nộp</TableHead>
                <TableHead>Trạng thái dữ liệu (AC-17)</TableHead>
                <TableHead>Minh chứng & Căn cứ đối soát</TableHead>
                <TableHead className="text-right">Thao tác đối soát (P5)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cdsMatrix.map((cell) => {
                const isConfirmed = cell.status === "CONFIRMED";
                const isZero = cell.status === "CONFIRMED_ZERO";
                const isUnconfirmed = cell.status === "UNCONFIRMED";
                const isMissing = cell.status === "MISSING";
                const isNA = cell.status === "NOT_APPLICABLE";

                return (
                  <TableRow
                    key={cell.code}
                    className={`hover:bg-slate-50/80 ${
                      isZero ? "bg-emerald-50/40" : isMissing ? "bg-rose-50/30" : ""
                    }`}
                  >
                    {/* Column 1: Mã & Chỉ tiêu */}
                    <TableCell>
                      <div className="font-mono text-xs font-bold text-emerald-800">
                        {cell.code} {isZero && "(RULE-14)"}
                      </div>
                      <div className="text-xs font-semibold text-slate-900 mt-0.5">
                        {cell.name}
                      </div>
                    </TableCell>

                    {/* Column 2: Địa bàn / Đơn vị */}
                    <TableCell>
                      <div className="text-xs font-medium text-slate-800">
                        {cell.code === "CDS-01"
                          ? "Thôn Đồng Tiến"
                          : cell.code === "CDS-02"
                          ? "Bộ phận Một cửa Xã"
                          : cell.code === "CDS-03"
                          ? "Thôn Tân Mỹ"
                          : cell.code === "CDS-04"
                          ? "Thôn Hòa Bình"
                          : cell.code === "CDS-05"
                          ? "Thôn Tân Thịnh"
                          : "Thôn Bản Lèn"}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {cell.code === "CDS-01"
                          ? "Tổ CNS-01 (Trần Văn Minh)"
                          : cell.code === "CDS-02"
                          ? "Bộ phận tiếp nhận & trả KQ"
                          : cell.code === "CDS-03"
                          ? "Tổ CNS-02 (Phạm Đức Long)"
                          : cell.code === "CDS-04"
                          ? "Tổ CNS-03 (Lê Thu Hà)"
                          : cell.code === "CDS-05"
                          ? "Tổ CNS-04 (Nguyễn Văn An)"
                          : "Khu vực vùng cao giáp ranh"}
                      </div>
                    </TableCell>

                    {/* Column 3: Giá trị */}
                    <TableCell className="text-center font-mono">
                      {isZero ? (
                        <div>
                          <span className="text-base font-extrabold text-emerald-700">0</span>
                          <p className="text-[10px] font-sans font-medium text-emerald-700">Không có vi phạm tồn đọng</p>
                        </div>
                      ) : isMissing ? (
                        <div>
                          <span className="text-xs font-bold text-rose-600">[Trống]</span>
                          <p className="text-[10px] font-sans text-rose-500">Chưa có số liệu</p>
                        </div>
                      ) : isNA ? (
                        <div>
                          <span className="text-xs font-bold text-slate-400">N/A</span>
                          <p className="text-[10px] font-sans text-slate-400">Không áp dụng</p>
                        </div>
                      ) : (
                        <div>
                          <span className="text-sm font-bold text-slate-900">{cell.value}</span>
                          <p className="text-[10px] font-sans text-slate-500">
                            {cell.code === "CDS-01" ? "388/424 công dân" : cell.code === "CDS-02" ? "172/220 hồ sơ" : cell.code === "CDS-04" ? "21/50 đối tượng" : ""}
                          </p>
                        </div>
                      )}
                    </TableCell>

                    {/* Column 4: Trạng thái dữ liệu (AC-17) */}
                    <TableCell>
                      {isConfirmed && (
                        <Badge variant="success" className="text-[11px] gap-1">
                          <Check className="w-3 h-3" /> Đã xác nhận
                        </Badge>
                      )}
                      {isZero && (
                        <Badge variant="success" className="text-[11px] gap-1 font-bold border-emerald-600 text-emerald-800">
                          <Check className="w-3 h-3" /> Số 0 đã xác nhận (RULE-14)
                        </Badge>
                      )}
                      {isUnconfirmed && (
                        <Badge variant="warning" className="text-[11px] gap-1">
                          <Clock className="w-3 h-3" /> Chưa xác nhận
                        </Badge>
                      )}
                      {isMissing && (
                        <Badge variant="danger" className="text-[11px] gap-1">
                          <AlertTriangle className="w-3 h-3" /> Thiếu dữ liệu (Missing)
                        </Badge>
                      )}
                      {isNA && (
                        <Badge variant="neutral" className="text-[11px] text-slate-500">
                          Không áp dụng (N/A)
                        </Badge>
                      )}
                    </TableCell>

                    {/* Column 5: Minh chứng & Nguồn */}
                    <TableCell className="text-xs text-slate-700">
                      <div className="font-medium text-slate-900">{cell.meaning}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {isZero && "Biên bản rà soát phản ánh C-ThaiNguyen • RULE-14 số 0 hợp lệ"}
                        {cell.code === "CDS-01" && "Báo cáo CA Xã Demo #88/BC-CAX đối soát dân cư"}
                        {cell.code === "CDS-02" && "Trích xuất Cổng DVC Thái Nguyên khớp mã hồ sơ"}
                        {cell.code === "CDS-04" && "Sao kê Bưu điện VH xã nộp 05/11 • Đang kiểm tra"}
                        {isMissing && "Chưa nộp biểu mẫu • CẤM quy về 0 khi chưa xác nhận"}
                        {isNA && (cell.naReason || "Trừ khỏi mẫu số tính tỷ lệ (Mẫu số = 6 - 1 = 5)")}
                      </div>
                    </TableCell>

                    {/* Column 6: Thao tác đối soát */}
                    <TableCell className="text-right">
                      {isReadOnlyHistory ? (
                        <span className="text-[11px] text-slate-400 italic">Khóa sửa (Xã B)</span>
                      ) : isUnconfirmed ? (
                        <Button
                          size="sm"
                          variant="primary"
                          className="h-7 px-2.5 text-xs bg-emerald-700 hover:bg-emerald-800 gap-1 font-semibold"
                          onClick={() => handleApproveCell(cell.code)}
                        >
                          Duyệt ô →
                        </Button>
                      ) : isMissing ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs border-rose-300 text-rose-700 hover:bg-rose-50"
                          onClick={() => handlePromptSubmission(cell.code)}
                        >
                          Đôn đốc nộp
                        </Button>
                      ) : isZero ? (
                        <span className="text-xs font-semibold text-emerald-800 bg-emerald-100/70 border border-emerald-300 px-2 py-1 rounded">
                          Đã đối soát = 0
                        </span>
                      ) : isConfirmed ? (
                        <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded">
                          Đạt chuẩn
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Trừ mẫu số</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Network of Community Digital Tech Groups */}
      <Card className="border border-slate-200 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            Mạng lưới Tổ Công nghệ số Cộng đồng các thôn/xóm ({tenant.name})
          </CardTitle>
          <CardDescription className="text-xs">
            Lực lượng nòng cốt hướng dẫn người dân nộp hồ sơ trực tuyến toàn trình và kích hoạt VNeID
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Địa bàn xóm/thôn</TableHead>
                <TableHead>Tổ trưởng phụ trách</TableHead>
                <TableHead>Quy mô tổ</TableHead>
                <TableHead>Người dân đã hỗ trợ</TableHead>
                <TableHead>Đánh giá hoạt động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {digitalGroups.map((g) => (
                <TableRow key={g.id} className="hover:bg-slate-50/80">
                  <TableCell className="font-semibold text-slate-800 text-xs">{g.hamlet}</TableCell>
                  <TableCell className="text-xs text-slate-700">{g.leader}</TableCell>
                  <TableCell className="text-xs text-slate-600">{g.members}</TableCell>
                  <TableCell className="font-semibold text-emerald-700 text-xs font-mono">
                    {g.activeSupport}
                  </TableCell>
                  <TableCell>
                    <Badge variant="success" className="text-[10px]">
                      {g.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* MODAL: OPEN NEW COLLECTION CYCLE */}
      <Modal
        isOpen={isNewCycleModalOpen}
        onClose={() => setIsNewCycleModalOpen(false)}
        title="Mở Kỳ Thu thập Số liệu CĐS Mới"
        description="Khởi tạo kỳ báo cáo tháng 11/2026 cho các Tổ CNSCĐ cơ sở"
      >
        <div className="space-y-4 text-xs text-slate-700">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <div className="font-semibold text-slate-900">Kỳ thu thập: Tháng 11/2026</div>
            <p className="text-slate-500">
              Gồm 6 chỉ tiêu ma trận thu thập định kỳ từ 03 thôn và bộ phận Một cửa.
            </p>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
            <span className="font-bold">Lưu ý kiểm soát:</span> Khi mở kỳ mới, các chỉ tiêu chưa xác nhận của kỳ cũ phải được chốt dứt điểm để phát hành bản snapshot bất biến.
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsNewCycleModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                addAuditLog({
                  action: "OPEN_NEW_CDS_CYCLE",
                  entityType: "CDS_COLLECTION_CYCLE",
                  entityId: "CYCLE-2026-11",
                  details: { period: "Tháng 11/2026" },
                });
                alert("Đã khởi tạo thành công kỳ thu thập số liệu CĐS Tháng 11/2026!");
                setIsNewCycleModalOpen(false);
              }}
            >
              Xác nhận mở kỳ mới
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
