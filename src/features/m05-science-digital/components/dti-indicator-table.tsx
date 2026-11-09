"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { updateDigitalIndicatorStatusAction } from "../server/actions";
import type { DigitalIndicatorDTO } from "../types";
import { Cpu, CheckCircle2, ShieldCheck, Clock, AlertTriangle, HelpCircle } from "lucide-react";

interface DTIIndicatorTableProps {
  readonly items: DigitalIndicatorDTO[];
  readonly canManage: boolean;
}

export function DTIIndicatorTable({ items, canManage }: DTIIndicatorTableProps) {
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const handleConfirm = async (id: string, code: string, value: string) => {
    setPendingId(id);
    try {
      const isZero = value.includes("0") && !value.includes("00") && !value.includes("%");
      const nextStatus = isZero ? "CONFIRMED_ZERO" : "CONFIRMED";
      await updateDigitalIndicatorStatusAction({
        indicatorId: id,
        status: nextStatus,
        value,
      });
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-emerald-700" />
          <h3 className="font-semibold text-slate-800">
            Bộ 6 chỉ tiêu Chuyển đổi số cấp xã (DTI xã / DEM-R03)
          </h3>
          <Badge variant="neutral">Kỳ T10/2026</Badge>
        </div>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Mã số</TableHead>
              <TableHead>Tên chỉ tiêu Chuyển đổi số</TableHead>
              <TableHead className="text-right">Giá trị đạt</TableHead>
              <TableHead>Ý nghĩa nghiệp vụ</TableHead>
              <TableHead className="text-center">Trạng thái dữ liệu</TableHead>
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
                  {item.name}
                </TableCell>
                <TableCell className="text-right font-bold text-sm text-[#1F633E]">
                  {item.value}
                </TableCell>
                <TableCell className="text-xs text-slate-600 max-w-sm">
                  {item.meaning}
                </TableCell>
                <TableCell className="text-center">
                  {item.status === "CONFIRMED_ZERO" ? (
                    <Badge variant="success">
                      <ShieldCheck className="w-3 h-3 mr-1 inline" /> Số 0 hợp lệ (Đạt)
                    </Badge>
                  ) : item.status === "CONFIRMED" ? (
                    <Badge variant="success">
                      <CheckCircle2 className="w-3 h-3 mr-1 inline" /> Đã xác nhận
                    </Badge>
                  ) : item.status === "UNCONFIRMED" ? (
                    <Badge variant="warning">
                      <Clock className="w-3 h-3 mr-1 inline" /> Chưa đối soát
                    </Badge>
                  ) : item.status === "NOT_APPLICABLE" ? (
                    <Badge variant="neutral">Không áp dụng</Badge>
                  ) : (
                    <Badge variant="danger">
                      <AlertTriangle className="w-3 h-3 mr-1 inline" /> Thiếu số liệu
                    </Badge>
                  )}
                </TableCell>
                {canManage && (
                  <TableCell className="text-right">
                    {item.status === "UNCONFIRMED" && (
                      <Button
                        variant="secondary"
                        size="xs"
                        disabled={pendingId === item.id}
                        onClick={() => handleConfirm(item.id, item.code, item.value)}
                      >
                        {pendingId === item.id ? "Đang ghi..." : "Duyệt số"}
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded border border-emerald-200 text-xs text-emerald-800">
        <HelpCircle className="w-4 h-4 shrink-0 text-emerald-700" />
        <span>
          Chỉ tiêu không phát sinh sự cố phải được xác nhận rõ là bằng 0; không được nhầm với trường hợp chưa báo cáo hoặc không áp dụng.
        </span>
      </div>
    </div>
  );
}
