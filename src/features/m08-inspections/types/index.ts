export type RemediationStatus = "NO_VIOLATION" | "PENDING" | "IN_PROGRESS" | "RESOLVED";

export interface InspectionRecordDTO {
  id: string;
  tenantId: string;
  code: string;
  targetName: string;
  category: string;
  hamletId?: string;
  inspectorName: string;
  inspectionDate: string;
  findingsCount: number;
  remediationStatus: RemediationStatus;
  remediationDeadline?: string;
  notes?: string;
}
