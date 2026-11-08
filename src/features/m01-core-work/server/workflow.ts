import "server-only";

/**
 * State Machine & Workflow Specification for M01 Work Items.
 * Authoritative Sources: ORIGINAL_REQUEST.md §R3, ADR-002 §6.8, S2-02
 */

export const WORK_ITEM_STATES = {
  NEW: "NEW",
  ASSIGNED: "ASSIGNED",
  IN_PROGRESS: "IN_PROGRESS",
  UNDER_REVIEW: "UNDER_REVIEW",
  COMPLETED: "COMPLETED",
  RETURNED: "RETURNED",
  CANCELLED: "CANCELLED",
} as const;

export type WorkItemState = typeof WORK_ITEM_STATES[keyof typeof WORK_ITEM_STATES];

export interface StateTransitionRule {
  from: WorkItemState;
  to: WorkItemState;
  requiredPermission: string;
  requiresReason?: boolean;
}

export const STATE_TRANSITIONS: StateTransitionRule[] = [
  { from: "NEW", to: "ASSIGNED", requiredPermission: "m01:work_item:assign" },
  { from: "NEW", to: "IN_PROGRESS", requiredPermission: "m01:work_item:update" },
  { from: "NEW", to: "CANCELLED", requiredPermission: "m01:work_item:delete" },
  { from: "ASSIGNED", to: "IN_PROGRESS", requiredPermission: "m01:work_item:update" },
  { from: "ASSIGNED", to: "CANCELLED", requiredPermission: "m01:work_item:delete" },
  { from: "IN_PROGRESS", to: "UNDER_REVIEW", requiredPermission: "m01:work_item:update" },
  { from: "IN_PROGRESS", to: "CANCELLED", requiredPermission: "m01:work_item:delete" },
  { from: "UNDER_REVIEW", to: "COMPLETED", requiredPermission: "m01:work_item:approve" },
  { from: "UNDER_REVIEW", to: "RETURNED", requiredPermission: "m01:work_item:approve", requiresReason: true },
  { from: "RETURNED", to: "IN_PROGRESS", requiredPermission: "m01:work_item:update" },
  { from: "RETURNED", to: "CANCELLED", requiredPermission: "m01:work_item:delete" },
];

export function canTransitionState(
  fromState: string,
  toState: string,
  permissions: string[]
): { allowed: boolean; reason?: string } {
  const rule = STATE_TRANSITIONS.find(
    (r) => r.from === fromState && r.to === toState
  );

  if (!rule) {
    return {
      allowed: false,
      reason: `INVALID_TRANSITION: Cannot transition from ${fromState} to ${toState}`,
    };
  }

  if (!permissions.includes(rule.requiredPermission)) {
    return {
      allowed: false,
      reason: `FORBIDDEN: Missing required permission ${rule.requiredPermission}`,
    };
  }

  return { allowed: true };
}
