import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { RequestContext } from "@/lib/auth/request-context";
import type { WorkItemDTO, WorkItemEventDTO } from "../types";

type RawWork = Record<string, unknown>;

function mapWork(r: RawWork): WorkItemDTO {
  return {
    id: String(r.id), tenantId: String(r.tenant_id), title: String(r.title),
    description: r.description ? String(r.description) : null,
    status: r.status as WorkItemDTO["status"],
    priority: r.priority as WorkItemDTO["priority"],
    category: String(r.category), assignedTo: r.assigned_to ? String(r.assigned_to) : null,
    dueDate: r.due_date ? String(r.due_date) : null,
    hamletId: r.hamlet_id ? String(r.hamlet_id) : null,
    version: Number(r.version), idempotencyKey: r.idempotency_key ? String(r.idempotency_key) : null,
    createdAt: String(r.created_at), createdBy: String(r.created_by),
    updatedAt: String(r.updated_at), updatedBy: String(r.updated_by),
  };
}

function requireRead(ctx: RequestContext) {
  if (!ctx.permissions.includes("m01:work:read")) throw new Error("FORBIDDEN: Thiếu quyền xem công việc");
}

export type WorkFilter = "mine" | "created" | "review" | "all";

export async function getWorkItemsPage(ctx: RequestContext, opts: {
  filter?: WorkFilter; page?: number; pageSize?: number; search?: string;
} = {}): Promise<{ items: WorkItemDTO[]; total: number; page: number; pageSize: number }> {
  requireRead(ctx);
  const db = await createServerSupabaseClient();
  const page = Math.max(1, Math.min(10000, Math.floor(opts.page || 1)));
  const pageSize = Math.max(1, Math.min(100, Math.floor(opts.pageSize || 20)));
  const filter = opts.filter || "mine";
  // RLS remains the final record-level boundary for all filters.
  let query = db.from("work_items").select("*", { count: "exact" }).eq("tenant_id", ctx.tenantId);
  if (filter === "mine") query = query.eq("assigned_to", ctx.userId);
  if (filter === "created") query = query.eq("created_by", ctx.userId);
  if (filter === "review") query = query.eq("status", "UNDER_REVIEW");
  if (filter === "all" && !ctx.permissions.includes("m01:work:read_all")) {
    throw new Error("FORBIDDEN: Thiếu quyền xem toàn đơn vị");
  }
  const search = opts.search?.trim().slice(0, 100);
  if (search) query = query.ilike("title", `%${search.replace(/[%_,]/g, "\\$&")}%`);
  const { data, error, count } = await query.order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);
  if (error) throw new Error(`DB_ERROR: Không tải được danh sách công việc (${error.code})`);
  return { items: (data || []).map((r) => mapWork(r)), total: count ?? 0, page, pageSize };
}

// Retained for legacy callers. Never substitute fake rows on empty/error.
export async function getWorkItems(ctx: RequestContext): Promise<WorkItemDTO[]> {
  requireRead(ctx);
  const db = await createServerSupabaseClient();
  const { data, error } = await db.from("work_items").select("*")
    .eq("tenant_id", ctx.tenantId).order("created_at", { ascending: false }).limit(100);
  if (error) throw new Error(`DB_ERROR: Không tải được công việc (${error.code})`);
  return (data || []).map(mapWork);
}

export async function getWorkItemById(ctx: RequestContext, id: string): Promise<WorkItemDTO | null> {
  requireRead(ctx);
  const db = await createServerSupabaseClient();
  const { data, error } = await db.from("work_items").select("*")
    .eq("tenant_id", ctx.tenantId).eq("id", id).maybeSingle();
  if (error) throw new Error(`DB_ERROR: Không tải được công việc (${error.code})`);
  return data ? mapWork(data) : null;
}

export async function getWorkItemDetail(ctx: RequestContext, id: string) {
  const item = await getWorkItemById(ctx, id);
  if (!item) return null;
  const db = await createServerSupabaseClient();
  const [events, assignments, evidence] = await Promise.all([
    db.from("work_item_events").select("*").eq("tenant_id", ctx.tenantId)
      .eq("work_item_id", id).order("created_at", { ascending: true }),
    db.from("work_item_assignments").select("id,previous_assignee,assignee,actor_id,reason,work_item_version,created_at")
      .eq("tenant_id", ctx.tenantId).eq("work_item_id", id).order("created_at", { ascending: true }),
    db.from("evidence_files").select("id,original_name,uploaded_by,created_at,status")
      .eq("tenant_id", ctx.tenantId).eq("work_item_id", id).order("created_at", { ascending: false }),
  ]);
  if (events.error || assignments.error || evidence.error) {
    throw new Error("DB_ERROR: Không tải đủ lịch sử, phân công hoặc minh chứng");
  }
  const timeline: WorkItemEventDTO[] = (events.data || []).map((r) => ({
    id: String(r.id), tenantId: String(r.tenant_id), workItemId: String(r.work_item_id),
    fromStatus: r.from_status, toStatus: String(r.to_status), actorId: String(r.actor_id),
    reason: r.reason, payload: r.payload || {}, version: Number(r.version),
    createdAt: String(r.created_at), createdBy: String(r.created_by),
  }));
  return { item, timeline, assignments: assignments.data || [], evidence: evidence.data || [] };
}

export async function getAssignees(ctx: RequestContext): Promise<{ userId: string; fullName: string }[]> {
  if (!ctx.permissions.includes("m01:work:assign")) return [];
  const db = await createServerSupabaseClient();
  const { data, error } = await db.schema("app").rpc("list_work_assignees");
  if (error) throw new Error(`DB_ERROR: Không tải được người nhận việc (${error.code})`);
  return (data || []).map((r: { user_id: string; full_name: string }) =>
    ({ userId: r.user_id, fullName: r.full_name }));
}

export async function getDashboardStats(ctx: RequestContext) {
  requireRead(ctx);
  const db = await createServerSupabaseClient();
  // Exact server-side counts against RLS-visible rows; URGENT is not overdue.
  const base = () => db.from("work_items").select("id", { count: "exact", head: true })
    .eq("tenant_id", ctx.tenantId);
  const now = new Date().toISOString();
  const [mine, review, overdue] = await Promise.all([
    base().eq("assigned_to", ctx.userId).in("status", ["ASSIGNED", "IN_PROGRESS", "RETURNED"]),
    base().eq("status", "UNDER_REVIEW"),
    base().lt("due_date", now).neq("status", "COMPLETED").neq("status", "CANCELLED"),
  ]);
  if (mine.error || review.error || overdue.error) throw new Error("DB_ERROR: Không thống kê được công việc");
  return { mine: mine.count ?? 0,
    review: ctx.permissions.includes("m01:work:review") ? review.count ?? 0 : 0,
    overdue: overdue.count ?? 0 };
}

export async function getWorkInbox(ctx: RequestContext): Promise<{
  id: string; workItemId: string; kind: string; createdAt: string;
}[]> {
  requireRead(ctx);
  const db = await createServerSupabaseClient();
  const { data, error } = await db.from("work_item_inbox")
    .select("id,work_item_id,kind,created_at")
    .eq("tenant_id", ctx.tenantId).eq("recipient_id", ctx.userId)
    .order("created_at", { ascending: false }).limit(10);
  if (error) throw new Error(`DB_ERROR: Không tải được thông báo (${error.code})`);
  return (data || []).map(r => ({ id: r.id, workItemId: r.work_item_id,
    kind: r.kind, createdAt: r.created_at }));
}
