import "server-only";

import type { RequestContext } from "@/lib/auth/request-context";
import { assertPermission } from "@/lib/authorization/assert-permission";

/**
 * Asserts user has permission to read reports and view snapshots.
 */
export function assertCanReadReports(ctx: RequestContext): void {
  const canRead =
    ctx.permissions.includes("m09:report:read") ||
    ctx.permissions.includes("m09:view") ||
    ctx.permissions.includes("m09:*") ||
    ctx.permissions.includes("m09:full") ||
    ctx.roles.includes("LANH_DAO_XA") ||
    ctx.roles.includes("CAN_BO_THANH_TRA");

  if (!canRead) {
    assertPermission(ctx, "m09:report:read");
  }
}

/**
 * Asserts user can draft report snapshots.
 */
export function assertCanDraftReport(ctx: RequestContext): void {
  const canDraft =
    ctx.permissions.includes("m09:draft") ||
    ctx.permissions.includes("m09:full") ||
    ctx.roles.includes("CAN_BO_VHXH") ||
    ctx.roles.includes("LANH_DAO_XA");

  if (!canDraft) {
    assertPermission(ctx, "m09:draft");
  }
}

/**
 * Asserts user can sign and finalize immutable report snapshots.
 */
export function assertCanFinalizeSnapshot(ctx: RequestContext): void {
  const canSign =
    ctx.permissions.includes("m09:snapshot:sign") ||
    ctx.permissions.includes("m09:sign_snapshot") ||
    ctx.permissions.includes("m09:full") ||
    ctx.roles.includes("LANH_DAO_XA");

  if (!canSign) {
    assertPermission(ctx, "m09:snapshot:sign");
  }
}
