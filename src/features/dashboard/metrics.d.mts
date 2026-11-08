export interface DashboardItem {
  id: string;
  tenantId: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  assignedTo?: string | null;
  dueDate?: string | null;
  hamletId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardContext {
  tenantId: string;
  userId: string;
  roles: readonly string[];
  scopes: { readonly hamletIds?: readonly string[]; readonly sectorIds?: readonly string[] };
}

export interface DashboardCompletionEvent {
  workItemId: string;
  toStatus: string;
  createdAt: string;
}

export type DeadlineState = { kind: "closed" | "unset" | "overdue" | "soon" | "later"; days: number | null };
export declare function vietnamDay(value: string | Date): string | null;
export declare function deadlineState(item: Pick<DashboardItem, "dueDate" | "status">, today: string): DeadlineState;
export declare function roleKind(ctx: DashboardContext): "leader" | "hamlet" | "officer";
export declare function scopeWorkItems<T extends DashboardItem>(items: readonly T[], ctx: DashboardContext): T[];

export interface DashboardStatus { code: string; label: string; color: string; count: number }
export interface DashboardDomain {
  code: string;
  label: string;
  categories: readonly string[];
  href: string;
  icon: string;
  count: number;
  overdue: number;
}
export interface DashboardModel {
  today: string;
  role: "leader" | "hamlet" | "officer";
  userId: string;
  items: DashboardItem[];
  total: number;
  open: number;
  overdue: number;
  dueSoon: number;
  review: number;
  focus: { label: string; value: number };
  queueIds: string[];
  queueCount: number;
  statuses: DashboardStatus[];
  domains: DashboardDomain[];
  workload: { id: string; label: string; count: number }[];
  hamlets: { id: string; count: number }[];
  weekly: { start: string; label: string; created: number; completed: number }[];
  eventsAvailable: boolean;
  lastUpdated: string | null;
  demo: boolean;
  scopeLabel: string;
  roleLabel: string;
}

export declare const DASHBOARD_STATUSES: readonly { code: string; label: string; color: string }[];
export declare const DASHBOARD_DOMAINS: readonly {
  code: string; label: string; categories: readonly string[]; href: string; icon: string;
}[];

export declare function buildDashboardModel(input: {
  items: DashboardItem[];
  completionEvents?: DashboardCompletionEvent[];
  ctx: DashboardContext;
  now?: string | Date;
  eventsAvailable?: boolean;
  eventsTruncated?: boolean;
}): DashboardModel;
