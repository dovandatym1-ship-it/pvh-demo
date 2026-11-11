export type NotificationStatusFilter = "all" | "unread" | "read";
export type NotificationGroupFilter = "all" | "assignment" | "workflow" | "deadline";
export type NotificationPeriodFilter = "all" | "7d" | "30d";
export type NotificationFilters = {
  status: NotificationStatusFilter;
  group: NotificationGroupFilter;
  period: NotificationPeriodFilter;
};

export const DEFAULT_NOTIFICATION_FILTERS: NotificationFilters = {
  status: "all", group: "all", period: "all",
};

export const NOTIFICATION_EVENTS: Record<Exclude<NotificationGroupFilter, "all">, string[]> = {
  assignment: ["WORK_ASSIGNED"],
  workflow: ["WORK_RETURNED", "WORK_COMPLETED", "WORK_CANCELLED", "WORK_REVIEW"],
  deadline: ["WORK_DEADLINE_CHANGED"],
};

export function normalizeNotificationFilters(values: {
  status?: string; group?: string; period?: string;
}): NotificationFilters {
  const status = values.status === "unread" || values.status === "read" ? values.status : "all";
  const group = values.group === "assignment" || values.group === "workflow" || values.group === "deadline"
    ? values.group : "all";
  const period = values.period === "7d" || values.period === "30d" ? values.period : "all";
  return { status, group, period };
}

export function notificationPageUrl(filters: NotificationFilters, page = 1): string {
  const params = new URLSearchParams();
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.group !== "all") params.set("group", filters.group);
  if (filters.period !== "all") params.set("period", filters.period);
  if (page > 1) params.set("page", String(Math.floor(page)));
  return "/thong-bao" + (params.size ? `?${params.toString()}` : "");
}
