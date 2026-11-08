export type RemediationStatus = "NO_VIOLATION" | "PENDING" | "IN_PROGRESS" | "RESOLVED";

export interface InspectionRecordDTO {
  readonly id: string;
  readonly tenantId: string;
  readonly code: string;
  readonly targetName: string;
  readonly category: string;
  readonly hamletId?: string;
  readonly inspectorName: string;
  readonly inspectionDate: string;
  readonly findingsCount: number;
  readonly remediationStatus: RemediationStatus;
  readonly remediationDeadline?: string;
  readonly notes?: string;
}

export interface InspectionRecommendationDTO {
  readonly id: string;
  readonly inspectionId: string;
  readonly code: string;
  readonly title: string;
  readonly facilityName: string;
  readonly hamletId: string;
  readonly assignee: string;
  readonly dueDate: string;
  readonly status: "WAITING_OVERDUE" | "FEEDBACK_UNVERIFIED" | "RESOLVED_CLOSED";
  readonly metric: string;
}
