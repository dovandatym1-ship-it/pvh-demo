"use server";

import { fail, type Result } from "@/lib/types/result";

// Retired pre-PH03 RPC signature could return success after failed DB writes.
// The PH03 flow requires a reviewer, reason, version and completed M01 work.
export async function resolveInspectionRecommendationAction(
 _raw:unknown
):Promise<Result<{success:boolean;recommendationId:string;status:string}>>{
 return fail("VALIDATION","Hậu kiểm PH03 yêu cầu lý do, phiên bản và đối soát công việc M01.");
}
