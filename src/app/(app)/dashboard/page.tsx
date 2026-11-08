import { getRequestContext } from "@/lib/auth/request-context";
import { canAccessRoute } from "@/config/navigation";
import { getWorkItems } from "@/features/m01-core-work/server/queries";
import { getCompletionEvents } from "@/features/dashboard/server/get-completion-events";
import { buildDashboardModel } from "@/features/dashboard/metrics.mjs";
import { DashboardView } from "@/features/dashboard/components/dashboard-view";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const ctx = await getRequestContext();
  const [items, history] = await Promise.all([
    getWorkItems(ctx),
    getCompletionEvents(ctx),
  ]);

  const model = buildDashboardModel({
    items,
    completionEvents: history.events,
    eventsAvailable: history.available,
    eventsTruncated: history.truncated,
    ctx,
    now: new Date(),
  });

  const allowedRoutes = [
    "/cong-viec",
    "/van-hoa/gia-dinh-van-hoa",
    "/khcn-chuyen-doi-so",
    "/y-te-an-sinh",
    "/giao-duc",
    "/noi-vu",
  ].filter((path) => canAccessRoute(path, ctx.permissions, ctx.roles));

  return <DashboardView model={model} allowedRoutes={allowedRoutes} />;
}
