"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Sidebar, type NavigationGroupDisplay } from "@/components/layout/sidebar";
import { TopbarActions } from "@/features/notifications/components/topbar-actions";
import type { NotificationsView } from "@/features/notifications/server/queries";

export function AppShell({ children, groups, tenantLabel, roleLabel, notifications, avatarVersion }: {
  children: ReactNode;
  groups: readonly NavigationGroupDisplay[];
  tenantLabel: string;
  roleLabel: string;
  notifications: NotificationsView | null;
  avatarVersion: number;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  useEffect(() => setMobileNavOpen(false), [pathname]);
  useEffect(() => {
    if (!mobileNavOpen) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileNavOpen(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [mobileNavOpen]);
  const closeMobileNav = () => {
    setMobileNavOpen(false);
    menuButton.current?.focus();
  };

  return <div className="flex min-h-screen bg-slate-50">
    <Sidebar groups={groups} tenantLabel={tenantLabel}
      isOpen={mobileNavOpen} onClose={closeMobileNav}/>
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <button ref={menuButton} type="button" aria-label="Mở menu điều hướng"
            aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen(true)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 lg:hidden">
            <Menu size={19} aria-hidden="true"/>
          </button>
          <span className="inline-block max-w-[32vw] truncate rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 sm:max-w-md">
            {tenantLabel}
          </span>
        </div>
        <TopbarActions view={notifications} roleLabel={roleLabel} avatarVersion={avatarVersion}/>
      </header>
      <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6">{children}</main>
    </div>
  </div>;
}
