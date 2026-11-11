import type { DashboardItem, DashboardStatus, DashboardDomain, DashboardModel } from "./metrics.mjs";
export type QueueFilter = "urgent" | "overdue" | "soon" | "review" | "returned" | "unassigned" | "progress" | "all";
export interface RoleCard {
  id: string; label: string; value: number; detail: string;
  tone: "bad" | "warn" | "info" | "primary"; filter: QueueFilter;
}
export interface RolePresentation {
  role: "leader" | "officer" | "hamlet";
  title: string; subtitle: string; cards: RoleCard[];
  focusItems: DashboardItem[]; focusOpen: DashboardItem[];
  ageRanges: { key: string; label: string; count: number }[];
  statuses: DashboardStatus[]; domains: DashboardDomain[];
  priorityIds: string[]; queueTitle: string; queueSubtitle: string;
  ageTitle: string; domainTitle: string; statusTitle: string;
  totalFocus: number; totalFocusOpen: number; warningCount: number;
}
export declare function buildRolePresentation(model: DashboardModel): RolePresentation;
