import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { type Result, ok, fail } from "@/lib/types/result";
import type { RequestContext } from "@/lib/auth/request-context";
import type { CultureSubmissionDTO, SubmissionStatus, CriteriaScore } from "../types";

export interface CreateSubmissionRepoInput {
  readonly id?: string;
  readonly campaignId: string;
  readonly rulePackId: string;
  readonly rulePackVersion: number;
  readonly householdId: string;
  readonly householdHeadName: string;
  readonly hamletId: string;
  readonly submissionType?: string;
  readonly score: number;
  readonly hasEvidence: boolean;
  readonly status?: SubmissionStatus;
  readonly idempotencyKey?: string | null;
  readonly reviewerComment?: string | null;
  readonly evidencePath?: string | null;
  readonly criteriaScores?: CriteriaScore[];
}

export interface UpdateEvaluationRepoInput {
  readonly submissionId: string;
  readonly status: SubmissionStatus;
  readonly score: number;
  readonly hasEvidence: boolean;
  readonly reviewerComment?: string | null;
  readonly evidencePath?: string | null;
  readonly criteriaScores?: CriteriaScore[];
}

function mapRowToDTO(row: Record<string, unknown>): CultureSubmissionDTO {
  const hamletMap: Record<string, string> = {
    XOM_A1: "Xóm A1",
    XOM_A2: "Xóm A2",
    XOM_A3: "Xóm A3",
  };
  const hamletId = String(row.hamlet_id);

  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    campaignId: String(row.campaign_id),
    rulePackId: String(row.rule_pack_id),
    rulePackVersion: Number(row.rule_pack_version) || 1,
    householdId: String(row.household_id),
    householdHeadName: String(row.household_head_name),
    hamletId,
    hamletName: hamletMap[hamletId] || `Xóm ${hamletId}`,
    submissionType: String(row.submission_type || "GIA_DINH_VAN_HOA"),
    status: row.status as SubmissionStatus,
    score: Number(row.score) || 0,
    hasEvidence: Boolean(row.has_evidence),
    reviewerComment: (row.reviewer_comment as string) || null,
    evidencePath: (row.evidence_path as string) || null,
    criteriaScores: (row.criteria_scores as CriteriaScore[]) || [],
    version: Number(row.version) || 1,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    createdBy: (row.created_by as string) || null,
  };
}

export const cultureRepository = {
  async createSubmission(
    ctx: RequestContext,
    input: CreateSubmissionRepoInput
  ): Promise<Result<CultureSubmissionDTO>> {
    try {
      const supabase = await createServerSupabaseClient();
      const submissionId = input.id || crypto.randomUUID();

      const { data, error } = await supabase
        .from("submissions")
        .insert({
          id: submissionId,
          tenant_id: ctx.tenantId,
          campaign_id: input.campaignId,
          rule_pack_id: input.rulePackId,
          rule_pack_version: input.rulePackVersion,
          household_id: input.householdId,
          household_head_name: input.householdHeadName,
          hamlet_id: input.hamletId,
          submission_type: input.submissionType || "GIA_DINH_VAN_HOA",
          status: input.status || "CHO_RA_SOAT",
          score: input.score,
          has_evidence: input.hasEvidence,
          reviewer_comment: input.reviewerComment || null,
          evidence_path: input.evidencePath || null,
          criteria_scores: input.criteriaScores || [],
          idempotency_key: input.idempotencyKey || null,
          version: 1,
          created_by: ctx.userId,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          return fail("DUPLICATE_REQUEST", "Hồ sơ đã tồn tại hoặc trùng khóa lặp", error);
        }
        if (error.code === "23514") {
          return fail("VALIDATION", `Vi phạm ràng buộc dữ liệu: ${error.message}`, error);
        }
        if (error.code === "42501") {
          return fail("FORBIDDEN", "Không có quyền ghi dữ liệu hồ sơ văn hóa", error);
        }
        return fail("INTERNAL", `Lỗi CSDL khi tạo hồ sơ: ${error.message}`, error);
      }

      return ok(mapRowToDTO(data as Record<string, unknown>));
    } catch (err: unknown) {
      return fail("INTERNAL", "Lỗi ngoại lệ tại cultureRepository.createSubmission", err);
    }
  },

  async updateSubmissionEvaluation(
    ctx: RequestContext,
    input: UpdateEvaluationRepoInput
  ): Promise<Result<CultureSubmissionDTO>> {
    try {
      const supabase = await createServerSupabaseClient();

      // Check current record and version
      const { data: current, error: findErr } = await supabase
        .from("submissions")
        .select("*")
        .eq("id", input.submissionId)
        .eq("tenant_id", ctx.tenantId)
        .single();

      if (findErr || !current) {
        return fail("NOT_FOUND", "Không tìm thấy hồ sơ văn hóa cần cập nhật");
      }

      const nextVersion = (Number(current.version) || 1) + 1;

      const { data, error } = await supabase
        .from("submissions")
        .update({
          status: input.status,
          score: input.score,
          has_evidence: input.hasEvidence,
          reviewer_comment: input.reviewerComment || null,
          evidence_path: input.evidencePath || current.evidence_path || null,
          criteria_scores: input.criteriaScores || current.criteria_scores || [],
          version: nextVersion,
          updated_at: new Date().toISOString(),
          updated_by: ctx.userId,
        })
        .eq("id", input.submissionId)
        .eq("tenant_id", ctx.tenantId)
        .select()
        .single();

      if (error) {
        if (error.code === "23514") {
          return fail("VALIDATION", `Ràng buộc CSDL bị vi phạm: ${error.message}`, error);
        }
        return fail("INTERNAL", `Lỗi CSDL khi cập nhật đánh giá: ${error.message}`, error);
      }

      return ok(mapRowToDTO(data as Record<string, unknown>));
    } catch (err: unknown) {
      return fail("INTERNAL", "Lỗi ngoại lệ tại cultureRepository.updateSubmissionEvaluation", err);
    }
  },

  async findSubmissionById(
    ctx: RequestContext,
    id: string
  ): Promise<Result<CultureSubmissionDTO>> {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .eq("id", id)
        .eq("tenant_id", ctx.tenantId)
        .single();

      if (error || !data) {
        return fail("NOT_FOUND", `Không tìm thấy hồ sơ ID ${id}`);
      }

      return ok(mapRowToDTO(data as Record<string, unknown>));
    } catch (err: unknown) {
      return fail("INTERNAL", "Lỗi ngoại lệ tại findSubmissionById", err);
    }
  },

  async listSubmissions(
    ctx: RequestContext,
    hamletId?: string
  ): Promise<CultureSubmissionDTO[]> {
    try {
      const supabase = await createServerSupabaseClient();
      let query = supabase
        .from("submissions")
        .select("*")
        .eq("tenant_id", ctx.tenantId);

      if (hamletId && hamletId !== "ALL") {
        query = query.eq("hamlet_id", hamletId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error || !data) return [];

      return data.map((row) => mapRowToDTO(row as Record<string, unknown>));
    } catch {
      return [];
    }
  },

  async getActiveCampaign(ctx: RequestContext): Promise<string> {
    try {
      const supabase = await createServerSupabaseClient();
      const { data } = await supabase
        .from("campaigns")
        .select("id")
        .eq("tenant_id", ctx.tenantId)
        .eq("status", "OPEN")
        .order("year", { ascending: false })
        .limit(1)
        .maybeSingle();

      return data?.id || "00000000-0000-0000-0000-000000000001";
    } catch {
      return "00000000-0000-0000-0000-000000000001";
    }
  },
};
