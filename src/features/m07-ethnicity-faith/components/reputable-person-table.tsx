"use client";

import React from "react";
import type { ReputablePersonDTO } from "../types";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

interface ReputablePersonTableProps {
  items: ReputablePersonDTO[];
  hamlets: readonly {id:string;name:string}[];
}

export function ReputablePersonTable({
  items,
  hamlets,
}: ReputablePersonTableProps) {
  if (!items || items.length === 0) {
    return (
      <div className="p-8 text-center border rounded-lg bg-gray-50/50">
        <Users className="w-10 h-10 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600 font-medium">Chưa có danh sách người có uy tín</p>
        <p className="text-sm text-gray-400 mt-1">Dữ liệu người có uy tín theo Quyết định sẽ hiển thị tại đây</p>
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
  };

  const hamletNames = new Map(hamlets.map(unit=>[unit.id,unit.name]));

  return (
    <div className="overflow-x-auto border rounded-lg bg-white shadow-sm">
      <table className="w-full text-sm text-left border-collapse">
        <thead className="bg-gray-50 text-gray-600 font-medium border-b">
          <tr>
            <th className="py-3 px-4">Họ và tên</th>
            <th className="py-3 px-4">Dân tộc</th>
            <th className="py-3 px-4">Địa bàn xóm</th>
            <th className="py-3 px-4">Năm công nhận</th>
            <th className="py-3 px-4">Trạng thái chính sách</th>
            <th className="py-3 px-4">Mức phụ cấp</th>

          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((person) => (
            <tr key={person.id} className="hover:bg-gray-50/75 transition-colors">
              <td className="py-3 px-4 font-medium text-gray-900">{person.fullName}</td>
              <td className="py-3 px-4">
                <Badge variant="neutral">{person.ethnicGroup}</Badge>
              </td>
              <td className="py-3 px-4 text-gray-600">{hamletNames.get(person.hamletId) ?? "Địa bàn chưa xác định"}</td>
              <td className="py-3 px-4 font-mono text-gray-500">{person.yearRecognized}</td>
              <td className="py-3 px-4">
                {person.policyStatus === "DANG_HUONG" ? (
                  <Badge variant="success">Đang hưởng</Badge>
                ) : (
                  <Badge variant="warning">{person.policyStatus === "DANG_XAC_MINH" ? "Đang xác minh" : person.policyStatus === "TAM_DUNG" ? "Tạm dừng" : "Thay thế"}</Badge>
                )}
              </td>
              <td className="py-3 px-4 font-semibold text-gray-800">
                {formatCurrency(person.monthlyAllowance)}
              </td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
