"use client";

import * as React from "react";
import { TENANTS, TenantConfig } from "./tenant-config";
import { PERSONAS, Persona } from "../auth/session";
import {
  DemoState,
  TenantDemoData,
  TenantCode,
  TenantMetrics,
  AuditLogEntry,
  createInitialDemoState,
  getInitialGoldenSeed,
} from "../store/demo-state";

export interface OracleMetrics {
  met01_openTasks: string;
  met02_overdueTasks: string;
  met03_culturalRate: string;
  met04_cdsCoverage: string;
  met05_openInspections: string;
}

export type MetricFilter = "MET-01" | "MET-02" | "MET-04" | "MET-05" | null;

export interface DemoContextValue {
  tenant: TenantConfig;
  setTenant: (t: TenantConfig) => void;
  persona: Persona;
  setPersona: (p: Persona) => void;
  currentTenantCode: TenantCode;
  data: TenantDemoData;
  metrics: TenantMetrics;
  oracleMetrics: OracleMetrics;
  demoState: DemoState;
  setDemoState: React.Dispatch<React.SetStateAction<DemoState>>;
  updateTenantData: (
    updater: (prev: TenantDemoData) => TenantDemoData,
    targetTenantCode?: TenantCode
  ) => void;
  resetTenant: (tenantIdOrCode: "XA_A" | "XA_B" | string) => void;
  addAuditLog: (
    entry: Omit<AuditLogEntry, "id" | "timestamp" | "tenantId" | "userId" | "personaCode"> & {
      tenantId?: string;
      id?: string;
      timestamp?: string;
      userId?: string;
      personaCode?: string;
    }
  ) => void;
  auditLogs: AuditLogEntry[];
  activeFilter: MetricFilter;
  setActiveFilter: (filter: MetricFilter) => void;
  delegationExpired: boolean;
  setDelegationExpired: (val: boolean) => void;
  isHydrated: boolean;
}

const STORAGE_KEY = "pvh_demo_state_v1";

