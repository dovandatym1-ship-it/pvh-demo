"use client";

import * as React from "react";
import { useDemoContext } from "@/lib/tenancy/demo-context";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import {
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Database,
  ArrowRight,
  FileSpreadsheet,
  ShieldAlert,
  Info,
  Check,
  XCircle,
} from "lucide-react";

interface ExternalService {
  name: string;
  source: string;
  lastSync: string;
  status: "ONLINE" | "STANDBY" | "WARNING";
  matchedRecords: number;
  unmatchedRecords: number;
}

interface ImportRowPreview {
  rowNum: number;
  subjectCode: string;
  fullName: string;
  category: string;
  targetTenant: string;
  status: "VALID" | "ERROR_CROSS_TENANT" | "WARNING_FORMAT";
  note: string;
}

export default function TichHopPage() {
  const { tenant } = useDemoContext();
  const [syncing, setSyncing] = React.useState(false);
  const [lastSyncTime, setLastSyncTime] = React.useState("07/11/2026 09:15");
  const [syncCount, setSyncCount] = React.useState(2430);

  // Batch Import Wizard State
  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);
  const [importStep, setImportStep] = React.useState<1 | 2 | 3>(1);
  const [isProcessingFile, setIsProcessingFile] = React.useState(false);
  const [importSuccessMessage, setImportSuccessMessage] = React.useState<string | null>(null);

  const services: ExternalService[] = [
    {
      name: "Cơ sở dữ liệu Quốc gia về Dân cư (VNeID / C06)",
      source: "Trục liên thông LGSP Thái Nguyên",
      lastSync: lastSyncTime,
      status: "ONLINE",
      matchedRecords: syncCount,
      unmatchedRecords: 3,
    },
    {
      name: "Hệ thống Thông tin Bảo trợ Xã hội & Giảm nghèo",
      source: "Bộ Lao động - TB&XH",
      lastSync: "06/11/2026 18:30",
      status: "ONLINE",
      matchedRecords: 142,
      unmatchedRecords: 0,
    },
    {
      name: "Cổng Dịch vụ công & Một cửa điện tử Tỉnh",
      source: "Cổng DVC Thái Nguyên",
      lastSync: "07/11/2026 08:00",
      status: "STANDBY",
      matchedRecords: 89,
      unmatchedRecords: 1,
    },
  ];

  const previewRows: ImportRowPreview[] = [
    {
      rowNum: 1,
      subjectCode: `${tenant.code}-001`,
      fullName: "Nguyễn Văn Hùng",
      category: "Người có công",
      targetTenant: tenant.code,
      status: "VALID",
      note: "Hợp lệ, sẵn sàng nạp CSDL",
    },
    {
      rowNum: 2,
      subjectCode: `${tenant.code}-002`,
      fullName: "Trần Thị Mai",
      category: "Bảo trợ xã hội",
      targetTenant: tenant.code,
      status: "VALID",
      note: "Hợp lệ, sẵn sàng nạp CSDL",
    },
    {
      rowNum: 3,
      subjectCode: `${tenant.code}-003`,
      fullName: "Lê Hoàng Long",
      category: "Hộ gia đình văn hóa",
      targetTenant: tenant.code,
      status: "VALID",
      note: "Hợp lệ, sẵn sàng nạp CSDL",
    },
    {
      rowNum: 4,
      subjectCode: tenant.code === "XA_A" ? "TN-DEMO-B-099" : "TN-DEMO-A-099",
      fullName: "Dương Đình Khang",
      category: "Đối tượng ngoại lai",
      targetTenant: tenant.code === "XA_A" ? "XA_B" : "XA_A",
      status: "ERROR_CROSS_TENANT",
      note: `TỪ CHỐI 400: Mã địa bàn ${tenant.code === "XA_A" ? "XA_B" : "XA_A"} nằm ngoài phạm vi ${tenant.name} (AC-15, V15)`,
    },
    {
      rowNum: 5,
      subjectCode: `${tenant.code}-005`,
      fullName: "Hoàng Minh Tuấn",
      category: "Nghệ nhân dân gian",
      targetTenant: tenant.code,
      status: "VALID",
      note: "Hợp lệ, sẵn sàng nạp CSDL",
    },
  ];

  const handleTriggerSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setLastSyncTime("Vừa xong (07/11/2026 11:30)");
      setSyncCount((prev) => prev + 12);
    }, 1200);
  };

  const handleSimulateUpload = () => {
    setIsProcessingFile(true);
    setTimeout(() => {
      setIsProcessingFile(false);
      setImportStep(2);
    }, 800);
  };

  const handleExecuteImport = () => {
    setIsProcessingFile(true);
    setTimeout(() => {
      setIsProcessingFile(false);
      setImportStep(3);
      setSyncCount((prev) => prev + 4);
      setImportSuccessMessage(
        `Đã nạp thành công 4 bản ghi hợp lệ vào CSDL ${tenant.name}. Đã loại trừ và ghi log kiểm toán 1 bản ghi vi phạm biên giới đa xã.`
      );
    }, 1000);
  };

  const handleCloseImport = () => {
    setIsImportModalOpen(false);
    setImportStep(1);
    setImportSuccessMessage(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gov-600">
            Phân hệ M10 • Tích hợp & Nhập dữ liệu
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1 font-display">
            Kết nối Tích hợp Ngành & Nạp Dữ liệu Ngoại vi
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Giao diện đối soát dữ liệu dân cư, BHYT và nhập danh mục từ bảng tính Excel phục vụ mô phỏng {tenant.name}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
            <Upload className="w-4 h-4 mr-1.5" />
            Nhập file Excel
          </Button>
          <Button variant="primary" onClick={handleTriggerSync} disabled={syncing}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Đang đồng bộ..." : "Đối soát dữ liệu"}
          </Button>
        </div>
      </div>

      {importSuccessMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{importSuccessMessage}</span>
          </div>
          <button
            onClick={() => setImportSuccessMessage(null)}
            className="text-xs font-semibold text-emerald-700 hover:underline"
          >
            Đóng
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500">Cổng kết nối giả lập</div>
              <div className="text-xl font-bold text-slate-900 mt-1 font-display">3 cổng hoạt động</div>
            </div>
            <Database className="w-8 h-8 text-gov-600/30" />
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500">Hồ sơ đối soát thành công</div>
              <div className="text-xl font-bold text-emerald-700 mt-1 font-display tabular-nums">
                {syncCount.toLocaleString()} bản ghi
              </div>
            </div>
            <CheckCircle2 className="w-8 h-8 text-emerald-500/30" />
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500">Lệch số liệu cần kiểm tra</div>
              <div className="text-xl font-bold text-amber-600 mt-1 font-display tabular-nums">4 trường hợp</div>
            </div>
            <AlertTriangle className="w-8 h-8 text-amber-500/30" />
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-xs">
        <CardHeader>
          <CardTitle className="font-display">Trạng thái kết nối các trục liên thông</CardTitle>
          <CardDescription>
            Kiểm tra đường truyền đối soát LGSP và dữ liệu ngoại vi phục vụ xác thực chủ thể
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table density="compact">
            <TableHeader>
              <TableRow>
                <TableHead>Hệ thống kết nối</TableHead>
                <TableHead>Đơn vị chủ quản / Nguồn</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-center">Khớp dữ liệu</TableHead>
                <TableHead className="text-center">Sai lệch</TableHead>
                <TableHead className="text-right pr-4">Đồng bộ gần nhất</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((s, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-semibold text-slate-800">{s.name}</TableCell>
                  <TableCell className="text-slate-600 text-xs">{s.source}</TableCell>
                  <TableCell>
                    {s.status === "ONLINE" && <Badge variant="success">Hoạt động tốt</Badge>}
                    {s.status === "STANDBY" && <Badge variant="neutral">Chế độ chờ</Badge>}
                    {s.status === "WARNING" && <Badge variant="warning">Chậm phản hồi</Badge>}
                  </TableCell>
                  <TableCell className="text-center font-bold text-emerald-700 font-mono text-xs tabular-nums">
                    {s.matchedRecords.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center font-bold text-amber-700 font-mono text-xs tabular-nums">
                    {s.unmatchedRecords}
                  </TableCell>
                  <TableCell className="text-right pr-4 text-xs text-slate-500 font-mono">
                    {s.lastSync}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Batch Import Excel 3-Step Wizard Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={handleCloseImport}
        title="Quy trình Nhập lô Dữ liệu từ Excel (Batch Import Wizard)"
        description={`Nạp danh sách đối tượng nghiệp vụ vào hệ thống ${tenant.name} (AC-15, V15)`}
      >
        <div className="space-y-5 text-xs">
          {/* Stepper Header */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className={`flex items-center gap-1.5 font-bold ${importStep === 1 ? "text-gov-600" : "text-slate-500"}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${importStep === 1 ? "bg-gov-600 text-white" : "bg-slate-200 text-slate-700"}`}>
                1
              </div>
              <span>Chọn tệp Excel</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <div className={`flex items-center gap-1.5 font-bold ${importStep === 2 ? "text-gov-600" : "text-slate-500"}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${importStep === 2 ? "bg-gov-600 text-white" : "bg-slate-200 text-slate-700"}`}>
                2
              </div>
              <span>Tiền kiểm & Phân loại</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <div className={`flex items-center gap-1.5 font-bold ${importStep === 3 ? "text-gov-600" : "text-slate-500"}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${importStep === 3 ? "bg-gov-600 text-white" : "bg-slate-200 text-slate-700"}`}>
                3
              </div>
              <span>Hoàn tất nạp CSDL</span>
            </div>
          </div>

          {/* Step 1: Upload */}
          {importStep === 1 && (
            <div className="space-y-4">
              <div className="p-6 border-2 border-dashed border-slate-300 hover:border-gov-500 rounded-xl text-center bg-slate-50/50 space-y-2 cursor-pointer transition-colors">
                <FileSpreadsheet className="w-10 h-10 text-gov-600 mx-auto" />
                <div className="font-semibold text-slate-800 text-sm">Kéo thả tệp dữ liệu vào đây hoặc bấm để chọn</div>
                <div className="text-slate-500 text-[11px]">Hỗ trợ định dạng .xlsx, .xls theo biểu mẫu chuẩn của Sở TT&TT Thái Nguyên</div>
                <div className="pt-2">
                  <span className="inline-block px-2.5 py-1 rounded bg-gov-100 text-gov-800 font-mono text-[10px] font-semibold">
                    danh_sach_doi_tuong_{tenant.code.toLowerCase()}_2026.xlsx
                  </span>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 flex items-start gap-2.5 text-[11px]">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Quy chuẩn dữ liệu đầu vào:</span> Tệp phải có các cột: Mã đối tượng, Họ và tên, Thôn/Xóm, Phân loại, Mã xã tiếp nhận. Hệ thống sẽ tự động đối soát ranh giới thẩm quyền để chống rò rỉ dữ liệu chéo đơn vị.
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={handleCloseImport}>
                  Hủy
                </Button>
                <Button variant="primary" onClick={handleSimulateUpload} disabled={isProcessingFile}>
                  {isProcessingFile ? "Đang phân tích tệp..." : "Tải lên & Chạy tiền kiểm"}
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Pre-check Validation Matrix */}
          {importStep === 2 && (
            <div className="space-y-4">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 flex items-start gap-2.5 text-[11px]">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Phát hiện vi phạm ranh giới thẩm quyền (AC-15, V15):</span> Dòng số 4 chứa mã đối tượng thuộc địa bàn đơn vị khác. Hệ thống sẽ tự động <strong>Từ chối (Reject 400)</strong> dòng này để bảo vệ dữ liệu độc lập của từng xã.
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <Table density="compact">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-center">STT</TableHead>
                      <TableHead>Mã hồ sơ</TableHead>
                      <TableHead>Họ và tên</TableHead>
                      <TableHead>Phân ngành</TableHead>
                      <TableHead>Đơn vị đích</TableHead>
                      <TableHead className="text-center">Kết quả kiểm tra</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRows.map((row) => (
                      <TableRow
                        key={row.rowNum}
                        className={row.status === "ERROR_CROSS_TENANT" ? "bg-rose-50/70" : undefined}
                      >
                        <TableCell className="text-center font-mono text-slate-500">{row.rowNum}</TableCell>
                        <TableCell className="font-mono font-medium">{row.subjectCode}</TableCell>
                        <TableCell className="font-semibold">{row.fullName}</TableCell>
                        <TableCell>{row.category}</TableCell>
                        <TableCell className="font-mono text-[11px]">{row.targetTenant}</TableCell>
                        <TableCell className="text-center">
                          {row.status === "VALID" ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                              <Check className="w-3.5 h-3.5" /> Hợp lệ
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-700 font-bold text-[11px]">
                              <XCircle className="w-3.5 h-3.5" /> Từ chối chéo xã
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between items-center pt-2">
                <Button variant="outline" onClick={() => setImportStep(1)}>
                  Quay lại chọn tệp khác
                </Button>
                <Button variant="primary" onClick={handleExecuteImport} disabled={isProcessingFile}>
                  {isProcessingFile ? "Đang ghi CSDL..." : "Chấp thuận & Nạp 4 bản ghi hợp lệ"}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Success Confirmation */}
          {importStep === 3 && (
            <div className="space-y-4 text-center py-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-slate-900 font-display">Nạp Dữ liệu Thành công!</h3>
                <p className="text-slate-600 text-xs max-w-md mx-auto">
                  Đã ghi nhận <strong>4 bản ghi mới</strong> vào cơ sở dữ liệu của {tenant.name}.
                  Biên lai kiểm toán mã giao dịch <span className="font-mono font-bold text-slate-800">IMP-2026-X04</span> đã được phát hành.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-left text-[11px] space-y-1 font-mono text-slate-600 max-w-md mx-auto">
                <div>• Bản ghi hợp lệ đã nạp: 4/5</div>
                <div>• Bản ghi bị từ chối chéo xã: 1/5 (Đã ghi nhật ký vi phạm M00)</div>
                <div>• Thời gian thực thi: {new Date().toLocaleTimeString("vi-VN")}</div>
              </div>

              <div className="pt-2">
                <Button variant="primary" onClick={handleCloseImport}>
                  Hoàn tất & Đóng cửa sổ
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
