import Link from "next/link";
import { getRequestContext } from "@/lib/auth/request-context";
import { getDashboardStats, getWorkItemsPage, getWorkInbox } from "@/features/m01-core-work/server/queries";
import { MarkInboxReadButton } from "@/features/m01-core-work/components/mark-inbox-read-button";

export const dynamic = "force-dynamic";

export default async function WorkbenchPage() {
  const ctx = await getRequestContext();
  if (!ctx.permissions.includes("m01:work:read")) {
    return <div role="alert" className="rounded-lg bg-amber-50 p-5 text-sm text-amber-900">
      Tài khoản chưa được cấp quyền xem công việc. Liên hệ đầu mối quản trị phân quyền.
    </div>;
  }
  const [stats, page, inbox] = await Promise.all([
    getDashboardStats(ctx), getWorkItemsPage(ctx, { filter: "mine", pageSize: 20 }), getWorkInbox(ctx),
  ]);
  const cards = [
    { label: "Việc của tôi", value: stats.mine, detail: "Đã giao, đang làm hoặc được trả lại" },
    { label: "Quá hạn", value: stats.overdue, detail: "Trong phạm vi được xem; hạn đã qua, chưa kết thúc" },
    { label: "Chờ rà soát", value: stats.review, detail: "Bạn có quyền duyệt; loại trừ việc do mình đang xử lý" },
  ];
  return <div className="space-y-6">
    <header><h1 className="text-2xl font-bold text-slate-900">Bàn làm việc</h1>
      <p className="text-sm text-slate-600">Dữ liệu trực tiếp theo phân quyền, không có số liệu minh họa thay thế.</p></header>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{cards.map(c =>
      <div key={c.label} className="rounded-xl border bg-white p-4">
        <p className="text-sm font-medium text-slate-600">{c.label}</p>
        <p className="text-3xl font-bold text-emerald-800 mt-2">{c.value}</p>
        <p className="text-xs text-slate-500 mt-2">{c.detail}</p>
      </div>)}</div>
    <section className="rounded-xl border bg-white p-5 space-y-3">
      <div className="flex justify-between items-center gap-3"><h2 className="font-semibold">Công việc được giao cho tôi</h2>
        <Link href="/cong-viec" className="text-sm text-emerald-800 underline">Xem tất cả</Link></div>
      {page.items.length === 0 ? <p className="text-sm text-slate-500">Chưa có việc được giao</p> :
        <ul className="divide-y text-sm">{page.items.map(item => <li key={item.id} className="py-3 flex flex-wrap justify-between gap-2">
          <Link className="text-emerald-800 font-medium hover:underline" href={`/cong-viec/${item.id}`}>{item.title}</Link>
          <span className="text-slate-500">{item.status}</span>
        </li>)}</ul>}
    </section>
    <section className="rounded-xl border bg-white p-5 space-y-3">
      <h2 className="font-semibold">Thông báo nội bộ gần đây</h2>
      {inbox.length === 0 ? <p className="text-sm text-slate-500">Chưa có thông báo</p> :
        <ul className="divide-y text-sm">{inbox.map(n => <li key={n.id} className="py-2 flex flex-wrap justify-between items-center gap-3">
          <div className="space-y-1">
            <Link href={`/cong-viec/${n.workItemId}`} className="text-emerald-800 hover:underline">{n.kind}</Link>
            <p className="text-xs text-slate-500">{new Date(n.createdAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</p>
          </div>
          {n.readAt ? <span className="text-xs text-slate-500">Đã đọc</span> : <MarkInboxReadButton id={n.id} />}
        </li>)}</ul>}
    </section>
  </div>;
}
