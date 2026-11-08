"use client";

import * as React from "react";
import { useDemo } from "@/lib/tenancy/demo-context";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableEmptyState } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { SlideOverDrawer } from "@/components/ui/slide-over";
import {
  ShieldAlert,
  ClipboardCheck,
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Plus,
  Info,
  Lock,
  Smartphone,
  Wifi,
  WifiOff,
  Camera,
  RefreshCw,
  Check,
  Building,
  Calendar,
  AlertCircle,
  FolderSync,
} from "lucide-react";
import type { InspectionRecommendationItem } from "@/lib/store/demo-state";

const STORAGE_OFFLINE_KEY = "pvh_offline_inspections_v1";

interface OfflineDraft {
  id: string;
  facilityName: string;
  hamlet: string;
  pcccStatus: "FAILED" | "PASSED";
  pcccPhotoAttached: boolean;
  sportsFenceStatus: "VERIFIED" | "PENDING";
  hygieneStatus: "PASSED";
  notes: string;
  savedAt: string;
}

export default function KiemTraPage() {
  const { tenant, persona, data, updateTenantData, addAuditLog, metrics, oracleMetrics } = useDemo();

  // Device switcher: "desktop" | "mobile"
  const [deviceMode, setDeviceMode] = React.useState<"desktop" | "mobile">("desktop");

  // Mobile network state: true = Online 4G, false = Offline
  const [isOnline, setIsOnline] = React.useState<boolean>(true);

  // Offline drafts loaded from localStorage
  const [offlineDrafts, setOfflineDrafts] = React.useState<OfflineDraft[]>([]);

  // Mobile checklist local state
  const [pcccAttached, setPcccAttached] = React.useState<boolean>(true);
  const [fenceVerified, setFenceVerified] = React.useState<boolean>(false);
  const [mobileNotes, setMobileNotes] = React.useState<string>(
    "Phát hiện bình bọt MFZ4 quá hạn kiểm định; rào lưới B40 đã lắp xong chờ xác nhận."
  );

  // Search & Filters for desktop table
  const [search, setSearch] = React.useState("");
  const [selectedHamlet, setSelectedHamlet] = React.useState("ALL");
  const [selectedStatus, setSelectedStatus] = React.useState("ALL");

  // Modals & Drawers
  const [selectedRec, setSelectedRec] = React.useState<InspectionRecommendationItem | null>(null);
  const [isNewInspectionModalOpen, setIsNewInspectionModalOpen] = React.useState(false);

  // Read-only history mode for Xã B
  const isReadOnlyHistory = tenant.code === "XA_B" || !tenant.features.fieldInspection;

  // Recommendations data slice
  const recommendations: InspectionRecommendationItem[] =
    data?.recommendations || data?.inspections || [];

  // Load offline drafts from localStorage on mount
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_OFFLINE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setOfflineDrafts(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to read offline drafts from localStorage", e);
    }
  }, []);

  // Save drafts to localStorage whenever offlineDrafts changes
  const persistOfflineDrafts = (drafts: OfflineDraft[]) => {
    setOfflineDrafts(drafts);
    if (typeof window !== "undefined") {
      try {
        if (drafts.length === 0) {
          localStorage.removeItem(STORAGE_OFFLINE_KEY);
        } else {
          localStorage.setItem(STORAGE_OFFLINE_KEY, JSON.stringify(drafts));
        }
      } catch (e) {
        console.error("Failed to write offline drafts to localStorage", e);
      }
    }
  };

  // Filter recommendations
  const filteredRecs = recommendations.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.code.toLowerCase().includes(search.toLowerCase()) ||
      r.facilityName.toLowerCase().includes(search.toLowerCase());
    const matchesHamlet = selectedHamlet === "ALL" || r.hamlet === selectedHamlet;
    const matchesStatus = selectedStatus === "ALL" || r.status === selectedStatus;
    return matchesSearch && matchesHamlet && matchesStatus;
  });

  // Action: Resolve and close recommendation (e.g. KN-02)
  const handleResolveRecommendation = (id: string) => {
    if (isReadOnlyHistory) return;

    updateTenantData((prev) => {
      const updated = (prev.recommendations || []).map((item) =>
        item.id === id ? { ...item, status: "RESOLVED_CLOSED" as const, dueText: "Đã khắc phục xong" } : item
      );
      return {
        ...prev,
        recommendations: updated,
        inspections: updated,
      };
    });

    addAuditLog({
      action: "RESOLVE_INSPECTION_RECOMMENDATION",
      entityType: "INSPECTION_RECOMMENDATION",
      entityId: id,
      details: {
        note: `Xác nhận cơ sở đã khắc phục hoàn tất kiến nghị ${id}, đóng hồ sơ giám sát hiện trường (giảm MET-05)`,
      },
    });

    if (selectedRec && selectedRec.id === id) {
      setSelectedRec({
        ...selectedRec,
        status: "RESOLVED_CLOSED",
        dueText: "Đã khắc phục xong",
      });
    }
  };

  // Action: Mobile save draft offline
  const handleSaveMobileDraft = () => {
    const newDraft: OfflineDraft = {
      id: `draft-${Date.now()}`,
      facilityName: "Nhà văn hóa thôn Đồng Tiến",
      hamlet: "Xóm Đồng Thịnh",
      pcccStatus: "FAILED",
      pcccPhotoAttached: pcccAttached,
      sportsFenceStatus: fenceVerified ? "VERIFIED" : "PENDING",
      hygieneStatus: "PASSED",
      notes: mobileNotes,
      savedAt: new Date().toLocaleTimeString("vi-VN"),
    };

    const nextDrafts = [newDraft, ...offlineDrafts];
    persistOfflineDrafts(nextDrafts);

    addAuditLog({
      action: "SAVE_OFFLINE_INSPECTION_DRAFT",
      entityType: "OFFLINE_DRAFT",
      entityId: newDraft.id,
      details: {
        facilityName: newDraft.facilityName,
        networkMode: isOnline ? "ONLINE" : "OFFLINE",
        storageKey: STORAGE_OFFLINE_KEY,
        note: "Lưu nháp biên bản kiểm tra ngoại tuyến vào localStorage khi mất sóng",
      },
    });

    alert(
      "Đã lưu biên bản kiểm tra ngoại tuyến vào bộ nhớ điện thoại (LocalStorage)! Khi có sóng 4G/Wifi, bạn có thể bấm 'Đồng bộ tạo kiến nghị'."
    );
  };

  // Action: Sync offline drafts to server store
  const handleSyncDraftsToServer = () => {
    if (offlineDrafts.length === 0) return;
    if (!isOnline) {
      alert("Thiết bị đang ở chế độ Mất sóng (Offline). Vui lòng chuyển sang Trực tuyến 4G để đồng bộ!");
      return;
    }

    // Append newly created inspection recommendation from offline drafts
    const newRecs: InspectionRecommendationItem[] = offlineDrafts.map((d, idx) => ({
      id: `KN-SYNC-${Date.now()}-${idx}`,
      code: `INSP-2026-00${recommendations.length + 1 + idx}`,
      title: `Biên bản kiểm tra hiện trường: ${d.facilityName} (${d.notes.substring(0, 35)}...)`,
      facilityName: d.facilityName,
      hamlet: d.hamlet,
      assignee: `${persona.name} (${persona.code})`,
      dueText: "Hạn 7 ngày",
      isOverdue: false,
      status: "FEEDBACK_UNVERIFIED",
      metric: "MET-05",
      tenantCode: tenant.code === "XA_B" ? "XA_B" : "XA_A",
    }));

    updateTenantData((prev) => ({
      ...prev,
      recommendations: [...newRecs, ...(prev.recommendations || [])],
      inspections: [...newRecs, ...(prev.inspections || [])],
    }));

    addAuditLog({
      action: "SYNC_OFFLINE_INSPECTION_DRAFTS",
      entityType: "INSPECTION_RECOMMENDATION",
      entityId: `SYNC-${Date.now()}`,
      details: {
        syncedCount: offlineDrafts.length,
        note: `Đồng bộ thành công ${offlineDrafts.length} biên bản hiện trường ngoại tuyến lên hệ thống`,
      },
    });

    persistOfflineDrafts([]);
    alert(`Đã đồng bộ thành công ${newRecs.length} biên bản kiểm tra từ thực địa vào hệ thống!`);
  };

  const openCount = recommendations.filter((r) => r.status !== "RESOLVED_CLOSED").length;
  const closedCount = recommendations.filter((r) => r.status === "RESOLVED_CLOSED").length;

  return (
    <div className="space-y-6">
      {/* HISTORICAL READ-ONLY BANNER FOR XÃ B (AC-16 / V13) */}
      {isReadOnlyHistory && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-3.5 text-amber-900 shadow-xs">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded">
                [READ_ONLY_HISTORY] (AC-16 / V13)
              </span>
              <h4 className="text-xs font-bold uppercase tracking-wide text-amber-800">
                CHẾ ĐỘ XEM LỊCH SỬ • PHÂN HỆ KIỂM TRA HIỆN TRƯỜNG CHƯA KÍCH HOẠT TẠI {tenant.name}
              </h4>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              Theo chính sách phân bổ tính năng, đơn vị <strong>{tenant.name}</strong> không vận hành phân hệ <strong>M08 (Kiểm tra cơ sở & Kiến nghị)</strong>. Danh sách biên bản kiểm tra hiển thị dưới dạng bản ghi lưu trữ lịch sử; các tính năng tạo đợt mới, xác nhận khắc phục và đồng bộ thực địa tạm khóa.
            </p>
          </div>
        </div>
      )}

      {/* Page Header with Device Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
              PHÂN HỆ M08 • DEM-KT
            </span>
            <span className="text-xs text-slate-500 font-medium">
              KHỚP GOLDEN ORACLE DEM-R04 (MET-05: 02 KIẾN NGHỊ MỞ)
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1 font-display">
            Kiểm tra Cơ sở & Xử lý Kiến nghị Hiện trường
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý giám sát thiết chế NVH thôn/xóm, lập biên bản vi phạm PCCC và hỗ trợ lưu nháp ngoại tuyến khi mất sóng 4G.
          </p>
        </div>

        {/* DEVICE SWITCHER BUTTONS (Desktop Table vs Mobile Field Checklist V14) */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => setDeviceMode("desktop")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              deviceMode === "desktop"
                ? "bg-white text-emerald-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Bảng máy tính (Desktop Table)</span>
          </button>
          <button
            type="button"
            onClick={() => setDeviceMode("mobile")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              deviceMode === "mobile"
                ? "bg-white text-emerald-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-blue-600" />
            <span>Biên bản hiện trường (Mobile V14)</span>
            {offlineDrafts.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            )}
          </button>
        </div>
      </div>

      {/* =========================================================================
          VIEW 1: DESKTOP TABLE VIEW
         ========================================================================= */}
      {deviceMode === "desktop" && (
        <div className="space-y-6">
          {/* 3 Oracle Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-slate-600 shadow-xs">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Tổng đợt kiểm tra cơ sở</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1 font-display tabular-nums">
                      02 đợt
                    </h3>
                  </div>
                  <div className="p-2.5 bg-slate-100 text-slate-700 rounded-lg">
                    <Building className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  01 cơ sở trọng điểm: Nhà văn hóa thôn Đồng Tiến
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-600 shadow-xs">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-amber-700 font-medium">Kiến nghị đang mở (MET-05)</p>
                    <h3 className="text-2xl font-bold text-amber-700 mt-1 font-display tabular-nums">
                      {isReadOnlyHistory ? "00" : openCount < 10 ? `0${openCount}` : openCount} kiến nghị
                    </h3>
                  </div>
                  <div className="p-2.5 bg-amber-100 text-amber-800 rounded-lg">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-[11px] text-amber-700 mt-2 font-semibold">
                  Gồm KN-01 (Quá hạn) và KN-02 (Chờ xác minh)
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-600 shadow-xs">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-emerald-700 font-medium">Đã khắc phục hoàn tất</p>
                    <h3 className="text-2xl font-bold text-emerald-800 mt-1 font-display tabular-nums">
                      {closedCount < 10 ? `0${closedCount}` : closedCount} kiến nghị
                    </h3>
                  </div>
                  <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-lg">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-[11px] text-emerald-700 mt-2">
                  KN-03 đã xác minh đóng ngày 25/10/2026
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations Table */}
          <Card className="border border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4 text-emerald-600" />
                    Danh sách Kiến nghị Kiểm tra Hiện trường (MET-05 = 02 Mở)
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Các phát hiện cần khắc phục trên đối tượng Nhà văn hóa Thôn Đồng Tiến và các xóm
                  </CardDescription>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <Input
                      placeholder="Tìm kiến nghị..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8 text-xs h-8 w-44"
                    />
                  </div>

                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="text-xs h-8 px-2 border border-slate-200 rounded-md bg-white text-slate-700"
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="WAITING_OVERDUE">Quá hạn phản hồi</option>
                    <option value="FEEDBACK_UNVERIFIED">Chờ xác minh thực tế</option>
                    <option value="RESOLVED_CLOSED">Đã đóng</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-28">Mã kiến nghị</TableHead>
                    <TableHead>Nội dung phát hiện & kiến nghị</TableHead>
                    <TableHead>Cơ sở kiểm tra</TableHead>
                    <TableHead>Xóm / Địa bàn</TableHead>
                    <TableHead>Cán bộ phân công</TableHead>
                    <TableHead>Hạn xử lý</TableHead>
                    <TableHead>Trạng thái (MET-05)</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecs.length === 0 ? (
                    <TableEmptyState
                      colSpan={8}
                      title="Không tìm thấy kiến nghị nào"
                      description="Thử thay đổi từ khóa tìm kiếm hoặc chuyển sang chế độ Mobile để lập biên bản mới."
                    />
                  ) : (
                    filteredRecs.map((r) => {
                      const isOverdue = r.status === "WAITING_OVERDUE";
                      const isUnverified = r.status === "FEEDBACK_UNVERIFIED";
                      const isClosed = r.status === "RESOLVED_CLOSED";

                      return (
                        <TableRow key={r.id} className="hover:bg-slate-50/80">
                          <TableCell className="font-mono text-xs font-bold text-slate-800">
                            {r.id.startsWith("KN-") ? r.id : r.code}
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-slate-900 max-w-xs">
                            {r.title}
                          </TableCell>
                          <TableCell className="text-xs text-slate-700">{r.facilityName}</TableCell>
                          <TableCell className="text-xs text-slate-600">{r.hamlet}</TableCell>
                          <TableCell className="text-xs text-slate-700">{r.assignee}</TableCell>
                          <TableCell className="text-xs font-mono">
                            <span className={isOverdue ? "text-rose-600 font-bold" : "text-slate-600"}>
                              {r.dueText}
                            </span>
                          </TableCell>
                          <TableCell>
                            {isOverdue && (
                              <Badge variant="danger" className="text-[10px] gap-1">
                                <AlertCircle className="w-3 h-3" /> Quá hạn (Tính vào MET-05)
                              </Badge>
                            )}
                            {isUnverified && (
                              <Badge variant="warning" className="text-[10px] gap-1">
                                <Clock className="w-3 h-3" /> Chờ xác minh (Tính vào MET-05)
                              </Badge>
                            )}
                            {isClosed && (
                              <Badge variant="success" className="text-[10px] gap-1">
                                <Check className="w-3 h-3" /> Đã đóng
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900"
                                onClick={() => setSelectedRec(r)}
                              >
                                <Eye className="w-3.5 h-3.5 mr-1" /> Xem
                              </Button>
                              {!isReadOnlyHistory && !isClosed && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-[10px] border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                                  onClick={() => handleResolveRecommendation(r.id)}
                                >
                                  Xác nhận khắc phục
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: MOBILE FIELD CHECKLIST (REQ-M08-02, V14)
         ========================================================================= */}
      {deviceMode === "mobile" && (
        <div className="flex flex-col items-center gap-6 py-2">
          {/* Instructions Banner */}
          <div className="max-w-md w-full p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-3">
            <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Mô phỏng Ứng dụng Hiện trường Mobile V14 (P5 / P6):</span>{" "}
              Hỗ trợ tích chọn tiêu chí hiện trường, chụp ảnh minh chứng và lưu nháp ngoại tuyến (Offline Draft) vào LocalStorage (<code>{STORAGE_OFFLINE_KEY}</code>) khi mất sóng. Chuyển sang trực tuyến để kích hoạt nút đồng bộ.
            </div>
          </div>

          {/* Smartphone Simulator Frame */}
          <div className="w-full max-w-sm bg-white border-4 border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            {/* Phone Top Notch / Status Bar */}
            <div className="bg-slate-900 text-white px-5 py-2.5 flex items-center justify-between text-[11px] font-semibold">
              <span>09:41</span>
              {/* Network Status Toggle Button */}
              <button
                type="button"
                onClick={() => setIsOnline(!isOnline)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${
                  isOnline
                    ? "bg-emerald-600 text-white"
                    : "bg-rose-600 text-white animate-pulse"
                }`}
                title="Bấm để mô phỏng chuyển đổi Mất sóng (Offline) vs Có sóng (Online 4G)"
              >
                {isOnline ? (
                  <>
                    <Wifi className="w-3 h-3" /> Online 4G
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3" /> Offline (Mất sóng)
                  </>
                )}
              </button>
            </div>

            {/* Mobile App Header */}
            <div className="p-4 bg-emerald-800 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-200">
                  KIỂM TRA HIỆN TRƯỜNG • REQ-M08-02
                </span>
                <h3 className="text-sm font-bold mt-0.5">NVH Thôn Đồng Tiến</h3>
                <p className="text-[11px] text-emerald-100">Xóm Đồng Thịnh • Cơ sở văn hóa số 01</p>
              </div>
              <Badge variant="neutral" className="text-[10px] font-mono text-emerald-900 bg-white">
                P5 Mobile
              </Badge>
            </div>

            {/* Offline Draft Notification / Sync Banner */}
            <div
              className={`p-3 text-xs flex items-center justify-between border-b ${
                offlineDrafts.length > 0
                  ? isOnline
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-amber-50 border-amber-200 text-amber-900"
                  : "bg-slate-50 border-slate-200 text-slate-600"
              }`}
            >
              <div className="flex items-center gap-2">
                <FolderSync className="w-4 h-4 shrink-0" />
                <span className="font-semibold text-[11px]">
                  {offlineDrafts.length > 0
                    ? `Đang có ${offlineDrafts.length} bản nháp ngoại tuyến`
                    : "Không có bản nháp tồn đọng"}
                </span>
              </div>

              {offlineDrafts.length > 0 && isOnline && (
                <Button
                  size="sm"
                  variant="primary"
                  className="h-6 text-[10px] px-2 bg-emerald-700 hover:bg-emerald-800 font-bold"
                  onClick={handleSyncDraftsToServer}
                >
                  Đồng bộ tạo kiến nghị →
                </Button>
              )}
            </div>

            {/* Mobile Checklist Criteria Body */}
            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              {/* Criterion 1: PCCC Equipment */}
              <div className="p-3 border rounded-xl bg-white border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">1. Kiểm tra thiết bị PCCC</span>
                  <Badge variant="danger" className="text-[10px]">
                    Chưa đạt
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-600">
                  Phát hiện 03 bình bọt MFZ4 quá hạn kiểm định từ tháng 08/2026.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setPcccAttached(!pcccAttached)}
                    className={`text-[10px] font-semibold px-2 py-1 rounded border flex items-center gap-1 ${
                      pcccAttached
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    <Camera className="w-3 h-3" />
                    {pcccAttached ? "Ảnh bình PCCC (01 đính kèm)" : "Chụp ảnh đính kèm"}
                  </button>
                </div>
              </div>

              {/* Criterion 2: Sports Fence */}
              <div className="p-3 border rounded-xl bg-white border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">2. Rào chắn sân thể thao</span>
                  <Badge variant={fenceVerified ? "success" : "warning"} className="text-[10px]">
                    {fenceVerified ? "Đã xác minh" : "Chờ xác minh"}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-600">
                  Thôn đã lắp xong rào lưới B40, cần chụp ảnh kiểm tra thực tế.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setFenceVerified(!fenceVerified)}
                    className={`text-[10px] font-semibold px-2 py-1 rounded border flex items-center gap-1 ${
                      fenceVerified
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    <Check className="w-3 h-3" />
                    {fenceVerified ? "Đã chụp xác minh thực tế" : "Bấm chụp xác minh"}
                  </button>
                </div>
              </div>

              {/* Criterion 3: Sanitation & Lighting */}
              <div className="p-3 border rounded-xl bg-white border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">3. Vệ sinh & điện chiếu sáng</span>
                  <Badge variant="success" className="text-[10px]">
                    Đạt chuẩn
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-600">
                  Hệ thống 8 bóng LED hoạt động tốt, khuôn viên phong quang sạch sẽ.
                </p>
              </div>

              {/* Notes Input */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Ghi chú hiện trường:
                </label>
                <textarea
                  rows={2}
                  value={mobileNotes}
                  onChange={(e) => setMobileNotes(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800"
                />
              </div>
            </div>

            {/* Mobile Bottom Action Bar */}
            <div className="p-3.5 bg-slate-100 border-t border-slate-200 flex flex-col gap-2">
              <Button
                type="button"
                variant="primary"
                className="w-full text-xs h-9 bg-emerald-800 hover:bg-emerald-900 font-bold"
                onClick={handleSaveMobileDraft}
              >
                {!isOnline ? "Lưu nháp Offline (Mất sóng)" : "Lưu biên bản hiện trường"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL SLIDE-OVER DRAWER FOR INSPECTION RECOMMENDATION */}
      <SlideOverDrawer
        isOpen={Boolean(selectedRec)}
        onClose={() => setSelectedRec(null)}
        title={`Kiến nghị: ${selectedRec?.id || selectedRec?.code}`}
        description={`Cơ sở: ${selectedRec?.facilityName} • ${selectedRec?.hamlet}`}
        badge={
          selectedRec?.status === "WAITING_OVERDUE" ? (
            <Badge variant="danger">Quá hạn</Badge>
          ) : selectedRec?.status === "FEEDBACK_UNVERIFIED" ? (
            <Badge variant="warning">Chờ xác minh</Badge>
          ) : (
            <Badge variant="success">Đã đóng</Badge>
          )
        }
        footer={
          selectedRec && selectedRec.status !== "RESOLVED_CLOSED" && !isReadOnlyHistory ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleResolveRecommendation(selectedRec.id)}
            >
              Xác nhận cơ sở đã khắc phục hoàn tất
            </Button>
          ) : undefined
        }
      >
        {selectedRec && (
          <div className="space-y-4 text-xs text-slate-700">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <span className="text-slate-400">Nội dung yêu cầu khắc phục:</span>
              <p className="font-semibold text-slate-900 text-sm">{selectedRec.title}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-400">Thời hạn khắc phục:</span>
                <p className="font-mono font-bold text-slate-900">{selectedRec.dueText}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-400">Cán bộ phụ trách:</span>
                <p className="font-medium text-slate-900">{selectedRec.assignee}</p>
              </div>
            </div>

            <div className="p-3.5 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 space-y-1">
              <span className="font-bold">Quy trình đóng kiến nghị có xác minh (AC-13, V10):</span>
              <p className="text-[11px] leading-relaxed">
                Khi cơ sở báo cáo đã hoàn thành sửa chữa, cán bộ tiến hành kiểm tra phúc tra thực tế tại hiện trường. Bấm &quot;Xác nhận cơ sở đã khắc phục hoàn tất&quot; để đóng kiến nghị và cập nhật giảm số lượng kiến nghị mở MET-05 trên toàn hệ thống.
              </p>
            </div>
          </div>
        )}
      </SlideOverDrawer>
    </div>
  );
}
