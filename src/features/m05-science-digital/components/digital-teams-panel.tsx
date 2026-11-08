"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import type { CommunityDigitalTeamDTO } from "../types";
import { Users, Smartphone, CheckCircle2 } from "lucide-react";

interface DigitalTeamsPanelProps {
  readonly items: CommunityDigitalTeamDTO[];
}

export function DigitalTeamsPanel({ items }: DigitalTeamsPanelProps) {
  const totalCitizensSupported = items.reduce((acc, t) => acc + t.citizensSupported, 0);
  const totalVNeID = items.reduce((acc, t) => acc + t.vneidLevel2Count, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-700" />
          <h3 className="font-semibold text-slate-800">
            Mạng lưới Tổ công nghệ số cộng đồng (Tổ CNSCĐ)
          </h3>
          <Badge variant="neutral">{items.length} tổ xóm</Badge>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-slate-700">
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>Đã hướng dẫn: <strong className="text-slate-900">{totalCitizensSupported}</strong> người</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Kích hoạt VNeID Mức 2: <strong className="text-slate-900">{totalVNeID}</strong> tài khoản</span>
          </div>
        </div>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Địa bàn xóm</TableHead>
              <TableHead>Tổ trưởng Tổ CNSCĐ</TableHead>
              <TableHead>Số điện thoại</TableHead>
              <TableHead className="text-center">Số thành viên</TableHead>
              <TableHead className="text-center">Số lượt người dân được hướng dẫn</TableHead>
              <TableHead className="text-center">Định danh VNeID Mức 2</TableHead>
              <TableHead className="text-right">Tình trạng hoạt động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-semibold text-slate-900">
                  <Badge variant="neutral">Xóm {item.hamletId}</Badge>
                </TableCell>
                <TableCell className="font-medium text-slate-900">
                  {item.leaderName}
                </TableCell>
                <TableCell className="font-mono text-xs text-slate-600">
                  {item.leaderPhone || "—"}
                </TableCell>
                <TableCell className="text-center text-xs">
                  {item.memberCount} thành viên
                </TableCell>
                <TableCell className="text-center font-semibold text-xs text-slate-900">
                  {item.citizensSupported} lượt
                </TableCell>
                <TableCell className="text-center text-xs text-emerald-700 font-semibold">
                  {item.vneidLevel2Count} tài khoản
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="success">Hoạt động tốt</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
