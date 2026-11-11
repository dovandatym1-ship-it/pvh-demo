/**
 * PH02 client-safe workflow projection. Migration 20261108060000 is authoritative.
 * Do not authorize business mutations from this client-readable table.
 */
export const WORK_ITEM_STATES = [
  "NEW", "ASSIGNED", "IN_PROGRESS", "UNDER_REVIEW",
  "RETURNED", "COMPLETED", "CANCELLED",
] as const;
export type WorkItemState = (typeof WORK_ITEM_STATES)[number];
export type WorkTransition = {
  from: WorkItemState;
  to: WorkItemState;
  permission: string;
  scope: "ASSIGNEE" | "REVIEWER" | "MANAGER";
  reason?: boolean;
  evidence?: boolean;
};

export const WORKFLOW_VERSION = 1;
export const STATE_TRANSITIONS: readonly WorkTransition[] = [
  { from: "NEW", to: "ASSIGNED", permission: "m01:work:assign", scope: "MANAGER" },
  { from: "ASSIGNED", to: "IN_PROGRESS", permission: "m01:work:update", scope: "ASSIGNEE" },
  { from: "IN_PROGRESS", to: "UNDER_REVIEW", permission: "m01:work:update", scope: "ASSIGNEE", evidence: true },
  { from: "UNDER_REVIEW", to: "RETURNED", permission: "m01:work:review", scope: "REVIEWER", reason: true },
  { from: "RETURNED", to: "IN_PROGRESS", permission: "m01:work:update", scope: "ASSIGNEE" },
  { from: "UNDER_REVIEW", to: "COMPLETED", permission: "m01:work:review", scope: "REVIEWER" },
  { from: "NEW", to: "CANCELLED", permission: "m01:work:assign", scope: "MANAGER", reason: true },
  { from: "ASSIGNED", to: "CANCELLED", permission: "m01:work:assign", scope: "MANAGER", reason: true },
  { from: "IN_PROGRESS", to: "CANCELLED", permission: "m01:work:assign", scope: "MANAGER", reason: true },
  { from: "RETURNED", to: "CANCELLED", permission: "m01:work:assign", scope: "MANAGER", reason: true },
  { from: "UNDER_REVIEW", to: "CANCELLED", permission: "m01:work:assign", scope: "MANAGER", reason: true },
];

export function allowedTransitions(
  status: WorkItemState,
  permissions: readonly string[],
  isAssignee: boolean,
  isReviewer: boolean,
): readonly WorkTransition[] {
  return STATE_TRANSITIONS.filter((rule) =>
    rule.from === status && permissions.includes(rule.permission) &&
    (rule.scope === "MANAGER" || rule.scope === "ASSIGNEE" && isAssignee ||
      rule.scope === "REVIEWER" && isReviewer)
  );
}

export function isOverdue(dueDate: string | null | undefined, status: WorkItemState, now: Date): boolean {
  return !!dueDate && !["COMPLETED", "CANCELLED"].includes(status) &&
    new Date(dueDate).getTime() < now.getTime();
}
