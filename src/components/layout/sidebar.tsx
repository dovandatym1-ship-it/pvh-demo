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
  FileInput,
  RefreshCw,
  BookOpen,
  LucideIcon,
} from "lucide-react";
import { Persona } from "@/lib/auth/session";
import { TenantConfig } from "@/lib/tenancy/tenant-config";

const ICON_MAP: Record<string, LucideIcon> = {
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
  FileInput,
  RefreshCw,
  BookOpen,
};

export interface NavigationItemDisplay {
  readonly title: string;
  readonly route: string;
  readonly iconName: string;
  readonly badge?: string;
  readonly status?: string;
}

export interface NavigationGroupDisplay {
  readonly title: string;
  readonly items: readonly NavigationItemDisplay[];
}

const DEFAULT_GROUPS: NavigationGroupDisplay[] = [
  {
    title: "Điều hành & Tác nghiệp",
    items: [
      { title: "Bàn làm việc", route: "/ban-lam-viec", iconName: "LayoutDashboard" },
      { title: "Quản lý công việc", route: "/cong-viec", iconName: "CalendarCheck" },
    ],
  },
  {
    title: "Chuyên ngành VH-XH",
    items: [
      { title: "Nội vụ & Lao động", route: "/noi-vu", iconName: "Building" },
      { title: "Giáo dục & Đào tạo", route: "/giao-duc", iconName: "GraduationCap" },
      { title: "Gia đình văn hóa", route: "/van-hoa/gia-dinh-van-hoa", iconName: "Sparkles" },
      { title: "Thôn / Xóm văn hóa", route: "/van-hoa/thon-van-hoa", iconName: "Compass" },
      { title: "Khoa học & Chuyển đổi số", route: "/khcn-chuyen-doi-so", iconName: "Cpu" },
      { title: "Y tế & An sinh xã hội", route: "/y-te-an-sinh", iconName: "HeartHandshake" },
      { title: "Dân tộc & Tôn giáo", route: "/dan-toc-ton-giao", iconName: "Compass" },
    ],
  },
  {
    title: "Kiểm tra, Báo cáo & Nền tảng",
    items: [
      { title: "Kiểm tra & Kiến nghị", route: "/kiem-tra", iconName: "ClipboardList" },
      { title: "Báo cáo thống kê", route: "/bao-cao", iconName: "BarChart3" },
      { title: "Nhập chỉ tiêu có nguồn", route: "/nhap-chi-tieu", iconName: "FileInput" },
      { title: "Dữ liệu dùng chung", route: "/du-lieu-dung-chung", iconName: "Database" },
      { title: "Cổng tích hợp liên thông", route: "/tich-hop", iconName: "RefreshCw" },
      { title: "Quản trị hệ thống & Cán bộ", route: "/quan-tri", iconName: "ShieldCheck" },
    ],
  },
];

export function Sidebar({
  persona,
  tenant,
  groups,
  isOpen = true,
  onClose,
}: {
  persona?: Persona;
  tenant?: TenantConfig;
  groups?: readonly NavigationGroupDisplay[];
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const displayGroups = groups && groups.length > 0 ? groups : DEFAULT_GROUPS;

  return (
    <>
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
              <h1 className="text-sm font-bold text-slate-800 leading-tight">
                {tenant?.name || "UBND Xã Định Hóa"}
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">Huyện Định Hóa, Thái Nguyên</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-6 overflow-y-auto">
          {displayGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              <h2 className="px-3 text-[11px] font-semibold text-slate-600 tracking-wider">
                {group.title}
              </h2>
              <div className="space-y-0.5">
                {group.items.map((item, itemIdx) => {
                  const Icon = ICON_MAP[item.iconName] || LayoutDashboard;
                  const isActive =
                    pathname === item.route || pathname.startsWith(item.route + "/");
                  return (
                    <Link
                      key={itemIdx}
                      href={item.route}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors group",
                        isActive
                          ? "bg-emerald-50 text-emerald-800 font-semibold"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={cn(
                            "w-4 h-4 shrink-0 transition-colors",
                            isActive
                              ? "text-emerald-700"
                              : "text-slate-400 group-hover:text-slate-600"
                          )}
                        />
                        <span className="truncate">{item.title}</span>
                      </div>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-sm bg-emerald-100 text-emerald-800 shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {persona && (
          <div className="p-3 border-t border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white border border-slate-200/80">
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                {persona.name ? persona.name.split(" ").slice(-1)[0]?.charAt(0) : "CB"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-800 truncate">{persona.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{persona.roleTitle}</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
