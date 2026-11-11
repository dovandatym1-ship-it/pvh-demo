import * as React from "react";
import { redirect } from "next/navigation";
import { getRequestContext } from "@/lib/auth/request-context";
import { filterNavigation } from "@/config/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getPersonalNotifications, type NotificationsView } from "@/features/notifications/server/queries";
import { deploymentBrand } from "@/config/deployment-brand";

function roleLabel(roles: readonly string[]): string {
  if (roles.includes("SYSTEM_ADMIN") || roles.includes("admin")) return "Quản trị viên hệ thống";
  if (roles.includes("LANH_DAO_XA")) return "Lãnh đạo cấp xã";
  if (roles.includes("CONG_CHUC_VHXH") || roles.includes("CAN_BO_KIEM_NHIEM") || roles.includes("WORK_OFFICER")) return "Công chức văn hóa – xã hội";
  if (roles.includes("CAN_BO_MOT_CUA")) return "Cán bộ bộ phận một cửa";
  if (roles.includes("CAN_BO_THANH_TRA") || roles.includes("AUDITOR")) return "Cán bộ kiểm tra";
  if (roles.includes("TRUONG_THON")) return "Cán bộ thôn, xóm";
  return "Người sử dụng";
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // App-wide auth is mandatory: an empty sidebar is not an access-control gate.
  // Fail closed before rendering descendants; individual pages/actions still check
  // their domain permission and database RLS independently.
  let ctx: Awaited<ReturnType<typeof getRequestContext>>;
  try {
    ctx = await getRequestContext();
  } catch {
    redirect("/login");
  }

  const groups = filterNavigation(ctx.permissions, ctx.roles);
  const userLabel = roleLabel(ctx.roles);
  let tenantLabel = deploymentBrand.organizationName;
  let notifications: NotificationsView | null = null;
  let avatarVersion = 0;

  // Optional header data may fail without replacing a verified user's access
  // context with a fabricated guest; the backend/page still fails closed.
  try {
    const db = await createServerSupabaseClient();
    const [tenant, inbox, auth] = await Promise.all([
      db.from("tenants").select("name").eq("id", ctx.tenantId).maybeSingle(),
      getPersonalNotifications(ctx, 1, 5),
      db.auth.getUser(),
    ]);
    if (!tenant.error && tenant.data?.name) tenantLabel = tenant.data.name;
    const avatar = auth.data.user?.user_metadata?.avatar_updated_at;
    if (auth.data.user?.id === ctx.userId && typeof avatar === "number" && Number.isFinite(avatar)) {
      avatarVersion = avatar;
    }
    notifications = inbox;
  } catch {
    // Display optional header information as unavailable; never fabricate data
    // or suppress domain-level authorization errors in child pages.
  }

  return <AppShell groups={groups} tenantLabel={tenantLabel} roleLabel={userLabel}
    notifications={notifications} avatarVersion={avatarVersion}>{children}</AppShell>;
}
