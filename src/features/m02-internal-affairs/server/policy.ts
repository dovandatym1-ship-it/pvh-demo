import "server-only";

import type { RequestContext } from "@/lib/auth/request-context";
import { assertPermission } from "@/lib/authorization/assert-permission";

export function assertCanReadInternalAffairs(ctx: RequestContext): void {
  assertPermission(ctx, "m02:internal:read");
}

export function assertCanResolveDispute(ctx: RequestContext): void {
  assertPermission(ctx, "m02:internal:write");
}

export function canViewUnmaskedPII(ctx: RequestContext): boolean {
  return (
    ctx.roles.includes("chu_tich_xa") ||
    ctx.roles.includes("pho_chu_tich_xa") ||
    ctx.roles.includes("can_bo_chuyen_trach") ||
    ctx.permissions.includes("m02:internal:pii_unmask") ||
    ctx.permissions.includes("admin")
  );
}
