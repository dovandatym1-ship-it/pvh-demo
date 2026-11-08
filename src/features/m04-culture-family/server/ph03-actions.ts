"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getRequestContext } from "@/lib/auth/request-context";
import { assertPermission } from "@/lib/authorization/assert-permission";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fail, ok, type Result } from "@/lib/types/result";

const RulePackInput = z.object({
  titleType: z.enum(["GIA_DINH", "THON", "XA_TIEU_BIEU"]),
  version: z.number().int().positive(),
  jurisdiction: z.string().trim().min(2).max(150),
  criteria: z.array(z.object({
    code: z.string().trim().min(1),
    label: z.string().trim().min(2),
    maxPoints: z.number().nonnegative(),
  }).strict()).max(100),
  minScore: z.number().nonnegative().nullable(),
}).strict();
const CampaignInput = z.object({
  rulePackId: z.string().uuid(),
  year: z.number().int().min(2000).max(2200),
  title: z.string().trim().min(3).max(250),
  closesAt: z.string().datetime({ offset: true }),
}).strict();
const SubmissionInput = z.object({
  campaignId: z.string().uuid(),
  subjectRef: z.string().trim().min(2).max(150),
  subjectName: z.string().trim().min(2).max(250),
  hamletId: z.string().uuid(),
  sourceRef: z.string().trim().min(3).max(500),
  idempotencyKey: z.string().uuid(),
}).strict();
const ReviewInput = z.object({
  submissionId: z.string().uuid(),
  status: z.enum(["THIEU_MINH_CHUNG", "YEU_CAU_BO_SUNG", "DAT", "KHONG_DAT"]),
  score: z.number().nonnegative().nullable(),
  reason: z.string().trim().min(5).max(2000),
  expectedVersion: z.number().int().positive(),
  evidenceId: z.string().uuid().nullable(),
}).strict();

function dbFail(error: { code?: string; message: string }): Result<never> {
  if (error.code === "42501") return fail("FORBIDDEN", "Thiếu quyền, sai phạm vi hoặc quy tắc chưa xác minh");
  if (error.code === "PV409") return fail("VERSION_CONFLICT", "Hồ sơ đã thay đổi hoặc khóa lặp không khớp");
  if (error.code === "23505") return fail("DUPLICATE_REQUEST", "Đợt/hồ sơ đã tồn tại");
  if (error.code === "P0002") return fail("NOT_FOUND", "Không tìm thấy hồ sơ hoặc đợt");
  if (error.code === "22023" || error.code === "23514") return fail("VALIDATION", error.message);
  return fail("INTERNAL", "Không ghi được dữ liệu văn hóa vào CSDL");
}

async function mutation<T>(permission: string, rpc: string, args: Record<string, unknown>): Promise<Result<T>> {
  try {
    const ctx = await getRequestContext();
    assertPermission(ctx, permission);
    const db = await createServerSupabaseClient();
    const { data, error } = await db.schema("app").rpc(rpc, args);
    if (error) return dbFail(error);
    if (!data || typeof data !== "object" || Array.isArray(data) || !("id" in data)) {
      return fail("INTERNAL", "CSDL không xác nhận bản ghi được tạo hoặc cập nhật");
    }
    revalidatePath("/van-hoa/gia-dinh-van-hoa");
    revalidatePath("/van-hoa/thon-van-hoa");
    return ok(data as T);
  } catch {
    return fail("FORBIDDEN", "Không xác thực được quyền thao tác hoặc lỗi kết nối");
  }
}

export async function createIllustrativeRulePackAction(raw: unknown): Promise<Result<{id:string}>> {
  const parsed = RulePackInput.safeParse(raw);
  if (!parsed.success) return fail("VALIDATION", "Bộ tiêu chí minh họa không hợp lệ");
  const x = parsed.data;
  return mutation<{id:string}>("m04:culture:evaluate", "create_culture_rule_pack", {
    p_title_type:x.titleType, p_version:x.version, p_jurisdiction:x.jurisdiction,
    p_criteria:x.criteria,p_min_score:x.minScore,
  });
}

export async function createCultureCampaignAction(raw: unknown): Promise<Result<{id:string}>> {
  const parsed = CampaignInput.safeParse(raw);
  if (!parsed.success) return fail("VALIDATION", "Thông tin đợt bình xét không hợp lệ");
  const x=parsed.data;
  return mutation<{id:string}>("m04:culture:evaluate", "create_culture_campaign", {
    p_rule_pack_id:x.rulePackId,p_year:x.year,p_title:x.title,p_closes_at:x.closesAt,
  });
}

export async function submitCultureDossierAction(raw: unknown): Promise<Result<{id:string}>> {
  const parsed = SubmissionInput.safeParse(raw);
  if (!parsed.success) return fail("VALIDATION", "Hồ sơ phải có nguồn, mã đối tượng, xóm và khóa gửi ổn định");
  const x=parsed.data;
  return mutation<{id:string}>("m04:culture:create", "submit_culture_dossier", {
    p_campaign_id:x.campaignId,p_subject_ref:x.subjectRef,p_subject_name:x.subjectName,
    p_hamlet_id:x.hamletId,p_source_ref:x.sourceRef,p_idempotency_key:x.idempotencyKey,
  });
}

export async function reviewCultureDossierAction(raw: unknown): Promise<Result<{id:string;version:number}>> {
  const parsed = ReviewInput.safeParse(raw);
  if (!parsed.success) return fail("VALIDATION", "Lý do, trạng thái hoặc phiên bản hồ sơ không hợp lệ");
  const x=parsed.data;
  return mutation<{id:string;version:number}>("m04:culture:evaluate", "review_culture_dossier", {
    p_submission_id:x.submissionId,p_status:x.status,p_score:x.score,
    p_reason:x.reason,p_expected_version:x.expectedVersion,p_evidence_id:x.evidenceId,
  });
}
