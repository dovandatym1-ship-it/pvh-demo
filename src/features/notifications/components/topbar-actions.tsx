"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, LogOut, Settings2, UserRound, X } from "lucide-react";
import { logoutAction } from "@/lib/auth/actions";
import { AvatarImage } from "@/features/self-service/components/avatar-image";
import { notificationLabel } from "../presentation";
import type { NotificationsView } from "../server/queries";

type OpenPopover = "notifications" | "account" | null;

/** Single controller ensures only one popover is open and mobile overlays close predictably. */
export function TopbarActions({ view, roleLabel, avatarVersion }: {
  view: NotificationsView | null; roleLabel: string; avatarVersion: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState<OpenPopover>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);
  const accountRef = useRef<HTMLButtonElement>(null);
  const unread = view?.status === "ready" ? view.unread : null;

  useEffect(() => setOpen(null), [pathname]);
  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(null);
    }
    function escape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      const original = open === "notifications" ? bellRef : accountRef;
      setOpen(null);
      original.current?.focus();
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  return <div ref={rootRef} className="relative flex items-center gap-2 sm:gap-3">
    {open && <button type="button" aria-label="Đóng cửa sổ nổi"
      onClick={() => setOpen(null)}
      className="fixed inset-0 z-40 bg-slate-900/25 sm:hidden"/>}

    <div className="relative">
      <button ref={bellRef} type="button"
        onClick={() => setOpen(previous => previous === "notifications" ? null : "notifications")}
        aria-label={unread === null ? "Mở trung tâm thông báo" : `Thông báo, ${unread} chưa đọc`}
        aria-expanded={open === "notifications"} aria-controls="pvh-notification-popover"
        className="relative z-50 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
        <Bell size={19} aria-hidden="true"/>
        {unread !== null && unread > 0 && <span aria-hidden="true"
          className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
          {unread > 99 ? "99+" : unread}
        </span>}
      </button>
      {open === "notifications" && <section id="pvh-notification-popover"
        aria-label="Thông báo gần đây" role="region"
        className="fixed left-3 right-3 top-[4.75rem] z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-[360px]">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Thông báo</h2>
            {unread !== null && <p className="mt-0.5 text-xs text-slate-500">{unread} chưa đọc</p>}
          </div>
          <button type="button" aria-label="Đóng thông báo" onClick={() => { setOpen(null); bellRef.current?.focus(); }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
            <X size={17} aria-hidden="true"/>
          </button>
        </div>
        {!view || view.status === "unavailable" ? <p role="alert" className="px-4 py-5 text-sm text-rose-700">
          Chưa tải được thông báo. Mở trang thông báo để kiểm tra.
        </p> : view.status === "demo" ? <p className="px-4 py-5 text-sm text-amber-800">
          Phiên demo không có thông báo xác thực.
        </p> : view.items.length === 0 ? <p className="px-4 py-6 text-sm text-slate-500">
          Chưa có thông báo mới.
        </p> : <ul className="max-h-[min(48dvh,300px)] divide-y divide-slate-100 overflow-y-auto">
          {view.items.slice(0, 5).map(item => <li key={item.id}>
            <Link onClick={() => setOpen(null)}
              href={item.sourceId ? `/cong-viec/${item.sourceId}` : "/thong-bao"}
              className={`block px-4 py-3 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${item.readAt ? "bg-white" : "bg-emerald-50/50"}`}>
              <p className="text-sm font-semibold text-slate-800">{notificationLabel(item.eventCode)}</p>
              <p className="mt-1 text-xs text-slate-500">
                {new Date(item.createdAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}
              </p>
            </Link>
          </li>)}
        </ul>}
        <Link href="/thong-bao" onClick={() => setOpen(null)}
          className="block border-t border-slate-100 px-4 py-3 text-center text-sm font-semibold text-emerald-800 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
          Xem tất cả thông báo
        </Link>
      </section>}
    </div>

    <div className="relative">
      <button ref={accountRef} type="button"
        onClick={() => setOpen(previous => previous === "account" ? null : "account")}
        aria-expanded={open === "account"} aria-controls="pvh-account-popover"
        aria-label={`Mở menu tài khoản: ${roleLabel}`}
        className="relative z-50 flex h-11 max-w-48 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 sm:max-w-60">
        <AvatarImage version={avatarVersion}/>
        <span className="hidden truncate sm:block">{roleLabel}</span>
        <ChevronDown size={15} aria-hidden="true"/>
      </button>
      {open === "account" && <section id="pvh-account-popover" role="region" aria-label="Tùy chọn tài khoản"
        className="fixed left-3 right-3 top-[4.75rem] z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-64">
        <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
          <p className="truncate text-xs font-semibold text-slate-500">{roleLabel}</p>
          <button type="button" aria-label="Đóng menu tài khoản" onClick={() => { setOpen(null); accountRef.current?.focus(); }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">
            <X size={16} aria-hidden="true"/>
          </button>
        </div>
        <Link href="/thong-tin-ca-nhan" onClick={() => setOpen(null)}
          className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
          <UserRound size={16} aria-hidden="true"/> Thông tin cá nhân
        </Link>
        <Link href="/thong-bao" onClick={() => setOpen(null)}
          className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
          <Settings2 size={16} aria-hidden="true"/> Quản lý thông báo
        </Link>
        <div className="my-1 border-t border-slate-100"/>
        <form action={logoutAction}>
          <button type="submit"
            className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm text-rose-700 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
            <LogOut size={16} aria-hidden="true"/> Đăng xuất
          </button>
        </form>
      </section>}
    </div>
  </div>;
}
