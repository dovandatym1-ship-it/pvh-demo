"use server";

import { revalidatePath } from "next/cache";
import { getRequestContext } from "@/lib/auth/request-context";
import { assertPermission } from "@/lib/authorization/assert-permission";
import { type Result, fail, ok } from "@/lib/types/result";
import {
  ProposeCulturalTitleSchema,
  EvaluateSubmissionSchema,
  RequestSupplementationSchema,
  AttachEvidenceSchema,
} from "../schemas";
import { cultureService } from "./service";
import { assertCanProposeCulture } from "./policy";
import type { CultureSubmissionDTO, CulturalTitleDTO } from "../types";

/**
 * Server Action: Propose household for cultural title (DEM-VH)
 * Thin coordinator per ADR-002 §9.2.
 */
export async function proposeCulturalTitleAction(
  input: unknown
): Promise<Result<CulturalTitleDTO>> {
  try {
    const parsed = ProposeCulturalTitleSchema.safeParse(input);
    if (!parsed.success) {
      return fail("VALIDATION", "Dữ liệu đề xuất danh hiệu không hợp lệ", parsed.error.flatten());
    }

    const ctx = await getRequestContext();
    assertCanProposeCulture(ctx);

    const result = await cultureService.proposeCulturalTitle(ctx, parsed.data);
    if (!result.ok) {
      return result;
    }

    revalidatePath("/van-hoa/gia-dinh-van-hoa");

    // Map to CulturalTitleDTO for legacy/interface compatibility
    const sub = result.data;
    const mapped: CulturalTitleDTO = {
      id: sub.id,
      tenantId: sub.tenantId,
      code: `GDVH-${new Date().getFullYear()}-${sub.id.slice(0, 8).toUpperCase()}`,
      householdHead: sub.householdHeadName,
      hamletId: sub.hamletId,
      hamletName: sub.hamletName || `Xóm ${sub.hamletId}`,
      membersCount: 4,
      evaluationYear: 2026,
      score: sub.score,
      yearsRecognized: 0,
      status: "PROPOSED",
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
    };

    return ok(mapped);
  } catch (err: unknown) {
    return fail("INTERNAL", "Đã xảy ra lỗi hệ thống khi đề xuất danh hiệu", err);
  }
}

/**
 * Server Action: Evaluate and score a cultural dossier.
 */
export async function evaluateSubmissionAction(
  input: unknown
): Promise<Result<CultureSubmissionDTO>> {
  try {
    const parsed = EvaluateSubmissionSchema.safeParse(input);
    if (!parsed.success) {
      return fail("VALIDATION", "Dữ liệu chấm điểm không hợp lệ", parsed.error.flatten());
    }

    const ctx = await getRequestContext();
    assertPermission(ctx, "m04:culture:evaluate");

    const result = await cultureService.evaluateSubmission(ctx, parsed.data);
    if (!result.ok) {
      return result;
    }

    revalidatePath("/van-hoa/gia-dinh-van-hoa");
    return result;
  } catch (err: unknown) {
    return fail("INTERNAL", "Lỗi hệ thống khi chấm điểm hồ sơ", err);
  }
}

/**
 * Server Action: Request evidence supplementation with reviewer comment.
 */
export async function requestSupplementationAction(
  input: unknown
): Promise<Result<CultureSubmissionDTO>> {
  try {
    const parsed = RequestSupplementationSchema.safeParse(input);
    if (!parsed.success) {
      return fail("VALIDATION", "Lý do yêu cầu bổ sung không hợp lệ", parsed.error.flatten());
    }

    const ctx = await getRequestContext();
    assertPermission(ctx, "m04:culture:evaluate");

    const result = await cultureService.requestSupplementation(ctx, parsed.data);
    if (!result.ok) {
      return result;
    }

    revalidatePath("/van-hoa/gia-dinh-van-hoa");
    return result;
  } catch (err: unknown) {
    return fail("INTERNAL", "Lỗi hệ thống khi yêu cầu bổ sung hồ sơ", err);
  }
}

/**
 * Server Action: Attach evidence to submission.
 */
export async function attachEvidenceAction(
  input: unknown
): Promise<Result<CultureSubmissionDTO>> {
  try {
    const parsed = AttachEvidenceSchema.safeParse(input);
    if (!parsed.success) {
      return fail("VALIDATION", "Thông tin minh chứng không hợp lệ", parsed.error.flatten());
    }

    const ctx = await getRequestContext();
    assertPermission(ctx, "m04:culture:read");

    const result = await cultureService.attachEvidence(ctx, parsed.data);
    if (!result.ok) {
      return result;
    }

    revalidatePath("/van-hoa/gia-dinh-van-hoa");
    return result;
  } catch (err: unknown) {
    return fail("INTERNAL", "Lỗi hệ thống khi gắn minh chứng", err);
  }
}
