import "server-only";
import type { WorkFilter, WorkQuick } from "./queries";

// Shared, allowlisted view and drill-down choices for the work-list route.
export const workViewFilters: readonly { id: WorkFilter; label: string }[] = [
  { id: "scope", label: "Phạm vi của tôi" },
  { id: "mine", label: "Việc được giao" },
  { id: "created", label: "Do tôi tạo" },
  { id: "review", label: "Chờ rà soát" },
  { id: "hamlet", label: "Theo thôn, xóm" },
  { id: "all", label: "Toàn đơn vị" },
];
export const workQuickFilters: readonly WorkQuick[] = [
  "overdue", "soon", "returned", "review", "unassigned", "progress", "open", "urgent",
];
