"use client";

import * as React from "react";
import { useDemo } from "@/lib/tenancy/demo-context";
import { maskPII } from "@/lib/authorization/pii-mask";
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
  HeartHandshake,
  Award,
  Building,
  Users,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  FileText,
  Check,
  X,
  Search,
  Plus,
  Scale,
  Briefcase,
  AlertOctagon,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import type {
  NCCItem,
  LaborContractItem,
  LaborDisputeItem,
  LaborUnderageItem,
} from "@/lib/store/demo-state";

export default function NoiVuPage() {
  const { tenant, persona, data, updateTenantData, addAuditLog } = useDemo();

  // Search & Filters
  const [searchTerm, setSearchTerm] = React.useState("");

  // Modals state
  const [isDeduplicationModalOpen, setIsDeduplicationModalOpen] = React.useState(false);
  const [selectedDispute, setSelectedDispute] = React.useState<LaborDisputeItem | null>(null);
  const [isEscalateModalOpen, setIsEscalateModalOpen] = React.useState(false);
  const [isNewDisputeModalOpen, setIsNewDisputeModalOpen] = React.useState(false);
  const [isNewProposalModalOpen, setIsNewProposalModalOpen] = React.useState(false);

  // New dispute form state
  const [newDisputeRequester, setNewDisputeRequester] = React.useState("");
  const [newDisputeRole, setNewDisputeRole] = React.useState<"EMPLOYEE" | "EMPLOYER" | "COLLECTIVE">("INDIVIDUAL" as unknown as "EMPLOYEE");
  const [newDisputeRespondent, setNewDisputeRespondent] = React.useState("");
  const [newDisputeContent, setNewDisputeContent] = React.useState("");
  const [newDisputeType, setNewDisputeType] = React.useState<"INDIVIDUAL" | "COLLECTIVE">("INDIVIDUAL");

  // New proposal form state
  const [newNccName, setNewNccName] = React.useState("");
  const [newNccCategory, setNewNccCategory] = React.useState<NCCItem["category"]>("THUONG_BINH");
  const [newNccMedal, setNewNccMedal] = React.useState("");
  const [newNccAllowance, setNewNccAllowance] = React.useState("2850000");

  const noiVuData = data.domainRecords?.noiVu || {
    ncc: [],
    contracts: [],
    disputes: [],
    underage: [],
  };

  const nccList = noiVuData.ncc || [];
  const contractsList = noiVuData.contracts || [];
  const disputesList = noiVuData.disputes || [];
  const underageList = noiVuData.underage || [];

  // Filtered lists
  const filteredNcc = nccList.filter(
    (item) =>
      item.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.hamlet && item.hamlet.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredContracts = contractsList.filter(
    (item) =>
      item.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.taxCode.includes(searchTerm)
  );

  const filteredDisputes = disputesList.filter(
    (item) =>
      item.requesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.respondentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // AC-06 Deduplication check count
  const duplicatedCount = nccList.filter((item) => item.hasDeduplicationFlag).length;

  // Handler: Apply AC-06 recommendation (Resolve duplication)
  const handleResolveDuplication = (item: NCCItem) => {
    updateTenantData((prev) => {
      const currentNcc = prev.domainRecords?.noiVu?.ncc || [];
      const updatedNcc = currentNcc.map((n) =>
        n.id === item.id
          ? {
              ...n,
              hasDeduplicationFlag: false,
              medalTitle: "Kỷ niệm chương Kháng chiến chống Mỹ cứu nước",
              proposedAward: "Kỷ niệm chương (Đã chuyển đổi theo AC-06)",
              deduplicationWarning: undefined,
              status: "ACTIVE" as const,
            }
          : n
      );
      return {
        ...prev,
        domainRecords: {
          ...prev.domainRecords,
          noiVu: {
            ...prev.domainRecords.noiVu,
            ncc: updatedNcc,
          },
        },
      };
    });

    addAuditLog({
      action: "AC06_RESOLVE_MEDAL_DEDUPLICATION",
      entityType: "NCC_MEDAL_PROPOSAL",
      entityId: item.code,
      details: {
        message: `Đã xử lý đối soát trùng lặp khen thưởng cho ${item.fullName}: Chuyển đổi sang Kỷ niệm chương theo quy tắc AC-06`,
        target: item.fullName,
        originalAward: item.proposedAward || item.medalTitle,
        updatedAward: "Kỷ niệm chương Kháng chiến chống Mỹ cứu nước",
      },
    });

    setIsDeduplicationModalOpen(false);
  };

  // Handler: Escalate collective strike to district (D03 Rule)
  const handleEscalateToDistrict = () => {
    if (!selectedDispute) return;

    updateTenantData((prev) => {
      const currentDisputes = prev.domainRecords?.noiVu?.disputes || [];
      const updatedDisputes = currentDisputes.map((d) =>
        d.id === selectedDispute.id
          ? {
              ...d,
              status: "ESCALATED_DISTRICT" as const,
              outcomeSummary:
                "Đã chuyển hồ sơ đình công lên Cơ quan Quản lý Lao động cấp trên giải quyết theo thẩm quyền (D03)",
            }
          : d
      );
      return {
        ...prev,
        domainRecords: {
          ...prev.domainRecords,
          noiVu: {
            ...prev.domainRecords.noiVu,
            disputes: updatedDisputes,
          },
        },
      };
    });

    addAuditLog({
      action: "D03_ESCALATE_COLLECTIVE_STRIKE_TO_DISTRICT",
      entityType: "LABOR_DISPUTE",
      entityId: selectedDispute.code,
      details: {
        message: `Chuyển hồ sơ tranh chấp tập thể / nguy cơ đình công (${selectedDispute.requesterName}) lên Cơ quan Quản lý Lao động cấp trên theo ranh giới thẩm quyền D03`,
        disputeCode: selectedDispute.code,
        requester: selectedDispute.requesterName,
        employer: selectedDispute.respondentName,
      },
    });

    setIsEscalateModalOpen(false);
    setSelectedDispute(null);
  };

  // Handler: Add new dispute
  const handleCreateDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDisputeRequester || !newDisputeRespondent) return;

    const newCode = `HG-2026-0${disputesList.length + 1}`;
    const isCollective = newDisputeType === "COLLECTIVE";

    const newItem: LaborDisputeItem = {
      id: `DISP-NEW-${Date.now()}`,
      code: newCode,
      requesterName: newDisputeRequester,
      requesterRole: isCollective ? "COLLECTIVE" : newDisputeRole,
      respondentName: newDisputeRespondent,
      disputeContent: newDisputeContent || "Yêu cầu giải quyết tranh chấp quyền và lợi ích lao động",
      disputeType: newDisputeType,
      receivedDate: new Date().toISOString().split("T")[0],
      status: isCollective ? "RECEIVED" : "SCHEDULED",
      outcomeSummary: isCollective
        ? "Tranh chấp tập thể nộp đơn - Chờ chuyển cấp Huyện theo D03"
        : "Đã lên lịch phiên hòa giải cơ sở",
      tenantCode: tenant.code === "XA_B" ? "XA_B" : "XA_A",
    };

    updateTenantData((prev) => ({
      ...prev,
      domainRecords: {
        ...prev.domainRecords,
        noiVu: {
          ...prev.domainRecords.noiVu,
          disputes: [newItem, ...(prev.domainRecords?.noiVu?.disputes || [])],
        },
      },
    }));

    addAuditLog({
      action: "CREATE_LABOR_DISPUTE_DOSSIER",
      entityType: "LABOR_DISPUTE",
      entityId: newCode,
      details: {
        message: `Tiếp nhận đơn yêu cầu hòa giải lao động ${newCode} (${newDisputeRequester})`,
        disputeType: newDisputeType,
      },
    });

    setIsNewDisputeModalOpen(false);
    setNewDisputeRequester("");
    setNewDisputeRespondent("");
    setNewDisputeContent("");
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
            <Building className="w-4 h-4 text-[#1F633E]" />
            Phân hệ M02 • Nội vụ & Cải cách hành chính
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            Nội vụ, Lao động & Cải cách hành chính
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Không gian tác nghiệp độc lập về công tác cán bộ, thi đua khen thưởng, hợp đồng lao động, hòa giải tranh chấp và chính sách người có công tại {tenant.name}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDeduplicationModalOpen(true)}
            className="border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 font-semibold"
          >
            <Sparkles className="w-4 h-4 mr-1 text-amber-600" />
            Kiểm tra chống trùng khen thưởng (AC-06)
            {duplicatedCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                {duplicatedCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover:border-emerald-300 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500">Người có công & Thân nhân</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{nccList.length} đối tượng</div>
              <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                {duplicatedCount > 0 ? `Phát hiện ${duplicatedCount} trường hợp trùng AC-06` : "100% hồ sơ chuẩn hóa"}
              </div>
            </div>
            <HeartHandshake className="w-8 h-8 text-[#1F633E]/20" />
          </CardContent>
        </Card>

        <Card className="hover:border-emerald-300 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500">Cơ sở LĐ & Lương tối thiểu</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{contractsList.length} cơ sở</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {contractsList.filter((c) => c.isUnderMinWage).length > 0 ? (
                  <span className="text-rose-600 font-semibold">
                    {contractsList.filter((c) => c.isUnderMinWage).length} cơ sở dưới lương tối thiểu
                  </span>
                ) : (
                  "100% đạt chuẩn mức lương vùng"
                )}
              </div>
            </div>
            <Briefcase className="w-8 h-8 text-indigo-500/20" />
          </CardContent>
        </Card>

        <Card className="hover:border-emerald-300 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500">Hòa giải lao động (D03)</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{disputesList.length} vụ việc</div>
              <div className="text-[11px] text-amber-700 font-medium mt-0.5">
                {disputesList.filter((d) => d.disputeType === "COLLECTIVE").length} vụ đình công chuyển huyện
              </div>
            </div>
            <Scale className="w-8 h-8 text-amber-500/20" />
          </CardContent>
        </Card>

        <Card className="hover:border-emerald-300 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500">Giám sát LĐ chưa thành niên</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{underageList.length} lao động</div>
              <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                100% tuân thủ ≤ 4.0h/ngày
              </div>
            </div>
            <Users className="w-8 h-8 text-sky-500/20" />
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Container */}
      <Tabs defaultValue="ncc" className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <TabList className="bg-slate-100 p-1 rounded-lg">
            <TabTrigger value="ncc" className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span>Người có công & TĐKT (AC-06)</span>
              {duplicatedCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </TabTrigger>
            <TabTrigger value="labor" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              <span>HĐLĐ, Lương tối thiểu & LĐ chưa thành niên</span>
            </TabTrigger>
            <TabTrigger value="disputes" className="flex items-center gap-2">
              <Scale className="w-4 h-4" />
              <span>Hòa giải & Chuyển đình công lên Huyện (D03)</span>
            </TabTrigger>
          </TabList>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <Input
              placeholder="Tìm kiếm đối tượng, cơ sở..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* SUB-TAB 1: Người có công & Thi đua khen thưởng (AC-06)         */}
        {/* ------------------------------------------------------------- */}
        <TabContent value="ncc" className="space-y-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Danh sách đối tượng người có công & đề xuất khen thưởng
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Kiểm soát đối soát chéo chống trùng khen thưởng (AC-06) và bảo vệ dữ liệu PII mức trợ cấp
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDeduplicationModalOpen(true)}
                  className="text-xs text-amber-700 bg-amber-50 border-amber-200"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-600" />
                  Đối soát AC-06 ({duplicatedCount} trùng)
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã HS</TableHead>
                    <TableHead>Họ và tên</TableHead>
                    <TableHead>CCCD</TableHead>
                    <TableHead>Địa bàn</TableHead>
                    <TableHead>Diện chính sách</TableHead>
                    <TableHead>Danh hiệu / Huân huy chương</TableHead>
                    <TableHead>Trợ cấp hàng tháng</TableHead>
                    <TableHead>Kiểm tra chống trùng AC-06</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNcc.length === 0 ? (
                    <TableEmptyState colSpan={9} title="Không tìm thấy hồ sơ người có công phù hợp" />
                  ) : (
                    filteredNcc.map((item) => (
                      <TableRow key={item.id} className={item.hasDeduplicationFlag ? "bg-amber-50/50" : ""}>
                        <TableCell className="font-mono text-xs font-semibold text-slate-700">
                          {item.code}
                        </TableCell>
                        <TableCell className="font-bold text-slate-900">
                          {item.fullName}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-600">
                          {maskPII(item.cccd || "019088001234", "cccd", persona)}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">{item.hamlet || "Xã Giả định A"}</TableCell>
                        <TableCell>
                          <Badge variant={item.category === "BA_ME_VNAH" ? "danger" : item.category === "THUONG_BINH" ? "info" : "neutral"}>
                            {item.category === "BA_ME_VNAH"
                              ? "Bà Mẹ VNAH"
                              : item.category === "THUONG_BINH"
                              ? "Thương binh"
                              : item.category === "LIET_SI"
                              ? "Thân nhân Liệt sĩ"
                              : "Nhiễm CĐHH"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-medium text-slate-800">
                          {item.medalTitle}
                        </TableCell>
                        <TableCell className="font-mono font-semibold text-emerald-700 text-xs">
                          {maskPII(item.monthlyAllowance, "aid", persona)}
                        </TableCell>
                        <TableCell>
                          {item.hasDeduplicationFlag ? (
                            <div className="flex items-center gap-1.5">
                              <Badge variant="warning" className="text-[11px] py-0.5">
                                <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" />
                                Cảnh báo trùng lặp
                              </Badge>
                              <button
                                onClick={() => setIsDeduplicationModalOpen(true)}
                                className="text-[11px] text-amber-800 underline font-semibold hover:text-amber-900"
                              >
                                Xem & Sửa
                              </button>
                            </div>
                          ) : (
                            <Badge variant="success" className="text-[11px] py-0.5">
                              <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                              Hợp lệ (Đã đối soát)
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.status === "ACTIVE" ? "success" : "warning"}>
                            {item.status === "ACTIVE" ? "Đang hưởng" : "Chờ thẩm định"}
                          </Badge>
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
        {/* SUB-TAB 2: HĐLĐ, Lương tối thiểu & LĐ chưa thành niên         */}
        {/* ------------------------------------------------------------- */}
        <TabContent value="labor" className="space-y-6">
          {/* Section 1: Labor Contracts & Wages */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
                <span>1. Giám sát Hợp đồng lao động & Tuân thủ Tiền lương tối thiểu vùng</span>
                <span className="text-xs font-normal text-slate-500">
                  Căn cứ: Nghị định 38/2022/NĐ-CP (Mức lương tối thiểu Vùng III: 3.450.000 ₫/tháng)
                </span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Theo dõi điều kiện giao kết HĐLĐ, tỷ lệ tham gia BHXH và kiểm tra cảnh báo vi phạm lương tối thiểu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên Doanh nghiệp / Hợp tác xã</TableHead>
                    <TableHead>Mã số thuế</TableHead>
                    <TableHead className="text-center">Tổng số LĐ</TableHead>
                    <TableHead className="text-center">LĐ thời vụ</TableHead>
                    <TableHead className="text-center">Đã đóng BHXH</TableHead>
                    <TableHead>Lương tối thiểu chi trả</TableHead>
                    <TableHead>Lương tối thiểu vùng</TableHead>
                    <TableHead>Trạng thái tuân thủ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContracts.length === 0 ? (
                    <TableEmptyState colSpan={8} title="Không có dữ liệu cơ sở sử dụng lao động" />
                  ) : (
                    filteredContracts.map((c) => (
                      <TableRow key={c.id} className={c.isUnderMinWage ? "bg-rose-50/40" : ""}>
                        <TableCell className="font-bold text-slate-800">{c.businessName}</TableCell>
                        <TableCell className="font-mono text-xs text-slate-600">{c.taxCode}</TableCell>
                        <TableCell className="text-center font-semibold text-slate-800">{c.totalWorkers}</TableCell>
                        <TableCell className="text-center text-slate-600">{c.seasonalWorkersCount}</TableCell>
                        <TableCell className="text-center">
                          <span className="font-semibold text-slate-800">{c.bhxhRegisteredCount}</span>
                          <span className="text-xs text-slate-500 ml-1">
                            ({Math.round((c.bhxhRegisteredCount / Math.max(c.totalWorkers, 1)) * 100)}%)
                          </span>
                        </TableCell>
                        <TableCell className={`font-mono font-semibold text-xs ${c.isUnderMinWage ? "text-rose-700" : "text-emerald-700"}`}>
                          {formatMoney(c.minWagePaid)}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-600">
                          {formatMoney(c.regionalMinWage)}
                        </TableCell>
                        <TableCell>
                          {c.isUnderMinWage ? (
                            <Badge variant="danger" className="font-bold py-0.5">
                              <AlertOctagon className="w-3 h-3 mr-1" />
                              VI PHẠM LƯƠNG TỐI THIỂU
                            </Badge>
                          ) : (
                            <Badge variant="success" className="py-0.5">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Đạt chuẩn lương tối thiểu
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Section 2: Underage Labor Monitoring */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
                <span>2. Sổ theo dõi Lao động chưa thành niên (Điều 143–146 BLLĐ 2019)</span>
                <Badge variant="info" className="text-xs">Ràng buộc: Thời giờ làm việc ≤ 4.0 giờ/ngày</Badge>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Giám sát đối tượng lao động từ đủ 13 tuổi đến chưa đủ 15 tuổi làm các công việc nhẹ được phép
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Họ và tên lao động</TableHead>
                    <TableHead>CCCD / Định danh</TableHead>
                    <TableHead>Cơ sở sử dụng lao động</TableHead>
                    <TableHead>Nhóm công việc được phép</TableHead>
                    <TableHead className="text-center">Thời giờ làm việc</TableHead>
                    <TableHead className="text-center">Đồng ý của người giám hộ</TableHead>
                    <TableHead className="text-center">Giấy khám sức khỏe</TableHead>
                    <TableHead>Trạng thái tuân thủ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {underageList.length === 0 ? (
                    <TableEmptyState colSpan={8} title="Không có hồ sơ lao động chưa thành niên cần giám sát" />
                  ) : (
                    underageList.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-bold text-slate-800">{u.minorName}</TableCell>
                        <TableCell className="font-mono text-xs text-slate-600">
                          {maskPII(u.cccd, "cccd", persona)}
                        </TableCell>
                        <TableCell className="text-slate-800">{u.employer}</TableCell>
                        <TableCell>
                          <Badge variant="neutral">
                            {u.allowedJobCategory === "TRADITIONAL_CRAFT"
                              ? "Nghề thủ công truyền thống"
                              : u.allowedJobCategory === "ARTS"
                              ? "Biểu diễn nghệ thuật"
                              : "Thể dục thể thao"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-mono font-bold text-emerald-700">{u.dailyHours}h/ngày</span>
                          <span className="text-[11px] text-slate-500 block">≤ 4.0h theo luật</span>
                        </TableCell>
                        <TableCell className="text-center">
                          {u.guardianConsent ? (
                            <Badge variant="success" className="py-0.5 text-[11px]">
                              <Check className="w-3 h-3 mr-1" /> Đã ký cam kết
                            </Badge>
                          ) : (
                            <Badge variant="danger" className="py-0.5 text-[11px]">Thiếu văn bản</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {u.healthCertValid ? (
                            <Badge variant="success" className="py-0.5 text-[11px]">
                              <Check className="w-3 h-3 mr-1" /> Còn hạn (6 tháng)
                            </Badge>
                          ) : (
                            <Badge variant="warning" className="py-0.5 text-[11px]">Hết hạn</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.status === "COMPLIANT" ? "success" : "warning"}>
                            {u.status === "COMPLIANT" ? "Tuân thủ đầy đủ" : "Cần bổ sung hồ sơ"}
                          </Badge>
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
        {/* SUB-TAB 3: Hòa giải lao động & Chuyển đình công lên Huyện (D03) */}
        {/* ------------------------------------------------------------- */}
        <TabContent value="disputes" className="space-y-4">
          {/* D03 Jurisdiction Boundary Banner */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold uppercase tracking-wider text-amber-800">
                Rào chắn ranh giới thẩm quyền cấp xã (Nguyên tắc D03):
              </div>
              <p className="text-amber-800 leading-relaxed">
                Hòa giải viên lao động cấp xã chỉ có thẩm quyền tiến hành hòa giải các vụ <strong>tranh chấp lao động cá nhân</strong> giữa người lao động và người sử dụng lao động.
                Đối với <strong>tranh chấp lao động tập thể về quyền hoặc lợi ích dẫn đến nguy cơ đình công</strong> (COLLECTIVE), hệ thống <strong>TUYỆT ĐỐI CẤM</strong> hòa giải thành tại cấp xã; bắt buộc phải lập biên bản và bấm nút <strong>Chuyển hồ sơ đình công lên Cơ quan cấp trên</strong> (theo ranh giới thẩm quyền D03) xử lý.
              </p>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Sổ tiếp nhận & Theo dõi hòa giải tranh chấp lao động
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Phân định rõ tranh chấp cá nhân (hòa giải tại xã) vs tranh chấp tập thể / đình công (chuyển cấp huyện theo D03)
                </CardDescription>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsNewDisputeModalOpen(true)}
                className="text-xs"
              >
                <Plus className="w-4 h-4 mr-1" /> Tiếp nhận vụ việc mới
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã vụ</TableHead>
                    <TableHead>Bên yêu cầu (Người làm đơn)</TableHead>
                    <TableHead>Loại tranh chấp</TableHead>
                    <TableHead>Bên bị yêu cầu (Doanh nghiệp/Người SD LĐ)</TableHead>
                    <TableHead>Nội dung tranh chấp</TableHead>
                    <TableHead>Ngày nhận</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Hành động tác nghiệp (D03)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDisputes.length === 0 ? (
                    <TableEmptyState colSpan={8} title="Không có hồ sơ tranh chấp lao động" />
                  ) : (
                    filteredDisputes.map((d) => {
                      const isCollective = d.disputeType === "COLLECTIVE" || d.requesterRole === "COLLECTIVE";
                      const isEscalated = d.status === "ESCALATED_DISTRICT";

                      return (
                        <TableRow key={d.id} className={isCollective ? "bg-rose-50/40" : ""}>
                          <TableCell className="font-mono text-xs font-semibold text-slate-700">{d.code}</TableCell>
                          <TableCell className="font-bold text-slate-900">
                            {d.requesterName}
                            {isCollective && (
                              <span className="block text-[11px] font-normal text-rose-700">
                                (Tập thể lao động)
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {isCollective ? (
                              <Badge variant="danger" className="text-[11px] py-0.5 font-bold">
                                Đình công / Tập thể
                              </Badge>
                            ) : (
                              <Badge variant="info" className="text-[11px] py-0.5">
                                Cá nhân
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs font-medium text-slate-800">{d.respondentName}</TableCell>
                          <TableCell className="text-xs text-slate-700 max-w-xs truncate" title={d.disputeContent}>
                            {d.disputeContent}
                          </TableCell>
                          <TableCell className="text-xs text-slate-500 font-mono">{d.receivedDate}</TableCell>
                          <TableCell>
                            {isEscalated ? (
                              <Badge variant="neutral" className="bg-purple-100 text-purple-800 border-purple-200 text-[11px]">
                                <ArrowUpRight className="w-3 h-3 mr-1" /> Đã chuyển Huyện (D03)
                              </Badge>
                            ) : d.status === "SCHEDULED" ? (
                              <Badge variant="warning" className="text-[11px]">
                                <Clock className="w-3 h-3 mr-1" /> Đã lên lịch hòa giải
                              </Badge>
                            ) : (
                              <Badge variant="info" className="text-[11px]">Mới tiếp nhận</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {isCollective ? (
                              isEscalated ? (
                                <span className="text-[11px] font-medium text-purple-700">
                                  Hồ sơ đã chuyển cấp trên
                                </span>
                              ) : (
                                <Button
                                  variant="danger"
                                  size="xs"
                                  onClick={() => {
                                    setSelectedDispute(d);
                                    setIsEscalateModalOpen(true);
                                  }}
                                  className="font-bold shadow-sm"
                                >
                                  <AlertOctagon className="w-3.5 h-3.5 mr-1" />
                                  Chuyển đình công lên Huyện (D03)
                                </Button>
                              )
                            ) : (
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => {
                                  updateTenantData((prev) => {
                                    const current = prev.domainRecords?.noiVu?.disputes || [];
                                    return {
                                      ...prev,
                                      domainRecords: {
                                        ...prev.domainRecords,
                                        noiVu: {
                                          ...prev.domainRecords.noiVu,
                                          disputes: current.map((item) =>
                                            item.id === d.id
                                              ? {
                                                  ...item,
                                                  status: "RESOLVED_SUCCESS" as const,
                                                  outcomeSummary: "Hòa giải thành tại UBND xã ngày 07/11",
                                                }
                                              : item
                                          ),
                                        },
                                      },
                                    };
                                  });
                                  addAuditLog({
                                    action: "RESOLVE_INDIVIDUAL_LABOR_DISPUTE",
                                    entityType: "LABOR_DISPUTE",
                                    entityId: d.code,
                                    details: { message: `Hòa giải thành vụ việc cá nhân ${d.code} (${d.requesterName})` },
                                  });
                                }}
                                className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 text-xs"
                              >
                                <Check className="w-3.5 h-3.5 mr-1" /> Hòa giải thành
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
      {/* MODAL: AC-06 Deduplication Verification (Kiểm tra chống trùng) */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={isDeduplicationModalOpen}
        onClose={() => setIsDeduplicationModalOpen(false)}
        title="Đối soát Chống trùng lặp Thi đua Khen thưởng (AC-06)"
        description="Mô phỏng thuật toán đối soát chéo danh sách đề nghị khen thưởng với CSDL khen thưởng cấp Tỉnh/Huyện 3 năm gần nhất"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Quy tắc nghiệp vụ AC-06:</strong> Không khen thưởng nhiều lần, nhiều hình thức cho một thành tích đạt được. Nếu cá nhân/tập thể đã được tặng Bằng khen cấp tỉnh/Bộ ngành trong vòng 3 năm gần nhất thì không tiếp tục đề xuất hình thức tương đương cùng kỳ.
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-2">
            <div className="font-semibold text-slate-800">
              Kết quả rà soát tự động: Phát hiện {duplicatedCount} trường hợp trùng lặp đề xuất
            </div>

            {nccList
              .filter((item) => item.hasDeduplicationFlag)
              .map((dup) => (
                <div key={dup.id} className="p-3 bg-white rounded border border-rose-200 shadow-sm space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{dup.fullName} ({dup.code})</div>
                      <div className="text-slate-500 text-xs mt-0.5">Địa bàn: {dup.hamlet} • CCCD: {dup.cccd}</div>
                    </div>
                    <Badge variant="danger">Trùng lặp AC-06</Badge>
                  </div>

                  <div className="bg-rose-50 p-2 rounded text-rose-800 text-xs">
                    <strong>Nội dung cảnh báo:</strong> {dup.deduplicationWarning}
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      variant="primary"
                      size="xs"
                      onClick={() => handleResolveDuplication(dup)}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Áp dụng khuyến nghị (Đổi sang Kỷ niệm chương)
                    </Button>
                  </div>
                </div>
              ))}

            {duplicatedCount === 0 && (
              <div className="text-center py-4 text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <div className="font-semibold text-emerald-800">Không còn trường hợp nào trùng lặp khen thưởng!</div>
                <div className="text-[11px] text-slate-500 mt-1">Toàn bộ hồ sơ đề xuất đã tuân thủ nguyên tắc AC-06.</div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: Escalate Collective Strike to District (D03 Rule)      */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={isEscalateModalOpen}
        onClose={() => {
          setIsEscalateModalOpen(false);
          setSelectedDispute(null);
        }}
        title="Chuyển hồ sơ đình công tập thể lên Cấp Huyện (D03)"
        description="Ranh giới thẩm quyền: Cấp xã không có thẩm quyền giải quyết tranh chấp tập thể / đình công"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsEscalateModalOpen(false);
                setSelectedDispute(null);
              }}
            >
              Hủy bỏ
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleEscalateToDistrict}
              className="bg-rose-600 hover:bg-rose-700 font-bold"
            >
              <AlertOctagon className="w-4 h-4 mr-1" />
              Xác nhận chuyển tuyến Cấp Huyện (D03)
            </Button>
          </>
        }
      >
        {selectedDispute && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-rose-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-rose-800">
                <AlertOctagon className="w-4 h-4" />
                CẢNH BÁO TRANH CHẤP LAO ĐỘNG TẬP THỂ (D03)
              </div>
              <p className="text-rose-800 leading-relaxed">
                Hồ sơ <strong>{selectedDispute.code}</strong> có sự tham gia của tập thể người lao động với nguy cơ ngừng việc / đình công tại cơ sở <strong>{selectedDispute.respondentName}</strong>. Cấp xã có trách nhiệm báo cáo khẩn cấp và chuyển toàn bộ hồ sơ lên Cơ quan Quản lý Lao động cấp trên theo ranh giới thẩm quyền D03 giải quyết.
              </p>
            </div>

            <div className="border border-slate-200 rounded-lg p-3 space-y-2 bg-slate-50">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Mã vụ việc:</span>
                <span className="font-mono font-semibold">{selectedDispute.code}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Bên yêu cầu (Tập thể LĐ):</span>
                <span className="font-bold text-slate-800">{selectedDispute.requesterName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Đơn vị bị yêu cầu:</span>
                <span className="font-bold text-slate-800">{selectedDispute.respondentName}</span>
              </div>
              <div className="py-1">
                <span className="text-slate-500 block mb-1">Nội dung tranh chấp:</span>
                <span className="text-slate-700 italic">{selectedDispute.disputeContent}</span>
              </div>
            </div>

            <div className="text-slate-600">
              Khi bấm xác nhận: Hệ thống sẽ chuyển trạng thái vụ việc thành <Badge variant="neutral" className="text-[10px]">ĐÃ CHUYỂN HUYỆN (D03)</Badge>, tự động ghi nhận vào Nhật ký kiểm toán hệ thống và xuất giấy biên nhận chuyển tuyến.
            </div>
          </div>
        )}
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: Tiếp nhận đơn hòa giải mới                            */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={isNewDisputeModalOpen}
        onClose={() => setIsNewDisputeModalOpen(false)}
        title="Tiếp nhận Yêu cầu Hòa giải Lao động Mới"
        description="Ghi nhận đơn yêu cầu giải quyết tranh chấp lao động cơ sở"
      >
        <form onSubmit={handleCreateDispute} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Loại hình tranh chấp</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNewDisputeType("INDIVIDUAL")}
                className={`p-2 rounded border text-left font-medium transition-colors ${
                  newDisputeType === "INDIVIDUAL"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800 font-bold"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                Tranh chấp Cá nhân (Hòa giải tại xã)
              </button>
              <button
                type="button"
                onClick={() => setNewDisputeType("COLLECTIVE")}
                className={`p-2 rounded border text-left font-medium transition-colors ${
                  newDisputeType === "COLLECTIVE"
                    ? "border-rose-600 bg-rose-50 text-rose-800 font-bold"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                Tranh chấp Tập thể / Đình công (Chuyển Huyện D03)
              </button>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Bên làm đơn / Yêu cầu</label>
            <Input
              placeholder={newDisputeType === "COLLECTIVE" ? "Ví dụ: Tập thể 15 công nhân xưởng mộc..." : "Ví dụ: Nguyễn Văn A..."}
              value={newDisputeRequester}
              onChange={(e) => setNewDisputeRequester(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Bên bị yêu cầu (Người SD LĐ / Doanh nghiệp)</label>
            <Input
              placeholder="Ví dụ: Công ty TNHH May Mặc... hoặc Hợp tác xã..."
              value={newDisputeRespondent}
              onChange={(e) => setNewDisputeRespondent(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Nội dung tóm tắt tranh chấp</label>
            <Input
              placeholder="Ví dụ: Tranh chấp về tiền lương làm thêm giờ hoặc phụ cấp ăn ca..."
              value={newDisputeContent}
              onChange={(e) => setNewDisputeContent(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsNewDisputeModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Tiếp nhận hồ sơ
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
