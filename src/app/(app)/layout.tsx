import * as React from "react";
import { getRequestContext } from "@/lib/auth/request-context";
import { filterNavigation } from "@/config/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getPersonalNotifications, type NotificationsView } from "@/features/notifications/server/queries";
import { TopbarActions } from "@/features/notifications/components/topbar-actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let filteredGroups: ReturnType<typeof filterNavigation> = [];
  let userLabel = "Tài khoản";
  let tenantLabel = "Đơn vị công tác";
  let notifications: NotificationsView | null = null;
  let avatarVersion = 0;

  try {
    const ctx = await getRequestContext();
    filteredGroups = filterNavigation(ctx.permissions, ctx.roles);
    if (ctx.roles.includes("SYSTEM_ADMIN") || ctx.roles.includes("admin")) {
      userLabel = "Quản trị hệ thống";
    } else if (ctx.roles.includes("CONG_CHUC_VHXH") || ctx.roles.includes("CAN_BO_KIEM_NHIEM") || ctx.roles.includes("WORK_OFFICER")) {
      userLabel = "Công chức VH-XH";
    } else if (ctx.roles.includes("CAN_BO_MOT_CUA")) {
      userLabel = "Cán bộ Một cửa";
    } else if (ctx.roles.includes("CAN_BO_THANH_TRA") || ctx.roles.includes("AUDITOR")) {
      userLabel = "Cán bộ Kiểm tra";
    } else if (ctx.roles.includes("LANH_DAO_XA")) {
      userLabel = "Lãnh đạo xã";
    } else if (ctx.roles.includes("TRUONG_THON")) {
      userLabel = "Cán bộ địa bàn";
    }
    const db = await createServerSupabaseClient();
    const [tenant, inbox, auth] = await Promise.all([
      db.from("tenants").select("name").eq("id", ctx.tenantId).maybeSingle(),
      getPersonalNotifications(ctx, 1, 5),
      db.auth.getUser(),
    ]);
    const avatar = auth.data.user?.user_metadata?.avatar_updated_at;
    if (auth.data.user?.id === ctx.userId && typeof avatar === "number" && Number.isFinite(avatar)) {
      avatarVersion = avatar;
    }
    tenantLabel = tenant.data?.name || "Đơn vị công tác";
    notifications = inbox;
  } catch {
    // Never display an invented identity; authorization still occurs in page/actions.
    filteredGroups = [];
  }

  return <div className="flex min-h-screen bg-slate-50">
    <Sidebar groups={filteredGroups} tenantLabel={tenantLabel}/>
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-3 backdrop-blur-sm sm:px-6">
        <div className="min-w-0">
          <span className="inline-block max-w-[45vw] truncate rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 sm:max-w-md">
            {tenantLabel}
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <TopbarActions view={notifications} roleLabel={userLabel} avatarVersion={avatarVersion}/>
        </div>
      </header>
      <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6">{children}</main>
    </div>
  </div>;
}
