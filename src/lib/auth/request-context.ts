import React from "react";
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors/app-error";

export interface RequestContext {
  readonly userId: string;
  readonly tenantId: string; // UUID of TN-DEMO-A
  readonly membershipId: string;
  readonly roles: readonly string[]; // ["LANH_DAO_XA", "CAN_BO_MOT_CUA", ...]
  readonly permissions: readonly string[]; // ["m01:work:create", ...]
  readonly scopes: {
    readonly hamletIds?: readonly string[];
    readonly sectorIds?: readonly string[];
  };
}

/**
 * Server-side RequestContext extractor per ADR-002 §6.1.
 * Memoized per-request using React.cache().
 */
export const getRequestContext = React.cache(async (): Promise<RequestContext> => {
  const supabase = await createServerSupabaseClient();

  // 1. Verify user identity via Supabase Auth (getUser(), NEVER getSession())
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new UnauthorizedError("Chưa xác thực hoặc phiên làm việc đã hết hạn (UNAUTHENTICATED)");
  }

  // 2. Query active memberships from PostgreSQL
  const { data: memberships, error: memberError } = await supabase
    .from("memberships")
    .select("id, tenant_id, roles, permissions, scopes, is_active, valid_from, valid_to")
    .eq("user_id", user.id)
    .eq("is_active", true);

  if (memberError || !memberships || memberships.length === 0) {
    throw new ForbiddenError("Người dùng không có quyền công tác tại đơn vị xã nào (FORBIDDEN)");
  }

  // 3. Read tenant cookie pvh_tenant & validate against memberships (Fail-Closed)
  const cookieStore = await cookies();
  const tenantCookie = cookieStore.get("pvh_tenant")?.value;

  let activeMembership = memberships[0];

  if (tenantCookie) {
    const matched = memberships.find((m) => m.tenant_id === tenantCookie);
    if (!matched) {
      // Cookie is spoofed or points to an unassigned tenant -> fail closed!
      throw new ForbiddenError(
        "Không có quyền truy cập đơn vị xã được chỉ định trong cookie pvh_tenant (FORBIDDEN)"
      );
    }
    activeMembership = matched;
  }

  // 4. Validate time-bound validity period if configured
  const now = new Date().toISOString();
  if (activeMembership.valid_from && activeMembership.valid_from > now) {
    throw new ForbiddenError("Tài khoản chưa đến thời hạn hiệu lực công tác (FORBIDDEN)");
  }
  if (activeMembership.valid_to && activeMembership.valid_to < now) {
    throw new ForbiddenError("Quyền công tác tại đơn vị xã đã hết hạn hiệu lực (FORBIDDEN)");
  }

  // 5. Construct RequestContext
  return {
    userId: user.id,
    tenantId: activeMembership.tenant_id,
    membershipId: activeMembership.id,
    roles: Array.isArray(activeMembership.roles) ? activeMembership.roles : [],
    permissions: Array.isArray(activeMembership.permissions) ? activeMembership.permissions : [],
    scopes: (activeMembership.scopes as RequestContext["scopes"]) ?? {},
  };
});
