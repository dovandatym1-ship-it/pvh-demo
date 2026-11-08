export interface ReportSnapshotDTO {
  id: string;
  tenantId: string;
  code: string;
  title: string;
  period: string;
  indicatorsData: Record<string, any>;
  signedBy?: string;
  signedAt?: string;
  sha256Hash?: string;
  status: "DRAFT" | "LOCKED_IMMUTABLE";
  createdAt: string;
}
