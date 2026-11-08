"use client";

import React from "react";
import type { ReligiousEstablishmentDTO } from "../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Compass, Users, MapPin, Landmark } from "lucide-react";

interface EstablishmentTableProps {
  items: ReligiousEstablishmentDTO[];
  userPermissions?: readonly string[];
}

export function EstablishmentTable({
  items,
  userPermissions = [],
}: EstablishmentTableProps) {
  if (!items || items.length === 0) {
    return (
      <div className="p-8 text-center border rounded-lg bg-gray-50/50">
        <Landmark className="w-10 h-10 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600 font-medium">Chưa có cơ sở tôn giáo nào được đăng ký</p>
        <p className="text-sm text-gray-400 mt-1">Dữ liệu cơ sở tôn giáo sẽ hiển thị tại đây</p>
      </div>
    );
  }

  const getReligionBadge = (type: string) => {
    switch (type) {
      case "PHAT_GIAO":
        return <Badge variant="warning">Phật giáo</Badge>;
      case "TIN_LANH":
        return <Badge variant="info">Tin Lành</Badge>;
      case "CONG_GIAO":
        return <Badge variant="neutral">Công giáo</Badge>;
      default:
        return <Badge variant="neutral">Tín ngưỡng</Badge>;
    }
  };

  const canManage = userPermissions.includes("m07:faith:manage");

  return (
    <div className="overflow-x-auto border rounded-lg bg-white shadow-sm">
      <table className="w-full text-sm text-left border-collapse">
        <thead className="bg-gray-50 text-gray-600 font-medium border-b">
          <tr>
            <th className="py-3 px-4">Mã số</th>
            <th className="py-3 px-4">Tên cơ sở / Điểm nhóm</th>
            <th className="py-3 px-4">Tôn giáo</th>
            <th className="py-3 px-4">Người đại diện</th>
            <th className="py-3 px-4">Địa bàn</th>
            <th className="py-3 px-4">Tín đồ</th>
            <th className="py-3 px-4 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50/75 transition-colors">
              <td className="py-3 px-4 font-mono text-xs text-gray-500">{item.code}</td>
              <td className="py-3 px-4 font-medium text-gray-900 truncate break-words max-w-xs">
                {item.name}
              </td>
              <td className="py-3 px-4">{getReligionBadge(item.religionType)}</td>
              <td className="py-3 px-4 text-gray-700">{item.representativeName}</td>
              <td className="py-3 px-4 text-gray-500">Xóm {item.hamletId}</td>
              <td className="py-3 px-4 font-semibold text-gray-800">{item.followerCount}</td>
              <td className="py-3 px-4 text-right">
                <Button size="sm" variant="outline" disabled={!canManage}>
                  Chi tiết
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
