"use client";

import * as React from "react";
import { useDemoContext } from "@/lib/tenancy/demo-context";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableEmptyState } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { maskPII } from "@/lib/authorization/pii-mask";
import type { CitizenSubjectItem, CitizenResidenceHistoryItem } from "@/lib/store/demo-state";
import {
  Database,
  Search,
  Plus,
  Filter,
  Users,
  Building,
  CheckCircle2,
  Clock,
  AlertTriangle,
  History,
  FileText,
  MapPin,
  ShieldAlert,
  Info,
  GitMerge,
  ArrowRight,
  Home,
  Check,
  Layers,
} from "lucide-react";

interface FacilityItem {
  id: string;
  code: string;
  name: string;
  category: string;
  capacity: string;
  hamlet: string;
  status: string;
  builtYear: number;
  manager: string;
  formerName?: string;
  tenantCode: "XA_A" | "XA_B";
  interDepartmentFiles: string[];
}

const INITIAL_FACILITIES: FacilityItem[] = [
  // Xã A
  {
    id: "fac-1",
    code: "CS-VH-001",
    name: "Nhà văn hóa Xóm A1",
    category: "Nhà văn hóa xóm",
    capacity: "150 chỗ ngồi",
    hamlet: "Xóm A1",
    status: "Hoạt động tốt",
    builtYear: 2021,
    manager: "Trưởng xóm Đỗ Minh Đức (P6)",
    formerName: "Hội trường thôn A1",
    tenantCode: "XA_A",
    interDepartmentFiles: ["Hồ sơ đất công số 142/QĐ", "Biên bản bàn giao thiết bị âm thanh", "Sổ kiểm tra PCCC 2026"],
  },
  {
    id: "fac-2",
    code: "CS-VH-002",
    name: "Đình làng A1",
    category: "Di tích lịch sử cấp tỉnh",
    capacity: "Khuôn viên 800m2",
    hamlet: "Xóm A1",
    status: "Bảo tồn tốt",
    builtYear: 1890,
    manager: "Ban khánh tiết Đình làng",
    formerName: "Đình Thượng A1",
    tenantCode: "XA_A",
    interDepartmentFiles: ["Bằng xếp hạng di tích cấp tỉnh", "Quy hoạch khoanh vùng bảo vệ di tích", "Kế hoạch tổ chức Lễ hội đầu xuân"],
  },
  {
    id: "fac-3",
    code: "CS-VH-003",
    name: "Sân thể thao trung tâm xã",
    category: "Khu thể thao đa năng",
    capacity: "Sân bóng đá mini & bóng chuyền",
    hamlet: "Xóm A2",
    status: "Đang sử dụng",
    builtYear: 2023,
    manager: "Đoàn Thanh niên xã",
    tenantCode: "XA_A",
    interDepartmentFiles: ["Quyết định đầu tư NTM", "Hồ sơ bàn giao thiết bị tập thể dục ngoài trời"],
  },
  // Xã B
  {
    id: "fac-b-1",
    code: "CS-VH-B-001",
    name: "Nhà văn hóa Xóm B1",
    category: "Nhà văn hóa xóm",
    capacity: "120 chỗ ngồi",
    hamlet: "Xóm B1",
    status: "Hoạt động tốt",
    builtYear: 2022,
    manager: "Trưởng xóm Chè (P6-B)",
    tenantCode: "XA_B",
    interDepartmentFiles: ["Hồ sơ thiết chế văn hóa NTM kiểu mẫu"],
  },
  {
    id: "fac-b-2",
    code: "CS-VH-B-002",
    name: "Không gian Trưng bày Văn hóa Trà Đồi Chè",
    category: "Thiết chế du lịch & Di sản",
    capacity: "Khuôn viên 1.500m2",
    hamlet: "Xóm B1",
    status: "Bảo tồn tốt",
    builtYear: 2020,
    manager: "HTX Chè Hảo Đạt & UBND Xã",
    tenantCode: "XA_B",
    interDepartmentFiles: ["Hồ sơ di sản văn hóa phi vật thể quốc gia về Tri thức làm trà"],
  },
];

