import "server-only";

import type { RequestContext } from "@/lib/auth/request-context";
import { assertPermission } from "@/lib/authorization/assert-permission";

/**
 * Asserts that user can view cultural submissions and status.
 */
export function assertCanViewCulture(ctx: RequestContext): void {
  assertPermission(ctx, "m04:culture:read");
}

/**
 * Asserts that user can propose households for cultural title.
 */
export function assertCanProposeCulture(ctx: RequestContext): void {
  const canPropose =
    ctx.permissions.includes("m04:propose_title") ||
    ctx.permissions.includes("m04:culture:create") ||
    ctx.permissions.includes("m04:full") ||
    ctx.roles.includes("TRUONG_THON") ||
    ctx.roles.includes("LANH_DAO_XA");

  if (!canPropose) {
    assertPermission(ctx, "m04:propose_title");
  }
}

/**
 * Asserts that user can evaluate cultural submissions.
 */
export function assertCanEvaluateCulture(ctx: RequestContext): void {
  const canEval =
    ctx.permissions.includes("m04:culture:evaluate") ||
    ctx.permissions.includes("m04:full") ||
    ctx.roles.includes("CAN_BO_VHXH") ||
    ctx.roles.includes("LANH_DAO_XA");

  if (!canEval) {
    assertPermission(ctx, "m04:culture:evaluate");
  }
}
