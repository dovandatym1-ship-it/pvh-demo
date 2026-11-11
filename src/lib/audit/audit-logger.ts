import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors/app-error";
import { isMembershipCurrentlyActive } from "@/lib/auth/membership-validity";
import { getRequestContext } from "@/lib/auth/request-context";

export interface AuditLogEntry {
  id?: string;
  timestamp?: string;
  tenantId: string;
  userId: string;
  personaCode?: string;
  action: string;
  entityType: string;
  entityId: string;
  payload?: Record<string, unknown>;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

function assertUuid(value: string, field: string): void {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    throw new ForbiddenError(`AUDIT_INVALID_${field}`);
  }
}

/**
 * Best-effort callers are NOT permitted to manufacture a successful audit receipt.
 * Business mutations must use one audited database RPC transaction. This helper
 * fails closed until an explicitly authorized, append-only auth event path exists.
 */
export async function logAuditEvent(entry: Omit<AuditLogEntry, "id" | "timestamp">): Promise<AuditLogEntry> {
  assertUuid(entry.tenantId, "TENANT");
  assertUuid(entry.userId, "ACTOR");
  if (entry.personaCode) {
    throw new ForbiddenError("Demo persona không phải chủ thể kiểm toán DB (AUDIT_DEMO_FORBIDDEN)");
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new UnauthorizedError("AUDIT_UNAUTHENTICATED");
  if (user.id !== entry.userId) throw new ForbiddenError("AUDIT_ACTOR_MISMATCH");

  const { data: membership, error: memberError } = await supabase
    .from("memberships")
    .select("tenant_id, is_active, valid_from, valid_to")
    .eq("user_id", user.id)
    .eq("tenant_id", entry.tenantId)
    .maybeSingle();
  if (memberError || !membership || !isMembershipCurrentlyActive(membership)) {
    throw new ForbiddenError("AUDIT_MEMBERSHIP_INVALID");
  }

  const { data, error } = await supabase.from("audit_log").insert({
    tenant_id: entry.tenantId,
    actor_id: user.id,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId,
    payload: entry.payload ?? {},
    details: entry.details ?? {},
  }).select("id, created_at").single();

  if (error || !data) {
    // Current canonical schema denies direct audit writes: this is expected to
    // fail until callers are migrated to an audited RPC. Never synthesize an ID.
    throw new Error("AUDIT_WRITE_FAILED: Dùng RPC giao dịch có ghi kiểm toán nguyên tử");
  }

  return {
    ...entry,
    id: data.id,
    timestamp: data.created_at,
  };
}

/**
 * Truy vấn nhật ký kiểm toán từ bảng public.audit_log của CSDL.
 */
export async function getRecentAuditLogs(tenantId?: string, limit = 20) {
  const ctx = await getRequestContext();
  const selectedTenantId = tenantId ?? ctx.tenantId;
  assertUuid(selectedTenantId, "TENANT");
  if (selectedTenantId !== ctx.tenantId) throw new ForbiddenError("AUDIT_TENANT_MISMATCH");
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("audit_log")
    .select("*")
    .eq("tenant_id", selectedTenantId)
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 100));
  if (error || !data) throw new Error("AUDIT_QUERY_FAILED");
  return data;
}
