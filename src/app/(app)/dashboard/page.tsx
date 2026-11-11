import { getRequestContext } from "@/lib/auth/request-context";
import { canAccessRoute } from "@/config/navigation";
import { getM01DashboardSnapshot } from "@/features/dashboard/server/get-m01-dashboard-snapshot";
import { DashboardView } from "@/features/dashboard/components/dashboard-view";
import { getDomainCountMetrics } from "@/features/dashboard/server/get-domain-count-metrics";
import { DomainCountPanel } from "@/features/dashboard/components/domain-count-panel";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const ctx = await getRequestContext();
  const hasWorkAccess = ctx.permissions.includes("m01:work:read");
  const domainMetrics = await getDomainCountMetrics(ctx);
  if (!hasWorkAccess && domainMetrics.length === 0) {
    return <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
      Tài khoản chưa được cấp quyền xem thống kê công việc. Đề nghị liên hệ quản trị viên.
    </div>;
  }
  const model = hasWorkAccess ? await getM01DashboardSnapshot(ctx) : null;
  const allowedRoutes = [
    "/cong-viec", "/van-hoa/gia-dinh-van-hoa", "/khcn-chuyen-doi-so",
    "/y-te-an-sinh", "/giao-duc", "/noi-vu", "/dan-toc-ton-giao",
    "/kiem-tra", "/bao-cao", "/nhap-chi-tieu", "/danh-muc-dung-chung",
  ].filter(path => canAccessRoute(path, ctx.permissions, ctx.roles));
  return <main className="space-y-6">
    {model ? <DashboardView model={model} allowedRoutes={allowedRoutes}/> :
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-xl font-bold text-slate-900">Tổng quan nghiệp vụ được phân quyền</h1>
        <p className="mt-2 text-sm text-slate-600">Tài khoản không được phép xem công việc M01. Những số liệu hồ sơ sau đây chỉ thuộc các phân hệ được cấp quyền và không đồng nghĩa với số công việc đã hoàn thành.</p>
      </section>}
    <DomainCountPanel metrics={domainMetrics}/>
  </main>;
}
