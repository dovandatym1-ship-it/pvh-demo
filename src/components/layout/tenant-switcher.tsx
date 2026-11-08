"use client";

import * as React from "react";
import { TENANTS, TenantConfig } from "@/lib/tenancy/tenant-config";
import { Building2 } from "lucide-react";

export function TenantSwitcher({
  currentTenant,
  onSelectTenant,
}: {
  currentTenant: TenantConfig;
  onSelectTenant: (tenant: TenantConfig) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1F633E] text-white shadow-sm">
        <Building2 className="h-4 w-4" />
      </div>
      <div>
        <label htmlFor="tenant-select" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Đơn vị cấp xã
        </label>
        <select
          id="tenant-select"
          value={currentTenant.code === "XA_A" ? "xa_a" : "xa_b"}
          onChange={(e) => onSelectTenant(TENANTS[e.target.value])}
          className="h-6 rounded border-none bg-transparent pr-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-0 cursor-pointer"
        >
          <option value="xa_a">Xã Thịnh Đức (Đầy đủ CĐS/KT)</option>
          <option value="xa_b">Xã Tân Cương (Thu gọn/Phân nhiệm)</option>
        </select>
      </div>
    </div>
  );
}
