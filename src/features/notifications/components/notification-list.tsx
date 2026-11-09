"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Check, Clock3, ListFilter } from "lucide-react";
import { markOwnNotificationReadAction } from "../server/actions";
import { notificationLabel } from "../presentation";
import { notificationPageUrl, type NotificationFilters } from "../filters";
import type { PersonalNotification, NotificationsView } from "../server/queries";

function NotificationRow({ item }: { item: PersonalNotification }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function markRead() {
    if (pending || item.readAt) return;
    setPending(true); setError("");
    try {
      const result = await markOwnNotificationReadAction(item.id);
      if (!result.ok) setError(result.error.message);
      else router.refresh();
    } catch { setError("Không thể cập nhật. Vui lòng thử lại."); }
    finally { setPending(false); }
  }

  return <li className={item.readAt ? "bg-white" : "bg-emerald-50/50"}>
    <div className="flex items-start gap-3 p-4 sm:p-5">
      <span className="mt-0.5 rounded-lg bg-slate-100 p-2 text-slate-600">
        <Bell size={16} aria-hidden="true"/>
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-semibold text-slate-900">{notificationLabel(item.eventCode)}</p>
        <p className="flex items-center gap-1 text-xs text-slate-500">
          <Clock3 size={13} aria-hidden="true"/>
          {new Date(item.createdAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}
        </p>
        {item.sourceId && <Link className="inline-block text-xs font-semibold text-emerald-800 underline-offset-2 hover:underline"
          href={`/cong-viec/${item.sourceId}`}>Xem công việc</Link>}
        {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
      </div>
      <div className="shrink-0">
        {item.readAt ? <span className="text-xs text-slate-500">Đã đọc</span> :
          <button type="button" onClick={markRead} disabled={pending}
            aria-label={`Đánh dấu đã đọc: ${notificationLabel(item.eventCode)}`}
            className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2.5 text-xs font-medium text-emerald-800 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-60">
            <Check size={14} aria-hidden="true"/>{pending ? "Đang lưu" : "Đã đọc"}
          </button>}
      </div>
    </div>
  </li>;
}

const statusOptions: Array<{ id: NotificationFilters["status"]; label: string }> = [
  { id: "all", label: "Tất cả" },
  { id: "unread", label: "Chưa đọc" },
  { id: "read", label: "Đã đọc" },
];

export function NotificationList({ view }: { view: NotificationsView }) {
  const filters = view.filters;
  const filtered = filters.status !== "all" || filters.group !== "all" || filters.period !== "all";
  return <div className="space-y-4">
    <section aria-label="Bộ lọc thông báo" className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Trạng thái thông báo" className="flex rounded-lg bg-slate-100 p-1">
          {statusOptions.map(option => <Link key={option.id}
            aria-current={filters.status === option.id ? "page" : undefined}
            href={notificationPageUrl({ ...filters, status: option.id })}
            className={`rounded-md px-3 py-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${filters.status === option.id ? "bg-white text-emerald-800 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
            {option.label}
          </Link>)}
        </div>
        {view.status === "ready" && <p className="text-xs text-slate-500">
          {view.total} kết quả · {view.unread} thông báo chưa đọc
        </p>}
      </div>
      <form method="get" action="/thong-bao"
        className="mt-3 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-3">
        <input type="hidden" name="status" value={filters.status}/>
        <label className="min-w-36 flex-1 space-y-1 text-xs font-medium text-slate-600">
          Loại thông báo
          <select name="group" defaultValue={filters.group}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
            <option value="all">Tất cả loại</option>
            <option value="assignment">Giao việc</option>
            <option value="workflow">Xử lý công việc</option>
            <option value="deadline">Thay đổi hạn</option>
          </select>
        </label>
        <label className="min-w-32 flex-1 space-y-1 text-xs font-medium text-slate-600">
          Thời gian
          <select name="period" defaultValue={filters.period}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
            <option value="all">Mọi thời điểm</option>
            <option value="7d">7 ngày gần đây</option>
            <option value="30d">30 ngày gần đây</option>
          </select>
        </label>
        <button type="submit"
          className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#1F633E] px-4 text-xs font-semibold text-white hover:bg-[#174E31] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
          <ListFilter size={15} aria-hidden="true"/> Áp dụng
        </button>
        {filtered && <Link href="/thong-bao"
          className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50">
          Xóa bộ lọc
        </Link>}
      </form>
    </section>

    {view.status === "demo" ? <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
      Phiên demo không có thông báo xác thực. Đăng nhập bằng tài khoản thật để sử dụng trung tâm thông báo.
    </div> : view.status !== "ready" ? <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
      Chưa tải được thông báo. Kiểm tra kết nối và migration dữ liệu trước khi sử dụng.
    </div> : view.total === 0 ? <div role="status" className="rounded-xl border border-slate-200 bg-white p-10 text-center">
      <Bell size={26} className="mx-auto mb-3 text-slate-400" aria-hidden="true"/>
      <p className="font-semibold text-slate-800">{filtered ? "Không tìm thấy thông báo phù hợp" : "Chưa có thông báo"}</p>
      <p className="mt-1 text-sm text-slate-500">{filtered
        ? "Thử điều chỉnh loại, trạng thái hoặc thời gian lọc."
        : "Các cập nhật công việc sẽ xuất hiện ở đây khi phát sinh sự kiện."}</p>
      {filtered && <Link href="/thong-bao" className="mt-3 inline-block text-sm font-semibold text-emerald-800 hover:underline">Xem tất cả</Link>}
    </div> : <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <ul className="divide-y divide-slate-100">{view.items.map(item => <NotificationRow key={item.id} item={item}/>)}</ul>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
        <span>Trang {view.page} · {view.total} kết quả</span>
        <div className="flex items-center gap-3">
          {view.page > 1 && <Link href={notificationPageUrl(filters, view.page - 1)}
            className="font-medium text-emerald-800 hover:underline">Trang trước</Link>}
          {view.page * view.pageSize < view.total && <Link href={notificationPageUrl(filters, view.page + 1)}
            className="font-medium text-emerald-800 hover:underline">Trang tiếp</Link>}
        </div>
      </div>
    </div>}
  </div>;
}
