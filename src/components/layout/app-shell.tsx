"use client";

import * as React from "react";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { Sidebar, type NavigationGroupDisplay } from "@/components/layout/sidebar";

export function AppShell({
  groups, userLabel, tenantLabel, logout, children,
}: {
  groups: readonly NavigationGroupDisplay[];
  userLabel: string;
  tenantLabel: string;
  logout: React.ReactNode;
  children: React.ReactNode;
}) {
  const [navOpen, setNavOpen] = React.useState(false);
  const pathname = usePathname();
  React.useEffect(() => setNavOpen(false), [pathname]);
  React.useEffect(() => {
    if (!navOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNavOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [navOpen]);

  return <div className="flex min-h-screen bg-slate-50">
    <Sidebar groups={groups} isOpen={navOpen} onClose={() => setNavOpen(false)} />
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="sticky top-0 z-20 flex min-h-14 items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <button type="button" aria-controls="pvh-primary-nav" aria-expanded={navOpen}
            aria-label={navOpen ? "Đóng menu điều hướng" : "Mở menu điều hướng"}
            onClick={() => setNavOpen(value => !value)}
            className="rounded-lg border border-slate-200 p-2 text-slate-800 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700 lg:hidden">
            {navOpen ? <X size={19} aria-hidden="true"/> : <Menu size={19} aria-hidden="true"/>}
          </button>
          <span className="truncate rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
            {tenantLabel}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <span className="hidden max-w-48 truncate rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 sm:block">
            {userLabel}
          </span>
          {logout}
        </div>
      </header>
      <main className="min-w-0 flex-1 p-3 sm:p-6">{children}</main>
    </div>
  </div>;
}
