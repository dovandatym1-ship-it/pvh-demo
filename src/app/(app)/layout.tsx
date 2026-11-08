import * as React from "react";
import Link from "next/link";
import { getRequestContext } from "@/lib/auth/request-context";
import { filterNavigation } from "@/config/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { logoutAction } from "@/lib/auth/actions";
import { TENANTS } from "@/lib/tenancy/tenant-config";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let filteredGroups: ReturnType<typeof filterNavigation> = [];
  let userLabel = "Chủ tịch UBND xã";
  let tenantLabel = "Đơn vị công tác";

  try {
    const ctx = await getRequestContext();
    filteredGroups = filterNavigation(ctx.permissions, ctx.roles);
    const tenant = Object.values(TENANTS).find((entry) => entry.id === ctx.tenantId || entry.code === ctx.tenantId);
    if (tenant) tenantLabel = tenant.name;
    if (ctx.roles.includes("SYSTEM_ADMIN") || ctx.roles.includes("admin")) {
      userLabel = "Quản trị viên hệ thống";
    } else if (ctx.roles.includes("CONG_CHUC_VHXH") || ctx.roles.includes("CAN_BO_KIEM_NHIEM") || ctx.roles.includes("WORK_OFFICER")) {
      userLabel = "Công chức VH-XH";
    } else if (ctx.roles.includes("CAN_BO_MOT_CUA")) {
      userLabel = "Cán bộ Một cửa";
    } else if (ctx.roles.includes("CAN_BO_THANH_TRA") || ctx.roles.includes("AUDITOR")) {
      userLabel = "Cán bộ Kiểm tra";
    } else {
      userLabel = "Chủ tịch UBND xã";
    }
  } catch {
    filteredGroups = filterNavigation([]);
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="hidden lg:block"><Sidebar groups={filteredGroups} /></div>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-slate-200 bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2 min-w-0">
            <details className="relative lg:hidden group">
              <summary className="cursor-pointer list-none rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500" aria-label="Mở điều hướng">☰ Menu</summary>
              <nav aria-label="Điều hướng trên điện thoại" className="absolute top-10 left-0 z-50 max-h-[70vh] w-[min(85vw,310px)] overflow-y-auto rounded-lg border border-slate-200 bg-white p-3 shadow-xl">
                {filteredGroups.map((group) => (
                  <div className="mb-3" key={group.title}>
                    <p className="px-2 py-1 text-[11px] font-bold text-slate-500">{group.title}</p>
                    {group.items.map((item) => <Link key={item.route} href={item.route} className="block rounded-md px-2 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-800">{item.title}</Link>)}
                  </div>
                ))}
              </nav>
            </details>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
              🏛️ {tenantLabel}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-700 font-medium bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
              👤 {userLabel}
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 px-2.5 py-1 rounded border border-transparent hover:border-red-200 transition-colors"
              >
                Đăng xuất
              </button>
            </form>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
