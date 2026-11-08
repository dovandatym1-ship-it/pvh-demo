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
  ShieldAlert,
  Users,
  Stethoscope,
  Utensils,
  Pill,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Plus,
  Check,
  X,
  AlertOctagon,
  FileCheck2,
  Lock,
  Flame,
  ShieldCheck,
} from "lucide-react";
import type {
  SocialProtectionItem,
  FoodSafetyItem,
  MedicalFacilityItem,
  EpidemicLogItem,
} from "@/lib/store/demo-state";

export default function YTeAnSinhPage() {
  const { tenant, persona, data, updateTenantData, addAuditLog } = useDemo();

  // Search state
  const [searchTerm, setSearchTerm] = React.useState("");

  // Modals state
  const [isFinalizePaymentModalOpen, setIsFinalizePaymentModalOpen] = React.useState(false);
  const [isNewInspectionModalOpen, setIsNewInspectionModalOpen] = React.useState(false);
  const [isOutbreakActionModalOpen, setIsOutbreakActionModalOpen] = React.useState(false);

  // New inspection form state
  const [newInspFacility, setNewInspFacility] = React.useState("");
  const [newInspType, setNewInspType] = React.useState<FoodSafetyItem["inspectionType"]>("SCHOOL_CANTEEN");
  const [newInspScore, setNewInspScore] = React.useState(90);
  const [newInspSample24h, setNewInspSample24h] = React.useState(true);

  const yTeData = data.domainRecords?.yTeAnSinh || {
    socialProtection: [],
    foodSafety: [],
    medical: [],
    epidemics: [],
  };

  const socialList = yTeData.socialProtection || [];
  const foodSafetyList = yTeData.foodSafety || [];
  const medicalList = yTeData.medical || [];
  const epidemicList = yTeData.epidemics || [];

  // Filtered lists
  const filteredSocial = socialList.filter(
    (item) =>
      item.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.hamlet.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFoodSafety = foodSafetyList.filter(
    (item) =>
      item.facilityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.inspectionType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMedical = medicalList.filter(
    (item) =>
      item.facilityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.practitionerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Counts & Summaries
  const pendingPaymentCount = socialList.filter((s) => s.paymentStatus === "PENDING").length;
  const totalMonthlyAidBudget = socialList.reduce((acc, s) => acc + s.monthlyAmount, 0);

  // Outbreak detection rule: Any record with outbreakAlertFlag or Dengue cases > 3
  const activeOutbreak = epidemicList.find(
    (e) => e.outbreakAlertFlag || (e.diseaseName.includes("Dengue") && e.casesCount > 3)
  );

  // Handler: Finalize monthly social aid payment
  const handleFinalizePayment = () => {
    updateTenantData((prev) => {
      const current = prev.domainRecords?.yTeAnSinh?.socialProtection || [];
      const updated = current.map((s) => ({
        ...s,
        paymentStatus: "PAID" as const,
      }));
      return {
        ...prev,
        domainRecords: {
          ...prev.domainRecords,
          yTeAnSinh: {
            ...prev.domainRecords.yTeAnSinh,
            socialProtection: updated,
          },
        },
      };
    });

    addAuditLog({
      action: "FINALIZE_MONTHLY_SOCIAL_AID_PAYMENT",
      entityType: "SOCIAL_AID_PAYMENT_PERIOD",
      entityId: "BTXH-NOV-2026",
      details: {
        message: `Chốt danh sách chi trả trợ cấp bảo trợ xã hội tháng 11/2026 cho ${socialList.length} đối tượng (Tổng kinh phí: ${formatMoney(totalMonthlyAidBudget)})`,
        totalRecipients: socialList.length,
        totalAmount: totalMonthlyAidBudget,
      },
    });

    setIsFinalizePaymentModalOpen(false);
  };

  // Handler: Add new food safety checklist
  const handleCreateInspection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInspFacility) return;

    const conclusion: FoodSafetyItem["conclusion"] =
      newInspScore >= 80 ? "PASSED" : newInspScore >= 60 ? "WARNING_REMEDIAL" : "FAILED_SUSPEND";

    const newItem: FoodSafetyItem = {
      id: `FS-NEW-${Date.now()}`,
      facilityName: newInspFacility,
      inspectionType: newInspType,
      inspectionDate: new Date().toISOString().split("T")[0],
      totalScore: Number(newInspScore),
      sampleRetention24hPassed: newInspType === "SCHOOL_CANTEEN" ? newInspSample24h : true,
      conclusion,
      tenantCode: tenant.code === "XA_B" ? "XA_B" : "XA_A",
    };

    updateTenantData((prev) => ({
      ...prev,
      domainRecords: {
        ...prev.domainRecords,
        yTeAnSinh: {
          ...prev.domainRecords.yTeAnSinh,
          foodSafety: [newItem, ...(prev.domainRecords?.yTeAnSinh?.foodSafety || [])],
        },
      },
    }));

    addAuditLog({
      action: "RECORD_FOOD_SAFETY_INSPECTION",
      entityType: "FOOD_SAFETY_CHECKLIST",
      entityId: newInspFacility,
      details: {
        message: `Lập biên bản kiểm tra ATTP cơ sở ${newInspFacility} (${conclusion}, điểm số: ${newInspScore}/100)`,
        sampleRetention24h: newItem.sampleRetention24hPassed,
      },
    });

    setIsNewInspectionModalOpen(false);
    setNewInspFacility("");
  };

  // Handler: Activate outbreak response
  const handleActivateOutbreakResponse = () => {
    if (!activeOutbreak) return;

    updateTenantData((prev) => {
      const current = prev.domainRecords?.yTeAnSinh?.epidemics || [];
      const updated = current.map((e) =>
        e.id === activeOutbreak.id ? { ...e, outbreakAlertFlag: false } : e
      );
      return {
        ...prev,
        domainRecords: {
          ...prev.domainRecords,
          yTeAnSinh: {
            ...prev.domainRecords.yTeAnSinh,
            epidemics: updated,
          },
        },
      };
    });

    addAuditLog({
      action: "ACTIVATE_EPIDEMIC_OUTBREAK_RESPONSE",
      entityType: "EPIDEMIC_SURVEILLANCE",
      entityId: activeOutbreak.hamlet,
      details: {
        message: `Kích hoạt kế hoạch khẩn cấp xử lý ổ dịch ${activeOutbreak.diseaseName} tại ${activeOutbreak.hamlet}: Tổ chức phun khử khuẩn, diệt bọ gậy lăng quăng và cách ly điều trị`,
        hamlet: activeOutbreak.hamlet,
        casesCount: activeOutbreak.casesCount,
      },
    });

    setIsOutbreakActionModalOpen(false);
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
            <HeartHandshake className="w-4 h-4 text-[#1F633E]" />
            Phân hệ M06 • Y tế, Dân số & An sinh xã hội
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            Bảo trợ Xã hội, An toàn Thực phẩm & Y tế Cơ sở
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Không gian tác nghiệp độc lập quản lý chi trả bảo trợ xã hội có maskPII, kiểm soát ATTP bếp ăn lưu mẫu 24h và giám sát dịch bệnh tại {tenant.name}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!persona.canViewPII && (
            <Badge variant="warning" className="px-3 py-1 font-semibold text-xs flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              Chế độ Che mờ PII Đang Bật ({persona.code})
            </Badge>
          )}
        </div>
      </div>

      {/* Epidemic Outbreak Alert Banner if Active */}
      {activeOutbreak && (
        <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs text-rose-950 shadow-sm animate-pulse">
          <div className="flex items-start gap-3">
            <AlertOctagon className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-sm text-rose-900 flex items-center gap-2">
                CẢNH BÁO NGUY CƠ BÙNG PHÁT Ổ DỊCH (EPIDEMIC_OUTBREAK_RISK)
                <Badge variant="danger" className="text-[10px]">Tuần {activeOutbreak.logWeek}/2026</Badge>
              </div>
              <p className="text-rose-800 leading-relaxed">
                Phát hiện <strong>{activeOutbreak.casesCount} ca mắc {activeOutbreak.diseaseName}</strong> tại{" "}
                <strong>{activeOutbreak.hamlet}</strong> ({activeOutbreak.hospitalizedCount} ca nhập viện điều trị). Vượt ngưỡng an toàn (&gt; 3 ca/tuần/xóm). Cần kích hoạt ngay đội phản ứng nhanh y tế dập dịch.
              </p>
            </div>
          </div>

          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsOutbreakActionModalOpen(true)}
            className="font-bold whitespace-nowrap shadow-md bg-rose-700 hover:bg-rose-800 text-white shrink-0"
          >
            <Flame className="w-4 h-4 mr-1.5" />
            Kích hoạt Xử lý Ổ dịch / Phun hóa chất
          </Button>
        </div>
      )}

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover:border-emerald-300 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500">Đối tượng Bảo trợ XH</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{socialList.length} người</div>
              <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                {pendingPaymentCount > 0 ? `${pendingPaymentCount} đối tượng chờ chi trả` : "100% đã chi trả tháng"}
              </div>
            </div>
            <HeartHandshake className="w-8 h-8 text-[#1F633E]/20" />
          </CardContent>
        </Card>

        <Card className="hover:border-emerald-300 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500">Kiểm tra An toàn thực phẩm</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{foodSafetyList.length} cơ sở</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {foodSafetyList.filter((f) => f.sampleRetention24hPassed).length} cơ sở lưu mẫu 24h
              </div>
            </div>
            <Utensils className="w-8 h-8 text-amber-500/20" />
          </CardContent>
        </Card>

        <Card className="hover:border-emerald-300 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500">Cơ sở Y dược tư nhân</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{medicalList.length} cơ sở</div>
              <div className="text-[11px] text-indigo-700 font-medium mt-0.5">
                {medicalList.filter((m) => m.inspectionStatus === "NORMAL").length} cơ sở đạt chuẩn GPP
              </div>
            </div>
            <Stethoscope className="w-8 h-8 text-indigo-500/20" />
          </CardContent>
        </Card>

        <Card className="hover:border-emerald-300 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500">Dịch bệnh truyền nhiễm</div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {epidemicList.reduce((acc, e) => acc + e.casesCount, 0)} ca (Tuần 45)
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {activeOutbreak ? (
                  <span className="text-rose-600 font-bold">Cảnh báo ổ dịch tại {activeOutbreak.hamlet}</span>
                ) : (
                  <span className="text-emerald-700">Trong ngưỡng an toàn</span>
                )}
              </div>
            </div>
            <Activity className="w-8 h-8 text-rose-500/20" />
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Container */}
      <Tabs defaultValue="protection" className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <TabList className="bg-slate-100 p-1 rounded-lg">
            <TabTrigger value="protection" className="flex items-center gap-2">
              <HeartHandshake className="w-4 h-4" />
              <span>Bảo trợ XH & Chốt chi trả tháng</span>
              {pendingPaymentCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                  {pendingPaymentCount}
                </span>
              )}
            </TabTrigger>
            <TabTrigger value="food-safety" className="flex items-center gap-2">
              <Utensils className="w-4 h-4" />
              <span>ATTP thức ăn đường phố & Bếp ăn trường học</span>
            </TabTrigger>
            <TabTrigger value="medical" className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4" />
              <span>Y dược tư nhân & Giám sát dịch bệnh theo tuần</span>
              {activeOutbreak && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </TabTrigger>
          </TabList>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <Input
              placeholder="Tìm đối tượng, cơ sở, dịch bệnh..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* SUB-TAB 1: Bảo trợ XH & Chốt chi trả tháng (kèm maskPII)       */}
        {/* ------------------------------------------------------------- */}
        <TabContent value="protection" className="space-y-4">
          <Card>
            <CardHeader className="pb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Sổ chi trả trợ cấp bảo trợ xã hội hàng tháng</span>
                  <Badge variant="neutral" className="text-xs">Kỳ: Tháng 11/2026</Badge>
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Tự động che mờ dữ liệu PII (CCCD, SĐT, Bệnh án, Mức tiền) khi cán bộ không có thẩm quyền theo ranh giới D03
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsFinalizePaymentModalOpen(true)}
                  disabled={pendingPaymentCount === 0}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-sm"
                >
                  <FileCheck2 className="w-4 h-4 mr-1.5" />
                  Chốt danh sách chi trả tháng 11/2026
                  {pendingPaymentCount > 0 && ` (${pendingPaymentCount} chờ)`}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã hồ sơ</TableHead>
                    <TableHead>Họ và tên đối tượng</TableHead>
                    <TableHead>CCCD</TableHead>
                    <TableHead>Số điện thoại</TableHead>
                    <TableHead>Địa bàn cư trú</TableHead>
                    <TableHead>Diện bảo trợ</TableHead>
                    <TableHead>Chẩn đoán bệnh lý / Hoàn cảnh</TableHead>
                    <TableHead className="text-right">Mức trợ cấp hàng tháng</TableHead>
                    <TableHead className="text-center">Trạng thái chi trả</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSocial.length === 0 ? (
                    <TableEmptyState colSpan={9} title="Không tìm thấy đối tượng bảo trợ xã hội" />
                  ) : (
                    filteredSocial.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs font-semibold text-slate-700">
                          {item.code}
                        </TableCell>
                        <TableCell className="font-bold text-slate-900">
                          {item.fullName}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-600">
                          {maskPII(item.cccd, "cccd", persona)}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-600">
                          {maskPII(item.phone, "phone", persona)}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">{item.hamlet}</TableCell>
                        <TableCell className="text-xs font-medium text-slate-800">{item.aidCategory}</TableCell>
                        <TableCell className="text-xs text-slate-700 italic max-w-xs truncate" title={maskPII(item.diagnosis, "medical", persona)}>
                          {maskPII(item.diagnosis, "medical", persona)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-emerald-800 text-xs">
                          {maskPII(item.monthlyAmount, "aid", persona)}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.paymentStatus === "PAID" ? (
                            <Badge variant="success" className="py-0.5 text-[11px]">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Đã chi trả
                            </Badge>
                          ) : (
                            <Badge variant="warning" className="py-0.5 text-[11px]">
                              <Clock className="w-3 h-3 mr-1" /> Chờ chốt kỳ
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
        </TabContent>

        {/* ------------------------------------------------------------- */}
        {/* SUB-TAB 2: ATTP thức ăn đường phố & Bếp ăn trường học (BL-067) */}
        {/* ------------------------------------------------------------- */}
        <TabContent value="food-safety" className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-slate-800">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold uppercase tracking-wider text-slate-900">
                Tiêu chuẩn kiểm soát An toàn thực phẩm cơ sở (Thông tư 30/2012/TT-BYT):
              </div>
              <p className="text-slate-600 leading-relaxed">
                Đối với <strong>Bếp ăn bán trú trường học</strong>, bắt buộc phải thực hiện quy trình kiểm thực 3 bước và <strong>lưu mẫu thức ăn 24 giờ có niêm phong ghi chép đầy đủ</strong>. Đối với thức ăn đường phố và cơ sở cổng trường, kiểm tra giấy khám sức khỏe và trang bị dụng cụ bao gói an toàn.
              </p>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Biên bản kiểm tra An toàn thực phẩm cơ sở năm 2026
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Kiểm soát cam kết lưu mẫu thức ăn 24 giờ và điều kiện vệ sinh chế biến
                </CardDescription>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsNewInspectionModalOpen(true)}
                className="text-xs"
              >
                <Plus className="w-4 h-4 mr-1" /> Thêm biên bản kiểm tra
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên cơ sở / Bếp ăn trường học</TableHead>
                    <TableHead>Phân loại hình thức</TableHead>
                    <TableHead className="text-center">Ngày kiểm tra</TableHead>
                    <TableHead className="text-center">Cam kết lưu mẫu thức ăn 24h</TableHead>
                    <TableHead className="text-center">Điểm số ATTP</TableHead>
                    <TableHead>Kết luận kiểm tra</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFoodSafety.length === 0 ? (
                    <TableEmptyState colSpan={6} title="Không có dữ liệu biên bản kiểm tra ATTP" />
                  ) : (
                    filteredFoodSafety.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-bold text-slate-900">{item.facilityName}</TableCell>
                        <TableCell>
                          <Badge variant="neutral">
                            {item.inspectionType === "SCHOOL_CANTEEN"
                              ? "Bếp ăn bán trú trường học"
                              : item.inspectionType === "STREET_FOOD"
                              ? "Thức ăn đường phố / Cổng trường"
                              : "Cơ sở sản xuất thủ công"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs text-slate-600">
                          {item.inspectionDate}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.sampleRetention24hPassed ? (
                            <Badge variant="success" className="py-0.5 text-[11px]">
                              <Check className="w-3 h-3 mr-1" /> Đã lưu mẫu 24h có niêm phong
                            </Badge>
                          ) : (
                            <Badge variant="danger" className="py-0.5 text-[11px]">
                              <X className="w-3 h-3 mr-1" /> Chưa thực hiện lưu mẫu
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center font-mono font-bold text-slate-900">
                          {item.totalScore} / 100
                        </TableCell>
                        <TableCell>
                          {item.conclusion === "PASSED" ? (
                            <Badge variant="success">Đạt chuẩn ATTP</Badge>
                          ) : item.conclusion === "WARNING_REMEDIAL" ? (
                            <Badge variant="warning">Cảnh báo yêu cầu khắc phục</Badge>
                          ) : (
                            <Badge variant="danger">Không đạt (Tạm đình chỉ)</Badge>
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
        {/* SUB-TAB 3: Y dược tư nhân & Giám sát dịch bệnh theo tuần      */}
        {/* ------------------------------------------------------------- */}
        <TabContent value="medical" className="space-y-6">
          {/* Section 1: Private Clinics & Pharmacies */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900">
                1. Danh mục Cơ sở Hành nghề Y dược Tư nhân trên Địa bàn
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Theo dõi giấy phép hành nghề, chuẩn GPP nhà thuốc và sổ theo dõi thuốc kiểm soát đặc biệt
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên cơ sở Y dược tư nhân</TableHead>
                    <TableHead>Loại hình cơ sở</TableHead>
                    <TableHead>Người chịu trách nhiệm chuyên môn</TableHead>
                    <TableHead>Số Giấy phép hành nghề</TableHead>
                    <TableHead className="text-center">Chuẩn GPP / Kiểm soát thuốc</TableHead>
                    <TableHead>Trạng thái hoạt động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMedical.length === 0 ? (
                    <TableEmptyState colSpan={6} title="Không có dữ liệu cơ sở y dược tư nhân" />
                  ) : (
                    filteredMedical.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-bold text-slate-900">{m.facilityName}</TableCell>
                        <TableCell>
                          <Badge variant="neutral">
                            {m.facilitySubType === "TRADITIONAL_CLINIC"
                              ? "Phòng chẩn trị YHCT"
                              : m.facilitySubType === "DRUG_STORE"
                              ? "Quầy thuốc tân dược"
                              : "Phòng khám chuyên khoa"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-800 text-xs font-medium">
                          {m.practitionerName}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-600">
                          {m.licenseNumber}
                          <span className="block text-[11px] text-slate-500">Cấp ngày: {m.licenseIssueDate}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            {m.gppCertified && (
                              <Badge variant="success" className="text-[10px] py-0">Đạt chuẩn GPP</Badge>
                            )}
                            {m.controlledDrugsLedger ? (
                              <Badge variant="info" className="text-[10px] py-0">Có sổ kiểm soát thuốc</Badge>
                            ) : (
                              <Badge variant="warning" className="text-[10px] py-0">Thiếu sổ kiểm soát</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={m.inspectionStatus === "NORMAL" ? "success" : "warning"}>
                            {m.inspectionStatus === "NORMAL" ? "Bình thường" : "Cần rà soát"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Section 2: Epidemic Surveillance Weekly Log */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  2. Giám sát Báo cáo Dịch bệnh Truyền nhiễm theo Tuần (Tuần 45/2026)
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Cơ chế kích hoạt ổ dịch: Tự động cảnh báo đỏ khi số ca mắc Sốt xuất huyết/Sởi &gt; 3 ca/tuần tại 1 thôn/xóm
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Địa bàn xóm / Thôn</TableHead>
                    <TableHead>Tên bệnh truyền nhiễm</TableHead>
                    <TableHead className="text-center">Nhóm bệnh (Luật PCBTN)</TableHead>
                    <TableHead className="text-center">Số ca mắc trong tuần</TableHead>
                    <TableHead className="text-center">Ca nhập viện</TableHead>
                    <TableHead className="text-center">Ca tử vong</TableHead>
                    <TableHead className="text-center">Ngày báo cáo</TableHead>
                    <TableHead>Đánh giá nguy cơ ổ dịch</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {epidemicList.length === 0 ? (
                    <TableEmptyState colSpan={8} title="Không có dữ liệu giám sát dịch bệnh" />
                  ) : (
                    epidemicList.map((e) => {
                      const isAlert = e.outbreakAlertFlag || e.casesCount > 3;

                      return (
                        <TableRow key={e.id} className={isAlert ? "bg-rose-50/50" : ""}>
                          <TableCell className="font-bold text-slate-900">{e.hamlet}</TableCell>
                          <TableCell className="font-semibold text-slate-800">{e.diseaseName}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="neutral">Nhóm B</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={`font-mono font-bold text-sm ${
                                isAlert ? "text-rose-700" : "text-slate-800"
                              }`}
                            >
                              {e.casesCount} ca
                            </span>
                          </TableCell>
                          <TableCell className="text-center font-mono text-slate-700">
                            {e.hospitalizedCount}
                          </TableCell>
                          <TableCell className="text-center font-mono text-slate-700">
                            {e.deathsCount}
                          </TableCell>
                          <TableCell className="text-center font-mono text-xs text-slate-500">
                            {e.reportedDate}
                          </TableCell>
                          <TableCell>
                            {isAlert ? (
                              <Badge variant="danger" className="font-bold py-0.5">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                NGUY CƠ BÙNG PHÁT Ổ DỊCH
                              </Badge>
                            ) : (
                              <Badge variant="success" className="py-0.5">
                                Trong tầm kiểm soát
                              </Badge>
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
      {/* MODAL: Chốt danh sách chi trả trợ cấp tháng                   */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={isFinalizePaymentModalOpen}
        onClose={() => setIsFinalizePaymentModalOpen(false)}
        title="Chốt Danh sách Chi trả Trợ cấp Bảo trợ Xã hội Tháng 11/2026"
        description="Khóa kỳ chi trả và xuất biên bản tổng hợp chuyển Kho bạc / Bưu điện thực hiện chi trả"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsFinalizePaymentModalOpen(false)}>
              Hủy bỏ
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleFinalizePayment}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
            >
              <FileCheck2 className="w-4 h-4 mr-1.5" />
              Xác nhận Chốt danh sách & Xuất biên bản
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-950 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              TỔNG HỢP KINH PHÍ CHI TRẢ THÁNG 11/2026
            </div>
            <p className="text-emerald-800 leading-relaxed">
              Tổng số đối tượng thụ hưởng: <strong>{socialList.length} người</strong>.
              Tổng ngân sách trợ cấp tháng: <strong>{formatMoney(totalMonthlyAidBudget)}</strong>.
            </p>
          </div>

          <div className="border border-slate-200 rounded-lg p-3 space-y-2 bg-slate-50">
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Đối tượng đã hoàn tất chi trả:</span>
              <span className="font-semibold text-emerald-700">{socialList.filter(s => s.paymentStatus === "PAID").length} đối tượng</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Đối tượng đang chờ chốt kỳ:</span>
              <span className="font-bold text-amber-700">{pendingPaymentCount} đối tượng</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Phương thức chuyển giao:</span>
              <span className="font-medium text-slate-800">Qua dịch vụ Bưu điện & Tài khoản ngân hàng</span>
            </div>
          </div>

          <div className="text-slate-600 text-[11px]">
            * Khi bấm xác nhận: Toàn bộ đối tượng còn lại sẽ được chuyển trạng thái <Badge variant="success" className="text-[10px]">Đã chi trả</Badge> và hệ thống tự động ghi nhật ký kiểm toán.
          </div>
        </div>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: Thêm biên bản kiểm tra ATTP                            */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={isNewInspectionModalOpen}
        onClose={() => setIsNewInspectionModalOpen(false)}
        title="Thêm Biên bản Kiểm tra An toàn Thực phẩm Mới"
        description="Ghi nhận kết quả kiểm tra điều kiện an toàn thực phẩm cơ sở chế biến / bếp ăn"
      >
        <form onSubmit={handleCreateInspection} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Tên cơ sở / Bếp ăn trường học</label>
            <Input
              placeholder="Ví dụ: Bếp ăn Bán trú Mầm non... hoặc Quán chè..."
              value={newInspFacility}
              onChange={(e) => setNewInspFacility(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Loại hình cơ sở</label>
            <select
              value={newInspType}
              onChange={(e) => setNewInspType(e.target.value as FoodSafetyItem["inspectionType"])}
              className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#1F633E]"
            >
              <option value="SCHOOL_CANTEEN">Bếp ăn bán trú trường học</option>
              <option value="STREET_FOOD">Thức ăn đường phố / Quán ăn cổng trường</option>
              <option value="ARTISAN_PRODUCER">Cơ sở sản xuất thủ công làng nghề</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Tổng điểm chấm ATTP (thang điểm 100)</label>
            <Input
              type="number"
              min="0"
              max="100"
              value={newInspScore}
              onChange={(e) => setNewInspScore(Number(e.target.value))}
              required
            />
          </div>

          {newInspType === "SCHOOL_CANTEEN" && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <label className="flex items-center gap-2 font-semibold text-amber-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newInspSample24h}
                  onChange={(e) => setNewInspSample24h(e.target.checked)}
                  className="rounded text-emerald-700 focus:ring-emerald-600"
                />
                Cam kết & Thực hiện Lưu mẫu thức ăn 24 giờ có niêm phong
              </label>
              <span className="text-[11px] text-amber-700 block mt-1">
                * Bắt buộc đối với tất cả bếp ăn trường học theo quy định của Bộ Y tế.
              </span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsNewInspectionModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Lưu biên bản
            </Button>
          </div>
        </form>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: Kích hoạt kế hoạch xử lý ổ dịch khẩn cấp              */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={isOutbreakActionModalOpen}
        onClose={() => setIsOutbreakActionModalOpen(false)}
        title="Kế hoạch Khẩn cấp Xử lý Ổ dịch Truyền nhiễm"
        description="Triển khai các biện pháp dập dịch sốt xuất huyết tại thôn/xóm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsOutbreakActionModalOpen(false)}>
              Hủy bỏ
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleActivateOutbreakResponse}
              className="bg-rose-700 hover:bg-rose-800 font-bold text-white"
            >
              <Flame className="w-4 h-4 mr-1.5" />
              Xác nhận Triển khai Dập dịch & Phun hóa chất
            </Button>
          </>
        }
      >
        {activeOutbreak && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-rose-950 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-rose-800">
                <AlertOctagon className="w-4 h-4" />
                QUY TRÌNH PHẢN ỨNG NHANH CẤP XÃ
              </div>
              <p className="text-rose-800 leading-relaxed">
                Kích hoạt chiến dịch tổng vệ sinh môi trường, diệt lăng quăng bọ gậy và phun hóa chất diệt muỗi trưởng thành diện rộng tại <strong>{activeOutbreak.hamlet}</strong>.
              </p>
            </div>

            <div className="border border-slate-200 rounded-lg p-3 space-y-2 bg-slate-50">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Tên ổ dịch:</span>
                <span className="font-bold text-rose-700">{activeOutbreak.diseaseName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Địa bàn bùng phát:</span>
                <span className="font-bold text-slate-900">{activeOutbreak.hamlet}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Số ca mắc ghi nhận:</span>
                <span className="font-mono font-bold text-rose-700">{activeOutbreak.casesCount} ca</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Lực lượng phối hợp:</span>
                <span className="font-medium text-slate-800">Trạm Y tế xã, Trưởng thôn, Tổ CNSCĐ</span>
              </div>
            </div>

            <div className="text-slate-600 text-[11px]">
              * Khi xác nhận: Hệ thống sẽ chuyển trạng thái cảnh báo sang đã xử lý và ghi nhận nhật ký kiểm toán điều hành.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
