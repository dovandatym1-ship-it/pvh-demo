import "server-only";

import { getRequestContext, type RequestContext } from "@/lib/auth/request-context";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  DEFAULT_NOTIFICATION_FILTERS, NOTIFICATION_EVENTS,
  type NotificationFilters,
} from "../filters";

export interface PersonalNotification {
  id: string;
  eventCode: string;
  sourceId: string | null;
  createdAt: string;
  readAt: string | null;
}

export type NotificationsView =
  | { status: "ready"; items: PersonalNotification[]; unread: number; total: number;
      page: number; pageSize: number; filters: NotificationFilters }
  | { status: "demo" | "unavailable"; items: []; unread: null; total: null;
      page: number; pageSize: number; filters: NotificationFilters };

export async function getPersonalNotifications(
  ctx?: RequestContext,
  requestedPage = 1,
  requestedPageSize = 20,
  filters: NotificationFilters = DEFAULT_NOTIFICATION_FILTERS,
): Promise<NotificationsView> {
  const current = ctx ?? await getRequestContext();
  const page = Math.max(1, Math.min(10000, Math.floor(requestedPage) || 1));
  const size = Math.max(1, Math.min(50, Math.floor(requestedPageSize) || 20));
  const empty = { items: [] as [], unread: null, total: null, page, pageSize: size, filters };
  try {
    const db = await createServerSupabaseClient();
    const { data: { user } } = await db.auth.getUser();
    if (!user || user.id !== current.userId) return { ...empty, status: "demo" };

    let query = db.from("pvh_user_notifications")
      .select("id,event_code,source_id,created_at,read_at", { count: "exact" })
      .eq("tenant_id", current.tenantId).eq("recipient_id", current.userId);
    if (filters.status === "unread") query = query.is("read_at", null);
    if (filters.status === "read") query = query.not("read_at", "is", null);
    if (filters.group !== "all") query = query.in("event_code", NOTIFICATION_EVENTS[filters.group]);
    if (filters.period !== "all") {
      const days = filters.period === "7d" ? 7 : 30;
      query = query.gte("created_at", new Date(Date.now() - days * 86400000).toISOString());
    }

    const [list, unreadResult] = await Promise.all([
      query.order("created_at", { ascending: false }).order("id", { ascending: false })
        .range((page - 1) * size, page * size - 1),
      db.from("pvh_user_notifications")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", current.tenantId).eq("recipient_id", current.userId)
        .is("read_at", null),
    ]);
    if (list.error || unreadResult.error) return { ...empty, status: "unavailable" };
    const items = (list.data ?? []).map(row => ({
      id: String(row.id),
      eventCode: String(row.event_code),
      sourceId: row.source_id ? String(row.source_id) : null,
      createdAt: String(row.created_at),
      readAt: row.read_at ? String(row.read_at) : null,
    }));
    return {
      status: "ready", items, unread: unreadResult.count ?? 0,
      total: list.count ?? 0, page, pageSize: size, filters,
    };
  } catch {
    return { ...empty, status: "unavailable" };
  }
}
