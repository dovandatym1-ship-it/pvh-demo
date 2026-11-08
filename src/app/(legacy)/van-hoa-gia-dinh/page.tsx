"use client";

import * as React from "react";
import { useDemo } from "@/lib/tenancy/demo-context";
import { maskPII } from "@/lib/authorization/pii-mask";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabList, TabTrigger, TabContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableEmptyState } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { SlideOverDrawer } from "@/components/ui/slide-over";
import {
  Award,
  Home,
  Landmark,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Eye,
  Plus,
  ShieldCheck,
  Info,
  AlertTriangle,
  ShieldAlert,
  Printer,
  Film,
  Users,
  Check,
  X,
  ArrowRight,
  Lock,
  HeartHandshake,
  FileCheck2,
  AlertCircle,
} from "lucide-react";
import type {
  CulturalTitleItem,
  FestivalRecordItem,
  CulturalServiceItem,
  DomesticViolenceItem,
} from "@/lib/store/demo-state";

// Step Details for 9-Step Stepper (VH1..VH9)
interface StepperStep {
  number: number;
  code: string;
  name: string;
  role: string;
  title: string;
  desc: string;
  legalBasis: string;
}

const STEPPER_STEPS: StepperStep[] = [
  {
    number: 1,
    code: "VH1",
    name: "Mở đợt",
    role: "P4 (Phó Chủ tịch / Lãnh đạo)",
    title: "VH1 — P4 mở đợt và ghim phiên bản",
    desc: "Chọn pack/form version và các đơn vị thôn/xóm phải nộp; ghi rõ trạng thái MINH_HOA. Không tự chọn quy tắc chỉ từ năm xét.",
    legalBasis: "NC03 mục 4.1 VH1; TN-DEMO-ILLUSTRATIVE-01",
  },
  {
    number: 2,
    code: "VH2",
    name: "Nhập hộ",
    role: "P6 (Trưởng thôn / Xóm trưởng)",
    title: "VH2 — P6 nhập hộ thuộc xóm được giao",
    desc: "Tạo hoặc nhập hộ tham chiếu trong phạm vi xóm; cảnh báo khả năng trùng theo định danh, không tự gộp hai hộ chỉ vì trùng tên.",
    legalBasis: "NC03 mục 4.1 VH2; REQ-M01-03",
  },
  {
    number: 3,
    code: "VH3",
    name: "Checklist",
    role: "P6 (Trưởng thôn)",
    title: "VH3 — P6 điền checklist và minh chứng",
    desc: "Phân biệt Đạt, Không đạt, Thiếu chứng cứ và Không áp dụng. Không tự công nhận danh hiệu; không giả định đã có kết nối dữ liệu dân cư.",
    legalBasis: "NC03 mục 4.1 VH3; V03",
  },
  {
    number: 4,
    code: "VH4",
    name: "Họp & ý kiến",
    role: "P6 / P5 (Ban CTMT & VH-XH)",
    title: "VH4 — P6/P5 ghi nhận họp và lấy ý kiến",
    desc: "Lưu nguồn, phạm vi công khai và ý kiến cần xử lý theo cấu hình loại hồ sơ. Không gán ngưỡng biểu quyết khi chưa xác minh gói áp dụng.",
    legalBasis: "NC03 mục 4.1 VH4; pack minh họa",
  },
  {
    number: 5,
    code: "VH5",
    name: "Nộp hồ sơ",
    role: "P6 (Trưởng thôn)",
    title: "VH5 — P6 nộp hồ sơ chính thức",
    desc: "Kiểm tra trường và tệp bắt buộc, phiên bản và trùng hồ sơ còn hiệu lực của cùng đối tượng–đợt–loại. Thiếu đầu vào thì giữ nháp và chỉ rõ lỗi.",
    legalBasis: "NC03 mục 4.1 VH5 và 4.3",
  },
  {
    number: 6,
    code: "VH6",
    name: "Rà soát",
    role: "P5 (Cán bộ chuyên môn VH-XH)",
    title: "VH6 — P5 rà soát từng lần nộp",
    desc: "Người được phân công kết luận từng mục; trả bổ sung phải có lý do và người nhận. Nộp lại giữ lịch sử lần trước; thiếu chứng cứ không chuyển thành Không đạt (RULE-10).",
    legalBasis: "NC03 mục 4.1 VH6 và 4.3; V02/V03",
  },
  {
    number: 7,
    code: "VH7",
    name: "Kiểm tra trình",
    role: "P4 (Phó Chủ tịch UBND)",
    title: "VH7 — P4 kiểm tra đề xuất và chuyển trình",
    desc: "P4 kiểm tra bản danh sách cụ thể có version; trả P5/P6 hoặc chuyển P3 demo theo quyền. Không trình bản đã bị thay thế.",
    legalBasis: "NC03 mục 4.1 VH7 và 4.3; V04",
  },
  {
    number: 8,
    code: "VH8",
    name: "Kết quả mô phỏng",
    role: "P3 (Chủ tịch UBND xã)",
    title: "VH8 — P3 ghi kết quả mô phỏng",
    desc: "Nhận, trả hoặc ghi kết quả từng đối tượng; lưu người thao tác và version bản trình. Không phát hành quyết định chính thức hoặc tự xác nhận thẩm quyền.",
    legalBasis: "NC03 mục 4.1 VH8; MÔ PHỎNG DEMO",
  },
  {
    number: 9,
    code: "VH9",
    name: "Chốt DEM-R02",
    role: "P5 / P4 (Tổng hợp số liệu)",
    title: "VH9 — P5/P4 tổng hợp và chốt DEM-R02",
    desc: "Tổng hợp theo đợt/xóm, mở hồ sơ nguồn trong quyền. Fixture A có 2/4 hồ sơ có kết quả = 50%; chỉ khi chốt mới tạo snapshot giữ nguyên số tại cut-off.",
    legalBasis: "NC03 mục 4.1 VH9, 7.2 và 8.1; AC-18",
  },
];

