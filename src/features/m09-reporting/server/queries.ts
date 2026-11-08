import "server-only";
import type { RequestContext } from "@/lib/auth/request-context";
import type { ReportSnapshotDTO, SnapshotLineageDTO, ReportCatalogEntry } from "../types";
import { assertCanReadReports } from "./policy";
import { reportingRepository } from "./repository";

export async function getReportSnapshots(ctx: RequestContext): Promise<ReportSnapshotDTO[]> {
  assertCanReadReports(ctx);
  const res = await reportingRepository.listSnapshots(ctx);
  if (!res.ok) throw new Error(res.error.message);
  return res.data;
}
export async function getReportCatalog(ctx: RequestContext): Promise<ReportCatalogEntry[]> {
  assertCanReadReports(ctx);
  const res = await reportingRepository.listCatalog();
  if (!res.ok) throw new Error(res.error.message);
  return res.data;
}
export async function getReportSnapshotById(ctx: RequestContext,id: string): Promise<ReportSnapshotDTO | null> {
  assertCanReadReports(ctx);
  const res = await reportingRepository.findSnapshotById(ctx,id);
  if (!res.ok) {
    if (res.error.code === "NOT_FOUND") return null;
    throw new Error(res.error.message);
  }
  return res.data;
}
export async function getSnapshotLineage(ctx: RequestContext,snapshotId: string): Promise<SnapshotLineageDTO[]> {
  assertCanReadReports(ctx);
  const res = await reportingRepository.getLineage(ctx,snapshotId);
  if (!res.ok) throw new Error(res.error.message);
  return res.data;
}
