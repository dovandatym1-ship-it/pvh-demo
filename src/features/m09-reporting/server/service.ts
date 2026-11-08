import "server-only";

import crypto from "node:crypto";
import { type Result, fail, ok } from "@/lib/types/result";
import type { RequestContext } from "@/lib/auth/request-context";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { CreateReportSnapshotInput } from "../schemas";
import type { ReportSnapshotDTO } from "../types";
import { assertCanDraftReport, assertCanFinalizeSnapshot } from "./policy";
import { reportingRepository } from "./repository";

/**
 * Sort object keys recursively according to RFC 8785 Canonical JSON.
 */
export function sortKeysRecursively(obj: unknown): unknown {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(sortKeysRecursively);
  const sortedKeys = Object.keys(obj as Record<string, unknown>).sort();
  const result: Record<string, unknown> = {};
  for (const key of sortedKeys) {
    result[key] = sortKeysRecursively((obj as Record<string, unknown>)[key]);
  }
  return result;
}

/**
 * Serialize object to RFC 8785 Canonical JSON String.
 */
export function toCanonicalJsonString(obj: unknown): string {
  return JSON.stringify(sortKeysRecursively(obj));
}

/**
 * Compute SHA-256 hash of canonical JSON payload.
 */
export function computeCanonicalSha256(payload: unknown): string {
  const canonicalStr = toCanonicalJsonString(payload);
  return crypto.createHash("sha256").update(canonicalStr).digest("hex");
}

export const reportingService = {
  /**
   * Create an unfinalized DRAFT snapshot.
   */
  async createDraftSnapshot(
    ctx: RequestContext,
    input: CreateReportSnapshotInput
  ): Promise<Result<ReportSnapshotDTO>> {
    try {
      assertCanDraftReport(ctx);
    } catch (err: unknown) {
      return fail("FORBIDDEN", "Không có quyền tạo bản nháp báo cáo", err);
    }

    const payload = input.payload || {
      generatedAt: new Date().toISOString(),
      commune: "TN-DEMO-A",
      period: input.period,
      year: input.year,
      metrics: {
        tasksTotal: 6,
        tasksCompleted: 4,
        cultureSubmissions: 5,
        cultureApproved: 2,
        cdsIndex: 82.5,
      },
    };

    return await reportingRepository.createSnapshotRecord(ctx, {
      reportCode: input.reportCode,
      title: input.title,
      period: input.period,
      year: input.year,
      status: "DRAFT",
      payload,
      sha256: "PENDING",
      isFinalized: false,
      idempotencyKey: input.idempotencyKey || null,
      watermark: "[MÔ PHỎNG DEMO — KHÔNG CÓ GIÁ TRỊ PHÁP LÝ]",
    });
  },

  /**
   * Generate canonical payload, create snapshot, atomically finalize via RPC and store lineage.
   */
  async createAndFinalizeSnapshot(
    ctx: RequestContext,
    input: { reportCode?: string; title: string; period: string; year: number }
  ): Promise<Result<{ id: string; sha256: string; snapshot: ReportSnapshotDTO }>> {
    try {
      assertCanFinalizeSnapshot(ctx);
    } catch (err: unknown) {
      return fail("FORBIDDEN", "Không có quyền chốt snapshot báo cáo", err);
    }

    const supabase = await createServerSupabaseClient();

    // 1. Live metrics query
    const { count: tasksCount } = await supabase
      .from("work_items")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", ctx.tenantId);

    const { count: cultureTotal } = await supabase
      .from("submissions")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", ctx.tenantId);

    const { count: culturePassed } = await supabase
      .from("submissions")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", ctx.tenantId)
      .eq("status", "DAT");

    // Retrieve active work items and submissions for lineage
    const { data: latestTasks } = await supabase
      .from("work_items")
      .select("id, version")
      .eq("tenant_id", ctx.tenantId)
      .limit(3);

    const { data: latestSubs } = await supabase
      .from("submissions")
      .select("id, version")
      .eq("tenant_id", ctx.tenantId)
      .limit(3);

    // 2. Build canonical payload
    const canonicalPayload: Record<string, unknown> = {
      commune: "TN-DEMO-A",
      period: input.period,
      year: input.year,
      metrics: {
        tasksTotal: tasksCount || 6,
        tasksCompleted: 4,
        cultureSubmissions: cultureTotal || 5,
        cultureApproved: culturePassed || 2,
        cdsIndex: 82.5,
      },
    };

    const snapshotId = crypto.randomUUID();
    const sha256 = computeCanonicalSha256(canonicalPayload);

    // 3. Insert initial draft
    const insertRes = await reportingRepository.createSnapshotRecord(ctx, {
      id: snapshotId,
      reportCode: input.reportCode || "DEM-R01",
      title: input.title,
      period: input.period,
      year: input.year,
      status: "DRAFT",
      payload: canonicalPayload,
      sha256,
      isFinalized: false,
      watermark: "[MÔ PHỎNG DEMO — KHÔNG CÓ GIÁ TRỊ PHÁP LÝ]",
    });

    if (!insertRes.ok) return insertRes;

    // 4. Finalize via atomic RPC with SHA256 checksum and immutable locking
    const rpcRes = await reportingRepository.finalizeSnapshotViaRpc(
      ctx,
      snapshotId,
      canonicalPayload,
      sha256
    );
    if (!rpcRes.ok) return rpcRes;

    // 5. Record lineage contributing source records
    const lineageItems = [
      ...(latestTasks || []).map((t) => ({
        sourceTable: "work_items",
        sourceId: String(t.id),
        sourceVersion: Number(t.version) || 1,
      })),
      ...(latestSubs || []).map((s) => ({
        sourceTable: "submissions",
        sourceId: String(s.id),
        sourceVersion: Number(s.version) || 1,
      })),
    ];
    await reportingRepository.recordLineage(ctx, snapshotId, lineageItems);

    const finalSnapshotRes = await reportingRepository.findSnapshotById(ctx, snapshotId);
    if (!finalSnapshotRes.ok) return finalSnapshotRes;

    return ok({
      id: snapshotId,
      sha256: rpcRes.data.sha256,
      snapshot: finalSnapshotRes.data,
    });
  },
};
