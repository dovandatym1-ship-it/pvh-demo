"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import type { InspectionRecordDTO } from "../types";
import { ClipboardList, ShieldAlert, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

interface InspectionTableProps {
  readonly items: InspectionRecordDTO[];
}

export function InspectionTable({ items }: InspectionTableProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL");

  const filtered = items.filter((item) => {
    if (selectedCategory !== "ALL" && item.category !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-emerald-700" />
          <h3 className="font-semibold text-slate-800">
            Biên bản kiểm tra liên ngành cơ sở (DEM-KT)
          </h3>
          <Badge variant="neutral">{filtered.length} biên bản</Badge>
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-700"
        >
          <option value="ALL">Tất cả lĩnh vực</option>
          <option value="ATTP">An toàn thực phẩm</option>
          <option value="PCCC">Phòng cháy chữa cháy</option>
          <option value="Y_TE">Y tế & Dược</option>
          <option value="VAN_HOA">Văn hóa & Lễ hội</option>
        </select>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Mã số</TableHead>
              <TableHead>Cơ sở / Đối tượng kiểm tra</TableHead>
              <TableHead>Lĩnh vực</TableHead>
              <TableHead>Đoàn kiểm tra</TableHead>
              <TableHead>Ngày kiểm tra</TableHead>
              <TableHead className="text-center">Số kiến nghị</TableHead>
              <TableHead className="text-right">Tình trạng khắc phục</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-xs font-semibold text-slate-600">
                  {item.code}
                </TableCell>
                <TableCell className="font-semibold text-slate-900">
                  {item.targetName}
                </TableCell>
                <TableCell>
                  <Badge variant="neutral">{item.category}</Badge>
                </TableCell>
                <TableCell className="text-xs text-slate-700">
                  {item.inspectorName}
                </TableCell>
                <TableCell className="font-mono text-xs text-slate-600">
                  {item.inspectionDate}
                </TableCell>
                <TableCell className="text-center font-semibold text-xs text-slate-900">
                  {item.findingsCount}
                </TableCell>
                <TableCell className="text-right">
                  {item.remediationStatus === "NO_VIOLATION" ? (
                    <Badge variant="success">Không vi phạm</Badge>
                  ) : item.remediationStatus === "RESOLVED" ? (
                    <Badge variant="success">
                      <CheckCircle2 className="w-3 h-3 mr-1 inline" /> Đã khắc phục
                    </Badge>
                  ) : item.remediationStatus === "IN_PROGRESS" ? (
                    <Badge variant="warning">
                      <Clock className="w-3 h-3 mr-1 inline" /> Đang khắc phục
                    </Badge>
                  ) : (
                    <Badge variant="danger">
                      <AlertTriangle className="w-3 h-3 mr-1 inline" /> Quá hạn
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
