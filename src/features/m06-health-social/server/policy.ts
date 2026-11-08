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

export function canViewUnmaskedPII(ctx: RequestContext): boolean {
  return (
    ctx.roles.includes("chu_tich_xa") ||
    ctx.roles.includes("pho_chu_tich_xa") ||
    ctx.roles.includes("can_bo_chuyen_trach") ||
    ctx.permissions.includes("m06:social:pii_unmask") ||
    ctx.permissions.includes("admin")
  );
}
