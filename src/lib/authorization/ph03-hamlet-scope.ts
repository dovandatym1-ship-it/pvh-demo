import "server-only";

import type { RequestContext } from "@/lib/auth/request-context";

/**
 * Database memberships use org_unit_ids; early demo contexts use hamletIds.
 * An explicit malformed DB scope must never silently become commune-wide.
 */
export function ph03HamletScope(ctx: RequestContext): readonly string[] | undefined {
  const raw = ctx.scopes as RequestContext["scopes"] & { org_unit_ids?: unknown };
  if (Object.prototype.hasOwnProperty.call(raw, "org_unit_ids")) {
    const ids = raw.org_unit_ids;
    return Array.isArray(ids) && ids.every((id): id is string => typeof id === "string")
      ? ids
      : [];
  }
  return ctx.scopes.hamletIds;
}
