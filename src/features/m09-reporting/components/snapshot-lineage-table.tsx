"use client";

import React from "react";
import { GitBranch, Database } from "lucide-react";
import type { SnapshotLineageDTO } from "../types";

export interface SnapshotLineageTableProps {
  readonly lineage: SnapshotLineageDTO[];
}

export function SnapshotLineageTable({ lineage }: SnapshotLineageTableProps) {
  if (lineage.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <GitBranch className="w-4 h-4 text-indigo-600" />
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Dòng dõi dữ liệu trích xuất (Lineage Audit Trail)
        </h3>
      </div>
      <p className="text-xs text-slate-500">
        Các bản ghi thực thể đóng góp vào tính toán số liệu tại thời điểm chốt snapshot bất biến:
      </p>

      <div className="overflow-x-auto rounded border border-slate-100">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
            <tr>
              <th className="px-3 py-2">Bảng nguồn (Source Table)</th>
              <th className="px-3 py-2">Mã bản ghi (Entity ID)</th>
              <th className="px-3 py-2 text-center">Phiên bản tại thời điểm chốt</th>
              <th className="px-3 py-2 text-right">Thời điểm trích xuất</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {lineage.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/50">
                <td className="px-3 py-2 font-semibold text-slate-800 flex items-center gap-1.5 font-sans">
                  <Database className="w-3.5 h-3.5 text-slate-400" />
                  {item.sourceTable}
                </td>
                <td className="px-3 py-2 text-slate-600 text-[11px]">{item.sourceId}</td>
                <td className="px-3 py-2 text-center font-bold text-indigo-700">v{item.sourceVersion}</td>
                <td className="px-3 py-2 text-right text-slate-500 font-sans text-[11px]">
                  {new Date(item.createdAt).toLocaleTimeString("vi-VN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
