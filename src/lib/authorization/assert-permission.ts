import "server-only";

import { ForbiddenError } from "@/lib/errors/app-error";
import type { RequestContext } from "@/lib/auth/request-context";
import { hasExplicitPermission } from "@/lib/authorization/permission-check";

/**
 * Asserts one explicit server-side permission from the database projection.
 * A system administrator or commune leader is not a universal data reader.
 * Throws ForbiddenError if the assertion fails.
 */
export function assertPermission(ctx: RequestContext, permission: string): void {
  if (!hasExplicitPermission(ctx.permissions, permission)) {
    throw new ForbiddenError(`Hành động bị từ chối: thiếu quyền ${permission} (FORBIDDEN)`);
  }
}
