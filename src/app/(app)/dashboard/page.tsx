import { getRequestContext } from "@/lib/auth/request-context";
import { canAccessRoute } from "@/config/navigation";
import { getM01DashboardSnapshot } from "@/features/dashboard/server/get-m01-dashboard-snapshot";
import { DashboardView } from "@/features/dashboard/components/dashboard-view";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const ctx = await getRequestContext();
  if (!ctx.permissions.includes("m01:work:read")) {
    return <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
      Tài khoản chưa được cấp quyền xem thống kê công việc. Đề nghị liên hệ quản trị viên.
    </div>;
  }
  const model = await getM01DashboardSnapshot(ctx);
  const allowedRoutes = [
    "/cong-viec", "/van-hoa/gia-dinh-van-hoa", "/khcn-chuyen-doi-so",
    "/y-te-an-sinh", "/giao-duc", "/noi-vu",
  ].filter(path => canAccessRoute(path, ctx.permissions, ctx.roles));
  return <DashboardView model={model} allowedRoutes={allowedRoutes}/>;
}
