import "server-only";

import type { RequestContext } from "@/lib/auth/request-context";
import { assertPermission } from "@/lib/authorization/assert-permission";
import { ForbiddenError } from "@/lib/errors/app-error";

export function assertCanViewFaith(ctx: RequestContext): void {
  assertPermission(ctx, "m07:faith:read");
}

export function assertCanManageFaith(ctx: RequestContext): void {
  assertPermission(ctx, "m07:faith:manage");
}

export function assertCanAccessHamlet(ctx: RequestContext, hamletId: string): void {
  if (ctx.scopes.hamletIds && !ctx.scopes.hamletIds.includes(hamletId)) {
    throw new ForbiddenError("Không có quyền truy cập dữ liệu ngoài địa bàn được phân công (FORBIDDEN)");
  }
}
