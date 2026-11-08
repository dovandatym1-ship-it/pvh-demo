import "server-only";

import { type Result, fail } from "@/lib/types/result";
import type { RequestContext } from "@/lib/auth/request-context";
import type {
  ProposeCulturalTitleInput,
  EvaluateSubmissionInput,
  RequestSupplementationInput,
  AttachEvidenceInput,
} from "../schemas";
import type { CultureSubmissionDTO } from "../types";
import {
  assertCanProposeCulture,
  assertCanEvaluateCulture,
} from "./policy";
import { validateStatusTransition } from "./workflow";
import { cultureRepository } from "./repository";

export const cultureService = {
  /**
   * Propose a new household cultural title dossier.
   */
  async proposeCulturalTitle(
    ctx: RequestContext,
    input: ProposeCulturalTitleInput
  ): Promise<Result<CultureSubmissionDTO>> {
    // 1. Policy check
    try {
      assertCanProposeCulture(ctx);
    } catch (err: unknown) {
      return fail("FORBIDDEN", "Không có quyền đề xuất danh hiệu Gia đình văn hóa", err);
    }

    // 2. Resolve active campaign
    const campaignId = input.campaignId || (await cultureRepository.getActiveCampaign(ctx));
    const recordId = crypto.randomUUID();

    // 3. Delegate to repository
    return await cultureRepository.createSubmission(ctx, {
      id: recordId,
      campaignId,
      rulePackId: "d0000000-0000-0000-0000-000000000001",
      rulePackVersion: 1,
      householdId: `HH-${recordId.slice(0, 6)}`,
      householdHeadName: input.householdHead,
      hamletId: input.hamletId,
      submissionType: "GIA_DINH_VAN_HOA",
      score: input.score,
      hasEvidence: false,
      status: "CHO_RA_SOAT",
      idempotencyKey: `idem-prop-${ctx.tenantId}-${Date.now()}-${recordId.slice(0, 8)}`,
    });
  },

  /**
   * Evaluate / grade a submission with criteria scores and validation rules.
   */
  async evaluateSubmission(
    ctx: RequestContext,
    input: EvaluateSubmissionInput
  ): Promise<Result<CultureSubmissionDTO>> {
    // 1. Policy check
    try {
      assertCanEvaluateCulture(ctx);
    } catch (err: unknown) {
      return fail("FORBIDDEN", "Không có quyền chấm điểm hoặc đánh giá hồ sơ", err);
    }

    // 2. Fetch current submission
    const currentRes = await cultureRepository.findSubmissionById(ctx, input.submissionId);
    if (!currentRes.ok) return currentRes;
    const current = currentRes.data;

    // 3. Validate workflow transition
    const hasEvidence = !!(input.evidencePath || current.hasEvidence);
    const transitionRes = validateStatusTransition(current.status, input.status, {
      score: input.score,
      hasEvidence,
      reviewerComment: input.reviewerComment,
    });
    if (!transitionRes.ok) return transitionRes;

    // 4. Update via repository
    return await cultureRepository.updateSubmissionEvaluation(ctx, {
      submissionId: input.submissionId,
      status: input.status,
      score: input.score,
      hasEvidence,
      reviewerComment: input.reviewerComment || null,
      evidencePath: input.evidencePath || current.evidencePath || null,
      criteriaScores: input.criteriaScores || current.criteriaScores,
    });
  },

  /**
   * Request dossier supplementation with required reviewer comment.
   */
  async requestSupplementation(
    ctx: RequestContext,
    input: RequestSupplementationInput
  ): Promise<Result<CultureSubmissionDTO>> {
    try {
      assertCanEvaluateCulture(ctx);
    } catch (err: unknown) {
      return fail("FORBIDDEN", "Không có quyền yêu cầu bổ sung hồ sơ", err);
    }

    const currentRes = await cultureRepository.findSubmissionById(ctx, input.submissionId);
    if (!currentRes.ok) return currentRes;
    const current = currentRes.data;

    const transitionRes = validateStatusTransition(current.status, "YEU_CAU_BO_SUNG", {
      score: current.score,
      hasEvidence: current.hasEvidence,
      reviewerComment: input.reviewerComment,
    });
    if (!transitionRes.ok) return transitionRes;

    return await cultureRepository.updateSubmissionEvaluation(ctx, {
      submissionId: input.submissionId,
      status: "YEU_CAU_BO_SUNG",
      score: current.score,
      hasEvidence: current.hasEvidence,
      reviewerComment: input.reviewerComment,
      evidencePath: current.evidencePath,
      criteriaScores: current.criteriaScores,
    });
  },

  /**
   * Attach evidence file to an existing dossier.
   */
  async attachEvidence(
    ctx: RequestContext,
    input: AttachEvidenceInput
  ): Promise<Result<CultureSubmissionDTO>> {
    const currentRes = await cultureRepository.findSubmissionById(ctx, input.submissionId);
    if (!currentRes.ok) return currentRes;
    const current = currentRes.data;

    const nextStatus = current.status === "THIEU_MINH_CHUNG" ? "CHO_RA_SOAT" : current.status;

    return await cultureRepository.updateSubmissionEvaluation(ctx, {
      submissionId: input.submissionId,
      status: nextStatus,
      score: current.score,
      hasEvidence: true,
      evidencePath: input.evidencePath,
      reviewerComment: current.reviewerComment,
      criteriaScores: current.criteriaScores,
    });
  },
};
