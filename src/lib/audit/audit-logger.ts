export interface AuditLogEntry {
  id: string;
  timestamp: string;
  tenantId: string;
  userId: string;
  personaCode: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, any>;
  ipAddress?: string;
}

export async function logAuditEvent(entry: Omit<AuditLogEntry, "id" | "timestamp">) {
  const log: AuditLogEntry = {
    ...entry,
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  if (process.env.NODE_ENV !== "production") {
    console.log(`[AUDIT] [${log.timestamp}] [${log.tenantId}] ${log.personaCode} performed ${log.action} on ${log.entityType}:${log.entityId}`);
  }

  return log;
}
