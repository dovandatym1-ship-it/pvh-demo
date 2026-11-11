"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import type { FoodSafetyInspectionDTO, MedicalFacilityDTO, EpidemicLogDTO } from "../types";
import { Stethoscope, Utensils, AlertTriangle, ShieldCheck, Activity } from "lucide-react";

interface HealthInspectionPanelsProps {
  readonly foodSafeties: FoodSafetyInspectionDTO[];
  readonly medicalFacilities: MedicalFacilityDTO[];
  readonly epidemicLogs: EpidemicLogDTO[];
  readonly hamlets: readonly {id:string;name:string}[];
}

export function HealthInspectionPanels({
  foodSafeties,
  medicalFacilities,
  epidemicLogs,
  hamlets,
}: HealthInspectionPanelsProps) {
  const hamletNames = React.useMemo(()=>new Map(hamlets.map(unit=>[unit.id,unit.name])),[hamlets]);
  const [activeTab, setActiveTab] = React.useState<"food" | "medical" | "epidemic">("food");

  return (
    <div className="space-y-4">
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab("food")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "food"
              ? "border-[#1F633E] text-[#1F633E]"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Utensils className="w-4 h-4" />
          An toàn thực phẩm ({foodSafeties.length})
        </button>
        <button
          onClick={() => setActiveTab("medical")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "medical"
              ? "border-[#1F633E] text-[#1F633E]"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          Hành nghề y dược tư nhân ({medicalFacilities.length})
        </button>
        <button
          onClick={() => setActiveTab("epidemic")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "epidemic"
              ? "border-[#1F633E] text-[#1F633E]"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Activity className="w-4 h-4" />
          Giám sát dịch bệnh ({epidemicLogs.length})
        </button>
      </div>

      {activeTab === "food" && (
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên cơ sở / Bếp ăn</TableHead>
                <TableHead>Loại hình</TableHead>
                <TableHead>Ngày kiểm tra</TableHead>
                <TableHead className="text-center">Điểm số</TableHead>
                <TableHead className="text-center">Lưu mẫu 24h</TableHead>
                <TableHead className="text-right">Kết luận</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {foodSafeties.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-slate-900">
                    {item.facilityName}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {item.inspectionType === "SCHOOL_CANTEEN"
                      ? "Bếp ăn bán trú trường học"
                      : item.inspectionType === "STREET_FOOD"
                      ? "Thức ăn đường phố"
                      : "Cơ sở chế biến thủ công"}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {item.inspectionDate}
                  </TableCell>
                  <TableCell className="text-center font-semibold text-xs">
                    {item.totalScore === null ? "Chưa chấm điểm" : `${item.totalScore}/100`}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.sampleRetention24hPassed === null ? (
                      <span className="text-slate-500 font-medium text-xs">Chưa kiểm tra</span>
                    ) : item.sampleRetention24hPassed ? (
                      <span className="text-emerald-700 font-medium text-xs">Đạt</span>
                    ) : (
                      <span className="text-rose-600 font-medium text-xs">Không đạt</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.conclusion === "PENDING" ? (
                      <Badge variant="neutral">Chưa có kết luận</Badge>
                    ) : item.conclusion === "PASSED" ? (
                      <Badge variant="success">Đạt yêu cầu</Badge>
                    ) : item.conclusion === "WARNING_REMEDIAL" ? (
                      <Badge variant="warning">Nhắc nhở / Khắc phục</Badge>
                    ) : (
                      <Badge variant="danger">Đình chỉ tạm thời</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {activeTab === "medical" && (
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cơ sở y dược</TableHead>
                <TableHead>Loại hình</TableHead>
                <TableHead>Người phụ trách chuyên môn</TableHead>
                <TableHead>Số giấy phép</TableHead>
                <TableHead className="text-center">Chuẩn GPP / Sổ kiểm soát</TableHead>
                <TableHead className="text-right">Tình trạng kiểm tra</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medicalFacilities.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-slate-900">
                    {item.facilityName}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {item.facilitySubType === "DRUG_STORE"
                      ? "Nhà thuốc / Quầy thuốc"
                      : item.facilitySubType === "TRADITIONAL_CLINIC"
                      ? "Phòng chẩn trị YHCT"
                      : "Phòng khám chuyên khoa"}
                  </TableCell>
                  <TableCell className="text-xs text-slate-700">
                    {item.practitionerName}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-600">
                    {item.licenseNumber || "Chưa có thông tin"} {item.licenseIssueDate ? `(${item.licenseIssueDate})` : ""}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.gppCertified ? (
                      <Badge variant="success">Đạt GPP</Badge>
                    ) : (
                      <Badge variant="warning">Chưa đồng bộ</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.inspectionStatus === "UNVERIFIED" ? (
                      <Badge variant="neutral">Chưa xác minh</Badge>
                    ) : item.inspectionStatus === "NORMAL" ? (
                      <Badge variant="success">Bình thường</Badge>
                    ) : (
                      <Badge variant="danger">Cảnh báo vi phạm</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {activeTab === "epidemic" && (
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Địa bàn xóm</TableHead>
                <TableHead>Nhóm bệnh</TableHead>
                <TableHead>Tên dịch bệnh</TableHead>
                <TableHead className="text-center">Số ca mắc</TableHead>
                <TableHead className="text-center">Nhập viện</TableHead>
                <TableHead className="text-center">Tử vong</TableHead>
                <TableHead className="text-right">Cảnh báo ổ dịch</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {epidemicLogs.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-slate-900">
                    {hamletNames.get(item.hamletId) ?? "Địa bàn chưa xác định"}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {item.diseaseGroup}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-800">
                    {item.diseaseName}
                  </TableCell>
                  <TableCell className="text-center font-medium text-xs">
                    {item.casesCount}
                  </TableCell>
                  <TableCell className="text-center text-xs">
                    {item.hospitalizedCount}
                  </TableCell>
                  <TableCell className="text-center text-xs text-rose-600 font-semibold">
                    {item.deathsCount}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.outbreakAlertFlag ? (
                      <Badge variant="danger">
                        <AlertTriangle className="w-3 h-3 mr-1 inline" /> Cảnh báo
                      </Badge>
                    ) : (
                      <Badge variant="success">
                        <ShieldCheck className="w-3 h-3 mr-1 inline" /> Chưa ghi nhận cảnh báo
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
