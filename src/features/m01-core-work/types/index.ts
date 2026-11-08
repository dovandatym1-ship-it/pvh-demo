export interface WorkItemDTO {
  readonly id: string;
  readonly tenantId: string;
  readonly title: string;
  readonly description?: string | null;
  readonly sourceRef?: string | null;
  readonly status:
    | "NEW"
    | "ASSIGNED"
    | "IN_PROGRESS"
    | "UNDER_REVIEW"
    | "COMPLETED"
    | "RETURNED"
    | "CANCELLED";
  readonly priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  readonly category: string;
  readonly assignedTo?: string | null;
  readonly dueDate?: string | null;
  readonly hamletId?: string | null;
  readonly version: number;
  readonly idempotencyKey?: string | null;
  readonly createdAt: string;
  readonly createdBy: string;
  readonly updatedAt: string;
  readonly updatedBy: string;
}

export interface WorkItemEventDTO {
  readonly id: string;
  readonly tenantId: string;
  readonly workItemId: string;
  readonly fromStatus?: string | null;
  readonly toStatus: string;
  readonly actorId: string;
  readonly reason?: string | null;
  readonly payload?: Record<string, unknown>;
  readonly version: number;
  readonly createdAt: string;
  readonly createdBy: string;
}