export default function VanHoaGiaDinhPage() {
  const { tenant, persona, data, updateTenantData, addAuditLog } = useDemo();

  // Active sub-tab
  const [activeSubTab, setActiveSubTab] = React.useState("tab-gdv-stepper");

  // Stepper state
  const [activeStep, setActiveStep] = React.useState<number>(6); // Default at Step 6 Maker-Checker

  // Filter & Search for GĐVH
  const [search, setSearch] = React.useState("");
  const [selectedHamlet, setSelectedHamlet] = React.useState("ALL");
  const [selectedStatus, setSelectedStatus] = React.useState("ALL");

  // Drawer / Modals
  const [detailItem, setDetailItem] = React.useState<CulturalTitleItem | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isFestivalModalOpen, setIsFestivalModalOpen] = React.useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = React.useState(false);

  // New Title Form State
  const [headName, setHeadName] = React.useState("");
  const [newHamlet, setNewHamlet] = React.useState(tenant.hamlets[0]?.name || "Xóm Tân Thịnh");
  const [members, setMembers] = React.useState("4");
  const [newScore, setNewScore] = React.useState("85");

  // New Festival Form State
  const [festivalName, setFestivalName] = React.useState("");
  const [organizerName, setOrganizerName] = React.useState("");
  const [regType, setRegType] = React.useState<"NOTIFICATION" | "OFFICIAL_REGISTRATION">("NOTIFICATION");
  const [festivalLocation, setFestivalLocation] = React.useState("");
  const [startDate, setStartDate] = React.useState("2026-11-20");
  const [endDate, setEndDate] = React.useState("2026-11-22");

  // New Service Form State
  const [serviceName, setServiceName] = React.useState("");
  const [ownerName, setOwnerName] = React.useState("");
  const [serviceType, setServiceType] = React.useState<"PHOTOCOPY_SHOP" | "MOBILE_CINEMA">("PHOTOCOPY_SHOP");
  const [deviceCount, setDeviceCount] = React.useState("2");

  // Domestic violence case detail state
  const [selectedDvCase, setSelectedDvCase] = React.useState<DomesticViolenceItem | null>(null);

  // Data slices from reactive context
  const culturalTitles: CulturalTitleItem[] = data?.culturalTitles || [];
  const festivals: FestivalRecordItem[] = data?.domainRecords?.festivals || [];
  const culturalServices: CulturalServiceItem[] = data?.domainRecords?.culturalServices || [];
  const domesticViolence: DomesticViolenceItem[] = data?.domesticViolence || [];

  // 50% Cap Statistics Calculation
  const submittedHouseholds = culturalTitles.filter(
    (t) => t.status !== "DRAFT" && t.status !== "CANCELLED"
  );
  const approvedHouseholds = submittedHouseholds.filter((t) => t.status === "APPROVED");
  const evaluatedHouseholds = submittedHouseholds.filter((t) => t.status === "EVALUATED");
  const proposedHouseholds = submittedHouseholds.filter((t) => t.status === "PROPOSED");
  const excludedHouseholds = culturalTitles.filter(
    (t) => t.status === "DRAFT" || t.status === "CANCELLED"
  );

  const passRate =
    submittedHouseholds.length > 0
      ? ((approvedHouseholds.length / submittedHouseholds.length) * 100).toFixed(1)
      : "0.0";

  // Filtered titles
  const filteredTitles = culturalTitles.filter((t) => {
    const matchesSearch =
      t.householdHead.toLowerCase().includes(search.toLowerCase()) ||
      t.code.toLowerCase().includes(search.toLowerCase());
    const matchesHamlet = selectedHamlet === "ALL" || t.hamlet === selectedHamlet;
    const matchesStatus = selectedStatus === "ALL" || t.status === selectedStatus;
    return matchesSearch && matchesHamlet && matchesStatus;
  });

  // Action: Approve Title
  const handleApproveTitle = (id: string) => {
    updateTenantData((prev) => {
      const updatedTitles = prev.culturalTitles.map((item) =>
        item.id === id
          ? { ...item, status: "APPROVED" as const, step: "VH8" as const }
          : item
      );
      return {
        ...prev,
        culturalTitles: updatedTitles,
      };
    });

    addAuditLog({
      action: "APPROVE_CULTURAL_TITLE",
      entityType: "CULTURAL_TITLE",
      entityId: id,
      details: { step: "VH8", note: "Phê duyệt công nhận danh hiệu GĐVH theo tỷ lệ khống chế" },
    });

    if (detailItem && detailItem.id === id) {
      setDetailItem({ ...detailItem, status: "APPROVED", step: "VH8" });
    }
  };

  // Action: Request Supplement (RULE-10)
  const handleRequestSupplement = (id: string) => {
    updateTenantData((prev) => {
      const updatedTitles = prev.culturalTitles.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "PROPOSED" as const,
              step: "VH4" as const,
              submissionCount: (item.submissionCount || 1) + 1,
            }
          : item
      );
      return {
        ...prev,
        culturalTitles: updatedTitles,
      };
    });

    addAuditLog({
      action: "REQUEST_SUPPLEMENT_CULTURAL_TITLE",
      entityType: "CULTURAL_TITLE",
      entityId: id,
      details: {
        step: "VH4",
        rule: "RULE-10",
        note: "Yêu cầu bổ sung tài liệu minh chứng, chuyển sang lần nộp mới",
      },
    });

    if (detailItem && detailItem.id === id) {
      setDetailItem({
        ...detailItem,
        status: "PROPOSED",
        step: "VH4",
        submissionCount: (detailItem.submissionCount || 1) + 1,
      });
    }
  };

  // Action: Create Title
  const handleCreateTitle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!headName.trim()) return;

    const newId = `tit-${Date.now()}`;
    const newCode = `GĐVH-${tenant.code === "XA_B" ? "B-" : ""}2026-00${culturalTitles.length + 1}`;
    const newItem: CulturalTitleItem = {
      id: newId,
      code: newCode,
      householdHead: headName,
      hamlet: newHamlet,
      membersCount: parseInt(members) || 4,
      yearsRecognized: 0,
      status: "PROPOSED",
      step: "VH2",
      score: parseInt(newScore) || 85,
      submissionCount: 1,
      tenantCode: tenant.code === "XA_B" ? "XA_B" : "XA_A",
    };

    updateTenantData((prev) => ({
      ...prev,
      culturalTitles: [newItem, ...prev.culturalTitles],
    }));

    addAuditLog({
      action: "CREATE_CULTURAL_TITLE",
      entityType: "CULTURAL_TITLE",
      entityId: newId,
      details: { code: newCode, headName, hamlet: newHamlet },
    });

    setHeadName("");
    setIsModalOpen(false);
  };

  // Action: Create Festival (Notification vs Registration)
  const handleCreateFestival = (e: React.FormEvent) => {
    e.preventDefault();
    if (!festivalName.trim()) return;

    const newId = `fest-${Date.now()}`;
    const newCode = `LH-2026-00${festivals.length + 1}`;
    const newFest: FestivalRecordItem = {
      id: newId,
      code: newCode,
      regType,
      festivalName,
      organizerName: organizerName || "UBND Xã Giả định A",
      scale: "Cấp xã",
      startDate,
      endDate,
      location: festivalLocation || "Sân vận động trung tâm xã",
      status: regType === "NOTIFICATION" ? "RECORDED" : "SUBMITTED",
      tenantCode: tenant.code === "XA_B" ? "XA_B" : "XA_A",
    };

    updateTenantData((prev) => ({
      ...prev,
      domainRecords: {
        ...prev.domainRecords,
        festivals: [newFest, ...prev.domainRecords.festivals],
      },
    }));

    addAuditLog({
      action: regType === "NOTIFICATION" ? "RECORD_FESTIVAL_NOTIFICATION" : "REGISTER_FESTIVAL",
      entityType: "FESTIVAL",
      entityId: newId,
      details: {
        code: newCode,
        festivalName,
        regType,
        note:
          regType === "NOTIFICATION"
            ? "AC-07: Tiếp nhận thông báo hoạt động, cấp giấy biên nhận tiếp nhận, không sinh giấy phép"
            : "BL-046: Thủ tục hành chính tiếp nhận đăng ký lễ hội tổ chức lần đầu",
      },
    });

    setFestivalName("");
    setOrganizerName("");
    setFestivalLocation("");
    setIsFestivalModalOpen(false);
  };

  // Action: Create Cultural Service
  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim()) return;

    const newId = `cs-${Date.now()}`;
    const newService: CulturalServiceItem = {
      id: newId,
      serviceType,
      facilityName: serviceName,
      ownerName: ownerName || "Chủ hộ kinh doanh",
      deviceCount: parseInt(deviceCount) || 1,
      contentCommitmentSigned: true,
      status: "ACTIVE",
      tenantCode: tenant.code === "XA_B" ? "XA_B" : "XA_A",
    };

    updateTenantData((prev) => ({
      ...prev,
      domainRecords: {
        ...prev.domainRecords,
        culturalServices: [newService, ...prev.domainRecords.culturalServices],
      },
    }));

    addAuditLog({
      action: "REGISTER_CULTURAL_SERVICE",
      entityType: "CULTURAL_SERVICE",
      entityId: newId,
      details: { facilityName: serviceName, ownerName, serviceType, commitment: true },
    });

    setServiceName("");
    setOwnerName("");
    setIsServiceModalOpen(false);
  };

  // Action: Emergency Domestic Violence Restraining Order
  const handleIssueRestrainingOrder = (caseId: string) => {
    updateTenantData((prev) => {
      const updatedCases = prev.domesticViolence.map((c) =>
        c.id === caseId
          ? { ...c, hasRestrainingOrder: true, status: "INTERVENING" as const }
          : c
      );
      return {
        ...prev,
        domesticViolence: updatedCases,
      };
    });

    addAuditLog({
      action: "ISSUE_EMERGENCY_RESTRAINING_ORDER",
      entityType: "DOMESTIC_VIOLENCE",
      entityId: caseId,
      details: {
        period: "03 ngày",
        rule: "BL-052",
        authority: "Chủ tịch UBND xã",
        note: "Ban hành Quyết định Cấm tiếp xúc khẩn cấp 03 ngày & Bố trí tạm lánh an toàn",
      },
    });

    if (selectedDvCase && selectedDvCase.id === caseId) {
      setSelectedDvCase({ ...selectedDvCase, hasRestrainingOrder: true, status: "INTERVENING" });
    }
  };

  // Action: Safe Close Domestic Violence Case
  const handleCloseDvCase = (caseId: string) => {
    updateTenantData((prev) => {
      const updatedCases = prev.domesticViolence.map((c) =>
        c.id === caseId ? { ...c, status: "SAFE_CLOSED" as const } : c
      );
      return {
        ...prev,
        domesticViolence: updatedCases,
      };
    });

    addAuditLog({
      action: "CLOSE_DOMESTIC_VIOLENCE_CASE",
      entityType: "DOMESTIC_VIOLENCE",
      entityId: caseId,
      details: {
        note: "Đã can thiệp thành công, đánh giá an toàn đạt chuẩn và đóng hồ sơ bảo vệ",
      },
    });

    if (selectedDvCase && selectedDvCase.id === caseId) {
      setSelectedDvCase({ ...selectedDvCase, status: "SAFE_CLOSED" });
    }
  };

  // Domestic Violence Strict Role Check (P2: Công chức VH-XH, P3: Chủ tịch UBND)
  const isP2orP3 = persona.code === "P2" || persona.code === "P3";

  // Aggregate stats for non-P2/P3 roles (RPC emulation: get_domestic_violence_aggregate_stats)
  const dvAggregateStats = React.useMemo(() => {
    const totalCases = domesticViolence.length;
    const urgentDanger = domesticViolence.filter((v) => v.severity === "URGENT_DANGER").length;
    const restrainingOrders = domesticViolence.filter((v) => v.hasRestrainingOrder).length;
    const activeInterventions = domesticViolence.filter((v) => v.status === "INTERVENING").length;

    return {
      totalCases,
      urgentDanger,
      restrainingOrders,
      activeInterventions,
    };
  }, [domesticViolence]);

  const activeStepDetail = STEPPER_STEPS.find((s) => s.number === activeStep) || STEPPER_STEPS[5];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 font-display">
              Văn hóa, Thông tin & Gia đình (M04)
            </h1>
            <Badge variant="success">DEM-VH</Badge>
            <span className="text-[11px] font-mono font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded">
              TRẦN 50% GĐVH (DEM-R02)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quy trình chuyên sâu 3 phân hệ: Bình xét Gia đình văn hóa 9 bước, Quản lý lễ hội & dịch vụ VH, Phòng chống bạo lực gia đình (D03 RLS)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {persona.permissions.includes("m04:full") && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setNewHamlet(tenant.hamlets[0]?.name || "Xóm Tân Thịnh");
                setIsModalOpen(true);
              }}
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" /> Đề xuất GĐVH mới
            </Button>
          )}
        </div>
      </div>

      {/* Legal & Standard Notice Banner */}
      <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3 text-xs text-emerald-900">
        <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Nguyên tắc thiết kế (AC-07, QĐ 74/2026 & D03 Thẩm quyền):</span>{" "}
          Với thủ tục thông báo lễ hội, kết quả là biên nhận ghi nhận (không sinh giấy phép cấp phép trái thẩm quyền). Bình xét GĐVH áp dụng khống chế trần 50% số hộ đạt danh hiệu xuất sắc. Dữ liệu phòng chống bạo lực gia đình áp dụng RLS bảo vệ danh tính nạn nhân nghiêm ngặt.
        </div>
      </div>

      {/* 3 SUB-TABS INTERFACE */}
      <Tabs defaultValue="tab-gdv-stepper" className="w-full">
        <TabList className="bg-slate-100 p-1 rounded-lg">
          <TabTrigger value="tab-gdv-stepper" className="gap-2">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>1. Bình xét GĐVH (9 Bước & Trần 50%)</span>
          </TabTrigger>
          <TabTrigger value="tab-festivals-services" className="gap-2">
            <Landmark className="w-4 h-4 text-blue-600" />
            <span>2. Lễ hội & Dịch vụ văn hóa</span>
          </TabTrigger>
          <TabTrigger value="tab-domestic-violence" className="gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            <span>3. Phòng chống bạo lực gia đình</span>
            {!isP2orP3 && (
              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-mono">
                Chỉ tổng hợp
              </span>
            )}
          </TabTrigger>
        </TabList>

        {/* =========================================================================
            SUB-TAB 1: BÌNH XÉT GĐVH (9 BƯỚC & TRẦN 50%)
           ========================================================================= */}
        <TabContent value="tab-gdv-stepper" className="space-y-6 pt-2">
          {/* 4 Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-gov-600 shadow-xs">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Tổng hộ nộp theo dõi</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1 font-display tabular-nums">
                      {submittedHouseholds.length}
                    </h3>
                  </div>
                  <div className="p-2.5 bg-gov-100 text-gov-700 rounded-lg">
                    <Home className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Loại trừ {excludedHouseholds.length} hồ sơ nháp/hủy ngoài mẫu số
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-600 shadow-xs">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Đạt kết quả mô phỏng</p>
                    <h3 className="text-2xl font-bold text-emerald-700 mt-1 font-display tabular-nums">
                      {approvedHouseholds.length}
                    </h3>
                  </div>
                  <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-lg">
                    <Award className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-[11px] text-emerald-700 mt-2 font-semibold">
                  Tỷ lệ đạt: {passRate}% (Đúng trần 50.0% Oracle DEM-R02)
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-600 shadow-xs">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Chờ rà soát / Bổ sung</p>
                    <h3 className="text-2xl font-bold text-amber-700 mt-1 font-display tabular-nums">
                      {evaluatedHouseholds.length + proposedHouseholds.length}
                    </h3>
                  </div>
                  <div className="p-2.5 bg-amber-100 text-amber-700 rounded-lg">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-[11px] text-amber-700 mt-2">
                  Gồm H3 (Chờ rà soát) và H4 (Bổ sung RULE-10)
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-600 shadow-xs">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Tiến trình Stepper</p>
                    <h3 className="text-2xl font-bold text-purple-700 mt-1 font-display">
                      Bước {activeStep}/9
                    </h3>
                  </div>
                  <div className="p-2.5 bg-purple-100 text-purple-700 rounded-lg">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-[11px] text-purple-700 mt-2 truncate">
                  {activeStepDetail.name}: {activeStepDetail.role.split(" ")[0]}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 9-STEP INTERACTIVE STEPPER COMPONENT (VH1..VH9) */}
          <Card className="border border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  Tiến trình 9 Bước Luồng DEM-VH (Bấm vào từng bước để tra cứu nghiệp vụ)
                </CardTitle>
                <Badge variant="neutral" className="font-mono text-emerald-700 border-emerald-200">
                  Bước đang chọn: {activeStepDetail.code} ({activeStepDetail.name})
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Stepper Buttons Row */}
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5">
                {STEPPER_STEPS.map((step) => {
                  const isCurrent = step.number === activeStep;
                  return (
                    <button
                      key={step.code}
                      type="button"
                      onClick={() => setActiveStep(step.number)}
                      className={`px-2 py-2.5 rounded-lg border text-center transition-all flex flex-col items-center gap-1 ${
                        isCurrent
                          ? "bg-emerald-800 text-white border-emerald-900 shadow-sm ring-2 ring-emerald-600/30 font-bold"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300 font-medium"
                      }`}
                    >
                      <span className={`text-[10px] font-mono px-1 rounded ${isCurrent ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600"}`}>
                        {step.code}
                      </span>
                      <span className="text-[11px] leading-tight line-clamp-1">{step.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Active Step Details Panel */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <span className="font-mono text-emerald-800 font-extrabold">{activeStepDetail.code}:</span>
                    {activeStepDetail.title}
                  </h4>
                  <span className="text-[11px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Phân công vai trò: <strong className="text-emerald-700">{activeStepDetail.role}</strong>
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{activeStepDetail.desc}</p>
                <div className="pt-1 text-[11px] text-emerald-800 font-medium flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Căn cứ pháp lý & quy tắc: <strong>{activeStepDetail.legalBasis}</strong></span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4 SHOWCASE FIXTURE HOUSEHOLDS CARDS (H1..H4) PROVING 50% CAP */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                4 Hồ sơ GĐVH Chuẩn Tạo Nên Kết quả Oracle DEM-R02 (Tỷ lệ 50.0%)
              </h3>
              <span className="text-[11px] text-slate-500">
                2 đạt / 4 nộp hợp lệ • Không tính H5 (Nháp) & H6 (Hủy)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* H1: Passed */}
              <div className="p-3.5 rounded-lg border border-emerald-300 bg-emerald-50/60 flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-emerald-800">H1: GĐVH-2026-001</span>
                    <span className="text-xs font-semibold text-slate-900">Hoàng Văn Nam</span>
                  </div>
                  <Badge variant="success" className="text-[10px]">
                    KẾT QUẢ: ĐẠT (95đ)
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-600">
                  Xóm Tân Thịnh • 4 nhân khẩu • Công nhận 3 năm liền. Đạt kết quả công nhận mô phỏng, khớp số liệu chốt T.
                </p>
              </div>

              {/* H2: Passed */}
              <div className="p-3.5 rounded-lg border border-emerald-300 bg-emerald-50/60 flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-emerald-800">H2: GĐVH-2026-002</span>
                    <span className="text-xs font-semibold text-slate-900">Nguyễn Thị Lan</span>
                  </div>
                  <Badge variant="success" className="text-[10px]">
                    KẾT QUẢ: ĐẠT (88đ)
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-600">
                  Xóm Tân Thịnh • 3 nhân khẩu • Công nhận 2 năm liền. Đạt kết quả công nhận mô phỏng, khớp số liệu chốt T.
                </p>
              </div>

              {/* H3: Pending Evaluation */}
              <div className="p-3.5 rounded-lg border border-amber-300 bg-amber-50/60 flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-amber-800">H3: GĐVH-2026-003</span>
                    <span className="text-xs font-semibold text-slate-900">Trần Văn Bình</span>
                  </div>
                  <Badge variant="warning" className="text-[10px]">
                    ĐÃ NỘP • CHỜ RÀ SOÁT (82đ)
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] text-slate-600">
                    Xóm Đồng Thịnh • 5 nhân khẩu • Đã nộp, đang chờ P5 rà soát kết luận (VH6).
                  </p>
                  {persona.permissions.includes("m04:full") && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-[10px] h-7 px-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                      onClick={() => handleApproveTitle("H3")}
                    >
                      Duyệt đạt →
                    </Button>
                  )}
                </div>
              </div>

              {/* H4: Proposed / Supplement Needed (RULE-10) */}
              <div className="p-3.5 rounded-lg border border-amber-300 bg-amber-50/60 flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-amber-800">H4: GĐVH-2026-004</span>
                    <span className="text-xs font-semibold text-slate-900">Vũ Đình Trọng</span>
                  </div>
                  <Badge variant="warning" className="text-[10px]">
                    CHỜ BỔ SUNG (RULE-10) (75đ)
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] text-slate-600">
                    Xóm Đức Hòa • 4 nhân khẩu • Thiếu biên bản họp xóm (Lần nộp #{culturalTitles.find((t) => t.id === "H4")?.submissionCount || 2}).
                  </p>
                  {persona.permissions.includes("m04:full") && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-[10px] h-7 px-2 border-amber-600 text-amber-700 hover:bg-amber-50"
                      onClick={() => handleRequestSupplement("H4")}
                    >
                      Nộp lại #{((culturalTitles.find((t) => t.id === "H4")?.submissionCount || 2) + 1)} →
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* MAIN CULTURAL TITLES TABLE */}
          <Card className="border border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-sm font-bold text-slate-800">
                  Danh sách Hồ sơ Bình xét Gia đình Văn hóa
                </CardTitle>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <Input
                      placeholder="Tìm mã hoặc chủ hộ..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8 text-xs h-8 w-44"
                    />
                  </div>

                  <select
                    value={selectedHamlet}
                    onChange={(e) => setSelectedHamlet(e.target.value)}
                    className="text-xs h-8 px-2 border border-slate-200 rounded-md bg-white text-slate-700"
                  >
                    <option value="ALL">Tất cả xóm ({tenant.hamlets.length})</option>
                    {tenant.hamlets.map((h) => (
                      <option key={h.id} value={h.name}>
                        {h.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="text-xs h-8 px-2 border border-slate-200 rounded-md bg-white text-slate-700"
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="APPROVED">Đã phê duyệt (Đạt)</option>
                    <option value="EVALUATED">Đã rà soát</option>
                    <option value="PROPOSED">Chờ bổ sung / Đề xuất</option>
                    <option value="DRAFT">Bản nháp (Ngoài mẫu số)</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">Mã hồ sơ</TableHead>
                    <TableHead>Chủ hộ gia đình</TableHead>
                    <TableHead>Xóm / Địa bàn</TableHead>
                    <TableHead className="text-center">Số NK</TableHead>
                    <TableHead className="text-center">Điểm rà soát</TableHead>
                    <TableHead className="text-center">Lần nộp</TableHead>
                    <TableHead className="text-center">Bước Stepper</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTitles.length === 0 ? (
                    <TableEmptyState
                      colSpan={9}
                      title="Không tìm thấy hồ sơ"
                      description="Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc thôn/xóm."
                    />
                  ) : (
                    filteredTitles.map((t) => (
                      <TableRow key={t.id} className="hover:bg-slate-50/80">
                        <TableCell className="font-mono text-xs font-bold text-slate-800">
                          {t.code}
                        </TableCell>
                        <TableCell className="font-medium text-slate-900 text-xs">
                          {t.householdHead}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">{t.hamlet}</TableCell>
                        <TableCell className="text-center text-xs font-mono">{t.membersCount}</TableCell>
                        <TableCell className="text-center text-xs font-mono font-bold">
                          {t.score > 0 ? `${t.score}/100` : "—"}
                        </TableCell>
                        <TableCell className="text-center text-xs font-mono">
                          {t.submissionCount > 0 ? `#${t.submissionCount}` : "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                            {t.step || "VH1"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {t.status === "APPROVED" && (
                            <Badge variant="success" className="text-[11px] gap-1">
                              <CheckCircle className="w-3 h-3" /> Đạt chuẩn GĐVH
                            </Badge>
                          )}
                          {t.status === "EVALUATED" && (
                            <Badge variant="info" className="text-[11px] gap-1">
                              <Clock className="w-3 h-3" /> Đã nộp • Chờ duyệt
                            </Badge>
                          )}
                          {t.status === "PROPOSED" && (
                            <Badge variant="warning" className="text-[11px] gap-1">
                              <AlertTriangle className="w-3 h-3" /> Chờ bổ sung
                            </Badge>
                          )}
                          {t.status === "DRAFT" && (
                            <Badge variant="neutral" className="text-[11px]">
                              Bản nháp
                            </Badge>
                          )}
                          {t.status === "CANCELLED" && (
                            <Badge variant="neutral" className="text-[11px] text-slate-400">
                              Đã hủy
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900"
                              onClick={() => setDetailItem(t)}
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" /> Chi tiết
                            </Button>
                            {persona.permissions.includes("m04:full") && t.status !== "APPROVED" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                                onClick={() => handleApproveTitle(t.id)}
                              >
                                Duyệt
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabContent>

        {/* =========================================================================
            SUB-TAB 2: LỄ HỘI & DỊCH VỤ VĂN HÓA
           ========================================================================= */}
        <TabContent value="tab-festivals-services" className="space-y-6 pt-2">
          {/* Statutory Notice: Registration vs Notification (AC-07) */}
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3 text-xs text-blue-900">
            <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Phân định thẩm quyền Lễ hội (BL-046 & BL-047 / AC-07):</span>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-blue-800">
                <li>
                  <strong>Đăng ký lễ hội (BL-046):</strong> Lễ hội tổ chức lần đầu hoặc thay đổi quy mô. Tiếp nhận hồ sơ trước 30 ngày làm việc. Kết quả: Ban hành Văn bản chấp thuận.
                </li>
                <li>
                  <strong>Thông báo lễ hội (BL-047):</strong> Lễ hội truyền thống thường niên định kỳ. Gửi thông báo bằng văn bản trước 20 ngày. Kết quả: Cấp Giấy biên nhận thông báo ghi nhận tiếp nhận, <strong>TUYỆT ĐỐI KHÔNG cấp phép trái thẩm quyền (AC-07)</strong>.
                </li>
              </ul>
            </div>
          </div>

          {/* Section 1: Festivals Table */}
          <Card className="border border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-blue-600" />
                  Quản lý Lễ hội Truyền thống & Sự kiện Văn hóa Cơ sở
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Theo dõi tiếp nhận thông báo và hồ sơ đăng ký lễ hội trên địa bàn xã
                </p>
              </div>
              {persona.permissions.includes("m04:full") && (
                <Button
                  size="sm"
                  variant="primary"
                  className="gap-1.5 bg-blue-700 hover:bg-blue-800"
                  onClick={() => setIsFestivalModalOpen(true)}
                >
                  <Plus className="w-3.5 h-3.5" /> Tiếp nhận / Đăng ký Lễ hội
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-28">Mã số</TableHead>
                    <TableHead>Tên lễ hội / Sự kiện</TableHead>
                    <TableHead>Hình thức thủ tục</TableHead>
                    <TableHead>Đơn vị tổ chức</TableHead>
                    <TableHead>Thời gian diễn ra</TableHead>
                    <TableHead>Địa điểm</TableHead>
                    <TableHead>Trạng thái giải quyết</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {festivals.length === 0 ? (
                    <TableEmptyState
                      colSpan={7}
                      title="Chưa có lễ hội nào"
                      description="Bấm 'Tiếp nhận / Đăng ký Lễ hội' để thêm hồ sơ mới."
                    />
                  ) : (
                    festivals.map((fest) => (
                      <TableRow key={fest.id} className="hover:bg-slate-50/80">
                        <TableCell className="font-mono text-xs font-bold text-slate-800">
                          {fest.code}
                        </TableCell>
                        <TableCell className="font-medium text-slate-900 text-xs">
                          {fest.festivalName}
                        </TableCell>
                        <TableCell>
                          {fest.regType === "NOTIFICATION" ? (
                            <Badge variant="info" className="text-[10px]">
                              Thông báo (Biên nhận)
                            </Badge>
                          ) : (
                            <Badge variant="warning" className="text-[10px]">
                              Đăng ký lần đầu (TTHC)
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-slate-700">{fest.organizerName}</TableCell>
                        <TableCell className="text-xs text-slate-600 font-mono">
                          {fest.startDate} → {fest.endDate}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">{fest.location}</TableCell>
                        <TableCell>
                          {fest.status === "RECORDED" && (
                            <Badge variant="success" className="text-[10px] gap-1">
                              <CheckCircle className="w-3 h-3" /> Đã cấp Giấy biên nhận
                            </Badge>
                          )}
                          {fest.status === "APPROVED" && (
                            <Badge variant="success" className="text-[10px] gap-1">
                              <Check className="w-3 h-3" /> Đã chấp thuận
                            </Badge>
                          )}
                          {fest.status === "SUBMITTED" && (
                            <Badge variant="warning" className="text-[10px] gap-1">
                              <Clock className="w-3 h-3" /> Đang thẩm tra
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

          {/* Section 2: Cultural Services Table (Photocopy, Cinema) */}
          <Card className="border border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Printer className="w-4 h-4 text-emerald-600" />
                  Cơ sở Kinh doanh Dịch vụ Văn hóa (BL-048)
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Quản lý cam kết tiệm photocopy in ấn & chiếu phim lưu động trên địa bàn
                </p>
              </div>
              {persona.permissions.includes("m04:full") && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => setIsServiceModalOpen(true)}
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm cơ sở dịch vụ VH
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên cơ sở kinh doanh</TableHead>
                    <TableHead>Loại hình dịch vụ</TableHead>
                    <TableHead>Chủ cơ sở</TableHead>
                    <TableHead className="text-center">Số lượng thiết bị</TableHead>
                    <TableHead>Cam kết nội dung</TableHead>
                    <TableHead>Quy chuẩn quản lý</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {culturalServices.length === 0 ? (
                    <TableEmptyState
                      colSpan={7}
                      title="Chưa có cơ sở nào"
                      description="Bấm 'Thêm cơ sở dịch vụ VH' để cập nhật danh sách."
                    />
                  ) : (
                    culturalServices.map((srv) => (
                      <TableRow key={srv.id} className="hover:bg-slate-50/80">
                        <TableCell className="font-medium text-slate-900 text-xs">
                          {srv.facilityName}
                        </TableCell>
                        <TableCell>
                          {srv.serviceType === "PHOTOCOPY_SHOP" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                              <Printer className="w-3.5 h-3.5 text-blue-600" /> Tiệm Photocopy & In ấn
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                              <Film className="w-3.5 h-3.5 text-purple-600" /> Chiếu phim lưu động
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-slate-800">{srv.ownerName}</TableCell>
                        <TableCell className="text-center text-xs font-mono font-bold">
                          {srv.deviceCount} máy
                        </TableCell>
                        <TableCell>
                          {srv.contentCommitmentSigned ? (
                            <Badge variant="success" className="text-[10px] gap-1">
                              <CheckCircle className="w-3 h-3" /> Đã ký cam kết
                            </Badge>
                          ) : (
                            <Badge variant="danger" className="text-[10px]">
                              Chưa ký
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {srv.serviceType === "PHOTOCOPY_SHOP"
                            ? "Khai báo số serial máy; cấm sao chụp tài liệu mật"
                            : "Kết thúc trước 22h00; âm lượng ≤ 70dB"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="success" className="text-[10px]">
                            {srv.status === "ACTIVE" ? "Đang hoạt động" : "Đình chỉ"}
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

        {/* =========================================================================
            SUB-TAB 3: PHÒNG CHỐNG BẠO LỰC GIA ĐÌNH (STRICT ROLE CHECK P2/P3)
           ========================================================================= */}
        <TabContent value="tab-domestic-violence" className="space-y-6 pt-2">
          {/* RLS SECURITY GUARD CHECK */}
          {!isP2orP3 ? (
            /* NON-P2/P3 VIEW: HIDE INDIVIDUAL RECORDS, SHOW SECURITY NOTICE & 4 AGGREGATE CARDS */
            <div className="space-y-6">
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-3 text-amber-900">
                <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wide text-amber-800">
                    BẢO MẬT DỮ LIỆU NHẠY CẢM NẠN NHÂN BLGĐ (RLS GUARD / LUẬT PCBLGĐ 2022)
                  </h4>
                  <p className="text-xs leading-relaxed text-amber-800">
                    Tài khoản hiện tại của bạn: <strong>{persona.name} ({persona.code} - {persona.roleTitle})</strong>. Theo chính sách phân quyền an toàn dữ liệu cá nhân cấp xã, chỉ <strong>P2 (Công chức VH-XH)</strong> và <strong>P3 (Chủ tịch UBND xã)</strong> có thẩm quyền truy cập danh sách chi tiết các vụ việc và danh tính nạn nhân bạo lực gia đình. Bạn chỉ được phép xem các chỉ số thống kê tổng hợp phục vụ giám sát chung.
                  </p>
                </div>
              </div>

              {/* 4 Aggregate Statistics Cards (RPC Emulation: get_domestic_violence_aggregate_stats) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-slate-600 shadow-xs">
                  <CardContent className="p-4">
                    <p className="text-xs text-slate-500 font-medium">Tổng số vụ việc tiếp nhận</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1 font-display tabular-nums">
                      {dvAggregateStats.totalCases < 10 ? `0${dvAggregateStats.totalCases}` : dvAggregateStats.totalCases} vụ
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-2">Dữ liệu lũy kế địa bàn xã</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-600 shadow-xs">
                  <CardContent className="p-4">
                    <p className="text-xs text-red-600 font-medium">Nguy cơ khẩn cấp (Cần bảo vệ)</p>
                    <h3 className="text-2xl font-bold text-red-700 mt-1 font-display tabular-nums">
                      {dvAggregateStats.urgentDanger < 10 ? `0${dvAggregateStats.urgentDanger}` : dvAggregateStats.urgentDanger} vụ
                    </h3>
                    <p className="text-[11px] text-red-600 mt-2">Đã bố trí lực lượng giám sát</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-600 shadow-xs">
                  <CardContent className="p-4">
                    <p className="text-xs text-amber-700 font-medium">Quyết định Cấm tiếp xúc khẩn cấp</p>
                    <h3 className="text-2xl font-bold text-amber-800 mt-1 font-display tabular-nums">
                      {dvAggregateStats.restrainingOrders < 10 ? `0${dvAggregateStats.restrainingOrders}` : dvAggregateStats.restrainingOrders} QĐ
                    </h3>
                    <p className="text-[11px] text-amber-700 mt-2">Thời hạn 03 ngày theo Điều 25</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-emerald-600 shadow-xs">
                  <CardContent className="p-4">
                    <p className="text-xs text-emerald-700 font-medium">Đang can thiệp an toàn</p>
                    <h3 className="text-2xl font-bold text-emerald-800 mt-1 font-display tabular-nums">
                      {dvAggregateStats.activeInterventions < 10 ? `0${dvAggregateStats.activeInterventions}` : dvAggregateStats.activeInterventions} vụ
                    </h3>
                    <p className="text-[11px] text-emerald-700 mt-2">Đội ngũ phản ứng nhanh hỗ trợ</p>
                  </CardContent>
                </Card>
              </div>

              {/* Masked Dummy Placeholders */}
              <div className="p-8 border-2 border-dashed border-slate-200 rounded-lg text-center space-y-2 bg-slate-50/50">
                <Lock className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">Dữ liệu Hồ sơ Cá nhân Được Mã Hóa & Khóa Quyền</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Vui lòng đăng nhập với vai trò <strong>P2 (Trần Thị Mai)</strong> hoặc <strong>P3 (Lê Văn Hùng)</strong> để trực tiếp xử lý các ca can thiệp khẩn cấp và ban hành quyết định cấm tiếp xúc.
                </p>
              </div>
            </div>
          ) : (
            /* P2 / P3 VIEW: CONFIDENTIAL EMERGENCY DOSSIERS TABLE WITH maskPII() */
            <div className="space-y-6">
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-xs text-red-900">
                <ShieldAlert className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Hồ sơ Can thiệp Khẩn cấp Bạo lực Gia đình (Thẩm quyền P2 / P3):</span>
                  {" "}Dữ liệu mật áp dụng che PII khi không ở chế độ xác thực đầy đủ. Thẩm quyền ban hành Quyết định Cấm tiếp xúc khẩn cấp 03 ngày thuộc Chủ tịch UBND xã (Điều 25 Luật PCBLGĐ 2022).
                </div>
              </div>

              {/* Emergency Protocol 4-Step Summary Banner */}
              <div className="p-3 bg-slate-100 rounded-lg border border-slate-200 text-xs text-slate-700 grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-white font-mono flex items-center justify-center text-[10px]">1</span>
                  <span>Tiếp nhận tin báo (111/Công an)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-white font-mono flex items-center justify-center text-[10px]">2</span>
                  <span>Phân loại nguy cơ tại chỗ</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-red-700 text-white font-mono flex items-center justify-center text-[10px]">3</span>
                  <span className="font-semibold text-red-900">Cấm tiếp xúc 03 ngày & Tạm lánh</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-700 text-white font-mono flex items-center justify-center text-[10px]">4</span>
                  <span>Giám sát an toàn & Đóng hồ sơ</span>
                </div>
              </div>

              {/* Cases Table */}
              <Card className="border border-slate-200 shadow-xs">
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-red-600" />
                      Danh sách Hồ sơ Vụ việc Can thiệp Bảo vệ Nạn nhân BLGĐ
                    </CardTitle>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Hiển thị trực tiếp cho vai trò {persona.code} ({persona.name})
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-28">Mã vụ việc</TableHead>
                        <TableHead>Nạn nhân (Được bảo vệ)</TableHead>
                        <TableHead>Số CCCD</TableHead>
                        <TableHead>Người có hành vi bạo lực</TableHead>
                        <TableHead>Quan hệ</TableHead>
                        <TableHead>Mức độ nguy cơ</TableHead>
                        <TableHead className="text-center">QĐ Cấm tiếp xúc</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {domesticViolence.length === 0 ? (
                        <TableEmptyState
                          colSpan={9}
                          title="Không có vụ việc nào"
                          description="Địa bàn chưa ghi nhận ca bạo lực gia đình."
                        />
                      ) : (
                        domesticViolence.map((dv) => (
                          <TableRow key={dv.id} className="hover:bg-slate-50/80">
                            <TableCell className="font-mono text-xs font-bold text-slate-800">
                              {dv.code}
                            </TableCell>
                            <TableCell className="text-xs font-semibold text-slate-900">
                              {maskPII(dv.victimName, "victim", persona)}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-slate-600">
                              {maskPII(dv.victimCccd, "cccd", persona)}
                            </TableCell>
                            <TableCell className="text-xs text-slate-800">{dv.perpetratorName}</TableCell>
                            <TableCell className="text-xs text-slate-600">{dv.relation}</TableCell>
                            <TableCell>
                              {dv.severity === "URGENT_DANGER" ? (
                                <Badge variant="danger" className="text-[10px]">
                                  NGUY CƠ KHẨN CẤP
                                </Badge>
                              ) : dv.severity === "MEDIUM_RISK" ? (
                                <Badge variant="warning" className="text-[10px]">
                                  Nguy cơ trung bình
                                </Badge>
                              ) : (
                                <Badge variant="neutral" className="text-[10px]">
                                  Nguy cơ thấp
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {dv.hasRestrainingOrder ? (
                                <Badge variant="success" className="text-[10px] gap-1">
                                  <Check className="w-3 h-3" /> Đã có QĐ 03 ngày
                                </Badge>
                              ) : (
                                <span className="text-[11px] text-slate-400">Chưa ban hành</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {dv.status === "INTERVENING" && (
                                <Badge variant="warning" className="text-[10px] gap-1">
                                  <Clock className="w-3 h-3" /> Đang can thiệp
                                </Badge>
                              )}
                              {dv.status === "REPORTED" && (
                                <Badge variant="neutral" className="text-[10px]">
                                  Mới tiếp nhận
                                </Badge>
                              )}
                              {dv.status === "SAFE_CLOSED" && (
                                <Badge variant="success" className="text-[10px]">
                                  Đã an toàn • Đóng
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {!dv.hasRestrainingOrder && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2 text-[10px] border-red-500 text-red-700 hover:bg-red-50"
                                    onClick={() => handleIssueRestrainingOrder(dv.id)}
                                  >
                                    Ra QĐ Cấm TX (03 ngày)
                                  </Button>
                                )}
                                {dv.status !== "SAFE_CLOSED" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-[10px] text-emerald-700 hover:bg-emerald-50"
                                    onClick={() => handleCloseDvCase(dv.id)}
                                  >
                                    Đóng an toàn
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </TabContent>
      </Tabs>

      {/* DETAIL SLIDE-OVER DRAWER FOR CULTURAL TITLE */}
      <SlideOverDrawer
        isOpen={Boolean(detailItem)}
        onClose={() => setDetailItem(null)}
        title={`Chi tiết Hồ sơ GĐVH: ${detailItem?.code}`}
        description={`Chủ hộ: ${detailItem?.householdHead} • ${detailItem?.hamlet}`}
        badge={
          detailItem?.status === "APPROVED" ? (
            <Badge variant="success">Đã phê duyệt</Badge>
          ) : detailItem?.status === "EVALUATED" ? (
            <Badge variant="info">Đã rà soát</Badge>
          ) : (
            <Badge variant="warning">Chờ bổ sung</Badge>
          )
        }
        footer={
          detailItem && persona.permissions.includes("m04:full") && detailItem.status !== "APPROVED" ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRequestSupplement(detailItem.id)}
              >
                Yêu cầu bổ sung (RULE-10)
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleApproveTitle(detailItem.id)}
              >
                Phê duyệt công nhận GĐVH
              </Button>
            </>
          ) : undefined
        }
      >
        {detailItem && (
          <div className="space-y-4 text-xs text-slate-700">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400">Mã định danh hồ sơ:</span>
                <p className="font-mono font-bold text-slate-900">{detailItem.code}</p>
              </div>
              <div>
                <span className="text-slate-400">Số nhân khẩu:</span>
                <p className="font-semibold text-slate-900">{detailItem.membersCount} người</p>
              </div>
              <div>
                <span className="text-slate-400">Điểm chấm rà soát:</span>
                <p className="font-mono font-bold text-emerald-700 text-sm">{detailItem.score} / 100 điểm</p>
              </div>
              <div>
                <span className="text-slate-400">Lần nộp hiện tại:</span>
                <p className="font-semibold text-slate-900">Lần nộp #{detailItem.submissionCount}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-xs">Bộ tiêu chí bình xét (Theo QĐ 74/2026)</h4>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between p-2 rounded bg-emerald-50 text-emerald-900">
                  <span>1. Gương mẫu chấp hành chủ trương, chính sách pháp luật</span>
                  <span className="font-bold">Đạt (25/25)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-emerald-50 text-emerald-900">
                  <span>2. Kinh tế gia đình ổn định, phát triển chính đáng</span>
                  <span className="font-bold">Đạt (20/20)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-emerald-50 text-emerald-900">
                  <span>3. Đời sống văn hóa tinh thần lành mạnh, phong phú</span>
                  <span className="font-bold">Đạt (25/25)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-amber-50 text-amber-900">
                  <span>4. Môi trường cảnh quan xóm làng sáng - xanh - sạch - đẹp</span>
                  <span className="font-bold">
                    {detailItem.score >= 88 ? "Đạt (20/20)" : "Đang hoàn thiện minh chứng"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </SlideOverDrawer>

      {/* MODAL 1: CREATE NEW CULTURAL TITLE */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Đề xuất Hồ sơ Bình xét Gia đình Văn hóa mới"
        description="Nhập thông tin hộ gia đình tham gia đợt bình xét cấp xóm"
      >
        <form onSubmit={handleCreateTitle} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Họ và tên chủ hộ <span className="text-red-500">*</span>
            </label>
            <Input
              required
              placeholder="VD: Hoàng Văn Nam"
              value={headName}
              onChange={(e) => setHeadName(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Thôn / Xóm</label>
              <select
                value={newHamlet}
                onChange={(e) => setNewHamlet(e.target.value)}
                className="w-full text-xs h-9 px-2 border border-slate-200 rounded-md bg-white text-slate-700"
              >
                {tenant.hamlets.map((h) => (
                  <option key={h.id} value={h.name}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Số nhân khẩu</label>
              <Input
                type="number"
                min="1"
                max="20"
                value={members}
                onChange={(e) => setMembers(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Điểm tự chấm ban đầu</label>
            <Input
              type="number"
              min="0"
              max="100"
              value={newScore}
              onChange={(e) => setNewScore(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Lưu đề xuất
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: RECORD FESTIVAL */}
      <Modal
        isOpen={isFestivalModalOpen}
        onClose={() => setIsFestivalModalOpen(false)}
        title="Tiếp nhận Thông báo / Đăng ký Lễ hội"
        description="Thực hiện thủ tục theo chuẩn AC-07 (Không cấp phép trái thẩm quyền)"
      >
        <form onSubmit={handleCreateFestival} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Hình thức thủ tục tiếp nhận <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label
                className={`p-2.5 rounded-lg border text-xs cursor-pointer flex flex-col gap-1 ${
                  regType === "NOTIFICATION"
                    ? "border-blue-600 bg-blue-50 text-blue-900 font-semibold"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                <input
                  type="radio"
                  name="regType"
                  checked={regType === "NOTIFICATION"}
                  onChange={() => setRegType("NOTIFICATION")}
                  className="sr-only"
                />
                <span>Thông báo lễ hội (BL-047)</span>
                <span className="text-[10px] text-slate-500 font-normal">
                  Lễ hội thường niên (Cấp Giấy biên nhận, không giấy phép)
                </span>
              </label>

              <label
                className={`p-2.5 rounded-lg border text-xs cursor-pointer flex flex-col gap-1 ${
                  regType === "OFFICIAL_REGISTRATION"
                    ? "border-amber-600 bg-amber-50 text-amber-900 font-semibold"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                <input
                  type="radio"
                  name="regType"
                  checked={regType === "OFFICIAL_REGISTRATION"}
                  onChange={() => setRegType("OFFICIAL_REGISTRATION")}
                  className="sr-only"
                />
                <span>Đăng ký lễ hội (BL-046)</span>
                <span className="text-[10px] text-slate-500 font-normal">
                  Tổ chức lần đầu hoặc đổi quy mô (TTHC 30 ngày)
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Tên lễ hội / sự kiện <span className="text-red-500">*</span>
            </label>
            <Input
              required
              placeholder="VD: Hội Chợ Quê Nông sản An toàn"
              value={festivalName}
              onChange={(e) => setFestivalName(e.target.value)}
              className="text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Đơn vị / Ban tổ chức</label>
            <Input
              placeholder="VD: Hội Nông dân Xã Giả định A"
              value={organizerName}
              onChange={(e) => setOrganizerName(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Ngày bắt đầu</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Ngày kết thúc</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Địa điểm tổ chức</label>
            <Input
              placeholder="VD: Khuôn viên Sân vận động xã"
              value={festivalLocation}
              onChange={(e) => setFestivalLocation(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsFestivalModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {regType === "NOTIFICATION" ? "Cấp Giấy biên nhận tiếp nhận" : "Ghi nhận đăng ký"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: ADD CULTURAL SERVICE */}
      <Modal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        title="Đăng ký Cơ sở Dịch vụ Văn hóa mới (BL-048)"
        description="Tiệm photocopy, in ấn hoặc điểm chiếu phim lưu động"
      >
        <form onSubmit={handleCreateService} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Loại hình dịch vụ</label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value as any)}
              className="w-full text-xs h-9 px-2 border border-slate-200 rounded-md bg-white text-slate-700"
            >
              <option value="PHOTOCOPY_SHOP">Cửa hàng Photocopy & In ấn</option>
              <option value="MOBILE_CINEMA">Chiếu phim lưu động</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Tên cơ sở kinh doanh <span className="text-red-500">*</span>
            </label>
            <Input
              required
              placeholder="VD: Cửa hàng Photocopy & In ấn Tân Thịnh"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Chủ cơ sở</label>
              <Input
                placeholder="VD: Lê Văn Tiến"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Số lượng thiết bị máy</label>
              <Input
                type="number"
                min="1"
                value={deviceCount}
                onChange={(e) => setDeviceCount(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-[11px] text-emerald-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Tự động đính kèm Biên bản Cam kết không sao chụp tài liệu cấm & đảm bảo an toàn PCCC.</span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsServiceModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Lưu cơ sở dịch vụ
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
