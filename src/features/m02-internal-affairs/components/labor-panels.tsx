"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import type { LaborContractDTO, LaborDisputeDTO } from "../types";
import { Briefcase, Scale, CheckCircle2, Clock } from "lucide-react";

interface LaborPanelsProps {
  readonly contracts: LaborContractDTO[];
  readonly disputes: LaborDisputeDTO[];
}

export function LaborPanels({ contracts, disputes }: LaborPanelsProps) {
  const [tab, setTab] = React.useState<"contracts" | "disputes">("contracts");

  return (
    <div className="space-y-4">
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setTab("contracts")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            tab === "contracts"
              ? "border-[#1F633E] text-[#1F633E]"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Tiền lương và bảo hiểm xã hội tại cơ sở ({contracts.length})
        </button>
        <button
          onClick={() => setTab("disputes")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            tab === "disputes"
              ? "border-[#1F633E] text-[#1F633E]"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Scale className="w-4 h-4" />
          Hòa giải tranh chấp lao động ({disputes.length})
        </button>
      </div>

      {tab === "contracts" && (
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doanh nghiệp / HTX / Cơ sở</TableHead>
                <TableHead>Mã số thuế</TableHead>
                <TableHead className="text-center">Tổng lao động</TableHead>
                <TableHead className="text-right">Mức lương thấp nhất</TableHead>
                <TableHead className="text-center">Tham gia BHXH</TableHead>
                <TableHead className="text-right">Chuẩn lương tối thiểu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-semibold text-slate-900">
                    {item.businessName}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-600">
                    {item.taxCode}
                  </TableCell>
                  <TableCell className="text-center text-xs">
                    <span className="font-semibold text-slate-900">{item.totalWorkers}</span> người
                  </TableCell>
                  <TableCell className="text-right font-medium text-xs text-slate-900">
                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(item.minWagePaid)}
                  </TableCell>
                  <TableCell className="text-center text-xs">
                    <span className="font-semibold text-emerald-700">{item.bhxhRegisteredCount}</span> / {item.totalWorkers}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.isUnderMinWage ? (
                      <Badge variant="danger">Dưới chuẩn vùng</Badge>
                    ) : (
                      <Badge variant="success">Đạt chuẩn vùng</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {tab === "disputes" && (
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">Mã vụ việc</TableHead>
                <TableHead>Bên yêu cầu</TableHead>
                <TableHead>Bên bị yêu cầu</TableHead>
                <TableHead>Nội dung tranh chấp</TableHead>
                <TableHead>Ngày tiếp nhận</TableHead>
                <TableHead className="text-center">Trạng thái</TableHead>
                <TableHead className="text-right">Kết quả hòa giải</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disputes.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs font-semibold text-slate-600">
                    {item.code}
                  </TableCell>
                  <TableCell className="font-medium text-slate-900 text-xs">
                    {item.requesterName} ({item.requesterRole === "EMPLOYEE" ? "Người LĐ" : "Người SDLĐ"})
                  </TableCell>
                  <TableCell className="text-xs text-slate-700">
                    {item.respondentName}
                  </TableCell>
                  <TableCell className="text-xs text-slate-700 max-w-xs truncate">
                    {item.disputeContent}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 font-mono">
                    {item.receivedDate}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.status === "RESOLVED_SUCCESS" ? (
                      <Badge variant="success">
                        <CheckCircle2 className="w-3 h-3 mr-1 inline" /> Thành công
                      </Badge>
                    ) : (
                      <Badge variant="warning">
                        <Clock className="w-3 h-3 mr-1 inline" /> Đang thụ lý
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-xs text-slate-600 italic">
                    {item.outcomeSummary || "Đang trong quá trình hòa giải"}
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
