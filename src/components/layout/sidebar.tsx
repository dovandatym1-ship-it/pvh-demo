"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarCheck,
  ShieldCheck,
  Database,
  Building,
  GraduationCap,
  Sparkles,
  Cpu,
  HeartHandshake,
  Compass,
  ClipboardList,
  BarChart3,
  RefreshCw,
  BookOpen,
  LucideIcon,
  X,
} from "lucide-react";
import { Persona } from "@/lib/auth/session";
import { TenantConfig } from "@/lib/tenancy/tenant-config";

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  moduleKey?: string;
  badge?: string;
}

const NAV_GROUPS: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "Điều hành & Tác nghiệp",
    items: [
      { title: "Bàn làm việc", href: "/ban-lam-viec", icon: LayoutDashboard },
      { title: "Kế hoạch & Công việc", href: "/ke-hoach-cong-viec", icon: CalendarCheck },
      { title: "Kịch bản Diễn thử", href: "/playbook", icon: BookOpen, badge: "DEMO" },
    ],
  },
  {
    title: "Chuyên ngành VH-XH",
    items: [
      { title: "Nội vụ & CCHC (M02)", href: "/noi-vu", icon: Building, moduleKey: "m02" },
      { title: "Giáo dục & Đào tạo (M03)", href: "/giao-duc", icon: GraduationCap, moduleKey: "m03" },
      { title: "Văn hóa & Gia đình (M04)", href: "/van-hoa-gia-dinh", icon: Sparkles, moduleKey: "m04" },
      { title: "KHCN & CĐS (M05)", href: "/khcn-chuyen-doi-so", icon: Cpu, moduleKey: "m05-science-digital" },
      { title: "Y tế & An sinh (M06)", href: "/y-te-an-sinh", icon: HeartHandshake, moduleKey: "m06" },
      { title: "Dân tộc & Tôn giáo (M07)", href: "/dan-toc-ton-giao", icon: Compass, moduleKey: "m07" },
    ],
  },
  {
    title: "Kiểm tra, Báo cáo & Nền tảng",
    items: [
      { title: "Kiểm tra & Kiến nghị (M08)", href: "/kiem-tra", icon: ClipboardList, moduleKey: "m08-inspections" },
      { title: "Báo cáo chỉ tiêu (M09)", href: "/bao-cao", icon: BarChart3, moduleKey: "m09" },
      { title: "Dữ liệu dùng chung (M01)", href: "/du-lieu-dung-chung", icon: Database, moduleKey: "m01" },
      { title: "Nhập & Tích hợp (M10)", href: "/tich-hop", icon: RefreshCw, moduleKey: "m10" },
      { title: "Quản trị & Cán bộ (M00)", href: "/quan-tri", icon: ShieldCheck, moduleKey: "m00" },
    ],
  },
];

export function Sidebar({
  persona,
  tenant,
  isOpen = true,
  onClose,
}: {
  persona: Persona;
  tenant: TenantConfig;
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "w-64 border-r border-slate-200 bg-white flex flex-col min-h-screen shrink-0 transition-transform duration-200 ease-in-out z-50",
          "fixed lg:static inset-y-0 left-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gov-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
              PVH
            </div>
            <div>
              <div className="font-bold text-sm text-slate-800 font-display">HTTT PHÒNG VH-XH</div>
              <div className="text-[10px] text-slate-500 font-medium truncate max-w-[140px]">
                {tenant.name.replace("UBND ", "")}
              </div>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {NAV_GROUPS.map((group, idx) => (
            <div key={idx} className="space-y-1">
              <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {group.title}
              </h4>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  // Check if module is disabled by tenant
                  const isDisabled =
                    (item.moduleKey === "m05-science-digital" && !tenant.features.digitalTransformation) ||
                    (item.moduleKey === "m08-inspections" && !tenant.features.fieldInspection);

                  const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                        isActive
                          ? "bg-gov-50 text-gov-600 font-semibold"
                          : isDisabled
                          ? "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0",
                            isActive ? "text-gov-600" : isDisabled ? "text-slate-400" : "text-slate-400"
                          )}
                        />
                        <span className="truncate">{item.title}</span>
                      </div>
                      {isDisabled ? (
                        <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-semibold bg-amber-100 text-amber-700 rounded border border-amber-200">
                          TẮT
                        </span>
                      ) : item.badge ? (
                        <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-semibold bg-gov-100 text-gov-700 rounded border border-gov-200">
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-slate-200 bg-slate-50/70">
          <div className="rounded-lg bg-white p-2.5 border border-slate-200 text-[11px] space-y-1">
            <div className="flex justify-between items-center text-slate-500 font-medium">
              <span>Đơn vị:</span>
              <span className="font-bold text-slate-700 font-mono text-[10px]">{tenant.code}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500 font-medium">
              <span>Mô hình:</span>
              <span className="font-medium text-slate-700">
                {tenant.officerMode === "CONCURRENT" ? "Kiêm nhiệm" : "Phân nhiệm"}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-500 font-medium">
              <span>Chế độ:</span>
              <span className="font-semibold text-emerald-700">Multi-Tenancy</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
