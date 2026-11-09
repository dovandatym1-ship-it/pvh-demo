import "server-only";
import crypto from "node:crypto";
import { type Result } from "@/lib/types/result";
import type { RequestContext } from "@/lib/auth/request-context";
import type { CreateReportSnapshotInput, AdvanceReportSnapshotInput } from "../schemas";
import type { ReportSnapshotDTO } from "../types";
import { assertCanDraftReport } from "./policy";
import { reportingRepository } from "./repository";

/** PG_JSONB_TEXT_V1: SHA-256 of exact PostgreSQL jsonb::text bytes.
 * The database produces canonicalText; JS verifies those bytes, not an RFC 8785 claim.
 */
export function computeCanonicalSha256(canonicalText: string): string {
  return crypto.createHash("sha256").update(canonicalText, "utf8").digest("hex");
}
export function verifySnapshotHash(snapshot: ReportSnapshotDTO): boolean {
  return snapshot.hashAlgorithm === "PG_JSONB_TEXT_V1" &&
    computeCanonicalSha256(snapshot.canonicalText) === snapshot.sha256;
}
export const reportingService = {
  createDraftSnapshot(ctx: RequestContext,input: CreateReportSnapshotInput): Promise<Result<ReportSnapshotDTO>> {
    assertCanDraftReport(ctx);
    return reportingRepository.createDraft(ctx,input);
  },
  advanceSnapshot(ctx: RequestContext,input: AdvanceReportSnapshotInput): Promise<Result<ReportSnapshotDTO>> {
    return reportingRepository.advance(ctx,input);
  },
};
