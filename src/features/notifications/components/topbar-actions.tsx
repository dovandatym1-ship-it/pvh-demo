"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, ChevronDown, LogOut, Settings2, UserRound } from "lucide-react";
import { notificationLabel } from "../presentation";
import type { NotificationsView } from "../server/queries";

export function NotificationBell({ view }: { view: NotificationsView | null }) {
  const [open, setOpen] = useState(false);
  const unread = view?.status === "ready" ? view.unread : null;
  return <div className="relative">
    <button type="button" onClick={() => setOpen(v => !v)}
      aria-label={unread === null ? "Mở thông báo" : `Thông báo: ${unread} chưa đọc`}
      aria-expanded={open} aria-controls="pvh-bell-popover"
      className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
      <Bell size={19} aria-hidden="true"/>
      {unread !== null && unread > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
        {unread > 99 ? "99+" : unread}
      </span>}
    </button>
    {open && <div id="pvh-bell-popover" role="region" aria-label="Xem nhanh thông báo"
      className="absolute right-0 top-12 z-50 w-[min(92vw,360px)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h2 className="font-semibold text-slate-900">Thông báo</h2>
        {unread !== null && <span className="text-xs font-medium text-slate-500">{unread} chưa đọc</span>}
      </div>
      {!view || view.status === "unavailable" ? <p role="alert" className="p-4 text-sm text-rose-700">Không tải được thông báo. Mở trang thông báo để kiểm tra.</p>
      : view.status === "demo" ? <p className="p-4 text-sm text-amber-800">Phiên demo không có thông báo xác thực.</p>
      : view.items.length === 0 ? <p className="p-4 text-sm text-slate-500">Chưa có thông báo mới.</p>
      : <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
        {view.items.slice(0, 5).map(item => <li key={item.id}>
          <Link onClick={() => setOpen(false)} href={item.sourceId ? `/cong-viec/${item.sourceId}` : "/thong-bao"}
            className={`block px-4 py-3 hover:bg-slate-50 ${item.readAt ? "" : "bg-emerald-50/50"}`}>
            <p className="text-sm font-medium text-slate-800">{notificationLabel(item.eventCode)}</p>
            <p className="mt-1 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</p>
          </Link>
        </li>)}
      </ul>}
      <Link onClick={() => setOpen(false)} href="/thong-bao"
        className="block border-t border-slate-100 px-4 py-3 text-center text-sm font-semibold text-emerald-800 hover:bg-slate-50">
        Xem tất cả thông báo
      </Link>
    </div>}
  </div>;
}

export function AccountMenu({ roleLabel }: { roleLabel: string }) {
  const [open, setOpen] = useState(false);
  return <div className="relative">
    <button type="button" onClick={() => setOpen(v => !v)}
      aria-expanded={open} aria-controls="pvh-account-popover" aria-label="Mở menu tài khoản"
      className="flex h-10 max-w-44 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 sm:max-w-60">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-800"><UserRound size={16} aria-hidden="true"/></span>
      <span className="hidden truncate sm:block">{roleLabel}</span>
      <ChevronDown size={14} aria-hidden="true"/>
    </button>
    {open && <div id="pvh-account-popover" className="absolute right-0 top-12 z-50 w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
      <Link onClick={() => setOpen(false)} href="/thong-tin-ca-nhan"
        className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
        <UserRound size={16} aria-hidden="true"/> Thông tin cá nhân
      </Link>
      <Link onClick={() => setOpen(false)} href="/thong-bao"
        className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
        <Settings2 size={16} aria-hidden="true"/> Quản lý thông báo
      </Link>
      <div className="my-1 border-t border-slate-100"/>
      <form action="/logout" method="post">
        <p className="px-3 py-2 text-xs text-slate-400">Đăng xuất bằng nút trên thanh hệ thống hoặc trang cá nhân.</p>
      </form>
    </div>}
  </div>;
}
