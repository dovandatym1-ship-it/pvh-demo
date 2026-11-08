"use client";

import * as React from "react";
import Link from "next/link";
import { useDemoContext } from "@/lib/tenancy/demo-context";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import {
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Info,
  ExternalLink,
  Layers,
  BookOpen,
} from "lucide-react";

interface PlaybookStep {
  stepNo: string;
  persona: string;
  badgeBg: string;
  badgeColor: string;
  title: string;
  action: string;
  proof: string;
  targetHref: string;
}

const PLAYBOOK_STEPS: PlaybookStep[] = [
  {
    stepNo: "BƯỚC 1",
    persona: "P1 / P4",
    badgeBg: "bg-emerald-100",
    badgeColor: "text-emerald-800",
    title: "Đăng nhập & Đa xã độc lập",
    action: "Chọn P4 Xã A -> xem 11 module. Chuyển sang Xã B -> M05/M08 bị tắt, dữ liệu tự cô lập.",
    proof: "DEM-ADD-01, DEM-ADD-06, V01, V13",
    targetHref: "/ban-lam-viec",
  },
  {
    stepNo: "BƯỚC 2",
    persona: "P4",
    badgeBg: "bg-blue-100",
    badgeColor: "text-blue-800",
    title: "Bàn làm việc điều hành",
    action: "Kiểm tra 5 chỉ số MET-01..05. Bấm vào chỉ số mở đúng danh sách công việc cần xử lý.",
    proof: "REQ-M09-06, F01 truy nguyên số liệu",
    targetHref: "/ban-lam-viec",
  },
  {
    stepNo: "BƯỚC 3",
    persona: "P6 -> P5 -> P4",
    badgeBg: "bg-amber-100",
    badgeColor: "text-amber-800",
    title: "Luồng sâu Văn hóa DEM-VH",
    action: "Xóm Tân Thịnh nộp danh sách hộ -> P2 thẩm tra checklist -> chốt kết quả đạt tỷ lệ 50%.",
    proof: "V02, V03, V04, V08, V09 (DEM-R02)",
    targetHref: "/van-hoa-gia-dinh",
  },
  {
    stepNo: "BƯỚC 4",
    persona: "P5 -> P6 -> P4",
    badgeBg: "bg-emerald-100",
    badgeColor: "text-emerald-800",
    title: "Kiểm tra hiện trường DEM-KT",
    action: "Lập biên bản cơ sở Karaoke -> ghi nhận 2 kiến nghị khắc phục -> xác nhận khắc phục an toàn.",
    proof: "M08, V10, V14 (DEM-R04 = 2 mở)",
    targetHref: "/kiem-tra",
  },
  {
    stepNo: "BƯỚC 5",
    persona: "P6 -> P5",
    badgeBg: "bg-purple-100",
    badgeColor: "text-purple-800",
    title: "Thu thập chỉ tiêu CĐS DEM-KH",
    action: "Xóm thu thập số liệu CNSCĐ -> kiểm tra tính hợp lệ -> tính ra chỉ tiêu CĐS MET-04 đạt 60%.",
    proof: "AC-17, RULE-14 (DEM-R03 = 60%)",
    targetHref: "/khcn-chuyen-doi-so",
  },
  {
    stepNo: "BƯỚC 6",
    persona: "P4",
    badgeBg: "bg-pink-100",
    badgeColor: "text-pink-800",
    title: "Chốt Snapshot & Lineage",
    action: "Chốt Snapshot Rev 1 tại kỳ báo cáo -> kiểm tra mã băm SHA256 -> mở Lineage truy nguyên số liệu.",
    proof: "AC-18, AC-24, V11, V12 (DEM-R05)",
    targetHref: "/bao-cao",
  },
  {
    stepNo: "BƯỚC 7",
    persona: "P2 / P5",
    badgeBg: "bg-sky-100",
    badgeColor: "text-sky-800",
    title: "Import lô & Tích hợp liên ngành",
    action: "Upload Excel qua Batch Wizard 3 bước -> tự động tiền kiểm từ chối dòng ngoại lai chéo xã TN-DEMO-B.",
    proof: "AC-03, AC-14, AC-15, AC-16, V15",
    targetHref: "/tich-hop",
  },
  {
    stepNo: "BƯỚC 8",
    persona: "P1 / P2",
    badgeBg: "bg-rose-100",
    badgeColor: "text-rose-800",
    title: "Reset Demo độc lập",
    action: "Bấm Reset Demo Xã A -> dữ liệu Xã A khôi phục về Golden Oracle ban đầu, Xã B giữ nguyên vẹn.",
    proof: "DEM-ADD-08, V16",
    targetHref: "/quan-tri",
  },
];

