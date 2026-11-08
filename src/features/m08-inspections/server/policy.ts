import "server-only";

import type { RequestContext } from "@/lib/auth/request-context";
import { assertPermission } from "@/lib/authorization/assert-permission";

export function assertCanReadInspections(ctx: RequestContext): void {
  assertPermission(ctx, "m08:inspection:read");
}

export function assertCanManageInspections(ctx: RequestContext): void {
  assertPermission(ctx, "m08:inspection:write");
}
