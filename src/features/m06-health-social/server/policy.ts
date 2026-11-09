import "server-only";
import type { RequestContext } from "@/lib/auth/request-context";
import { assertPermission } from "@/lib/authorization/assert-permission";

export function assertCanReadHealthSocial(ctx: RequestContext): void {
  assertPermission(ctx, "m06:social:read");
}

export function assertCanManageBeneficiaries(ctx: RequestContext): void {
  assertPermission(ctx, "m06:social:write");
}

export function assertCanRecordPayment(ctx: RequestContext): void {
  assertPermission(ctx, "m06:social:write");
}

/** Sensitive medical/financial fields require explicit need-to-know permission. */
export function canViewUnmaskedPII(ctx: RequestContext): boolean {
  return ctx.permissions.includes("m06:social:pii_unmask");
}