const DELTA_ROWS = [
  { code: "DEM-ADD-01", name: "Đa xã độc lập trên 1 codebase", test: "Xã A gọi tệp/dữ liệu Xã B bị chặn 100% (V01)", gate: "G2" },
  { code: "DEM-ADD-02", name: "Tách quyền kỹ thuật P1 Admin", test: "P1 không đọc được chi tiết cá nhân/nhạy cảm (AC-10)", gate: "G2" },
  { code: "DEM-ADD-03", name: "Gói quy tắc ghim version", test: "Ra pack v1.1 không tự tính lại hồ sơ v1.0 (V06)", gate: "G3" },
  { code: "DEM-ADD-04", name: "Phối hợp công việc đa chủ thể", test: "Xóm P6 chỉ sửa phần việc/ô chỉ tiêu của mình", gate: "G3/G4" },
  { code: "DEM-ADD-05", name: "Snapshot báo cáo bất biến", test: "Chốt Rev 1 không đổi số khi tác nghiệp thay đổi (V11)", gate: "G4" },
  { code: "DEM-ADD-06", name: "Bật/tắt module theo tenant", test: "Tắt M05/M08 ở Xã B chặn tạo mới, giữ lịch sử (V13)", gate: "G2" },
  { code: "DEM-ADD-07", name: "Lưu bền vững & Khóa lạc quan", test: "Optimistic lock 409 khi 2 người cùng sửa (V05)", gate: "G1/G3" },
  { code: "DEM-ADD-08", name: "Reset Demo theo từng Tenant", test: "Reset Xã A không ảnh hưởng Xã B, có log (V16)", gate: "G7" },
];

