import * as React from "react";
import { getRequestContext } from "@/lib/auth/request-context";
import { filterNavigation } from "@/config/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { logoutAction } from "@/lib/auth/actions";
import { deploymentBrand } from "@/config/deployment-brand";

function roleLabel(roles: readonly string[]): string {
  if (roles.includes("SYSTEM_ADMIN") || roles.includes("admin")) return "Quản trị viên hệ thống";
  if (roles.includes("LANH_DAO_XA")) return "Lãnh đạo cấp xã";
  if (roles.includes("CONG_CHUC_VHXH") || roles.includes("CAN_BO_KIEM_NHIEM") || roles.includes("WORK_OFFICER")) return "Công chức Văn hóa – Xã hội";
  if (roles.includes("CAN_BO_MOT_CUA")) return "Cán bộ Một cửa";
  if (roles.includes("CAN_BO_THANH_TRA") || roles.includes("AUDITOR")) return "Cán bộ kiểm tra";
  if (roles.includes("TRUONG_THON")) return "Cán bộ thôn, xóm";
  return "Người sử dụng";
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let groups: ReturnType<typeof filterNavigation> = [];
  let userLabel = "Chưa xác nhận vai trò";
  try {
    const ctx = await getRequestContext();
    groups = filterNavigation(ctx.permissions, ctx.roles);
    userLabel = roleLabel(ctx.roles);
  } catch {
    // No navigation entitlement is inferred from a failed authentication request.
    groups = filterNavigation([]);
  }

  return <AppShell groups={groups} userLabel={userLabel}
    tenantLabel={deploymentBrand.organizationName}
    logout={<form action={logoutAction}>
      <button type="submit" className="rounded-md border border-transparent px-2.5 py-1.5 text-xs text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700">
        Đăng xuất
      </button>
    </form>}>
    {children}
  </AppShell>;
}
