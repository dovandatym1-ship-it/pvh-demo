export type SnapshotStatus = "DRAFT" | "FINALIZED";

export interface ReportSnapshotDTO {
  readonly id: string;
  readonly tenantId: string;
  readonly reportCode: string;
  readonly title: string;
  readonly period: string;
  readonly year: number;
  readonly status: SnapshotStatus;
  readonly payload: Record<string, unknown>;
  readonly sha256: string;
  readonly watermark: string;
  readonly isFinalized: boolean;
  readonly idempotencyKey?: string | null;
  readonly finalizedAt?: string | null;
  readonly finalizedBy?: string | null;
  readonly createdAt: string;
  readonly updatedAt?: string;

  // Backward compatibility fields
  readonly code?: string;
  readonly indicatorsData?: Record<string, unknown>;
  readonly sha256Hash?: string;
  readonly signedBy?: string;
  readonly signedAt?: string;
}

export interface SnapshotLineageDTO {
  readonly id: string;
  readonly snapshotId: string;
  readonly sourceTable: string;
  readonly sourceId: string;
  readonly sourceVersion: number;
  readonly createdAt: string;
}
