"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Check, Clock3 } from "lucide-react";
import { markOwnNotificationReadAction } from "../server/actions";
import { notificationLabel } from "../presentation";
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
      <span className="mt-0.5 rounded-lg bg-slate-100 p-2 text-slate-600"><Bell size={16} aria-hidden="true"/></span>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-semibold text-slate-900">{notificationLabel(item.eventCode)}</p>
        <p className="flex items-center gap-1 text-xs text-slate-500"><Clock3 size={13} aria-hidden="true"/>
          {new Date(item.createdAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}
        </p>
        {item.sourceId && <Link className="inline-block text-xs font-semibold text-emerald-800 underline-offset-2 hover:underline"
          href={`/cong-viec/${item.sourceId}`}>Xem công việc</Link>}
        {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
      </div>
      <div>
        {item.readAt ? <span className="text-xs text-slate-500">Đã đọc</span> :
          <button type="button" onClick={markRead} disabled={pending}
            aria-label={`Đánh dấu đã đọc: ${notificationLabel(item.eventCode)}`}
            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2.5 py-2 text-xs font-medium text-emerald-800 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-60">
            <Check size={14} aria-hidden="true"/>{pending ? "Đang lưu" : "Đã đọc"}
          </button>}
      </div>
    </div>
  </li>;
}

export function NotificationList({ view }: { view: NotificationsView }) {
  if (view.status === "demo") return <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
    Phiên demo không có thông báo xác thực. Đăng nhập bằng tài khoản thật để sử dụng trung tâm thông báo.
  </div>;
  if (view.status !== "ready") return <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
    Chưa tải được thông báo. Kiểm tra kết nối và migration dữ liệu trước khi sử dụng.
  </div>;
  if (view.total === 0) return <div role="status" className="rounded-xl border border-slate-200 bg-white p-10 text-center">
    <Bell size={26} className="mx-auto mb-3 text-slate-400" aria-hidden="true"/>
    <p className="font-semibold text-slate-800">Chưa có thông báo</p>
    <p className="mt-1 text-sm text-slate-500">Các cập nhật công việc sẽ xuất hiện tại đây khi phát sinh sự kiện.</p>
  </div>;
  return <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
    <ul className="divide-y divide-slate-100">{view.items.map(x => <NotificationRow key={x.id} item={x}/>)}</ul>
    <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
      <span>{view.total} thông báo · {view.unread} chưa đọc</span>
      <div className="flex items-center gap-3">
        {view.page > 1 && <Link href={`/thong-bao?page=${view.page - 1}`} className="text-emerald-800 hover:underline">Trang trước</Link>}
        {view.page * 20 < view.total && <Link href={`/thong-bao?page=${view.page + 1}`} className="text-emerald-800 hover:underline">Trang tiếp</Link>}
      </div>
    </div>
  </div>;
}
