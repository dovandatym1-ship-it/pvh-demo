"use client";

import * as React from "react";
import { PERSONAS, Persona } from "@/lib/auth/session";
import { UserCheck } from "lucide-react";

export function PersonaSwitcher({
  currentPersona,
  onSelectPersona,
}: {
  currentPersona: Persona;
  onSelectPersona: (p: Persona) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 shadow-sm">
      <UserCheck className="h-4 w-4 text-[#1F633E]" />
      <div className="flex flex-col">
        <span className="text-[10px] uppercase font-bold text-slate-400">Cán bộ phụ trách</span>
        <select
          value={currentPersona.code}
          onChange={(e) => onSelectPersona(PERSONAS[e.target.value])}
          className="bg-transparent text-xs font-semibold text-slate-800 border-none focus:outline-none focus:ring-0 cursor-pointer"
        >
          <option value="P1">Nguyễn Văn An — Chủ tịch UBND xã</option>
          <option value="P2">Trần Thị Mai — Công chức VH-XH (Kiêm nhiệm)</option>
          <option value="P3">Lê Văn Hùng — Công chức VH-XH (Chuyên trách)</option>
          <option value="P4">Hoàng Văn Tuấn — Trưởng thôn / Xóm trưởng</option>
          <option value="P5">Phạm Thị Lan — Cán bộ Bộ phận Một cửa</option>
          <option value="P6">Đỗ Minh Đức — Cán bộ Kiểm tra liên ngành</option>
        </select>
      </div>
    </div>
  );
}
