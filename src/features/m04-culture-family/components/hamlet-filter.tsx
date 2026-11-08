"use client";

import React from "react";
import { Filter } from "lucide-react";

export interface HamletFilterProps {
  readonly selectedHamlet: string;
  readonly onSelectHamlet: (hamlet: string) => void;
}

export function HamletFilter({ selectedHamlet, onSelectHamlet }: HamletFilterProps) {
  const hamlets = [
    { id: "ALL", label: "Toàn bộ địa bàn xã" },
    { id: "XOM_A1", label: "Xóm A1" },
    { id: "XOM_A2", label: "Xóm A2" },
    { id: "XOM_A3", label: "Xóm A3" },
  ];

  return (
    <div className="flex items-center gap-2">
      <Filter className="w-4 h-4 text-slate-400" />
      <span className="text-xs font-medium text-slate-600">Lọc theo xóm:</span>
      <div className="flex flex-wrap gap-1.5">
        {hamlets.map((h) => {
          const isActive = selectedHamlet === h.id;
          return (
            <button
              key={h.id}
              onClick={() => onSelectHamlet(h.id)}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors border ${
                isActive
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {h.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
