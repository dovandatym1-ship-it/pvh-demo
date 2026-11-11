"use server";

import { fail, type Result } from "@/lib/types/result";

// PH03: legacy positional args and storage-path inputs cannot establish
// campaign/rule-version, record scope, evidence ownership or OCC.
// New pages use validated app RPCs in ph03-actions.ts.
const retired = "Luồng M04 cũ đã khóa; chuyển sang đợt bình xét PH03 có nguồn và phiên bản.";
export async function proposeCulturalTitleAction(_raw: unknown): Promise<Result<never>> {
 return fail<never>("VALIDATION", retired);
}
export async function evaluateSubmissionAction(_raw: unknown): Promise<Result<never>> {
 return fail<never>("VALIDATION", retired);
}
export async function requestSupplementationAction(_raw: unknown): Promise<Result<never>> {
 return fail<never>("VALIDATION", retired);
}
export async function attachEvidenceAction(_raw: unknown): Promise<Result<never>> {
 return fail<never>("VALIDATION", "Không chấp nhận đường dẫn Storage do client tự khai báo; cần evidence ID đã xác minh.");
}
