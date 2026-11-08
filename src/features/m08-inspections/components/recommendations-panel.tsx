"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { resolveInspectionRecommendationAction } from "../server/actions";
import type { InspectionRecommendationDTO } from "../types";
import { AlertCircle, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

interface RecommendationsPanelProps {
  readonly items: InspectionRecommendationDTO[];
  readonly canManage: boolean;
}

export function RecommendationsPanel({ items, canManage }: RecommendationsPanelProps) {
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const handleResolve = async (id: string, status: "RESOLVED_CLOSED" | "FEEDBACK_UNVERIFIED") => {
    setPendingId(id);
    try {
      await resolveInspectionRecommendationAction({
        recommendationId: id,
        status,
      });
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-emerald-700" />
          <h3 className="font-semibold text-slate-800">
            Theo dõi khắc phục kiến nghị liên ngành (MET-05)
          </h3>
          <Badge variant="neutral">{items.length} kiến nghị</Badge>
        </div>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Mã số</TableHead>
              <TableHead>Nội dung kiến nghị</TableHead>
              <TableHead>Cơ sở</TableHead>
              <TableHead>Địa bàn</TableHead>
              <TableHead>Người phụ trách đôn đốc</TableHead>
              <TableHead>Hạn xử lý</TableHead>
              <TableHead className="text-center">Trạng thái</TableHead>
              {canManage && <TableHead className="text-right">Tác vụ</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-xs font-semibold text-slate-600">
                  {item.code}
                </TableCell>
                <TableCell className="font-semibold text-slate-900">
                  {item.title}
                </TableCell>
                <TableCell className="text-xs text-slate-700 font-medium">
                  {item.facilityName}
                </TableCell>
                <TableCell>
                  <Badge variant="neutral">Xóm {item.hamletId}</Badge>
                </TableCell>
                <TableCell className="text-xs text-slate-600">
                  {item.assignee}
                </TableCell>
                <TableCell className="font-mono text-xs text-slate-600">
                  {item.dueDate}
                </TableCell>
                <TableCell className="text-center">
                  {item.status === "RESOLVED_CLOSED" ? (
                    <Badge variant="success">
                      <CheckCircle2 className="w-3 h-3 mr-1 inline" /> Đã đóng
                    </Badge>
                  ) : item.status === "FEEDBACK_UNVERIFIED" ? (
                    <Badge variant="warning">
                      <Clock className="w-3 h-3 mr-1 inline" /> Chờ thẩm tra
                    </Badge>
                  ) : (
                    <Badge variant="danger">
                      <AlertTriangle className="w-3 h-3 mr-1 inline" /> Đang đôn đốc
                    </Badge>
                  )}
                </TableCell>
                {canManage && (
                  <TableCell className="text-right">
                    {item.status !== "RESOLVED_CLOSED" && (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="xs"
                          disabled={pendingId === item.id}
                          onClick={() => handleResolve(item.id, "RESOLVED_CLOSED")}
                        >
                          Xác nhận hoàn thành
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
