import "server-only";

import type { RequestContext } from "@/lib/auth/request-context";
import { assertPermission } from "@/lib/authorization/assert-permission";

export function assertCanReadDigital(ctx: RequestContext): void {
  assertPermission(ctx, "m05:digital:read");
}

export function assertCanManageDigital(ctx: RequestContext): void {
  assertPermission(ctx, "m05:digital:write");
}