const DemoContext = React.createContext<DemoContextValue | undefined>(undefined);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = React.useState<TenantConfig>(TENANTS.xa_a);
  const [persona, setPersona] = React.useState<Persona>(PERSONAS.P2);
  const [demoState, setDemoState] = React.useState<DemoState>(createInitialDemoState);
  const [isHydrated, setIsHydrated] = React.useState(false);
  const [activeFilter, setActiveFilter] = React.useState<MetricFilter>(null);

  // Initial client hydration from localStorage
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.xa_a && parsed.xa_b) {
          const fresh = createInitialDemoState();
          if (!parsed.xa_a.residenceHistory) {
            parsed.xa_a.residenceHistory = fresh.xa_a.residenceHistory;
          }
          if (!parsed.xa_b.residenceHistory) {
            parsed.xa_b.residenceHistory = fresh.xa_b.residenceHistory;
          }
          if (!parsed.auditLogs || parsed.auditLogs.length === 0) {
            parsed.auditLogs = fresh.auditLogs;
          }
          // Normalize tenants dictionary in case of older saved structure
          parsed.tenants = {
            XA_A: parsed.xa_a,
            XA_B: parsed.xa_b,
            xa_a: parsed.xa_a,
            xa_b: parsed.xa_b,
          };
          setDemoState(parsed);
          setIsHydrated(true);
          return;
        }
      }
      // If not present or invalid, seed localStorage
      const initial = createInitialDemoState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    } catch (e) {
      console.error("Failed to load demo state from localStorage", e);
    }
    setIsHydrated(true);
  }, []);

  // Save to localStorage when state changes (after initial hydration)
  React.useEffect(() => {
    if (!isHydrated || typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(demoState));
    } catch (e) {
      console.error("Failed to persist demo state to localStorage", e);
    }
  }, [demoState, isHydrated]);

  // Resolve current active tenant code
  const currentTenantCode: TenantCode =
    tenant.code === "XA_B" || tenant.id === TENANTS.xa_b.id ? "XA_B" : "XA_A";

  const currentSliceKey = currentTenantCode === "XA_A" ? "xa_a" : "xa_b";
  const activeData: TenantDemoData = demoState[currentSliceKey] || demoState.xa_a;

  // Reactive MET-01..05 calculation for the active tenant
  const reactiveMetrics = React.useMemo(() => {
    // MET-01: Open tasks (not completed and not cancelled)
    const openTasks = activeData.tasks.filter(
      (t) => t.status !== "Hoàn thành" && t.status !== "Đã hủy"
    );
    const met01 = openTasks.length;

    // MET-02: Overdue open tasks
    const met02 = openTasks.filter((t) => t.isOverdue).length;

    // MET-03: Cultural title pass rate (approved / submitted)
    const submittedCultural = activeData.culturalTitles.filter(
      (t) => t.status !== "DRAFT" && t.status !== "CANCELLED"
    );
    const approvedCultural = submittedCultural.filter((t) => t.status === "APPROVED");
    const met03 =
      submittedCultural.length > 0
        ? `${((approvedCultural.length / submittedCultural.length) * 100).toFixed(1)}%`
        : "0.0%";

    // MET-04: CDS indicators confirmed rate
    let met04Str = "0%";
    let met04Num = 0;
    if (!tenant.features.digitalTransformation || currentTenantCode === "XA_B") {
      met04Str = "N/A";
    } else {
      const applicableCds = activeData.cdsMatrix.filter((c) => c.status !== "NOT_APPLICABLE");
      const confirmedCds = applicableCds.filter(
        (c) => c.status === "CONFIRMED" || c.status === "CONFIRMED_ZERO"
      );
      met04Num =
        applicableCds.length > 0
          ? Math.round((confirmedCds.length / applicableCds.length) * 100)
          : 0;
      met04Str = `${met04Num}%`;
    }

    // MET-05: Open inspection recommendations
    let met05 = 0;
    if (tenant.features.fieldInspection) {
      met05 = (activeData.recommendations || []).filter(
        (r) => r.status !== "RESOLVED_CLOSED"
      ).length;
    }

    const metrics: TenantMetrics = {
      met01,
      met02,
      met03,
      met04: met04Str === "N/A" ? "N/A" : met04Num,
      met05,
    };

    const oracleMetrics: OracleMetrics = {
      met01_openTasks: met01 < 10 ? `0${met01}` : `${met01}`,
      met02_overdueTasks: met02 < 10 ? `0${met02}` : `${met02}`,
      met03_culturalRate: met03,
      met04_cdsCoverage: met04Str,
      met05_openInspections: met05 < 10 ? `0${met05}` : `${met05}`,
    };

    return { metrics, oracleMetrics };
  }, [activeData, tenant.features, currentTenantCode]);

  // Action: Update tenant data
  const updateTenantData = React.useCallback(
    (
      updater: (prev: TenantDemoData) => TenantDemoData,
      targetTenantCode?: TenantCode
    ) => {
      const targetCode: TenantCode = targetTenantCode || currentTenantCode;
      const targetKey = targetCode === "XA_A" ? "xa_a" : "xa_b";

      setDemoState((prev) => {
        const currentTargetData = prev[targetKey];
        const nextTargetData = updater(currentTargetData);

        const nextState: DemoState = {
          ...prev,
          [targetKey]: nextTargetData,
          tenants: {
            ...prev.tenants,
            [targetCode]: nextTargetData,
            [targetKey]: nextTargetData,
          },
        };

        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
          } catch (e) {
            console.error("Error writing updated tenant data to storage", e);
          }
        }
        return nextState;
      });
    },
    [currentTenantCode]
  );

  // Action: Add audit log
  const addAuditLog = React.useCallback(
    (
      entry: Omit<AuditLogEntry, "id" | "timestamp" | "tenantId" | "userId" | "personaCode"> & {
        tenantId?: string;
        id?: string;
        timestamp?: string;
        userId?: string;
        personaCode?: string;
      }
    ) => {
      const logItem: AuditLogEntry = {
        id: entry.id || `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: entry.timestamp || new Date().toISOString(),
        tenantId: entry.tenantId || tenant.id,
        userId: entry.userId || persona.id,
        personaCode: entry.personaCode || persona.code,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        details: entry.details,
        ipAddress: entry.ipAddress || "127.0.0.1 (Localhost Demo)",
      };

      setDemoState((prev) => {
        const nextState: DemoState = {
          ...prev,
          auditLogs: [logItem, ...prev.auditLogs],
        };
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
          } catch (e) {
            console.error("Error writing audit log to storage", e);
          }
        }
        return nextState;
      });
    },
    [tenant.id, persona.id, persona.code]
  );

  // Action: Reset tenant data slice independently
  const resetTenant = React.useCallback(
    (tenantIdOrCode: "XA_A" | "XA_B" | string) => {
      const targetCode: TenantCode =
        tenantIdOrCode.toUpperCase().includes("B") ? "XA_B" : "XA_A";
      const targetKey = targetCode === "XA_A" ? "xa_a" : "xa_b";
      const pristineSeed = getInitialGoldenSeed(targetCode);

      setDemoState((prev) => {
        const resetAuditLog: AuditLogEntry = {
          id: `audit-reset-${Date.now()}`,
          timestamp: new Date().toISOString(),
          tenantId: targetCode === "XA_A" ? TENANTS.xa_a.id : TENANTS.xa_b.id,
          userId: persona.id,
          personaCode: persona.code,
          action: "AUDIT_RESET_TENANT",
          entityType: "TENANT",
          entityId: targetCode,
          details: {
            message: `Khôi phục toàn bộ bảng dữ liệu ${
              targetCode === "XA_A" ? "Xã Giả định A (TN-DEMO-A)" : "Xã Giả định B (TN-DEMO-B)"
            } về trạng thái Golden Seed ban đầu`,
            preservedTenant: targetCode === "XA_A" ? "XA_B" : "XA_A",
          },
          ipAddress: "127.0.0.1 (Localhost Demo)",
        };

        const nextState: DemoState = {
          ...prev,
          [targetKey]: pristineSeed,
          tenants: {
            ...prev.tenants,
            [targetCode]: pristineSeed,
            [targetKey]: pristineSeed,
          },
          auditLogs: [resetAuditLog, ...prev.auditLogs],
        };

        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
          } catch (e) {
            console.error("Error saving reset state to localStorage", e);
          }
        }
        return nextState;
      });
    },
    [persona.id, persona.code]
  );

  const setDelegationExpired = React.useCallback((val: boolean) => {
    setDemoState((prev) => ({
      ...prev,
      delegationExpired: val,
    }));
  }, []);

  const value: DemoContextValue = {
    tenant,
    setTenant,
    persona,
    setPersona,
    currentTenantCode,
    data: activeData,
    metrics: reactiveMetrics.metrics,
    oracleMetrics: reactiveMetrics.oracleMetrics,
    demoState,
    setDemoState,
    updateTenantData,
    resetTenant,
    addAuditLog,
    auditLogs: demoState.auditLogs || [],
    activeFilter,
    setActiveFilter,
    delegationExpired: Boolean(demoState.delegationExpired),
    setDelegationExpired,
    isHydrated,
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemoContext() {
  const ctx = React.useContext(DemoContext);
  if (!ctx) {
    throw new Error("useDemoContext must be used within DemoProvider");
  }
  return ctx;
}

// Convenient alias matching PROJECT.md interface contract
export const useDemo = useDemoContext;
