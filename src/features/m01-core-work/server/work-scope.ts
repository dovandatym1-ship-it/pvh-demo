import type { RequestContext } from "@/lib/auth/request-context";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type WorkScope =
  | { kind: "tenant"; hamlets: readonly string[] }
  | { kind: "hamlet"; hamlets: readonly string[] }
  | { kind: "officer"; hamlets: readonly string[]; userId: string };

/**
 * A presentation/query narrowing step only. The database's membership RLS
 * remains the final authority. No role string by itself bypasses permissions.
 */
export function resolveWorkScope(ctx: Pick<RequestContext, "userId" | "roles" | "permissions" | "scopes">): WorkScope {
  const hamlets = [...new Set((ctx.scopes.hamletIds || []).filter(id => UUID.test(id)))].slice(0, 100);
  const leader = ctx.roles.some(role => role === "LANH_DAO_XA" || role === "SYSTEM_ADMIN" || role === "admin");
  if (leader && ctx.permissions.includes("m01:work:read_all")) return { kind: "tenant", hamlets: [] };
  if (ctx.roles.includes("TRUONG_THON")) return { kind: "hamlet", hamlets };
  return { kind: "officer", hamlets, userId: ctx.userId };
}
