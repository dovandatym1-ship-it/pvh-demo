import "server-only";

import type { RequestContext } from "@/lib/auth/request-context";
import { assertPermission } from "@/lib/authorization/assert-permission";

export function assertCanReadEducation(ctx: RequestContext): void {
  assertPermission(ctx, "m03:education:read");
}

export function assertCanApproveExemption(ctx: RequestContext): void {
  assertPermission(ctx, "m03:education:write");
}
