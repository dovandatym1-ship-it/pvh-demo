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

  const cookieStore = await cookies();
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const demoPersona = cookieStore.get("pvh_demo_session")?.value;

  // In demo mode without cloud auth account, provide authorized test profile
  if ((authError || !user) && isDemo && demoPersona) {
    if (demoPersona === "ADMIN") {
      return {
        userId: "user-admin",
        tenantId: "TN-DEMO-A",
        membershipId: "mem-admin",
        roles: ["SYSTEM_ADMIN", "LANH_DAO_XA", "admin"],
        permissions: [
          "m00:admin",
          "*",
          "m01:full",
          "m02:full",
          "m03:full",
          "m04:full",
          "m05:full",
          "m06:full",
          "m07:full",
          "m08:full",
          "m09:full",
          "m10:full",
          "health:view_pii",
        ],
        scopes: {},
      };
    }
    if (demoPersona === "P2") {
      return {
        userId: "user-p2",
        tenantId: "TN-DEMO-A",
        membershipId: "mem-p2",
        roles: ["CONG_CHUC_VHXH", "WORK_OFFICER"],
        permissions: [
          "m01:full",
          "m02:full",
          "m04:full",
          "m05:full",
          "m06:full",
          "m07:full",
          "m08:execute",
          "m09:draft",
          "m10:import",
          "health:view_pii",
          "m01:work:create",
          "m01:work:assign",
          "m01:work:transition",
        ],
        scopes: { hamletIds: ["xom-a1", "xom-a2"], sectorIds: ["van-hoa", "xa-hoi"] },
      };
    }
    if (demoPersona === "P3") {
      return {
        userId: "user-p3",
        tenantId: "TN-DEMO-A",
        membershipId: "mem-p3",
        roles: ["CONG_CHUC_VHXH", "CAN_BO_CHUYEN_TRACH"],
        permissions: ["m01:view", "m04:full", "m05:view", "m09:draft", "health:view_pii"],
        scopes: {},
      };
    }
    if (demoPersona === "P4") {
      return {
        userId: "user-p4",
        tenantId: "TN-DEMO-A",
        membershipId: "mem-p4",
        roles: ["TRUONG_THON"],
        permissions: ["m01:hamlet_view", "m04:propose_title", "m06:propose_aid"],
        scopes: { hamletIds: ["xom-a1"] },
      };
    }
    if (demoPersona === "P5") {
      return {
        userId: "user-p5",
        tenantId: "TN-DEMO-A",
        membershipId: "mem-p5",
        roles: ["CAN_BO_MOT_CUA"],
        permissions: ["m01:intake", "m04:intake", "m06:intake", "health:view_pii"],
        scopes: {},
      };
    }
    if (demoPersona === "P6") {
      return {
        userId: "user-p6",
        tenantId: "TN-DEMO-A",
        membershipId: "mem-p6",
        roles: ["CAN_BO_THANH_TRA", "AUDITOR"],
        permissions: ["m08:full", "m04:inspect", "m06:inspect", "m09:view", "health:view_pii"],
        scopes: {},
      };
    }
    return {
      userId: "user-p1",
      tenantId: "TN-DEMO-A",
      membershipId: "mem-p1",
      roles: ["LANH_DAO_XA", "SYSTEM_ADMIN"],
      permissions: [
        "m00:admin",
        "m01:view",
        "m02:view",
        "m04:view",
        "m08:view",
        "m09:view",
        "m09:sign_snapshot",
        "m01:work:create",
        "m01:work:assign",
        "m01:work:transition",
      ],
      scopes: {},
    };
  }

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
