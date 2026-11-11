import "server-only";
import type { RequestContext } from "@/lib/auth/request-context";
import { assertPermission } from "@/lib/authorization/assert-permission";

export function assertCanReadReports(ctx: RequestContext): void {
  assertPermission(ctx, "m09:report:read");
}
export function assertCanDraftReport(ctx: RequestContext): void {
  assertPermission(ctx, "m09:report:draft");
}
export function assertCanFinalizeSnapshot(ctx: RequestContext): void {
  assertPermission(ctx, "m09:report:finalize");
}
export function assertCanExportReports(ctx: RequestContext): void {
  assertPermission(ctx, "m09:report:export");
}
