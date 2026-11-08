import "server-only";

import { ForbiddenError } from "@/lib/errors/app-error";
import type { RequestContext } from "@/lib/auth/request-context";

/**
 * Asserts that the actor possesses the specified permission or admin privilege.
 * Throws ForbiddenError if the assertion fails.
 */
export function assertPermission(ctx: RequestContext, permission: string): void {
  const [modulePrefix] = permission.split(":");

  const hasPerm =
    ctx.permissions.includes(permission) ||
    ctx.permissions.includes("m00:admin") ||
    ctx.permissions.includes("all") ||
    ctx.permissions.includes(`${modulePrefix}:*`) ||
    ctx.permissions.includes(`${modulePrefix}:full`) ||
    ctx.roles.includes("LANH_DAO_XA") ||
    ctx.roles.includes("ADMIN");

  if (!hasPerm) {
    throw new ForbiddenError(`Hành động bị từ chối: thiếu quyền ${permission} (FORBIDDEN)`);
  }
}
