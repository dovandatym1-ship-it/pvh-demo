"use client";

import * as React from "react";
import { useDemo } from "@/lib/tenancy/demo-context";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabList, TabTrigger, TabContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableEmptyState,
} from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import {
  GraduationCap,
  School,
  BookOpen,
  Baby,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Filter,
  Check,
  X,
  Building2,
  AlertOctagon,
  Calendar,
  FileCheck2,
  UserCheck,
} from "lucide-react";
import type {
  SchoolItem,
  PrivateFacilityItem,
  CCLItem,
  TuitionExemptionItem,
} from "@/lib/store/demo-state";

export default function GiaoDucPage() {
  const { tenant, data, updateTenantData, addAuditLog } = useDemo();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = React.useState("");

  // AC-10 Filter: School Year vs Civil Year
  const [filterType, setFilterType] = React.useState<"ALL" | "SCHOOL_YEAR" | "CIVIL_YEAR">("ALL");
  const [selectedSchoolYear, setSelectedSchoolYear] = React.useState<string>("2026-2027");
  const [selectedCivilYear, setSelectedCivilYear] = React.useState<number>(2026);

  // Modals state
  const [suspensionModalFacility, setSuspensionModalFacility] = React.useState<PrivateFacilityItem | null>(null);
  const [suspensionReason, setSuspensionReason] = React.useState("");
  const [isNewFacilityModalOpen, setIsNewFacilityModalOpen] = React.useState(false);

  // New facility form state
  const [newFacName, setNewFacName] = React.useState("");
  const [newFacOwner, setNewFacOwner] = React.useState("");
  const [newFacCccd, setNewFacCccd] = React.useState("");
  const [newFacCapacity, setNewFacCapacity] = React.useState(20);
  const [newFacEnrolled, setNewFacEnrolled] = React.useState(18);
  const [newFacArea, setNewFacArea] = React.useState(36);

  const giaoDucData = data.domainRecords?.giaoDuc || {
    schools: [],
    privateFacilities: [],
    ccl: [],
    tuitionExemptions: [],
  };

  const schoolsList = giaoDucData.schools || [];
  const privateList = giaoDucData.privateFacilities || [];
  const cclList = giaoDucData.ccl || [];
  const tuitionList = giaoDucData.tuitionExemptions || [];

  // AC-10 filtered schools list
  const filteredSchools = schoolsList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.principal.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === "SCHOOL_YEAR") {
      return s.schoolYear === selectedSchoolYear;
    }
    if (filterType === "CIVIL_YEAR") {
      return s.civilYear === selectedCivilYear;
    }
    return true;
  });

  const filteredPrivate = privateList.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTuition = tuitionList.filter(
    (t) =>
      t.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.schoolName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Summary counts
  const totalStudents = schoolsList.reduce((acc, s) => acc + s.totalStudents, 0);
  const nonCompliantPrivateCount = privateList.filter(
    (p) => p.sqmPerChild < 1.5 || !p.fireSafetyCertified || p.licensingStatus === "SUSPENDED"
  ).length;

  // Handler: Suspend private facility
  const handleConfirmSuspension = () => {
    if (!suspensionModalFacility) return;

    updateTenantData((prev) => {
      const current = prev.domainRecords?.giaoDuc?.privateFacilities || [];
      const updated = current.map((f) =>
        f.id === suspensionModalFacility.id
          ? {
              ...f,
              licensingStatus: "SUSPENDED" as const,
            }
          : f
      );
      return {
        ...prev,
        domainRecords: {
          ...prev.domainRecords,
          giaoDuc: {
            ...prev.domainRecords.giaoDuc,
            privateFacilities: updated,
          },
        },
      };
    });

    addAuditLog({
      action: "SUSPEND_PRIVATE_PRESCHOOL_FACILITY",
      entityType: "PRIVATE_PRESCHOOL_FACILITY",
      entityId: suspensionModalFacility.name,
      details: {
        message: `Đình chỉ hoạt động cơ sở mầm non độc lập ${suspensionModalFacility.name} do không đảm bảo an toàn diện tích (${suspensionModalFacility.sqmPerChild}m²/cháu < 1.5m²) hoặc vi phạm PCCC`,
        reason: suspensionReason || "Vi phạm tiêu chuẩn diện tích sàn tối thiểu 1.5m²/trẻ theo quy định",
        facilityName: suspensionModalFacility.name,
        sqmPerChild: suspensionModalFacility.sqmPerChild,
      },
    });

    setSuspensionModalFacility(null);
    setSuspensionReason("");
  };

  // Handler: Restore facility
  const handleRestoreFacility = (fac: PrivateFacilityItem) => {
    updateTenantData((prev) => {
      const current = prev.domainRecords?.giaoDuc?.privateFacilities || [];
      const updated = current.map((f) =>
        f.id === fac.id
          ? {
              ...f,
              licensingStatus: "LICENSED" as const,
            }
          : f
      );
      return {
        ...prev,
        domainRecords: {
          ...prev.domainRecords,
          giaoDuc: {
            ...prev.domainRecords.giaoDuc,
            privateFacilities: updated,
          },
        },
      };
    });

    addAuditLog({
      action: "RESTORE_PRIVATE_PRESCHOOL_FACILITY",
      entityType: "PRIVATE_PRESCHOOL_FACILITY",
      entityId: fac.name,
      details: {
        message: `Khôi phục hoạt động cơ sở ${fac.name} sau khi khắc phục điều kiện diện tích và PCCC`,
      },
    });
  };

  // Handler: Approve tuition exemption
  const handleApproveTuition = (item: TuitionExemptionItem) => {
    updateTenantData((prev) => {
      const current = prev.domainRecords?.giaoDuc?.tuitionExemptions || [];
      const updated = current.map((t) =>
        t.id === item.id ? { ...t, status: "APPROVED" as const } : t
      );
      return {
        ...prev,
        domainRecords: {
          ...prev.domainRecords,
          giaoDuc: {
            ...prev.domainRecords.giaoDuc,
            tuitionExemptions: updated,
          },
        },
      };
    });

    addAuditLog({
      action: "APPROVE_TUITION_EXEMPTION",
      entityType: "TUITION_EXEMPTION",
      entityId: item.studentName,
      details: {
        message: `Phê duyệt hỗ trợ chi phí học tập và miễn giảm học phí cho học sinh ${item.studentName} (${item.schoolName})`,
      },
    });
  };

  // Format currency
  const formatMoney = (val: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1F633E]">
            <School className="w-4 h-4 text-[#1F633E]" />
            Phân hệ M03 • Giáo dục & Đào tạo
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            Quản lý Phổ cập Giáo dục & Cơ sở Trường học Cấp Xã
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Không gian tác nghiệp độc lập theo dõi mạng lưới trường công lập, nhóm trẻ độc lập tư thục và TTHTCĐ tại {tenant.name}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="info" className="px-3 py-1 font-semibold text-xs">
            Phổ cập MN 5 tuổi & THCS: Đạt chuẩn Mức độ 3
          </Badge>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover:border-emerald-300 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500">Mạng lưới trường công lập</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{schoolsList.length} trường</div>
              <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                Quy mô: {totalStudents} học sinh
              </div>
            </div>
            <GraduationCap className="w-8 h-8 text-[#1F633E]/20" />
          </CardContent>
        </Card>

        <Card className="hover:border-emerald-300 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500">Nhóm trẻ độc lập tư thục</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{privateList.length} cơ sở</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {nonCompliantPrivateCount > 0 ? (
                  <span className="text-rose-600 font-semibold">
                    {nonCompliantPrivateCount} cơ sở vi phạm/đình chỉ
                  </span>
                ) : (
                  "100% đạt chuẩn diện tích ≥ 1.5m²"
                )}
              </div>
            </div>
            <Baby className="w-8 h-8 text-sky-500/20" />
          </CardContent>
        </Card>

        <Card className="hover:border-emerald-300 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500">Trung tâm HTCĐ cấp xã</div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {cclList[0]?.coursesConducted || 0} chuyên đề
              </div>
              <div className="text-[11px] text-indigo-700 font-medium mt-0.5">
                Xếp loại thi đua: {cclList[0]?.annualRating === "EXCELLENT" ? "Xuất sắc" : "Tốt"}
              </div>
            </div>
            <BookOpen className="w-8 h-8 text-indigo-500/20" />
          </CardContent>
        </Card>

        <Card className="hover:border-emerald-300 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500">Miễn giảm học phí</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{tuitionList.length} hồ sơ</div>
              <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                {tuitionList.filter((t) => t.status === "APPROVED").length} hồ sơ đã duyệt
              </div>
            </div>
            <UserCheck className="w-8 h-8 text-emerald-500/20" />
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Container */}
      <Tabs defaultValue="schools" className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <TabList className="bg-slate-100 p-1 rounded-lg">
            <TabTrigger value="schools" className="flex items-center gap-2">
              <School className="w-4 h-4" />
              <span>Trường lớp & Phổ cập (AC-10)</span>
            </TabTrigger>
            <TabTrigger value="private-facilities" className="flex items-center gap-2">
              <Baby className="w-4 h-4" />
              <span>Nhóm trẻ tư thục (≥ 1.5m²/cháu)</span>
              {nonCompliantPrivateCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </TabTrigger>
            <TabTrigger value="ccl-tuition" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>TTHTCĐ & Miễn giảm học phí</span>
            </TabTrigger>
          </TabList>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <Input
              placeholder="Tìm kiếm trường, nhóm trẻ, học sinh..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* SUB-TAB 1: Trường lớp & Phổ cập giáo dục (AC-10)               */}
        {/* ------------------------------------------------------------- */}
        <TabContent value="schools" className="space-y-4">
          <Card>
            <CardHeader className="pb-3 flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Mạng lưới các trường mầm non & phổ thông công lập</span>
                  <Badge variant="neutral" className="text-xs">AC-10 Tuân thủ</Badge>
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Phân tách rõ ràng niên khóa học tập (School Year) vs năm hành chính ngân sách (Civil Year)
                </CardDescription>
              </div>

              {/* AC-10 Filter Switcher */}
              <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                <div className="text-xs font-semibold text-slate-600 flex items-center gap-1 mr-1">
                  <Filter className="w-3.5 h-3.5" /> Bộ lọc AC-10:
                </div>
                <button
                  type="button"
                  onClick={() => setFilterType("ALL")}
                  className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                    filterType === "ALL" ? "bg-white text-emerald-800 shadow-sm font-bold" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType("SCHOOL_YEAR")}
                  className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                    filterType === "SCHOOL_YEAR" ? "bg-white text-emerald-800 shadow-sm font-bold" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Niên khóa (2026–2027)
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType("CIVIL_YEAR")}
                  className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                    filterType === "CIVIL_YEAR" ? "bg-white text-emerald-800 shadow-sm font-bold" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Năm tài chính (2026)
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên đơn vị trường học</TableHead>
                    <TableHead>Cấp học</TableHead>
                    <TableHead className="text-center">Niên khóa học tập</TableHead>
                    <TableHead className="text-center">Năm hành chính</TableHead>
                    <TableHead className="text-center">Quy mô học sinh</TableHead>
                    <TableHead>Chuẩn quốc gia / Phổ cập</TableHead>
                    <TableHead>Hiệu trưởng đơn vị</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSchools.length === 0 ? (
                    <TableEmptyState colSpan={7} title="Không tìm thấy trường học phù hợp với bộ lọc" />
                  ) : (
                    filteredSchools.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-bold text-slate-800 flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-emerald-700" />
                          {s.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="neutral">
                            {s.level === "PRESCHOOL" ? "Mầm non" : s.level === "PRIMARY" ? "Tiểu học" : "THCS"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs font-semibold text-emerald-800 bg-emerald-50/50">
                          {s.schoolYear}
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs text-slate-600">
                          {s.civilYear}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-slate-800">
                          {s.totalStudents} học sinh
                        </TableCell>
                        <TableCell>
                          <Badge variant="success">
                            {s.universalizationStandard === "LEVEL_3"
                              ? "Chuẩn Mức độ 3 (Xuất sắc)"
                              : s.universalizationStandard === "LEVEL_2"
                              ? "Chuẩn Mức độ 2"
                              : "Chuẩn Mức độ 1"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-700 font-medium text-xs">
                          {s.principal}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabContent>

        {/* ------------------------------------------------------------- */}
        {/* SUB-TAB 2: Nhóm trẻ tư thục & Đình chỉ vi phạm (BL-030)       */}
        {/* ------------------------------------------------------------- */}
        <TabContent value="private-facilities" className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold uppercase tracking-wider text-amber-800">
                Quy chuẩn kỹ thuật nhóm trẻ độc lập tư thục (Thông tư 52/2020/TT-BGDĐT):
              </div>
              <p className="text-amber-800 leading-relaxed">
                Diện tích phòng nuôi dưỡng, chăm sóc, giáo dục trẻ em bảo đảm <strong>tối thiểu 1.5 m²/trẻ em</strong>. Các cơ sở có diện tích sàn/cháu dưới 1.5m² hoặc chưa nghiệm thu PCCC/ATTP bắt buộc phải bị áp dụng biện pháp <strong>Đình chỉ hoạt động</strong> cho đến khi hoàn thành khắc phục.
              </p>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Danh mục nhóm trẻ độc lập & lớp mẫu giáo độc lập tư thục
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Tự động tính toán chỉ số diện tích sàn/trẻ và thực hiện quyền đình chỉ hoạt động cấp xã
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên cơ sở nhóm trẻ</TableHead>
                    <TableHead>Chủ nhóm / Người đại diện</TableHead>
                    <TableHead className="text-center">Số trẻ đang nuôi</TableHead>
                    <TableHead className="text-center">Diện tích sàn</TableHead>
                    <TableHead className="text-center">Diện tích/Trẻ (m²/cháu)</TableHead>
                    <TableHead className="text-center">PCCC & ATTP</TableHead>
                    <TableHead>Trạng thái giấy phép</TableHead>
                    <TableHead className="text-right">Thao tác xử lý</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPrivate.length === 0 ? (
                    <TableEmptyState colSpan={8} title="Không có dữ liệu nhóm trẻ tư thục" />
                  ) : (
                    filteredPrivate.map((fac) => {
                      const isAreaCompliant = fac.sqmPerChild >= 1.5;
                      const isSuspended = fac.licensingStatus === "SUSPENDED";

                      return (
                        <TableRow key={fac.id} className={!isAreaCompliant || isSuspended ? "bg-rose-50/40" : ""}>
                          <TableCell className="font-bold text-slate-900">
                            {fac.name}
                            <span className="block text-[11px] font-normal text-slate-500">
                              {fac.facilityType === "INDEPENDENT_NURSERY_GROUP" ? "Nhóm trẻ độc lập" : "Lớp mẫu giáo độc lập"}
                            </span>
                          </TableCell>
                          <TableCell className="text-slate-800 text-xs">
                            {fac.ownerName}
                            <span className="block font-mono text-[11px] text-slate-500">{fac.ownerCccd}</span>
                          </TableCell>
                          <TableCell className="text-center font-bold text-slate-800">
                            {fac.currentEnrolled} / {fac.capacity} cháu
                          </TableCell>
                          <TableCell className="text-center font-mono text-xs text-slate-700">
                            {fac.totalAreaSqm} m²
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={`font-mono font-bold text-xs ${
                                isAreaCompliant ? "text-emerald-700" : "text-rose-700"
                              }`}
                            >
                              {fac.sqmPerChild.toFixed(2)} m²/cháu
                            </span>
                            {!isAreaCompliant && (
                              <Badge variant="danger" className="block mx-auto mt-1 text-[10px] py-0">
                                Thiếu {((1.5 - fac.sqmPerChild) * fac.currentEnrolled).toFixed(1)}m² sàn
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center gap-1">
                              {fac.fireSafetyCertified ? (
                                <Badge variant="success" className="text-[10px] py-0">PCCC: Đạt</Badge>
                              ) : (
                                <Badge variant="danger" className="text-[10px] py-0">PCCC: Chưa đạt</Badge>
                              )}
                              {fac.foodSafetyCertified ? (
                                <Badge variant="success" className="text-[10px] py-0">ATTP: Đạt</Badge>
                              ) : (
                                <Badge variant="warning" className="text-[10px] py-0">ATTP: Cảnh báo</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {isSuspended ? (
                              <Badge variant="danger" className="font-bold text-[11px]">
                                <AlertOctagon className="w-3 h-3 mr-1" />
                                ĐÃ ĐÌNH CHỈ
                              </Badge>
                            ) : fac.licensingStatus === "PROBATION" ? (
                              <Badge variant="warning" className="text-[11px]">Đang theo dõi (Thử thách)</Badge>
                            ) : (
                              <Badge variant="success" className="text-[11px]">Đủ điều kiện hoạt động</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {isSuspended ? (
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => handleRestoreFacility(fac)}
                                className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 text-xs"
                              >
                                <Check className="w-3.5 h-3.5 mr-1" /> Khôi phục
                              </Button>
                            ) : (
                              <Button
                                variant="danger"
                                size="xs"
                                onClick={() => {
                                  setSuspensionModalFacility(fac);
                                  setSuspensionReason(
                                    !isAreaCompliant
                                      ? `Không đạt diện tích tối thiểu (${fac.sqmPerChild}m²/cháu < 1.5m² quy định)`
                                      : !fac.fireSafetyCertified
                                      ? "Không có chứng nhận an toàn PCCC cơ sở"
                                      : "Vi phạm an toàn trường mầm non độc lập"
                                  );
                                }}
                                className="font-semibold text-xs shadow-sm"
                              >
                                <AlertOctagon className="w-3.5 h-3.5 mr-1" />
                                Đình chỉ vi phạm
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabContent>

        {/* ------------------------------------------------------------- */}
        {/* SUB-TAB 3: TTHTCĐ & Miễn giảm học phí (BL-033)                 */}
        {/* ------------------------------------------------------------- */}
        <TabContent value="ccl-tuition" className="space-y-6">
          {/* Section 1: Community Learning Center */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-1 bg-slate-50/70 border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-700" />
                  Ban Giám đốc TTHTCĐ Xã
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Cơ cấu tổ chức kiêm nhiệm cấp xã
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="text-slate-500 block">Giám đốc Trung tâm:</span>
                  <span className="font-bold text-slate-800">Phó Chủ tịch UBND Xã (Kiêm nhiệm)</span>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="text-slate-500 block">Phó Giám đốc thường trực:</span>
                  <span className="font-bold text-slate-800">Hiệu trưởng Trường Tiểu học</span>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="text-slate-500 block">Kế hoạch năm 2026:</span>
                  <Badge variant="success" className="mt-1">UBND Thành phố Phê duyệt</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-slate-800">
                  Chuyên đề Bồi dưỡng & Học tập Cộng đồng Năm 2026
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Các lớp phổ biến kiến thức KHKT, kỹ năng số và xóa mù chữ
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded border border-slate-200 bg-white flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-900">
                        Chuyển giao KHKT: Thâm canh Chè Hữu cơ theo tiêu chuẩn VietGAP
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        Thời lượng: 03 buổi • Phối hợp Hội Nông dân xã • 85 học viên
                      </div>
                    </div>
                    <Badge variant="success">Hoàn thành (100%)</Badge>
                  </div>

                  <div className="p-2.5 rounded border border-slate-200 bg-white flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-900">
                        Xóa mù chữ mức độ 2 & Giáo dục sau xóa mù chữ cho người lớn
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        Thời lượng: 60 tiết • Phối hợp Trường Tiểu học • 18 học viên
                      </div>
                    </div>
                    <Badge variant="info">Đang triển khai</Badge>
                  </div>

                  <div className="p-2.5 rounded border border-slate-200 bg-white flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-900">
                        Tập huấn Kỹ năng số Cộng đồng: Sử dụng Dịch vụ công & Định danh VNeID
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        Thời lượng: 02 buổi • Phối hợp Đoàn Thanh niên xã • 157 học viên
                      </div>
                    </div>
                    <Badge variant="success">Hoàn thành (100%)</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Section 2: Tuition Exemption Records */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Hồ sơ Xét duyệt Miễn giảm học phí & Hỗ trợ chi phí học tập
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Căn cứ Nghị định 81/2021/NĐ-CP đối với trẻ em, học sinh diện nghèo, cận nghèo, khuyết tật
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Họ và tên học sinh</TableHead>
                    <TableHead>Đơn vị trường</TableHead>
                    <TableHead>Lớp học</TableHead>
                    <TableHead>Diện đối tượng chính sách</TableHead>
                    <TableHead className="text-center">Tỷ lệ miễn giảm</TableHead>
                    <TableHead className="text-right">Mức hỗ trợ CPHT</TableHead>
                    <TableHead className="text-center">Học kỳ</TableHead>
                    <TableHead>Trạng thái xét duyệt</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTuition.length === 0 ? (
                    <TableEmptyState colSpan={9} title="Không có hồ sơ miễn giảm học phí cần duyệt" />
                  ) : (
                    filteredTuition.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-bold text-slate-800">{item.studentName}</TableCell>
                        <TableCell className="text-xs text-slate-700">{item.schoolName}</TableCell>
                        <TableCell className="font-mono text-xs text-slate-600">{item.grade}</TableCell>
                        <TableCell>
                          <Badge variant={item.category === "POOR_HOUSEHOLD" ? "danger" : item.category === "DISABILITY" ? "info" : "warning"}>
                            {item.category === "POOR_HOUSEHOLD"
                              ? "Hộ nghèo (100%)"
                              : item.category === "DISABILITY"
                              ? "Khuyết tật (100%)"
                              : "Hộ cận nghèo (70%)"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-bold text-emerald-700">
                          {item.exemptionPercent}%
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold text-emerald-800 text-xs">
                          {formatMoney(item.supportAmount)}/tháng
                        </TableCell>
                        <TableCell className="text-center text-xs text-slate-600">{item.semester}</TableCell>
                        <TableCell>
                          <Badge variant={item.status === "APPROVED" ? "success" : "warning"}>
                            {item.status === "APPROVED" ? "Đã phê duyệt" : "Chờ xét duyệt"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.status !== "APPROVED" ? (
                            <Button
                              variant="primary"
                              size="xs"
                              onClick={() => handleApproveTuition(item)}
                              className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs"
                            >
                              <Check className="w-3 h-3 mr-1" /> Phê duyệt
                            </Button>
                          ) : (
                            <span className="text-[11px] text-emerald-700 font-semibold">Đã xuất quyết định</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabContent>
      </Tabs>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: Đình chỉ hoạt động nhóm trẻ vi phạm diện tích/PCCC     */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={Boolean(suspensionModalFacility)}
        onClose={() => setSuspensionModalFacility(null)}
        title="Quyết định Đình chỉ Hoạt động Cơ sở Mầm non Độc lập"
        description="Ban hành văn bản đình chỉ hoạt động do không đảm bảo điều kiện an toàn và diện tích theo quy định"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setSuspensionModalFacility(null)}>
              Hủy bỏ
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmSuspension}
              className="bg-rose-600 hover:bg-rose-700 font-bold"
            >
              <AlertOctagon className="w-4 h-4 mr-1" />
              Ký ban hành Quyết định Đình chỉ
            </Button>
          </>
        }
      >
        {suspensionModalFacility && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-rose-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-rose-800">
                <AlertOctagon className="w-4 h-4" />
                CẢNH BÁO VI PHẠM AN TOÀN TRẺ EM
              </div>
              <p className="text-rose-800 leading-relaxed">
                Cơ sở <strong>{suspensionModalFacility.name}</strong> hiện có diện tích sàn nuôi dưỡng đạt{" "}
                <strong>{suspensionModalFacility.sqmPerChild.toFixed(2)} m²/cháu</strong>, không đáp ứng tiêu chuẩn tối thiểu 1.5 m²/cháu theo Thông tư 52/2020/TT-BGDĐT.
              </p>
            </div>

            <div className="border border-slate-200 rounded-lg p-3 space-y-2 bg-slate-50">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Tên cơ sở:</span>
                <span className="font-bold text-slate-800">{suspensionModalFacility.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Chủ nhóm lớp:</span>
                <span className="font-semibold text-slate-800">{suspensionModalFacility.ownerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Số lượng trẻ hiện hữu:</span>
                <span className="font-bold text-rose-700">{suspensionModalFacility.currentEnrolled} cháu</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Tổng diện tích mặt sàn:</span>
                <span className="font-mono">{suspensionModalFacility.totalAreaSqm} m²</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Tình trạng PCCC:</span>
                <span>
                  {suspensionModalFacility.fireSafetyCertified ? "Đã nghiệm thu" : "Chưa nghiệm thu PCCC"}
                </span>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Lý do & Căn cứ đình chỉ hoạt động:
              </label>
              <Input
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                placeholder="Nhập lý do đình chỉ..."
                required
              />
            </div>

            <div className="text-slate-600 text-[11px]">
              * Quyết định đình chỉ sẽ được niêm yết tại Trụ sở UBND xã và thông báo đến cha mẹ trẻ em để chuyển tuyến sang các cơ sở đủ điều kiện trên địa bàn.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
