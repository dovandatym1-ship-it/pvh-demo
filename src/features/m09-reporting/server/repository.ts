import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { type Result, ok, fail } from "@/lib/types/result";
import type { RequestContext } from "@/lib/auth/request-context";
import type { ReportSnapshotDTO, SnapshotLineageDTO, SnapshotStatus } from "../types";

export interface CreateSnapshotRepoInput {
  readonly id?: string;
  readonly reportCode: string;
  readonly title: string;
  readonly period: string;
  readonly year: number;
  readonly status: SnapshotStatus;
  readonly payload: Record<string, unknown>;
  readonly sha256: string;
  readonly isFinalized: boolean;
  readonly idempotencyKey?: string | null;
  readonly watermark?: string;
}

export interface LineageRepoInput {
  readonly sourceTable: string;
  readonly sourceId: string;
  readonly sourceVersion: number;
}

function mapSnapshotRow(row: Record<string, unknown>): ReportSnapshotDTO {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    reportCode: String(row.report_code),
    title: String(row.title),
    period: String(row.period),
    year: Number(row.year),
    status: row.status as SnapshotStatus,
    payload: (row.payload as Record<string, unknown>) || {},
    sha256: String(row.sha256 || ""),
    watermark: String(row.watermark || "[MÔ PHỎNG DEMO — KHÔNG CÓ GIÁ TRỊ PHÁP LÝ]"),
    isFinalized: Boolean(row.is_finalized),
    idempotencyKey: (row.idempotency_key as string) || null,
    finalizedAt: (row.finalized_at as string) || null,
    finalizedBy: (row.finalized_by as string) || null,
    createdAt: String(row.created_at),
    updatedAt: (row.updated_at as string) || undefined,
    // Compat
    code: String(row.report_code),
    indicatorsData: (row.payload as Record<string, unknown>) || {},
    sha256Hash: String(row.sha256 || ""),
    signedBy: (row.finalized_by as string) || undefined,
    signedAt: (row.finalized_at as string) || undefined,
  };
}

export const reportingRepository = {
  async createSnapshotRecord(
    ctx: RequestContext,
    input: CreateSnapshotRepoInput
  ): Promise<Result<ReportSnapshotDTO>> {
    try {
      const supabase = await createServerSupabaseClient();
      const snapshotId = input.id || crypto.randomUUID();

      const { data, error } = await supabase
        .from("report_snapshots")
        .insert({
          id: snapshotId,
          tenant_id: ctx.tenantId,
          report_code: input.reportCode,
          title: input.title,
          period: input.period,
          year: input.year,
          status: input.status,
          payload: input.payload,
          sha256: input.sha256,
          watermark: input.watermark || "[MÔ PHỎNG DEMO — KHÔNG CÓ GIÁ TRỊ PHÁP LÝ]",
          is_finalized: input.isFinalized,
          idempotency_key: input.idempotencyKey || null,
          created_by: ctx.userId,
          finalized_at: input.isFinalized ? new Date().toISOString() : null,
          finalized_by: input.isFinalized ? ctx.userId : null,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          return fail("DUPLICATE_REQUEST", "Snapshot với idempotency key này đã tồn tại", error);
        }
        return fail("INTERNAL", `Lỗi CSDL khi tạo snapshot: ${error.message}`, error);
      }

      return ok(mapSnapshotRow(data as Record<string, unknown>));
    } catch (err: unknown) {
      return fail("INTERNAL", "Lỗi ngoại lệ tại reportingRepository.createSnapshotRecord", err);
    }
  },

  async finalizeSnapshotViaRpc(
    ctx: RequestContext,
    snapshotId: string,
    canonicalPayload: Record<string, unknown>
  ): Promise<Result<{ id: string; sha256: string; status: string }>> {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase.rpc("finalize_report_snapshot", {
        p_snapshot_id: snapshotId,
        p_canonical_payload: canonicalPayload,
      });

      if (error) {
        if (error.message.includes("FORBIDDEN")) {
          return fail("FORBIDDEN", "Không có quyền chốt snapshot báo cáo", error);
        }
        if (error.message.includes("NOT_FOUND")) {
          return fail("NOT_FOUND", "Không tìm thấy snapshot báo cáo", error);
        }
        return fail("INTERNAL", `Lỗi RPC finalize_report_snapshot: ${error.message}`, error);
      }

      const res = data as { ok: boolean; id: string; sha256: string; status: string };
      return ok({ id: res.id, sha256: res.sha256, status: res.status });
    } catch (err: unknown) {
      return fail("INTERNAL", "Lỗi ngoại lệ khi gọi RPC finalize_report_snapshot", err);
    }
  },

  async recordLineage(
    ctx: RequestContext,
    snapshotId: string,
    items: LineageRepoInput[]
  ): Promise<Result<true>> {
    try {
      if (items.length === 0) return ok(true);
      const supabase = await createServerSupabaseClient();
      const rows = items.map((item) => ({
        tenant_id: ctx.tenantId,
        snapshot_id: snapshotId,
        source_table: item.sourceTable,
        source_id: item.sourceId,
        source_version: item.sourceVersion,
      }));

      const { error } = await supabase.from("report_snapshot_lineage").insert(rows);
      if (error) {
        return fail("INTERNAL", `Lỗi CSDL khi ghi vết lineage: ${error.message}`, error);
      }
      return ok(true);
    } catch (err: unknown) {
      return fail("INTERNAL", "Lỗi ngoại lệ tại recordLineage", err);
    }
  },

  async findSnapshotById(
    ctx: RequestContext,
    snapshotId: string
  ): Promise<Result<ReportSnapshotDTO>> {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from("report_snapshots")
        .select("*")
        .eq("id", snapshotId)
        .eq("tenant_id", ctx.tenantId)
        .single();

      if (error || !data) {
        return fail("NOT_FOUND", `Không tìm thấy snapshot ID ${snapshotId}`);
      }

      return ok(mapSnapshotRow(data as Record<string, unknown>));
    } catch (err: unknown) {
      return fail("INTERNAL", "Lỗi ngoại lệ tại findSnapshotById", err);
    }
  },

  async listSnapshots(ctx: RequestContext): Promise<ReportSnapshotDTO[]> {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from("report_snapshots")
        .select("*")
        .eq("tenant_id", ctx.tenantId)
        .order("created_at", { ascending: false });

      if (error || !data) return [];
      return data.map((r) => mapSnapshotRow(r as Record<string, unknown>));
    } catch {
      return [];
    }
  },

  async getLineage(
    ctx: RequestContext,
    snapshotId: string
  ): Promise<SnapshotLineageDTO[]> {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from("report_snapshot_lineage")
        .select("*")
        .eq("tenant_id", ctx.tenantId)
        .eq("snapshot_id", snapshotId)
        .order("created_at", { ascending: true });

      if (error || !data) return [];
      return data.map((row) => ({
        id: String(row.id),
        snapshotId: String(row.snapshot_id),
        sourceTable: String(row.source_table),
        sourceId: String(row.source_id),
        sourceVersion: Number(row.source_version),
        createdAt: String(row.created_at),
      }));
    } catch {
      return [];
    }
  },
};
