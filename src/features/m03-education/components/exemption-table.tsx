"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { approveTuitionExemptionAction } from "../server/actions";
import type { TuitionExemptionDTO } from "../types";
import { BookOpen, CheckCircle2, Clock, XCircle } from "lucide-react";

interface ExemptionTableProps {
  readonly items: TuitionExemptionDTO[];
  readonly canManage: boolean;
}

export function ExemptionTable({ items, canManage }: ExemptionTableProps) {
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const handleDecision = async (id: string, status: "APPROVED" | "REJECTED") => {
    setPendingId(id);
    try {
      await approveTuitionExemptionAction({ exemptionId: id, status });
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-700" />
          <h3 className="font-semibold text-slate-800">
            Chính sách miễn, giảm học phí và hỗ trợ chi phí học tập
          </h3>
          <Badge variant="neutral">{items.length} học sinh</Badge>
        </div>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Học sinh</TableHead>
              <TableHead>Trường học và lớp</TableHead>
              <TableHead>Đối tượng miễn giảm</TableHead>
              <TableHead className="text-center">Tỷ lệ miễn giảm</TableHead>
              <TableHead className="text-right">Mức hỗ trợ/tháng</TableHead>
              <TableHead className="text-center">Trạng thái</TableHead>
              {canManage && <TableHead className="text-right">Tác vụ</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-semibold text-slate-900">
                  {item.studentName}
                </TableCell>
                <TableCell className="text-xs text-slate-700">
                  <div className="font-medium text-slate-900">{item.schoolName}</div>
                  <div className="text-slate-500">{item.grade}</div>
                </TableCell>
                <TableCell className="text-xs text-slate-700">
                  {item.category === "POOR_HOUSEHOLD"
                    ? "Hộ nghèo"
                    : item.category === "NEAR_POOR"
                    ? "Hộ cận nghèo"
                    : item.category === "ORPHAN"
                    ? "Trẻ mồ côi"
                    : "Khuyết tật"}
                </TableCell>
                <TableCell className="text-center font-semibold text-xs text-slate-900">
                  {item.exemptionPercent}%
                </TableCell>
                <TableCell className="text-right font-medium text-xs text-slate-900">
                  {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(item.supportAmount)}
                </TableCell>
                <TableCell className="text-center">
                  {item.status === "APPROVED" ? (
                    <Badge variant="success">
                      <CheckCircle2 className="w-3 h-3 mr-1 inline" /> Đã duyệt
                    </Badge>
                  ) : item.status === "REJECTED" ? (
                    <Badge variant="danger">
                      <XCircle className="w-3 h-3 mr-1 inline" /> Từ chối
                    </Badge>
                  ) : (
                    <Badge variant="warning">
                      <Clock className="w-3 h-3 mr-1 inline" /> Chờ xét duyệt
                    </Badge>
                  )}
                </TableCell>
                {canManage && (
                  <TableCell className="text-right">
                    {item.status === "PENDING" && (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="xs"
                          disabled={pendingId === item.id}
                          onClick={() => handleDecision(item.id, "APPROVED")}
                        >
                          Duyệt
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          disabled={pendingId === item.id}
                          onClick={() => handleDecision(item.id, "REJECTED")}
                        >
                          Từ chối
                        </Button>
                      </div>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
