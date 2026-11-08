import "server-only";

import type { RequestContext } from "@/lib/auth/request-context";
import type { ReportSnapshotDTO, SnapshotLineageDTO } from "../types";
import { reportingRepository } from "./repository";

export async function getReportSnapshots(
  ctx: RequestContext
): Promise<ReportSnapshotDTO[]> {
  return await reportingRepository.listSnapshots(ctx);
}

export async function getReportSnapshotById(
  ctx: RequestContext,
  id: string
): Promise<ReportSnapshotDTO | null> {
  const res = await reportingRepository.findSnapshotById(ctx, id);
  return res.ok ? res.data : null;
}

export async function getSnapshotLineage(
  ctx: RequestContext,
  snapshotId: string
): Promise<SnapshotLineageDTO[]> {
  return await reportingRepository.getLineage(ctx, snapshotId);
}
