import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface AuditLogEntry {
  id?: string;
  timestamp?: string;
  tenantId: string;
  userId: string;
  personaCode?: string;
  action: string;
  entityType: string;
  entityId: string;
  payload?: Record<string, any>;
  details?: Record<string, any>;
  ipAddress?: string;
}

export const TENANT_A_UUID = "a0000000-0000-0000-0000-000000000001";

export const PERSONA_UUIDS: Record<string, string> = {
  ADMIN: "c0000000-0000-0000-0000-000000000000",
  P1: "c0000000-0000-0000-0000-000000000001",
  P2: "c0000000-0000-0000-0000-000000000002",
  P3: "c0000000-0000-0000-0000-000000000003",
  P4: "c0000000-0000-0000-0000-000000000004",
  P5: "c0000000-0000-0000-0000-000000000005",
  P6: "c0000000-0000-0000-0000-000000000006",
};

export function toValidUuid(id: string, fallback: string): string {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) return id;
  return fallback;
}

/**
 * Ghi nhật ký kiểm toán (Audit Log) bất biến vào bảng public.audit_log của CSDL.
 * Tuân thủ ADR-002 §6.5 & S1-02: append-only, chống sửa đổi/xóa.
 */
export async function logAuditEvent(entry: Omit<AuditLogEntry, "id" | "timestamp">): Promise<AuditLogEntry> {
  const tenantUuid = toValidUuid(entry.tenantId, TENANT_A_UUID);
  const actorUuid = toValidUuid(
    entry.userId,
    entry.personaCode ? PERSONA_UUIDS[entry.personaCode] || PERSONA_UUIDS.P1 : PERSONA_UUIDS.P1
  );

  const payload = entry.payload || entry.details || {};
  const details = entry.details || entry.payload || {};

  try {
    const supabase = await createServerSupabaseClient();
    await supabase.from("audit_log").insert({
      tenant_id: tenantUuid,
      actor_id: actorUuid,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId,
      payload,
      details,
      ip_address: entry.ipAddress || "127.0.0.1",
    });
  } catch (err) {
    console.warn("[AUDIT WARN] Database audit write fallback:", err);
  }

  if (process.env.NODE_ENV !== "production") {
    console.log(
      `[AUDIT DB] [${new Date().toISOString()}] [${entry.tenantId}] ${entry.userId} performed ${entry.action} on ${entry.entityType}:${entry.entityId}`
    );
  }

  return {
    ...entry,
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Truy vấn nhật ký kiểm toán từ bảng public.audit_log của CSDL.
 */
export async function getRecentAuditLogs(tenantId = TENANT_A_UUID, limit = 20) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("audit_log")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}
