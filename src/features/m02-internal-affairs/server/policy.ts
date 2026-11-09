import "server-only";

import type { RequestContext } from "@/lib/auth/request-context";
import { assertPermission } from "@/lib/authorization/assert-permission";

export function assertCanReadInternalAffairs(ctx: RequestContext): void {
  assertPermission(ctx, "m02:internal:read");
}

export function assertCanResolveDispute(ctx: RequestContext): void {
  assertPermission(ctx, "m02:internal:write");
}

/** Sensitive data requires explicit field-level permission, regardless of leadership role. */
export function canViewUnmaskedPII(ctx: RequestContext): boolean {
  return ctx.permissions.includes("m02:internal:pii_unmask");
}
