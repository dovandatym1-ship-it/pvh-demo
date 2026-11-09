import "server-only";

import { getRequestContext, type RequestContext } from "@/lib/auth/request-context";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface PersonalNotification {
  id: string;
  eventCode: string;
  sourceId: string | null;
  createdAt: string;
  readAt: string | null;
}

export type NotificationsView =
  | { status: "ready"; items: PersonalNotification[]; unread: number; total: number; page: number }
  | { status: "demo" | "unavailable"; items: []; unread: null; total: null; page: number };

export async function getPersonalNotifications(
  ctx?: RequestContext,
  requestedPage = 1,
  requestedPageSize = 20
): Promise<NotificationsView> {
  const current = ctx ?? await getRequestContext();
  const page = Math.max(1, Math.min(10000, Math.floor(requestedPage) || 1));
  const size = Math.max(1, Math.min(50, Math.floor(requestedPageSize) || 20));
  try {
    const db = await createServerSupabaseClient();
    const { data: { user } } = await db.auth.getUser();
    if (!user || user.id !== current.userId) {
      return { status: "demo", items: [], unread: null, total: null, page };
    }
    const base = () => db.from("pvh_user_notifications")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", current.tenantId).eq("recipient_id", current.userId);
    const [list, unreadResult] = await Promise.all([
      db.from("pvh_user_notifications")
        .select("id,event_code,source_id,created_at,read_at", { count: "exact" })
        .eq("tenant_id", current.tenantId).eq("recipient_id", current.userId)
        .order("created_at", { ascending: false })
        .range((page - 1) * size, page * size - 1),
      base().is("read_at", null),
    ]);
    if (list.error || unreadResult.error) {
      return { status: "unavailable", items: [], unread: null, total: null, page };
    }
    const items = (list.data ?? []).map((x) => ({
      id: String(x.id),
      eventCode: String(x.event_code),
      sourceId: x.source_id ? String(x.source_id) : null,
      createdAt: String(x.created_at),
      readAt: x.read_at ? String(x.read_at) : null,
    }));
    return { status: "ready", items, unread: unreadResult.count ?? 0, total: list.count ?? 0, page };
  } catch {
    return { status: "unavailable", items: [], unread: null, total: null, page };
  }
}
