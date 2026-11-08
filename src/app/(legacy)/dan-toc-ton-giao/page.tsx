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
  Compass,
  Landmark,
  AlertTriangle,
  Users,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Search,
  Plus,
  Check,
  X,
  FileText,
  AlertOctagon,
  Calendar,
  Lock,
  BadgeDollarSign,
  UserCheck,
} from "lucide-react";
import type {
  ReligiousFacilityItem,
  IrregularActivityItem,
  EthnicAllocationItem,
  EthnicNotableItem,
} from "@/lib/store/demo-state";
import { maskPII } from "@/lib/authorization/pii-mask";

export default function DanTocTonGiaoPage() {
  const { tenant, persona, data, updateTenantData, addAuditLog } = useDemo();

  // Search state
  const [searchTerm, setSearchTerm] = React.useState("");

  // Modals state
  const [isReceiptModalOpen, setIsReceiptModalOpen] = React.useState(false);
  const [selectedFacility, setSelectedFacility] = React.useState<ReligiousFacilityItem | null>(null);
  const [eventName, setEventName] = React.useState("");
  const [eventDate, setEventDate] = React.useState("2026-11-20");
  const [attendeesCount, setAttendeesCount] = React.useState("100");

  const [isNewIrregularModalOpen, setIsNewIrregularModalOpen] = React.useState(false);
  const [newIrrLocation, setNewIrrLocation] = React.useState("");
  const [newIrrNature, setNewIrrNature] = React.useState<IrregularActivityItem["natureType"]>("UNREGISTERED_GATHERING");
  const [newIrrOrganizer, setNewIrrOrganizer] = React.useState("");
  const [newIrrAttendees, setNewIrrAttendees] = React.useState(10);
  const [newIrrAction, setNewIrrAction] = React.useState<IrregularActivityItem["actionTaken"]>("GUIDED_OFFICIAL_REGISTRATION");

  const [isDisbursementModalOpen, setIsDisbursementModalOpen] = React.useState(false);
  const [selectedAllocation, setSelectedAllocation] = React.useState<EthnicAllocationItem | null>(null);

  const danTocData = data.domainRecords?.danTocTonGiao || {
    religiousFacilities: [],
    irregularActivities: [],
    ethnicAllocations: [],
    ethnicNotables: [],
  };

  const religiousList = danTocData.religiousFacilities || [];
  const irregularList = danTocData.irregularActivities || [];
  const allocationsList = danTocData.ethnicAllocations || [];
  const notablesList = danTocData.ethnicNotables || [];

  // Filtered lists
  const filteredReligious = religiousList.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.leaderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.hamlet.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredIrregular = irregularList.filter(
    (item) =>
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.organizer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredNotables = notablesList.filter(
    (item) =>
      item.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.hamlet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ethnicGroup.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAllocations = allocationsList.filter(
    (item) =>
      item.beneficiaryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.hamlet.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper: Calculate posting days between two dates
  const calculateDaysPosted = (startDate: string, endDate: string) => {
    try {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      const diffTime = Math.abs(end - start);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  };

  // Handler: Issue Recorded Receipt for Religious Notification (D03 Rule)
  const handleIssueReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacility || !eventName) return;

    const receiptCode = `BN-TG-2026-${Math.floor(100 + Math.random() * 900)}`;

    addAuditLog({
      action: "RECORD_RELIGIOUS_NOTIFICATION_RECEIPT",
      entityType: "RELIGIOUS_NOTIFICATION",
      entityId: receiptCode,
      details: {
        message: `Xuất Giấy biên nhận tiếp nhận thông báo lễ trọng số ${receiptCode} cho ${selectedFacility.name}: ${eventName} (Quy tắc D03: Chỉ cấp biên nhận ghi nhận kế hoạch bảo đảm ANTT, không cấp phép hành chính)`,
        receiptCode,
        facility: selectedFacility.name,
        eventName,
        date: eventDate,
        attendees: attendeesCount,
      },
    });

    setIsReceiptModalOpen(false);
    setSelectedFacility(null);
    setEventName("");
  };

  // Handler: Add new irregular religious gathering
  const handleCreateIrregular = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIrrLocation) return;

    const newCode = `TG-2026-00${irregularList.length + 1}`;
    const newItem: IrregularActivityItem = {
      id: `IRR-NEW-${Date.now()}`,
      code: newCode,
      location: newIrrLocation,
      natureType: newIrrNature,
      organizer: newIrrOrganizer || "Nhóm sinh hoạt tự phát",
      attendeesEstimated: Number(newIrrAttendees),
      actionTaken: newIrrAction,
      status: "OPEN",
      tenantCode: tenant.code === "XA_B" ? "XA_B" : "XA_A",
    };

    updateTenantData((prev) => ({
      ...prev,
      domainRecords: {
        ...prev.domainRecords,
        danTocTonGiao: {
          ...prev.domainRecords.danTocTonGiao,
          irregularActivities: [newItem, ...(prev.domainRecords?.danTocTonGiao?.irregularActivities || [])],
        },
      },
    }));

    addAuditLog({
      action: "LOG_RELIGIOUS_IRREGULARITY",
      entityType: "RELIGIOUS_IRREGULARITY",
      entityId: newCode,
      details: {
        message: `Lập biên bản ghi nhận hoạt động tôn giáo trái phép / chưa đăng ký ${newCode} tại ${newIrrLocation}`,
        natureType: newIrrNature,
        actionTaken: newIrrAction,
      },
    });

    setIsNewIrregularModalOpen(false);
    setNewIrrLocation("");
    setNewIrrOrganizer("");
  };

  // Handler: Resolve irregular activity
  const handleResolveIrregular = (item: IrregularActivityItem) => {
    updateTenantData((prev) => {
      const current = prev.domainRecords?.danTocTonGiao?.irregularActivities || [];
      const updated = current.map((i) =>
        i.id === item.id ? { ...i, status: "RESOLVED" as const } : i
      );
      return {
        ...prev,
        domainRecords: {
          ...prev.domainRecords,
          danTocTonGiao: {
            ...prev.domainRecords.danTocTonGiao,
            irregularActivities: updated,
          },
        },
      };
    });

    addAuditLog({
      action: "RESOLVE_RELIGIOUS_IRREGULARITY",
      entityType: "RELIGIOUS_IRREGULARITY",
      entityId: item.code,
      details: {
        message: `Hoàn tất xử lý, giải tán hoặc hướng dẫn đăng ký sinh hoạt tôn giáo cho vụ việc ${item.code}`,
      },
    });
  };

  // Handler: Approve MTQG 1719 Disbursement
  const handleConfirmDisbursement = () => {
    if (!selectedAllocation) return;

    updateTenantData((prev) => {
      const current = prev.domainRecords?.danTocTonGiao?.ethnicAllocations || [];
      const updated = current.map((a) =>
        a.id === selectedAllocation.id
          ? {
              ...a,
              disbursementStatus: "DISBURSED" as const,
            }
          : a
      );
      return {
        ...prev,
        domainRecords: {
          ...prev.domainRecords,
          danTocTonGiao: {
            ...prev.domainRecords.danTocTonGiao,
            ethnicAllocations: updated,
          },
        },
      };
    });

    addAuditLog({
      action: "APPROVE_MTQG_1719_DISBURSEMENT",
      entityType: "ETHNIC_POLICY_ALLOCATION",
      entityId: selectedAllocation.beneficiaryName,
      details: {
        message: `Phê duyệt giải ngân vốn MTQG 1719 cho hộ ${selectedAllocation.beneficiaryName} (${selectedAllocation.subProjectType}): Đã đáp ứng đầy đủ điều kiện niêm yết công khai trên 15 ngày và không có đơn khiếu nại`,
        budget: selectedAllocation.budgetAllocated,
        subProjectType: selectedAllocation.subProjectType,
      },
    });

    setIsDisbursementModalOpen(false);
    setSelectedAllocation(null);
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
            <Compass className="w-4 h-4 text-[#1F633E]" />
            Phân hệ M07 • Dân tộc & Tôn giáo
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            Công tác Tôn giáo, Tín ngưỡng & Chính sách Dân tộc Thiểu số
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Không gian tác nghiệp độc lập theo dõi cơ sở tín ngưỡng, xử lý sinh hoạt trái phép và quản lý phân bổ vốn MTQG 1719 tại {tenant.name}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="info" className="px-3 py-1 font-semibold text-xs">
            142 hộ DTTS (Tày, Nùng, Sán Dìu)
          </Badge>
        </div>
      </div>

      {/* D03 Administrative Boundary Reminder Banner */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900 shadow-sm">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold uppercase tracking-wider text-amber-800">
            Lưu ý nghiệp vụ cấp xã (Ranh giới thẩm quyền D03):
          </div>
          <p className="text-amber-800 leading-relaxed">
            Ủy ban nhân dân cấp xã chỉ có thẩm quyền tiếp nhận văn bản thông báo tổ chức hoạt động tôn giáo/lễ trọng định kỳ nhằm lập kế hoạch phục vụ bảo đảm an ninh trật tự cơ sở và cấp <strong>Giấy biên nhận tiếp nhận thông báo (RECORDED_RECEIPT)</strong>; <strong>thông báo không tự biến thành giấy phép hành chính</strong>.
          </p>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover:border-emerald-300 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500">Cơ sở tôn giáo hợp pháp</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{religiousList.length} cơ sở</div>
              <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                100% sinh hoạt đúng hiến chương
              </div>
            </div>
            <Landmark className="w-8 h-8 text-[#1F633E]/20" />
          </CardContent>
        </Card>

        <Card className="hover:border-emerald-300 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500">Xử lý sinh hoạt trái phép</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{irregularList.length} vụ việc</div>
              <div className="text-[11px] text-amber-700 font-medium mt-0.5">
                {irregularList.filter((i) => i.status !== "RESOLVED").length} vụ đang giám sát
              </div>
            </div>
            <AlertOctagon className="w-8 h-8 text-amber-500/20" />
          </CardContent>
        </Card>

        <Card className="hover:border-emerald-300 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500">Người có uy tín DTTS</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{notablesList.length} người</div>
              <div className="text-[11px] text-indigo-700 font-medium mt-0.5">
                Thăm hỏi lễ tết định kỳ 100%
              </div>
            </div>
            <UserCheck className="w-8 h-8 text-indigo-500/20" />
          </CardContent>
        </Card>

        <Card className="hover:border-emerald-300 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500">Vốn MTQG 1719</div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {formatMoney(allocationsList.reduce((acc, a) => acc + a.budgetAllocated, 0))}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {allocationsList.filter((a) => a.disbursementStatus === "APPROVED" || a.disbursementStatus === "DISBURSED").length} hộ đã duyệt giải ngân
              </div>
            </div>
            <BadgeDollarSign className="w-8 h-8 text-emerald-500/20" />
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Container: 2 Sub-tabs */}
      <Tabs defaultValue="religious" className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <TabList className="bg-slate-100 p-1 rounded-lg">
            <TabTrigger value="religious" className="flex items-center gap-2">
              <Landmark className="w-4 h-4" />
              <span>Cơ sở tôn giáo & Sinh hoạt trái phép (BL-080)</span>
              {irregularList.filter((i) => i.status !== "RESOLVED").length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </TabTrigger>
            <TabTrigger value="ethnic" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Người có uy tín & Vốn MTQG 1719 (Niêm yết 15 ngày)</span>
            </TabTrigger>
          </TabList>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <Input
              placeholder="Tìm cơ sở, vụ việc, hộ DTTS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* SUB-TAB 1: Cơ sở tôn giáo & Sinh hoạt trái phép               */}
        {/* ------------------------------------------------------------- */}
        <TabContent value="religious" className="space-y-6">
          {/* Section 1: Officially Registered Facilities */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  1. Danh mục Cơ sở Tôn giáo Hợp pháp & Tiếp nhận Thông báo Lễ trọng
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Thực hiện nguyên tắc D03: Cấp giấy biên nhận ghi nhận (RECORDED_RECEIPT), không cấp phép hành chính
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên cơ sở / Điểm nhóm</TableHead>
                    <TableHead>Tôn giáo / Hệ phái</TableHead>
                    <TableHead>Địa bàn</TableHead>
                    <TableHead>Người đại diện / Trụ trì / Mục sư</TableHead>
                    <TableHead>Trạng thái pháp lý</TableHead>
                    <TableHead className="text-right">Hành động tác nghiệp (D03)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReligious.length === 0 ? (
                    <TableEmptyState colSpan={6} title="Không có dữ liệu cơ sở tôn giáo" />
                  ) : (
                    filteredReligious.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-bold text-slate-900">{r.name}</TableCell>
                        <TableCell>
                          <Badge variant="neutral">
                            {r.religionType === "BUDDHISM"
                              ? "Phật giáo"
                              : r.religionType === "CATHOLICISM"
                              ? "Công giáo"
                              : "Tin lành"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-700">{r.hamlet}</TableCell>
                        <TableCell className="text-xs font-medium text-slate-800">{r.leaderName}</TableCell>
                        <TableCell>
                          <Badge variant="success">
                            {r.status === "OFFICIALLY_REGISTERED" ? "Đã đăng ký chính thức" : "Cấp phép điểm nhóm tạm thời"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="secondary"
                            size="xs"
                            onClick={() => {
                              setSelectedFacility(r);
                              setEventName(`Lễ Phật Đản / Giáng sinh năm 2026 tại ${r.name}`);
                              setIsReceiptModalOpen(true);
                            }}
                            className="font-semibold text-xs"
                          >
                            <FileText className="w-3.5 h-3.5 mr-1" />
                            Tiếp nhận thông báo lễ trọng
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Section 2: Irregular Religious Gatherings */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  2. Sổ theo dõi Xử lý Sinh hoạt Tôn giáo Trái phép & Đạo lạ
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Xử lý các vụ việc tụ tập tôn giáo ngoài danh mục, tuyên truyền tà đạo tại cơ sở
                </CardDescription>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsNewIrregularModalOpen(true)}
                className="text-xs"
              >
                <Plus className="w-4 h-4 mr-1" /> Lập biên bản sự việc mới
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã sự việc</TableHead>
                    <TableHead>Địa điểm diễn ra</TableHead>
                    <TableHead>Tính chất vi phạm</TableHead>
                    <TableHead>Đối tượng chủ trì nghi vấn</TableHead>
                    <TableHead className="text-center">Số người tham gia</TableHead>
                    <TableHead>Biện pháp xử lý</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIrregular.length === 0 ? (
                    <TableEmptyState colSpan={8} title="Không có sự việc tôn giáo bất thường" />
                  ) : (
                    filteredIrregular.map((item) => (
                      <TableRow key={item.id} className={item.status !== "RESOLVED" ? "bg-amber-50/40" : ""}>
                        <TableCell className="font-mono text-xs font-semibold text-slate-700">{item.code}</TableCell>
                        <TableCell className="font-bold text-slate-800 text-xs">{item.location}</TableCell>
                        <TableCell>
                          <Badge variant={item.natureType === "SUSPECTED_CULT" ? "danger" : "warning"}>
                            {item.natureType === "SUSPECTED_CULT"
                              ? "Nghi tà đạo / Đạo lạ"
                              : item.natureType === "NEW_RELIGIOUS_PHENOMENON"
                              ? "Hiện tượng tôn giáo mới"
                              : "Tụ tập chưa đăng ký"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-700">{item.organizer}</TableCell>
                        <TableCell className="text-center font-bold text-slate-800 font-mono">
                          {item.attendeesEstimated} người
                        </TableCell>
                        <TableCell className="text-xs text-slate-800 font-medium">
                          {item.actionTaken === "GUIDED_OFFICIAL_REGISTRATION"
                            ? "Hướng dẫn đăng ký tập trung"
                            : item.actionTaken === "DISPERSED_CEASED"
                            ? "Vận động giải tán chấm dứt"
                            : "Chuyển cơ quan Công an"}
                        </TableCell>
                        <TableCell>
                          {item.status === "RESOLVED" ? (
                            <Badge variant="success" className="text-[11px]">Đã giải quyết xong</Badge>
                          ) : item.status === "MONITORING" ? (
                            <Badge variant="warning" className="text-[11px]">Đang theo dõi chặt</Badge>
                          ) : (
                            <Badge variant="danger" className="text-[11px]">Mới phát hiện</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.status !== "RESOLVED" ? (
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => handleResolveIrregular(item)}
                              className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 text-xs"
                            >
                              <Check className="w-3 h-3 mr-1" /> Đã xử lý xong
                            </Button>
                          ) : (
                            <span className="text-[11px] text-emerald-700 font-semibold">Đã đóng hồ sơ</span>
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

        {/* ------------------------------------------------------------- */}
        {/* SUB-TAB 2: Người có uy tín & Vốn MTQG 1719 (Niêm yết 15 ngày) */}
        {/* ------------------------------------------------------------- */}
        <TabContent value="ethnic" className="space-y-6">
          {/* Section 1: Ethnic Notables */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900">
                1. Danh sách Người có Uy tín trong Đồng bào Dân tộc Thiểu số
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Chính sách tôn vinh, bồi dưỡng và thực hiện chế độ thù lao cho người có uy tín
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Họ và tên người có uy tín</TableHead>
                    <TableHead>Thành phần dân tộc</TableHead>
                    <TableHead>Xóm cư trú</TableHead>
                    <TableHead className="text-center">Năm công nhận</TableHead>
                    <TableHead>Nhiệm vụ & Đóng góp tiêu biểu</TableHead>
                    <TableHead className="text-right">Chế độ thù lao</TableHead>
                    <TableHead className="text-center">Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNotables.length === 0 ? (
                    <TableEmptyState colSpan={7} title="Không có dữ liệu người có uy tín" />
                  ) : (
                    filteredNotables.map((n) => (
                      <TableRow key={n.id}>
                        <TableCell className="font-bold text-slate-900">{n.fullName}</TableCell>
                        <TableCell>
                          <Badge variant="info">{n.ethnicGroup}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-700">{n.hamlet}</TableCell>
                        <TableCell className="text-center font-mono text-xs text-slate-800">
                          {n.yearRecognized}
                        </TableCell>
                        <TableCell className="text-xs text-slate-700 max-w-xs">{n.roleDescription}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-emerald-800 text-xs">
                          {formatMoney(n.stipendAmount)}/tháng
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="success">Đang công tác</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Section 2: MTQG 1719 Allocations with 15-day Rule */}
          <Card>
            <CardHeader className="pb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>2. Quản lý Phân bổ Vốn Chương trình MTQG 1719</span>
                  <Badge variant="warning" className="text-xs font-semibold">
                    Quy tắc kiểm soát: Niêm yết công khai tối thiểu 15 ngày
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Dự án 1 (Hỗ trợ đất ở, nhà ở, nước sinh hoạt). Nút giải ngân chỉ mở khi niêm yết đủ 15 ngày và không có đơn khiếu nại.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Họ và tên chủ hộ thụ hưởng</TableHead>
                    <TableHead>Số CCCD</TableHead>
                    <TableHead>Xóm cư trú</TableHead>
                    <TableHead>Dự án hỗ trợ</TableHead>
                    <TableHead className="text-right">Mức kinh phí phân bổ</TableHead>
                    <TableHead className="text-center">Thời gian niêm yết công khai</TableHead>
                    <TableHead className="text-center">Số ngày niêm yết</TableHead>
                    <TableHead className="text-center">Đơn khiếu nại</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Quyết định giải ngân</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAllocations.length === 0 ? (
                    <TableEmptyState colSpan={10} title="Không có danh sách phân bổ vốn MTQG 1719" />
                  ) : (
                    filteredAllocations.map((a) => {
                      const daysPosted = calculateDaysPosted(a.publicPostingStart, a.publicPostingEnd);
                      const isTimeEligible = daysPosted >= 15;
                      const hasNoObjection = !a.objectionFiled;
                      const canDisburse = isTimeEligible && hasNoObjection;
                      const isDisbursed = a.disbursementStatus === "DISBURSED";

                      return (
                        <TableRow key={a.id} className={!canDisburse && !isDisbursed ? "bg-amber-50/30" : ""}>
                          <TableCell className="font-bold text-slate-900">{a.beneficiaryName}</TableCell>
                          <TableCell className="font-mono text-xs text-slate-600">{maskPII(a.cccd, "cccd", persona)}</TableCell>
                          <TableCell className="text-xs text-slate-700">{a.hamlet}</TableCell>
                          <TableCell>
                            <Badge variant="neutral">
                              {a.subProjectType === "HOUSING_AID"
                                ? "Hỗ trợ nhà ở"
                                : a.subProjectType === "WATER_SUPPLY"
                                ? "Nước sinh hoạt phân tán"
                                : "Hỗ trợ đất ở"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-emerald-800 text-xs">
                            {formatMoney(a.budgetAllocated)}
                          </TableCell>
                          <TableCell className="text-center font-mono text-xs text-slate-600">
                            {a.publicPostingStart} → {a.publicPostingEnd}
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={`font-mono font-bold text-xs ${
                                isTimeEligible ? "text-emerald-700" : "text-rose-700"
                              }`}
                            >
                              {daysPosted} / 15 ngày
                            </span>
                            {!isTimeEligible && (
                              <span className="block text-[10px] text-rose-600 font-semibold">
                                Thiếu {15 - daysPosted} ngày
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {a.objectionFiled ? (
                              <Badge variant="danger" className="text-[10px] py-0 font-bold">
                                Có đơn khiếu nại
                              </Badge>
                            ) : (
                              <Badge variant="success" className="text-[10px] py-0">Không khiếu nại</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {isDisbursed ? (
                              <Badge variant="success" className="font-semibold text-[11px]">
                                Đã giải ngân xong
                              </Badge>
                            ) : a.disbursementStatus === "APPROVED" ? (
                              <Badge variant="info" className="text-[11px]">Đủ điều kiện chi trả</Badge>
                            ) : (
                              <Badge variant="warning" className="text-[11px]">Đang niêm yết</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {isDisbursed ? (
                              <span className="text-[11px] text-emerald-700 font-bold">Hoàn tất</span>
                            ) : (
                              <Button
                                variant="primary"
                                size="xs"
                                disabled={!canDisburse}
                                onClick={() => {
                                  setSelectedAllocation(a);
                                  setIsDisbursementModalOpen(true);
                                }}
                                className={`text-xs font-semibold ${
                                  canDisburse
                                    ? "bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm"
                                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                                }`}
                                title={
                                  !isTimeEligible
                                    ? `Chưa đủ 15 ngày niêm yết công khai (${daysPosted}/15 ngày)`
                                    : a.objectionFiled
                                    ? "Đang có đơn thư khiếu nại, chưa được phép giải ngân"
                                    : "Đủ điều kiện giải ngân"
                                }
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Phê duyệt giải ngân
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
      </Tabs>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: Xuất giấy biên nhận tiếp nhận thông báo lễ trọng (D03) */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setSelectedFacility(null);
        }}
        title="Tiếp nhận Thông báo Hoạt động Tôn giáo Định kỳ (D03)"
        description="Xuất giấy biên nhận tiếp nhận thông báo phục vụ kế hoạch bảo đảm an ninh trật tự cơ sở"
      >
        <form onSubmit={handleIssueReceipt} className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-800">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              LƯU Ý RANH GIỚI THẨM QUYỀN (D03):
            </div>
            <p className="text-amber-800 leading-relaxed">
              Văn bản xuất ra là <strong>Giấy biên nhận tiếp nhận thông báo (RECORDED_RECEIPT)</strong> nhằm phối hợp đảm bảo ANTT, PCCC và trật tự an toàn giao thông; <strong>tuyệt đối không phải văn bản cấp phép hành chính</strong>.
            </p>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Cơ sở tôn giáo thông báo</label>
            <Input value={selectedFacility?.name || ""} disabled className="bg-slate-50 font-bold" />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Tên ngày lễ trọng / Sinh hoạt</label>
            <Input
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Ví dụ: Đại lễ Phật Đản PL.2570 hoặc Lễ Giáng sinh 2026..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Thời gian dự kiến</label>
              <Input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Số lượng tín đồ ước tính</label>
              <Input
                type="number"
                value={attendeesCount}
                onChange={(e) => setAttendeesCount(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsReceiptModalOpen(false);
                setSelectedFacility(null);
              }}
            >
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm" className="bg-emerald-700 hover:bg-emerald-800">
              <FileText className="w-4 h-4 mr-1.5" />
              Xuất Giấy biên nhận (RECORDED_RECEIPT)
            </Button>
          </div>
        </form>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: Lập biên bản sự việc tôn giáo bất thường             */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={isNewIrregularModalOpen}
        onClose={() => setIsNewIrregularModalOpen(false)}
        title="Lập Biên bản Hoạt động Tôn giáo Trái phép"
        description="Ghi nhận hiện tượng tụ tập sinh hoạt tôn giáo chưa đăng ký hoặc nghi tà đạo"
      >
        <form onSubmit={handleCreateIrregular} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Địa điểm diễn ra</label>
            <Input
              value={newIrrLocation}
              onChange={(e) => setNewIrrLocation(e.target.value)}
              placeholder="Ví dụ: Nhà riêng ông Nguyễn Văn A, Xóm Đức Hòa..."
              required
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Tính chất sự việc</label>
            <select
              value={newIrrNature}
              onChange={(e) => setNewIrrNature(e.target.value as IrregularActivityItem["natureType"])}
              className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#1F633E]"
            >
              <option value="UNREGISTERED_GATHERING">Sinh hoạt tôn giáo tập trung chưa đăng ký</option>
              <option value="NEW_RELIGIOUS_PHENOMENON">Hiện tượng tôn giáo mới phát sinh</option>
              <option value="SUSPECTED_CULT">Nghi tà đạo / Đạo lạ lừa bịp chữa bệnh</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Đối tượng chủ trì nghi vấn</label>
            <Input
              value={newIrrOrganizer}
              onChange={(e) => setNewIrrOrganizer(e.target.value)}
              placeholder="Ví dụ: Người ngoài địa phương tự xưng..."
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Số người tham gia ước tính</label>
            <Input
              type="number"
              min="1"
              value={newIrrAttendees}
              onChange={(e) => setNewIrrAttendees(Number(e.target.value))}
              required
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Biện pháp xử lý của chính quyền xã</label>
            <select
              value={newIrrAction}
              onChange={(e) => setNewIrrAction(e.target.value as IrregularActivityItem["actionTaken"])}
              className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#1F633E]"
            >
              <option value="GUIDED_OFFICIAL_REGISTRATION">Hướng dẫn làm thủ tục đăng ký sinh hoạt tập trung</option>
              <option value="DISPERSED_CEASED">Vận động, tuyên truyền giải tán và cam kết chấm dứt</option>
              <option value="TRANSFERRED_POLICE">Chuyển cơ quan Công an xử lý vi phạm pháp luật</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsNewIrregularModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Lưu biên bản
            </Button>
          </div>
        </form>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: Xác nhận giải ngân vốn MTQG 1719 (Niêm yết 15 ngày)   */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={isDisbursementModalOpen}
        onClose={() => {
          setIsDisbursementModalOpen(false);
          setSelectedAllocation(null);
        }}
        title="Quyết định Phê duyệt Giải ngân Vốn MTQG 1719"
        description="Kiểm tra điều kiện niêm yết công khai 15 ngày và đối soát không khiếu nại"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsDisbursementModalOpen(false);
                setSelectedAllocation(null);
              }}
            >
              Hủy bỏ
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmDisbursement}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
            >
              <Check className="w-4 h-4 mr-1.5" />
              Ký duyệt Giải ngân Vốn
            </Button>
          </>
        }
      >
        {selectedAllocation && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-950 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                HỒ SƠ ĐỦ ĐIỀU KIỆN PHÊ DUYỆT GIẢI NGÂN
              </div>
              <p className="text-emerald-800 leading-relaxed">
                Hồ sơ đã được niêm yết công khai tại Nhà văn hóa thôn và Trụ sở UBND xã từ ngày{" "}
                <strong>{selectedAllocation.publicPostingStart}</strong> đến ngày{" "}
                <strong>{selectedAllocation.publicPostingEnd}</strong> (
                <strong>
                  {calculateDaysPosted(selectedAllocation.publicPostingStart, selectedAllocation.publicPostingEnd)} ngày
                </strong>
                , đáp ứng điều kiện tối thiểu 15 ngày). Không phát sinh đơn thư khiếu nại, phản ánh trục lợi chính sách.
              </p>
            </div>

            <div className="border border-slate-200 rounded-lg p-3 space-y-2 bg-slate-50">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Chủ hộ thụ hưởng:</span>
                <span className="font-bold text-slate-800">{selectedAllocation.beneficiaryName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Số CCCD:</span>
                <span className="font-mono text-slate-800">{maskPII(selectedAllocation.cccd, "cccd", persona)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Dự án hỗ trợ:</span>
                <Badge variant="neutral">
                  {selectedAllocation.subProjectType === "HOUSING_AID"
                    ? "Hỗ trợ nhà ở"
                    : selectedAllocation.subProjectType === "WATER_SUPPLY"
                    ? "Nước sinh hoạt phân tán"
                    : "Hỗ trợ đất ở"}
                </Badge>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Kinh phí phê duyệt giải ngân:</span>
                <span className="font-mono font-bold text-emerald-800 text-sm">
                  {formatMoney(selectedAllocation.budgetAllocated)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Nguồn vốn:</span>
                <span className="font-semibold text-slate-800">Chương trình MTQG 1719 Giai đoạn 2021-2025</span>
              </div>
            </div>

            <div className="text-slate-600 text-[11px]">
              * Khi bấm ký duyệt: Kinh phí sẽ được chuyển về tài khoản Kho bạc/Ngân hàng CSXH để chi trả cho hộ gia đình và ghi nhận vết kiểm toán hệ thống.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
