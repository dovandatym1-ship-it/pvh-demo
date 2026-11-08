import "server-only";

import type { RequestContext } from "@/lib/auth/request-context";
import { assertPermission } from "@/lib/authorization/assert-permission";
import { ForbiddenError } from "@/lib/errors/app-error";
import type { WorkItemDTO } from "../types";

/**
 * Asserts that the actor possesses permission to create work items.
 */
export function assertCanCreateWorkItem(ctx: RequestContext): void {
  assertPermission(ctx, "m01:work:create");
}

/**
 * Asserts that the actor possesses permission to view the specified work item.
 */
export function assertCanViewWorkItem(ctx: RequestContext, item: WorkItemDTO): void {
  if (item.tenantId !== ctx.tenantId) {
    throw new ForbiddenError("Không thể truy cập dữ liệu của đơn vị xã khác (FORBIDDEN)");
  }
  assertPermission(ctx, "m01:work:read");
}

/**
 * Asserts that the actor possesses permission to assign the work item.
 */
export function assertCanAssignWorkItem(ctx: RequestContext, item: WorkItemDTO): void {
  if (item.tenantId !== ctx.tenantId) {
    throw new ForbiddenError("Không thể giao việc ngoài phạm vi đơn vị xã (FORBIDDEN)");
  }
  assertPermission(ctx, "m01:work:assign");
}
