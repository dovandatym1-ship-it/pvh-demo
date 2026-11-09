import { Bell } from "lucide-react";
import { getRequestContext } from "@/lib/auth/request-context";
import { getPersonalNotifications } from "@/features/notifications/server/queries";
import { NotificationList } from "@/features/notifications/components/notification-list";

export const dynamic = "force-dynamic";

export default async function NotificationCenterPage({ searchParams }: {
  searchParams: Promise<{ page?: string }>;
}) {
  const ctx = await getRequestContext();
  const query = await searchParams;
  const page = Math.max(1, Math.min(10000, Number(query.page) || 1));
  const view = await getPersonalNotifications(ctx, page, 20);
  return <main className="mx-auto max-w-5xl space-y-6 pb-8">
    <header className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
      <div className="flex items-center gap-3">
        <span className="rounded-xl bg-emerald-50 p-3 text-emerald-800"><Bell aria-hidden="true"/></span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Thông báo của tôi</h1>
          <p className="mt-1 text-sm text-slate-600">Cập nhật công việc trong phạm vi tài khoản được phân quyền.</p>
        </div>
      </div>
    </header>
    <NotificationList view={view}/>
  </main>;
}