export default function PlaybookPage() {
  const { tenant, resetTenant } = useDemoContext();
  const [resetModalOpen, setResetModalOpen] = React.useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = React.useState<string | null>(null);

  const handleExecuteReset = () => {
    resetTenant("XA_A");
    setResetSuccessMessage("Đã khôi phục toàn bộ bảng dữ liệu Xã Thịnh Đức (Xã A) về trạng thái hạt giống Golden Oracle ban đầu (LocalStorage pvh_demo_state_v1 & Audit Log AUDIT_RESET_TENANT). Dữ liệu Xã Tân Cương (Xã B) được giữ nguyên vẹn 100%.");
    setResetModalOpen(false);
    setTimeout(() => {
      setResetSuccessMessage(null);
    }, 6000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gov-600">
            Bảng điều khiển Người thuyết trình • Wave W11 • Gate G7
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1 font-display">
            Kịch bản Diễn thử 8 Bước & Ma trận Nghiệm thu
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Trình diễn trọn vẹn 11 phân hệ M00–M10, 3 luồng sâu, 5 báo cáo Oracle và cơ chế cô lập dữ liệu đa xã.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setResetModalOpen(true)}
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Demo Xã A
          </Button>
          <Link href="/ban-lam-viec">
            <Button variant="primary" className="gap-1.5">
              <Play className="w-4 h-4" /> Bắt đầu bước 1: Đăng nhập
            </Button>
          </Link>
        </div>
      </div>

      {resetSuccessMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{resetSuccessMessage}</span>
          </div>
          <button
            onClick={() => setResetSuccessMessage(null)}
            className="text-xs font-semibold text-emerald-700 hover:underline"
          >
            Đóng
          </button>
        </div>
      )}

      {/* 8-Step Grid */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-display">Kịch bản trình diễn 8 bước chuẩn (Demo Playbook)</CardTitle>
            <CardDescription>
              Theo sát từng thao tác click để chứng minh 76 REQ + 8 DEM-ADD
            </CardDescription>
          </div>
          <span className="text-xs font-bold text-gov-700">Thời lượng ước tính: 15–20 phút</span>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLAYBOOK_STEPS.map((step) => (
              <div
                key={step.stepNo}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-gov-400 hover:shadow-xs transition-all flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-gov-700">{step.stepNo}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${step.badgeBg} ${step.badgeColor}`}>
                      {step.persona}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 font-display leading-snug">{step.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{step.action}</p>
                </div>

                <div className="pt-2 border-t border-slate-200/80 space-y-2">
                  <div className="text-[10px] font-semibold text-emerald-800">
                    Điểm chứng minh: {step.proof}
                  </div>
                  <Link
                    href={step.targetHref}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-gov-700 hover:text-gov-800 hover:underline"
                  >
                    Mở màn hình <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Delta Matrix and Legal Boundaries Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Delta Rows */}
        <div className="lg:col-span-2">
          <Card className="shadow-xs h-full">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-display">Bảng đối chiếu 8 Delta nền tảng (DEM-ADD-01..08)</CardTitle>
                <CardDescription>Các yêu cầu kỹ thuật then chốt phân biệt với phần mềm hành chính cũ</CardDescription>
              </div>
              <Badge variant="success">8/8 ĐẠT TIÊU CHUẨN</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <Table density="compact">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-28">Mã Delta</TableHead>
                    <TableHead>Nội dung cam kết</TableHead>
                    <TableHead>Kịch bản kiểm chứng thực tế</TableHead>
                    <TableHead className="text-right pr-4">Kết quả</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DELTA_ROWS.map((row) => (
                    <TableRow key={row.code}>
                      <TableCell className="font-mono text-xs font-bold text-gov-700">
                        {row.code}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-800">{row.name}</TableCell>
                      <TableCell className="text-xs text-slate-600">{row.test}</TableCell>
                      <TableCell className="text-right pr-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          PASS ({row.gate})
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Legal Boundaries & Open Questions */}
        <div>
          <Card className="shadow-xs h-full flex flex-col justify-between">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-display">Ranh giới Pháp lý</CardTitle>
                <CardDescription>Quy tắc quản trị GAP Register</CardDescription>
              </div>
              <Badge variant="warning">14 GAPs Open</Badge>
            </CardHeader>
            <CardContent className="p-4 space-y-3 flex-1">
              <p className="text-xs text-slate-600">
                Hệ thống demo đáp ứng 100% kịch bản khảo sát nghiệp vụ nhưng giữ nguyên các câu hỏi mở trước khi triển khai chính thức:
              </p>

              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold text-gov-800">PVH-Q-001 • Địa bàn thí điểm chính thức</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Xác định quyết định thành lập xã và quy chế phân công còn hiệu lực.</div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold text-gov-800">PVH-Q-005 • Gói quy tắc bình xét văn hóa</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Nghị định 86/2023/NĐ-CP và QĐ 74 Thái Nguyên — chạy gói minh họa có nhãn.</div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold text-gov-800">PVH-Q-010 • Kết nối liên thông Một cửa</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Mô phỏng trục LGSP có biên nhận và đối soát, không giả lập ngầm.</div>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] space-y-1 mt-auto">
                <span className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Nguyên tắc bàn giao kỹ thuật:
                </span>
                <p>
                  Hoàn thành mã nguồn demo không tự động đóng các vấn đề pháp lý trong GAP Register khi chưa có thẩm quyền phê duyệt độc lập.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Anti-IOC Scope Guardrail Banner (PVH-I-005) */}
      <div className="p-4 bg-white border border-gov-300 border-l-4 border-l-gov-600 rounded-xl shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="text-xs font-bold text-gov-800 tracking-wider uppercase font-mono">
            Ranh giới cứng Phòng Văn hóa – Xã hội (Anti-IOC Guardrail • PVH-I-005)
          </div>
          <h4 className="text-sm font-bold text-slate-900">
            Đã hấp thu chọn lọc nghiệp vụ Phòng VH–XH (M00–M10) • Loại trừ hoàn toàn phân hệ IOC toàn xã
          </h4>
          <p className="text-xs text-slate-600 max-w-4xl leading-relaxed">
            <strong>Hấp thu chọn lọc:</strong> Điều phối việc nội bộ phòng (Kanban/Lịch tuần 2 hạn), Hàng đợi nộp 2 chiều từ Trưởng xóm (P6), Hồ sơ thiết chế văn hóa cơ sở (M03..M07), Bình dân học vụ số (M05).<br />
            <span className="text-rose-700 font-semibold">Loại trừ nghiêm ngặt (Cấm đưa vào):</span> IOC toàn xã, Bản đồ GIS điểm nóng, Camera AI Công an xã, Flycam/Drone, GPMB/Đất đai, Ecabinet HĐND, Quản lý chợ/nhà trọ/NVQS.
          </p>
        </div>
        <span className="shrink-0 px-3 py-1.5 bg-gov-100 text-gov-800 text-xs font-bold rounded-lg border border-gov-200 font-mono">
          PVH-ONLY VERIFIED
        </span>
      </div>

      {/* Modal Confirm Reset Xã A */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Xác nhận Reset Dữ liệu Demo Xã Thịnh Đức (Xã A)"
        description="Khôi phục toàn bộ bảng dữ liệu Xã A về trạng thái ban đầu để chuẩn bị ca diễn mới"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              Cảnh báo khôi phục môi trường thử nghiệm:
            </div>
            <p className="text-[11px] leading-relaxed">
              Thao tác này sẽ xóa các hồ sơ, nhiệm vụ, biên bản kiểm tra mới phát sinh trong phiên demo tại <strong>Xã Thịnh Đức (Xã A)</strong> và nạp lại toàn bộ hạt giống dữ liệu Golden Oracle ban đầu. Dữ liệu của <strong>Xã Tân Cương (Xã B)</strong> hoàn toàn không bị ảnh hưởng.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" onClick={() => setResetModalOpen(false)}>
              Hủy bỏ
            </Button>
            <Button
              variant="danger"
              onClick={handleExecuteReset}
              className="gap-1.5"
            >
              <RotateCcw className="w-4 h-4" /> Xác nhận Reset Xã A
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
