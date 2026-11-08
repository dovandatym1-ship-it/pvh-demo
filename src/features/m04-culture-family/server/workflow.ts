import "server-only";

import type { SubmissionStatus } from "../types";
import { fail, ok, type Result } from "@/lib/types/result";

/**
 * Valid state transitions for Culture Evaluation dossiers.
 */
const VALID_TRANSITIONS: Record<SubmissionStatus, readonly SubmissionStatus[]> = {
  CHO_RA_SOAT: ["DAT", "KHONG_DAT", "THIEU_MINH_CHUNG", "YEU_CAU_BO_SUNG"],
  THIEU_MINH_CHUNG: ["CHO_RA_SOAT", "DAT", "KHONG_DAT", "YEU_CAU_BO_SUNG"],
  YEU_CAU_BO_SUNG: ["CHO_RA_SOAT", "THIEU_MINH_CHUNG", "KHONG_DAT"],
  KHONG_DAT: ["CHO_RA_SOAT"], // Re-evaluation on appeal
  DAT: ["CHO_RA_SOAT"], // Re-opened if discrepancy found
};

export interface TransitionValidationContext {
  readonly score: number;
  readonly hasEvidence: boolean;
  readonly reviewerComment?: string | null;
}

export function validateStatusTransition(
  currentStatus: SubmissionStatus,
  targetStatus: SubmissionStatus,
  context: TransitionValidationContext
): Result<true> {
  const allowed = VALID_TRANSITIONS[currentStatus];
  if (!allowed || !allowed.includes(targetStatus)) {
    return fail(
      "INVALID_TRANSITION",
      `Không thể chuyển trạng thái hồ sơ từ ${currentStatus} sang ${targetStatus}`
    );
  }

  // Business Rule: DAT requires score >= 85 and hasEvidence = true
  if (targetStatus === "DAT") {
    if (!context.hasEvidence) {
      return fail(
        "VALIDATION",
        "Hồ sơ thiếu minh chứng bắt buộc, không thể phê duyệt ĐẠT danh hiệu (chk_submission_dat_requires_evidence)"
      );
    }
    if (context.score < 85) {
      return fail(
        "VALIDATION",
        `Tổng điểm đánh giá (${context.score}) chưa đạt ngưỡng 85 điểm để công nhận ĐẠT`
      );
    }
  }

  // Business Rule: YEU_CAU_BO_SUNG requires non-empty reviewer comment
  if (targetStatus === "YEU_CAU_BO_SUNG") {
    if (!context.reviewerComment || context.reviewerComment.trim().length === 0) {
      return fail(
        "VALIDATION",
        "Yêu cầu bổ sung hồ sơ bắt buộc phải có ý kiến nhận xét của cán bộ rà soát (chk_submission_supplementation_comment)"
      );
    }
  }

  return ok(true);
}
