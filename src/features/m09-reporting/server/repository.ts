import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { type Result, ok, fail } from "@/lib/types/result";
import type { RequestContext } from "@/lib/auth/request-context";
import type { CreateReportSnapshotInput, AdvanceReportSnapshotInput } from "../schemas";
import type { ReportSnapshotDTO, SnapshotLineageDTO, ReportCatalogEntry } from "../types";

function mapError<T>(error: {code?: string; message: string}): Result<T> {
  const msg = error.message || "";
  if (error.code === "42501" || /FORBIDDEN|PERIOD_LOCKED/.test(msg)) return fail("FORBIDDEN", "Không có quyền hoặc kỳ đã khóa");
  if (error.code === "40001" || /VERSION_CONFLICT/.test(msg)) return fail("VERSION_CONFLICT", "Dữ liệu đã thay đổi, vui lòng tải lại");
  if (/IDEMPOTENCY_CONFLICT|SOURCE_VERSION_CONFLICT/.test(msg)) return fail("DUPLICATE_REQUEST", "Khóa yêu cầu đã dùng với dữ liệu khác");
  if (error.code === "22023") return fail("VALIDATION", "Dữ liệu báo cáo không hợp lệ");
  if (error.code === "P0002") return fail("NOT_FOUND", "Không tìm thấy bản ghi");
  return fail("INTERNAL", "Không thể truy cập CSDL báo cáo");
}
export function mapSnapshot(row: Record<string, unknown>): ReportSnapshotDTO {
  return {
    id: String(row.id), tenantId: String(row.tenant_id),
    reportCode: row.report_code as ReportSnapshotDTO["reportCode"], title: String(row.title),
    period: String(row.period), year: Number(row.year), revision: Number(row.revision),
    previousSnapshotId: row.previous_snapshot_id ? String(row.previous_snapshot_id) : null,
    version: Number(row.version), createdBy: String(row.created_by), status: row.status as ReportSnapshotDTO["status"],
    payload: row.payload as Record<string, unknown>,
    canonicalText: String(row.canonical_text), sha256: String(row.sha256),
    hashAlgorithm: "PG_JSONB_TEXT_V1", watermark: String(row.watermark),
    isFinalized: row.status === "FINALIZED",
    finalizedAt: row.finalized_at ? String(row.finalized_at) : null,
    finalizedBy: row.finalized_by ? String(row.finalized_by) : null,
    createdAt: String(row.created_at), updatedAt: String(row.updated_at),
  };
}
export const reportingRepository = {
  async createDraft(ctx: RequestContext, input: CreateReportSnapshotInput): Promise<Result<ReportSnapshotDTO>> {
    try {
      const db = await createServerSupabaseClient();
      const { data, error } = await db.schema("app").rpc("create_report_snapshot", {
        p_report_code: input.reportCode, p_title: input.title, p_period: input.period,
        p_year: input.year, p_idempotency_key: input.idempotencyKey,
        p_previous_snapshot_id: input.previousSnapshotId ?? null,
      });
      if (error) return mapError<ReportSnapshotDTO>(error);
      if (!data || typeof data !== "object" || !("id" in data)) return fail("INTERNAL", "RPC không trả lại bản ghi đã tạo");
      const row = mapSnapshot(data as Record<string, unknown>);
      if (row.tenantId !== ctx.tenantId) return fail("FORBIDDEN", "Phạm vi đơn vị không hợp lệ");
      return ok(row);
    } catch { return fail("INTERNAL", "Không thể tạo bản nháp báo cáo"); }
  },
  async advance(ctx: RequestContext, input: AdvanceReportSnapshotInput): Promise<Result<ReportSnapshotDTO>> {
    try {
      const db = await createServerSupabaseClient();
      const { data, error } = await db.schema("app").rpc("advance_report_snapshot", {
        p_snapshot_id: input.snapshotId, p_expected_version: input.expectedVersion,
        p_transition: input.transition,
      });
      if (error) return mapError<ReportSnapshotDTO>(error);
      if (!data || typeof data !== "object" || !("id" in data)) return fail("INTERNAL", "RPC không xác nhận trạng thái");
      const row = mapSnapshot(data as Record<string, unknown>);
      if (row.tenantId !== ctx.tenantId) return fail("FORBIDDEN", "Sai đơn vị");
      return ok(row);
    } catch { return fail("INTERNAL", "Không thể chuyển trạng thái báo cáo"); }
  },
  async findSnapshotById(ctx: RequestContext, id: string): Promise<Result<ReportSnapshotDTO>> {
    try {
      const db = await createServerSupabaseClient();
      const {data,error} = await db.from("report_snapshots").select("*")
        .eq("tenant_id", ctx.tenantId).eq("id",id).maybeSingle();
      if (error) return mapError<ReportSnapshotDTO>(error);
      return data ? ok(mapSnapshot(data)) : fail("NOT_FOUND", "Không tìm thấy phiên bản báo cáo được phép xem");
    } catch { return fail("INTERNAL", "Không thể tra cứu phiên bản báo cáo"); }
  },
  async listSnapshots(ctx: RequestContext): Promise<Result<ReportSnapshotDTO[]>> {
    try {
      const db = await createServerSupabaseClient();
      const {data,error} = await db.from("report_snapshots").select("*")
        .eq("tenant_id",ctx.tenantId).order("created_at",{ascending:false}).limit(200);
      if (error) return mapError<ReportSnapshotDTO[]>(error);
      return ok((data ?? []).map(row => mapSnapshot(row)));
    } catch { return fail("INTERNAL", "Lỗi truy vấn danh sách báo cáo"); }
  },
  async listCatalog(): Promise<Result<ReportCatalogEntry[]>> {
    try {
      const db = await createServerSupabaseClient();
      const {data,error} = await db.from("report_catalog")
        .select("code,title,metric_definitions").eq("active",true).order("code");
      if (error) return mapError<ReportCatalogEntry[]>(error);
      return ok((data ?? []).map(row => ({
        code: row.code as ReportCatalogEntry["code"], title: row.title,
        metricDefinitions: row.metric_definitions as ReportCatalogEntry["metricDefinitions"],
      })));
    } catch { return fail("INTERNAL", "Lỗi truy vấn danh mục báo cáo"); }
  },
  async getLineage(ctx: RequestContext, snapshotId: string): Promise<Result<SnapshotLineageDTO[]>> {
    try {
      const db = await createServerSupabaseClient();
      const all: SnapshotLineageDTO[] = [];
      // Paginate until exhaustion; returned rows are additionally filtered by source-specific RLS.
      for (let offset = 0; offset < 100000; offset += 500) {
        const {data,error} = await db.from("report_snapshot_lineage").select("*")
          .eq("tenant_id",ctx.tenantId).eq("snapshot_id",snapshotId)
          .order("id").range(offset,offset+499);
        if (error) return mapError<SnapshotLineageDTO[]>(error);
        for (const row of data ?? []) all.push({
          id:String(row.id),snapshotId:String(row.snapshot_id),sourceTable:String(row.source_table),
          sourceId:String(row.source_id),sourceVersion:Number(row.source_version),
          metricGroup:String(row.metric_group),
          contribution:row.contribution as Record<string,unknown>,createdAt:String(row.created_at),
        });
        if ((data ?? []).length < 500) return ok(all);
      }
      return fail("INTERNAL", "Vượt giới hạn truy vấn lineage; cần phân trang máy chủ");
    } catch { return fail("INTERNAL", "Lỗi truy vấn nguồn dữ liệu"); }
  },
};
