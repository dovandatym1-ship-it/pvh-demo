import * as React from "react";
import { getRequestContext } from "@/lib/auth/request-context";
import { filterNavigation } from "@/config/navigation";
import { Sidebar } from "@/components/layout/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let filteredGroups: ReturnType<typeof filterNavigation> = [];

  try {
    const ctx = await getRequestContext();
    filteredGroups = filterNavigation(ctx.permissions, ctx.roles);
  } catch {
    filteredGroups = filterNavigation([]);
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar groups={filteredGroups} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-slate-200 bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              UBND Xã Giả Định A
            </span>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
