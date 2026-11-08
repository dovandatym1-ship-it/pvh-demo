"use client";

import * as React from "react";
import { DemoProvider, useDemoContext } from "@/lib/tenancy/demo-context";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

function DashboardShell({ children }: { children: React.ReactNode }) {
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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DemoProvider>
      <DashboardShell>{children}</DashboardShell>
    </DemoProvider>
  );
}
