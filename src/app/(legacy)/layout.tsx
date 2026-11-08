"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { DemoProvider, useDemoContext } from "@/lib/tenancy/demo-context";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

function LegacyDashboardShell({ children }: { children: React.ReactNode }) {
  const { tenant, setTenant, persona, setPersona } = useDemoContext();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        persona={persona}
        tenant={tenant}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Amber Warning Banner for Strangler Isolation (ADR-002 / D-02) */}
        <div
          data-testid="legacy-mock-banner"
          className="bg-amber-500 text-amber-950 px-4 py-2 text-xs sm:text-sm font-medium flex items-center justify-between border-b border-amber-600/40 shadow-xs sticky top-0 z-30 shrink-0"
        >
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-amber-900 text-amber-50 tracking-wider font-mono">
              LEGACY_MOCK
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-950 shrink-0 hidden sm:inline" />
            <span className="font-semibold">
              MÀN HÌNH LEGACY PROTOTYPE — ĐANG CHỜ CHUYỂN ĐỔI SANG KIẾN TRÚC MỚI (ADR-001/002)
            </span>
          </div>
          <span className="text-xs text-amber-950/80 hidden md:inline font-mono">
            Dữ liệu mô phỏng localStorage
          </span>
        </div>

        <Header
          tenant={tenant}
          persona={persona}
          onSelectTenant={setTenant}
          onSelectPersona={setPersona}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

export default function LegacyDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DemoProvider>
      <LegacyDashboardShell>{children}</LegacyDashboardShell>
    </DemoProvider>
  );
}
