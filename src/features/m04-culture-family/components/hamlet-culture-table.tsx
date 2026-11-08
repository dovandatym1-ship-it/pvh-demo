"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Landmark } from "lucide-react";
import type { HamletCultureSummaryDTO } from "../types";

export interface HamletCultureTableProps {
  readonly items: HamletCultureSummaryDTO[];
}

export function HamletCultureTable({ items }: HamletCultureTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
          <tr>
            <th className="px-4 py-3">Thôn / Xóm</th>
            <th className="px-4 py-3">Trưởng xóm</th>
            <th className="px-4 py-3 text-center">Tổng số hộ</th>
            <th className="px-4 py-3 text-center">Hộ đạt GĐVH</th>
            <th className="px-4 py-3 text-center">Tỷ lệ (%)</th>
            <th className="px-4 py-3">Thiết chế Nhà văn hóa</th>
            <th className="px-4 py-3 text-right">Danh hiệu Thôn văn hóa</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item) => (
            <tr key={item.hamletId} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-4 py-3 font-medium text-slate-900 flex items-center gap-1.5">
                <Landmark className="w-4 h-4 text-indigo-500" />
                <span>{item.hamletName}</span>
                <span className="text-[10px] text-slate-400 font-mono">({item.hamletCode})</span>
              </td>
              <td className="px-4 py-3 text-slate-700">{item.leaderName}</td>
              <td className="px-4 py-3 text-center font-mono text-slate-700">{item.totalHouseholds}</td>
              <td className="px-4 py-3 text-center font-mono font-semibold text-emerald-700">
                {item.culturalHouseholds}
              </td>
              <td className="px-4 py-3 text-center font-mono font-bold text-slate-900">
                {item.rate}%
              </td>
              <td className="px-4 py-3">
                <Badge variant={item.culturalHouseStatus === "DAT_CHUAN" ? "success" : "warning"}>
                  {item.culturalHouseStatus === "DAT_CHUAN" ? "ĐẠT CHUẨN" : "CHƯA ĐẠT"}
                </Badge>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> CÔNG NHẬN
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