export default function DuLieuDungChungPage() {
  const { tenant, data, updateTenantData, addAuditLog, persona } = useDemoContext();
  const [tab, setTab] = React.useState<"FACILITIES" | "SUBJECTS">("FACILITIES");
  const [search, setSearch] = React.useState("");
  const [selectedFacility, setSelectedFacility] = React.useState<FacilityItem | null>(null);
  const [facilitySubTab, setFacilitySubTab] = React.useState<"STATUS" | "FILES" | "HISTORY">("STATUS");
  const [duplicateWarning, setDuplicateWarning] = React.useState<string | null>(null);

  // Atomic Merge State
  const [isMergeModalOpen, setIsMergeModalOpen] = React.useState(false);
  const [selectedSubjectIds, setSelectedSubjectIds] = React.useState<string[]>([]);
  const [selectedGoldenId, setSelectedGoldenId] = React.useState<string>("");
  const [mergeSuccessMessage, setMergeSuccessMessage] = React.useState<string | null>(null);

  // Residence History State
  const [isResidenceModalOpen, setIsResidenceModalOpen] = React.useState(false);
  const [selectedCitizenForHistory, setSelectedCitizenForHistory] = React.useState<CitizenSubjectItem | null>(null);

  const tenantFacilities = INITIAL_FACILITIES.filter((f) => f.tenantCode === tenant.code);
  const citizenSubjects: CitizenSubjectItem[] = data.masterSubjects || [];
  const residenceList: CitizenResidenceHistoryItem[] = data.residenceHistory || [];

  React.useEffect(() => {
    if (tenantFacilities.length > 0) {
      setSelectedFacility(tenantFacilities[0]);
    } else {
      setSelectedFacility(null);
    }
  }, [tenant.code]);

  const filteredFacilities = tenantFacilities.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase()) || f.code.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSubjects = citizenSubjects.filter((s) => {
    const term = search.toLowerCase();
    return (
      !term ||
      s.fullName.toLowerCase().includes(term) ||
      s.code.toLowerCase().includes(term) ||
      s.cccd.toLowerCase().includes(term) ||
      s.hamlet.toLowerCase().includes(term) ||
      s.address.toLowerCase().includes(term)
    );
  });

  // Detect duplicate CCCDs among active records
  const duplicateCccdGroups = React.useMemo(() => {
    const map: Record<string, CitizenSubjectItem[]> = {};
    citizenSubjects.forEach((s) => {
      if (s.status === "ACTIVE" && s.cccd) {
        map[s.cccd] = map[s.cccd] || [];
        map[s.cccd].push(s);
      }
    });
    return Object.entries(map).filter(([_, items]) => items.length > 1);
  }, [citizenSubjects]);

  const handleOpenMerge = (presetGroup?: CitizenSubjectItem[]) => {
    if (presetGroup && presetGroup.length >= 2) {
      const ids = presetGroup.map((item) => item.id);
      setSelectedSubjectIds(ids);
      setSelectedGoldenId(presetGroup[0].id);
    } else {
      setSelectedSubjectIds([]);
      setSelectedGoldenId("");
    }
    setIsMergeModalOpen(true);
  };

  const handleExecuteMerge = () => {
    if (!selectedGoldenId || selectedSubjectIds.length < 2) return;
    const duplicateIds = selectedSubjectIds.filter((id) => id !== selectedGoldenId);
    const goldenRecord = citizenSubjects.find((s) => s.id === selectedGoldenId);

    updateTenantData((prev) => {
      const nextSubjects = prev.masterSubjects.map((s) => {
        if (duplicateIds.includes(s.id)) {
          return {
            ...s,
            status: "MERGED" as const,
            mergedIntoId: selectedGoldenId,
          };
        }
        return s;
      });
      return {
        ...prev,
        masterSubjects: nextSubjects,
      };
    });

    addAuditLog({
      action: "MERGE_CITIZEN_IDENTITIES",
      entityType: "MASTER_SUBJECTS",
      entityId: selectedGoldenId,
      details: {
        message: `Atomic merge: Gộp hồ sơ công dân vào Golden ID [${selectedGoldenId} - ${goldenRecord?.fullName}] mô phỏng RPC merge_citizen_identities`,
        goldenId: selectedGoldenId,
        mergedSubjectIds: duplicateIds,
        action: "RPC merge_citizen_identities",
      },
    });

    setMergeSuccessMessage(
      `Đã thực hiện gộp thành công ${duplicateIds.length} bản ghi vào Golden ID [${goldenRecord?.code || selectedGoldenId} - ${goldenRecord?.fullName}]. Trạng thái bản ghi phụ đã chuyển sang MERGED.`
    );
    setIsMergeModalOpen(false);
    setSelectedSubjectIds([]);
    setSelectedGoldenId("");
  };

  const handleOpenResidenceHistory = (citizen?: CitizenSubjectItem) => {
    setSelectedCitizenForHistory(citizen || null);
    setIsResidenceModalOpen(true);
  };

  const filteredResidenceEvents = React.useMemo(() => {
    if (selectedCitizenForHistory) {
      return residenceList.filter(
        (rh) => rh.subjectId === selectedCitizenForHistory.id || rh.cccd === selectedCitizenForHistory.cccd
      );
    }
    return residenceList;
  }, [residenceList, selectedCitizenForHistory]);

  const handleSimulateDuplicate = () => {
    setDuplicateWarning(
      "CẢNH BÁO TRÙNG LẶP (AC-04): Cơ sở 'Đình làng A1' có tọa độ GPS và tên gốc trùng khớp 95% với di tích lịch sử 'Đình Thượng' trong CSDL di sản Sở VHTT&DL (Mã DS-TN-042). Hệ thống kiến nghị liên kết thay vì tạo mới."
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gov-600">
            Phân hệ M01 • Dữ liệu dùng chung & Thiết chế cơ sở
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1 font-display">
            Quản lý Danh mục Cơ sở Thiết chế & Chủ thể Đa ngành
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kho dữ liệu nền tảng định danh công dân, di tích, cơ sở vật chất văn hóa - xã hội của {tenant.name}.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSimulateDuplicate}
            className="text-amber-700 border-amber-300 hover:bg-amber-50 gap-1.5"
            title="Thử thuật toán phát hiện trùng lặp cơ sở (AC-04)"
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Thử phát hiện trùng lặp (AC-04)
          </Button>
        </div>
      </div>

      {duplicateWarning && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start justify-between gap-3 text-xs text-amber-900 shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">Cảnh báo kiểm tra trùng lặp danh mục:</span>
              <p className="leading-relaxed">{duplicateWarning}</p>
            </div>
          </div>
          <button
            onClick={() => setDuplicateWarning(null)}
            className="text-xs font-semibold text-amber-700 hover:underline shrink-0"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex gap-2">
          <Button
            variant={tab === "FACILITIES" ? "primary" : "outline"}
            size="sm"
            onClick={() => setTab("FACILITIES")}
            className="gap-1.5"
          >
            <Building className="w-3.5 h-3.5" /> Cơ sở & Thiết chế văn hóa ({tenantFacilities.length})
          </Button>
          <Button
            variant={tab === "SUBJECTS" ? "primary" : "outline"}
            size="sm"
            onClick={() => setTab("SUBJECTS")}
            className="gap-1.5"
          >
            <Users className="w-3.5 h-3.5" /> Chủ thể & Công dân ({citizenSubjects.length})
          </Button>
        </div>

        <div className="relative w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <Input
            placeholder="Tìm kiếm danh mục..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* TAB 1: FACILITIES - MASTER DETAIL SPLIT VIEW 55/45 */}
      {tab === "FACILITIES" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Master List: 7 Cols */}
          <div className="lg:col-span-7">
            <Card className="shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="font-display">Danh sách Thiết chế & Di tích ({filteredFacilities.length})</CardTitle>
                <CardDescription>Bấm vào từng cơ sở để mở hồ sơ kỹ thuật chi tiết bên phải</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table density="compact">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-28">Mã cơ sở</TableHead>
                      <TableHead>Tên thiết chế</TableHead>
                      <TableHead>Phân loại</TableHead>
                      <TableHead>Địa bàn</TableHead>
                      <TableHead className="text-right pr-4">Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFacilities.length === 0 ? (
                      <TableEmptyState
                        title="Không tìm thấy thiết chế nào"
                        description="Thử tìm theo từ khóa khác hoặc chuyển sang phân hệ khác."
                        colSpan={5}
                      />
                    ) : (
                      filteredFacilities.map((f) => {
                        const isSelected = selectedFacility?.id === f.id;
                        return (
                          <TableRow
                            key={f.id}
                            onClick={() => setSelectedFacility(f)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? "bg-gov-50/90 font-semibold" : "hover:bg-slate-50"
                            }`}
                          >
                            <TableCell className="font-mono text-xs font-bold text-gov-700">
                              {f.code}
                            </TableCell>
                            <TableCell className="text-slate-900">{f.name}</TableCell>
                            <TableCell className="text-xs text-slate-600">{f.category}</TableCell>
                            <TableCell className="text-xs text-slate-600">{f.hamlet}</TableCell>
                            <TableCell className="text-right pr-4">
                              <Badge variant="success">{f.status}</Badge>
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

          {/* Detail Panel: 5 Cols */}
          <div className="lg:col-span-5">
            {selectedFacility ? (
              <Card className="shadow-xs border-l-4 border-l-gov-600 sticky top-20">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-gov-700 bg-gov-50 px-2 py-0.5 rounded border border-gov-200">
                      {selectedFacility.code}
                    </span>
                    <Badge variant="info">Năm XD: {selectedFacility.builtYear}</Badge>
                  </div>
                  <CardTitle className="font-display text-base mt-1">{selectedFacility.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {selectedFacility.hamlet} • {tenant.name}
                  </CardDescription>

                  {/* Subtabs inside Detail */}
                  <div className="flex gap-1.5 pt-3 border-t border-slate-100 mt-3">
                    <button
                      onClick={() => setFacilitySubTab("STATUS")}
                      className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-colors ${
                        facilitySubTab === "STATUS" ? "bg-gov-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      Hiện trạng
                    </button>
                    <button
                      onClick={() => setFacilitySubTab("FILES")}
                      className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-colors ${
                        facilitySubTab === "FILES" ? "bg-gov-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      Hồ sơ liên ngành
                    </button>
                    <button
                      onClick={() => setFacilitySubTab("HISTORY")}
                      className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-colors ${
                        facilitySubTab === "HISTORY" ? "bg-gov-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      Lịch sử đổi tên (AC-22)
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4 text-xs">
                  {facilitySubTab === "STATUS" && (
                    <div className="space-y-3">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Phân loại thiết chế:</span>
                          <span className="font-semibold text-slate-800">{selectedFacility.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Quy mô sức chứa:</span>
                          <span className="font-semibold text-slate-800">{selectedFacility.capacity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Cán bộ / Đơn vị quản lý:</span>
                          <span className="font-semibold text-slate-800">{selectedFacility.manager}</span>
                        </div>
                      </div>

                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Tiêu chí Nông thôn mới:
                        </div>
                        <p className="text-[11px]">
                          Thiết chế đáp ứng đủ 100% diện tích và trang thiết bị theo Thông tư 12/2010/TT-BVHTTDL.
                        </p>
                      </div>
                    </div>
                  )}

                  {facilitySubTab === "FILES" && (
                    <div className="space-y-2">
                      <p className="text-slate-600 font-medium">Hồ sơ liên kết các phòng ban cấp huyện/xã:</p>
                      <div className="space-y-1.5">
                        {selectedFacility.interDepartmentFiles.map((file, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs"
                          >
                            <span className="flex items-center gap-2 text-slate-800 font-medium">
                              <FileText className="w-4 h-4 text-gov-600" />
                              {file}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">Đã lưu trữ</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {facilitySubTab === "HISTORY" && (
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 space-y-1.5">
                        <div className="font-bold flex items-center gap-1.5">
                          <History className="w-4 h-4 text-blue-600" />
                          Truy nguyên lịch sử danh xưng (AC-22):
                        </div>
                        <p className="text-[11px] leading-relaxed">
                          Tên trước khi nâng cấp sáp nhập: <strong>{selectedFacility.formerName || "Chưa từng đổi tên"}</strong>. Mọi văn bản hành chính cũ ban hành dưới tên cũ vẫn tự động ánh xạ về mã định danh <code>{selectedFacility.code}</code>.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400">
                Chọn một cơ sở từ danh sách bên trái để xem hồ sơ.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SUBJECTS */}
      {tab === "SUBJECTS" && (
        <div className="space-y-4">
          {/* Duplicate CCCD Warning Banner */}
          {duplicateCccdGroups.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-950 shadow-xs">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Phát hiện {duplicateCccdGroups.length} trường hợp trùng định danh CCCD (AC-01 / D03):</span>
                  <p className="mt-0.5 text-amber-900 leading-relaxed">
                    Có {duplicateCccdGroups.map(([cccd, items]) => `${items[0].fullName} (${items.length} bản ghi)`).join(", ")} khai báo lặp giữa Bộ phận Một Cửa và các phân hệ. Hệ thống kiến nghị thực hiện Atomic Merge chuẩn hóa về Golden ID.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleOpenMerge(duplicateCccdGroups[0][1])}
                className="gap-1.5 shrink-0 bg-amber-700 hover:bg-amber-800 text-white border-none"
              >
                <GitMerge className="w-3.5 h-3.5" /> Khắc phục trùng lặp ngay
              </Button>
            </div>
          )}

          {/* Merge Success Alert */}
          {mergeSuccessMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-950 shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-medium">{mergeSuccessMessage}</span>
              </div>
              <button
                onClick={() => setMergeSuccessMessage(null)}
                className="text-xs font-semibold text-emerald-700 hover:underline shrink-0"
              >
                Đóng
              </button>
            </div>
          )}

          <Card className="shadow-xs">
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
              <div>
                <CardTitle className="font-display">Danh mục Chủ thể & Đối tượng Quản lý ({filteredSubjects.length})</CardTitle>
                <CardDescription>
                  Dữ liệu công dân được chuẩn hóa định danh và bảo vệ dữ liệu PII theo nguyên tắc D03
                </CardDescription>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenResidenceHistory()}
                  className="gap-1.5 text-slate-700 hover:text-slate-900"
                >
                  <History className="w-3.5 h-3.5 text-slate-500" />
                  Biến động cư trú ({residenceList.length})
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleOpenMerge()}
                  className="gap-1.5"
                >
                  <GitMerge className="w-3.5 h-3.5" />
                  Ghép định danh trùng (Atomic Merge)
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table density="compact">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Mã hồ sơ</TableHead>
                    <TableHead>Họ và tên</TableHead>
                    <TableHead className="w-32">Số CCCD</TableHead>
                    <TableHead className="w-28">Số điện thoại</TableHead>
                    <TableHead>Địa bàn thôn / Nơi ở</TableHead>
                    <TableHead>Diện quản lý</TableHead>
                    <TableHead className="w-32 text-center">Trạng thái hồ sơ</TableHead>
                    <TableHead className="w-40 text-right pr-4">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubjects.length === 0 ? (
                    <TableEmptyState
                      title="Không tìm thấy chủ thể công dân nào"
                      description="Thử tìm theo từ khóa tên, CCCD hoặc địa bàn thôn xóm khác."
                      colSpan={8}
                    />
                  ) : (
                    filteredSubjects.map((s) => {
                      const isMerged = s.status === "MERGED";
                      const isDuplicateCccd =
                        s.status === "ACTIVE" &&
                        citizenSubjects.filter((other) => other.status === "ACTIVE" && other.cccd === s.cccd).length > 1;

                      return (
                        <TableRow key={s.id} className={isMerged ? "bg-slate-50/70 opacity-75" : isDuplicateCccd ? "bg-amber-50/40" : ""}>
                          <TableCell className="font-mono text-xs font-bold text-gov-700">
                            {s.code}
                          </TableCell>
                          <TableCell className="font-semibold text-slate-900">
                            <div className="flex items-center gap-1.5">
                              <span>{s.fullName}</span>
                              {isDuplicateCccd && (
                                <Badge variant="warning" className="text-[10px] py-0 px-1">
                                  Trùng CCCD
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-700">
                            {maskPII(s.cccd, "cccd", persona)}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-600">
                            {maskPII(s.phone, "phone", persona)}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600">
                            <span className="font-medium text-slate-800">{s.hamlet}</span>
                            <span className="text-slate-400 block text-[11px] truncate max-w-xs">{s.address}</span>
                          </TableCell>
                          <TableCell className="text-xs text-slate-700">
                            {s.subjectType === "HOUSEHOLD_HEAD"
                              ? "Chủ hộ gia đình"
                              : s.subjectType === "WAR_INVALID"
                              ? "Người có công"
                              : s.subjectType === "SOCIAL_AID_BENEFICIARY"
                              ? "Đối tượng BTXH"
                              : s.subjectType === "ETHNIC_MINORITY"
                              ? "Đồng bào DTTS"
                              : "Công dân cơ sở"}
                          </TableCell>
                          <TableCell className="text-center">
                            {isMerged ? (
                              <Badge variant="warning" className="text-[10px]">
                                Đã gộp vào {s.mergedIntoId}
                              </Badge>
                            ) : s.status === "RELOCATED" ? (
                              <Badge variant="neutral" className="text-[10px]">
                                Đã chuyển đi
                              </Badge>
                            ) : (
                              <Badge variant="success" className="text-[10px]">
                                Hoạt động
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right pr-4">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenResidenceHistory(s)}
                                className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900 gap-1"
                                title="Xem lịch sử biến động cư trú của công dân này"
                              >
                                <History className="w-3.5 h-3.5 text-slate-400" />
                                Cư trú
                              </Button>
                              {isDuplicateCccd && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const pair = citizenSubjects.filter((x) => x.cccd === s.cccd);
                                    handleOpenMerge(pair);
                                  }}
                                  className="h-7 px-2 text-xs border-amber-300 text-amber-800 hover:bg-amber-50 gap-1"
                                  title="Gộp bản ghi trùng lặp này vào Golden ID"
                                >
                                  <GitMerge className="w-3 h-3 text-amber-600" />
                                  Gộp
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

      {/* MODAL 1: ATOMIC MERGE DUPLICATE IDENTITIES */}
      <Modal
        isOpen={isMergeModalOpen}
        onClose={() => setIsMergeModalOpen(false)}
        title="Ghép định danh trùng (Atomic Merge - RPC D03)"
        description="Mô phỏng thủ tục merge_citizen_identities gộp các bản ghi công dân trùng lặp về Golden ID chuẩn"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsMergeModalOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="primary"
              disabled={!selectedGoldenId || selectedSubjectIds.length < 2}
              onClick={handleExecuteMerge}
              className="gap-1.5"
            >
              <GitMerge className="w-3.5 h-3.5" />
              Thực hiện gộp định danh (Atomic Merge)
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-1.5 text-blue-900">
            <div className="font-semibold flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              Nguyên tắc Ghép định danh Atomic Merge:
            </div>
            <p className="text-[11px] leading-relaxed">
              Hệ thống sẽ giữ nguyên <strong>Mã chuẩn (Golden ID)</strong> ở trạng thái hoạt động (ACTIVE). Tất cả các bản ghi phụ còn lại sẽ được chuyển trạng thái sang <strong>MERGED</strong> và lưu khóa ngoại tham chiếu <code>merged_into_id</code>. Tác vụ sẽ tự động phát sinh log kiểm toán.
            </p>
          </div>

          {/* Quick presets if duplicates detected */}
          {duplicateCccdGroups.length > 0 && (
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">Các nhóm trùng lặp CCCD phát hiện tự động:</label>
              <div className="flex flex-wrap gap-2">
                {duplicateCccdGroups.map(([cccd, group]) => {
                  const isCurrent = group.every((g) => selectedSubjectIds.includes(g.id));
                  return (
                    <button
                      key={cccd}
                      type="button"
                      onClick={() => {
                        const ids = group.map((g) => g.id);
                        setSelectedSubjectIds(ids);
                        setSelectedGoldenId(group[0].id);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium text-left transition-colors ${
                        isCurrent
                          ? "bg-amber-100 border-amber-400 text-amber-900"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <div className="font-bold">{group[0].fullName}</div>
                      <div className="text-[10px] text-slate-500">
                        CCCD: {maskPII(cccd, "cccd", persona)} ({group.length} bản ghi)
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Checklist of citizens to merge */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-700 block">
              Chọn các bản ghi công dân cần ghép ({selectedSubjectIds.length} đã chọn):
            </label>
            <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white">
              {citizenSubjects.map((s) => {
                const isChecked = selectedSubjectIds.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className={`p-2.5 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 ${
                      isChecked ? "bg-amber-50/60" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            const next = [...selectedSubjectIds, s.id];
                            setSelectedSubjectIds(next);
                            if (!selectedGoldenId) setSelectedGoldenId(s.id);
                          } else {
                            const next = selectedSubjectIds.filter((id) => id !== s.id);
                            setSelectedSubjectIds(next);
                            if (selectedGoldenId === s.id) {
                              setSelectedGoldenId(next[0] || "");
                            }
                          }
                        }}
                        className="rounded border-slate-300 text-gov-600 focus:ring-gov-600"
                      />
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{s.fullName}</span>
                          <span className="font-mono text-[10px] text-slate-400">[{s.code}]</span>
                          {s.status === "MERGED" && (
                            <Badge variant="warning" className="text-[10px] py-0 px-1">
                              Đã gộp
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          CCCD: {maskPII(s.cccd, "cccd", persona)} • {s.hamlet} • {s.address}
                        </div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Golden ID Selector */}
          {selectedSubjectIds.length >= 2 && (
            <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <label className="font-bold text-slate-800 block">
                Chọn Bản ghi Chuẩn (Golden ID) để giữ lại: *
              </label>
              <select
                value={selectedGoldenId}
                onChange={(e) => setSelectedGoldenId(e.target.value)}
                className="w-full text-xs font-semibold border border-slate-300 rounded-md px-3 py-2 bg-white"
              >
                {selectedSubjectIds.map((id) => {
                  const rec = citizenSubjects.find((s) => s.id === id);
                  if (!rec) return null;
                  return (
                    <option key={id} value={id}>
                      ★ [Golden] {rec.code} - {rec.fullName} (CCCD: {maskPII(rec.cccd, "cccd", persona)}) - {rec.hamlet}
                    </option>
                  );
                })}
              </select>

              <div className="text-[11px] text-slate-600 mt-2 space-y-1">
                <div className="flex items-center gap-1.5 font-medium text-emerald-800">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Bản ghi chính: Giữ nguyên trạng thái ACTIVE với đầy đủ lịch sử.
                </div>
                <div className="flex items-center gap-1.5 font-medium text-amber-800">
                  <ArrowRight className="w-3.5 h-3.5 text-amber-600" />
                  Bản ghi phụ ({selectedSubjectIds.filter((id) => id !== selectedGoldenId).length}): Chuyển thành MERGED, trỏ về Golden ID.
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* MODAL 2: CITIZEN RESIDENCE HISTORY */}
      <Modal
        isOpen={isResidenceModalOpen}
        onClose={() => setIsResidenceModalOpen(false)}
        title={
          selectedCitizenForHistory
            ? `Lịch sử biến động cư trú: ${selectedCitizenForHistory.fullName}`
            : `Lịch sử biến động cư trú toàn xã (${filteredResidenceEvents.length})`
        }
        description="Trích xuất từ bảng DDL citizen_residence_history theo Luật Cư trú"
        footer={
          <Button variant="outline" onClick={() => setIsResidenceModalOpen(false)}>
            Đóng
          </Button>
        }
      >
        <div className="space-y-4 text-xs">
          {selectedCitizenForHistory && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 text-sm">{selectedCitizenForHistory.fullName}</div>
                <div className="text-slate-500 text-xs">
                  Mã: {selectedCitizenForHistory.code} • CCCD: {maskPII(selectedCitizenForHistory.cccd, "cccd", persona)} • Địa bàn: {selectedCitizenForHistory.hamlet}
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedCitizenForHistory(null)}
                className="text-xs text-gov-600"
              >
                Xem toàn xã
              </Button>
            </div>
          )}

          {filteredResidenceEvents.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-lg text-slate-400">
              Chưa ghi nhận biến động cư trú nào cho hồ sơ này.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredResidenceEvents.map((rh) => (
                <div
                  key={rh.id}
                  className="p-3.5 border border-slate-200 rounded-lg bg-white space-y-2 shadow-2xs hover:border-gov-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="info" className="text-[10px] font-bold">
                        {rh.actionTypeName}
                      </Badge>
                      <span className="font-bold text-slate-800">{rh.citizenName}</span>
                      <span className="font-mono text-slate-400 text-[11px]">
                        ({maskPII(rh.cccd, "cccd", persona)})
                      </span>
                    </div>
                    <span className="font-mono text-xs text-slate-500">{rh.eventDate}</span>
                  </div>

                  {/* Route change */}
                  <div className="p-2 bg-slate-50 rounded border border-slate-100 flex items-center gap-2 text-xs">
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Nơi ở cũ:</span>
                      <span className="text-slate-700 font-medium">{rh.oldAddress || rh.oldHamlet}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gov-600 shrink-0" />
                    <div className="flex-1">
                      <span className="text-[10px] text-gov-700 block uppercase font-bold">Nơi ở mới:</span>
                      <span className="text-slate-900 font-bold">{rh.newAddress || rh.newHamlet}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <div>
                      Căn cứ pháp lý: <strong className="text-slate-700">{rh.referenceDocument || "Quyết định UBND xã"}</strong>
                    </div>
                    {rh.notes && <div className="italic text-slate-600">Ghi chú: {rh.notes}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
