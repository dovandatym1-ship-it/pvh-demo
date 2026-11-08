"use server";

import { fail, type Result } from "@/lib/types/result";

// Retired pre-PH03 RPC signature had an unaudited fallback and unconditional ok().
// The PH03 entry point requires numeric value, source and expected version.
export async function updateDigitalIndicatorStatusAction(
 _raw:unknown
):Promise<Result<{success:boolean;indicatorId:string;status:string}>>{
 return fail("VALIDATION","Cập nhật theo phiên bản PH03 yêu cầu nguồn, giá trị số và expectedVersion.");
}
