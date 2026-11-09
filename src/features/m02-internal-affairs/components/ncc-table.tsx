"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import type { NCCBeneficiaryDisplayDTO } from "../types";
import { Award, ShieldAlert } from "lucide-react";

interface NCCTableProps {
  readonly items: NCCBeneficiaryDisplayDTO[];
  readonly canUnmaskPII: boolean;
}

export function NCCTable({ items, canUnmaskPII }: NCCTableProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL");

  const filtered = items.filter((item) => {
    if (selectedCategory !== "ALL" && item.category !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-emerald-700" />
          <h3 className="font-semibold text-slate-800">
            Hồ sơ người có công và thi đua, khen thưởng
          </h3>
          <Badge variant="neutral">{filtered.length} hồ sơ</Badge>
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-700"
        >
          <option value="ALL">Tất cả diện chính sách</option>
          <option value="THUONG_BINH">Thương binh</option>
          <option value="BA_ME_VNAH">Bà mẹ Việt Nam anh hùng</option>
          <option value="BENH_BINH">Bệnh binh</option>
          <option value="CHAT_DOC_HOA_HOC">Chất độc hóa học</option>
          <option value="LIET_SI">Liệt sĩ</option>
        </select>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Mã hồ sơ</TableHead>
              <TableHead>Họ và tên</TableHead>
              <TableHead>CCCD (PII)</TableHead>
              <TableHead>Địa bàn</TableHead>
              <TableHead>Diện chính sách</TableHead>
              <TableHead>Danh hiệu, huân chương</TableHead>
              <TableHead className="text-right">Trợ cấp hằng tháng</TableHead>
              <TableHead className="text-center">Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-xs font-semibold text-slate-600">
                  {item.code}
                </TableCell>
                <TableCell className="font-semibold text-slate-900">
                  {item.fullName}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  <span className={canUnmaskPII ? "text-slate-700" : "text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded"}>
                    {item.cccdDisplay}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="neutral">Xóm {item.hamletId}</Badge>
                </TableCell>
                <TableCell className="text-xs text-slate-700 font-medium">
                  {item.category === "BA_ME_VNAH"
                    ? "Bà mẹ Việt Nam anh hùng"
                    : item.category === "THUONG_BINH"
                    ? "Thương binh"
                    : item.category === "BENH_BINH"
                    ? "Bệnh binh"
                    : "Chất độc hóa học"}
                </TableCell>
                <TableCell className="text-xs text-slate-600">
                  {item.medalTitle}
                </TableCell>
                <TableCell className="text-right font-medium text-xs text-slate-900">
                  {item.allowanceDisplay}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="success">Đang hưởng</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {!canUnmaskPII && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 rounded border border-amber-200 text-xs text-amber-800">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-700" />
          <span>
            Chính sách bảo mật PII: Thông tin số CCCD và định mức chi trả trợ cấp người có công được bảo mật theo quy định D03.
          </span>
        </div>
      )}
    </div>
  );
}
