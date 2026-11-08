import React from "react";
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors/app-error";
import { isDemoAuthEnabled, isValidDemoPersona } from "@/lib/auth/demo-mode";
import { isMembershipCurrentlyActive } from "@/lib/auth/membership-validity";

export interface RequestContext {
  readonly userId: string;
  readonly tenantId: string;
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
  const isDemo = isDemoAuthEnabled();
  const demoPersona = cookieStore.get("pvh_demo_session")?.value;

  // In demo mode without cloud auth account, provide authorized test profile
  if ((authError || !user) && isDemo && isValidDemoPersona(demoPersona)) {
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
    if (demoPersona !== "P1") {
      throw new ForbiddenError("Vai trò demo không hợp lệ (FORBIDDEN)");
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
    .eq("is_active", true)
    .limit(2);

  if (memberError || !memberships || memberships.length === 0) {
    throw new ForbiddenError("Người dùng không có quyền công tác tại đơn vị xã nào (FORBIDDEN)");
  }

  // 3. MVP: one live commune per deployment; never select a tenant by cookie.
  const tenantCookie = cookieStore.get("pvh_tenant")?.value;
  if (memberships.length !== 1) {
    throw new ForbiddenError("Phiên đăng nhập có nhiều phân công xã, cần kiểm tra cấu hình (FORBIDDEN)");
  }
  const activeMembership = memberships[0];
  if (tenantCookie && tenantCookie !== activeMembership.tenant_id) {
    throw new ForbiddenError("Cookie đơn vị không khớp phân công hiện hành (FORBIDDEN)");
  }

  // 4. Validate time-bound validity period if configured
  if (!isMembershipCurrentlyActive(activeMembership)) {
    throw new ForbiddenError("Phân công công tác đã hết hạn hoặc chưa có hiệu lực (FORBIDDEN)");
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
