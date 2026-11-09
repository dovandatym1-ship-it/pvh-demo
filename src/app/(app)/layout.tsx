import * as React from "react";
import { getRequestContext } from "@/lib/auth/request-context";
import { filterNavigation } from "@/config/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { logoutAction } from "@/lib/auth/actions";
import { deploymentBrand } from "@/config/deployment-brand";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let filteredGroups: ReturnType<typeof filterNavigation> = [];
  let userLabel = "Chủ tịch UBND xã";
  const tenantLabel = deploymentBrand.organizationName;

  try {
    const ctx = await getRequestContext();
    filteredGroups = filterNavigation(ctx.permissions, ctx.roles);
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
      <Sidebar groups={filteredGroups} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-slate-200 bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2">
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
