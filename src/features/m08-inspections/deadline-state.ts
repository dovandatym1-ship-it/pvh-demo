export type InspectionDeadlineState =
  | "OVERDUE"
  | "DUE_TODAY"
  | "UPCOMING"
  | "CLOSED"
  | "UNKNOWN";

const TERMINAL_STATUSES = new Set(["RESOLVED", "RESOLVED_CLOSED", "NO_VIOLATION"]);
const ACTIVE_STATUSES = new Set(["PENDING", "FEEDBACK_UNVERIFIED", "IN_PROGRESS"]);

/** Projects a deadline label without overwriting the workflow's persisted status. */
export function inspectionDeadlineState(
  status: string,
  dueDate: string | null | undefined,
  today: string,
): InspectionDeadlineState {
  if (TERMINAL_STATUSES.has(status)) return "CLOSED";
  if (!ACTIVE_STATUSES.has(status)) return "UNKNOWN";
  if (!isCivilDate(today) || !dueDate || !isCivilDate(dueDate)) return "UNKNOWN";
  if (dueDate < today) return "OVERDUE";
  if (dueDate === today) return "DUE_TODAY";
  return "UPCOMING";
}

function isCivilDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
