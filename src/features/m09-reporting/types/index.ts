export type SnapshotStatus = "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "FINALIZED";
export type ReportCode = "RPT-WORK" | "RPT-CULTURE" | "RPT-DIGITAL" | "RPT-INSPECTION" | "RPT-SUMMARY";
export type SnapshotTransition = "SUBMIT" | "START_REVIEW" | "FINALIZE";

export interface ReportSnapshotDTO {
  readonly id: string;
  readonly tenantId: string;
  readonly reportCode: ReportCode;
  readonly title: string;
  readonly period: string;
  readonly year: number;
  readonly revision: number;
  readonly previousSnapshotId: string | null;
  readonly version: number;
  readonly createdBy: string;
  readonly status: SnapshotStatus;
  readonly payload: Record<string, unknown>;
  readonly canonicalText: string;
  readonly sha256: string;
  readonly hashAlgorithm: "PG_JSONB_TEXT_V1";
  readonly watermark: string;
  readonly isFinalized: boolean;
  readonly finalizedAt: string | null;
  readonly finalizedBy: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}
export interface SnapshotLineageDTO {
  readonly id: string;
  readonly snapshotId: string;
  readonly sourceTable: string;
  readonly sourceId: string;
  readonly sourceVersion: number;
  readonly metricGroup: string;
  readonly contribution: Record<string, unknown>;
  readonly createdAt: string;
}
export interface ReportCatalogEntry {
  readonly code: ReportCode;
  readonly title: string;
  readonly metricDefinitions: readonly { code: string; formula: string; unit: string }[];
}
