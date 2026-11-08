import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { RequestContext } from "@/lib/auth/request-context";
import type { WorkItemDTO } from "../types";

export async function getWorkItems(ctx: RequestContext): Promise<WorkItemDTO[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("work_items")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: String(row.id),
    tenantId: String(row.tenant_id),
    title: String(row.title),
    description: (row.description as string) || null,
    status: (row.status as WorkItemDTO["status"]) || "NEW",
    priority: (row.priority as WorkItemDTO["priority"]) || "MEDIUM",
    category: (row.category as string) || "CHUNG",
    assignedTo: (row.assigned_to as string) || null,
    dueDate: (row.due_date as string) || null,
    hamletId: (row.hamlet_id as string) || null,
    version: Number(row.version) || 1,
    idempotencyKey: (row.idempotency_key as string) || null,
    createdAt: String(row.created_at),
    createdBy: String(row.created_by),
    updatedAt: String(row.updated_at),
    updatedBy: String(row.updated_by),
  }));
}

export async function getWorkItemById(
  ctx: RequestContext,
  id: string
): Promise<WorkItemDTO | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("work_items")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: String(data.id),
    tenantId: String(data.tenant_id),
    title: String(data.title),
    description: (data.description as string) || null,
    status: (data.status as WorkItemDTO["status"]) || "NEW",
    priority: (data.priority as WorkItemDTO["priority"]) || "MEDIUM",
    category: (data.category as string) || "CHUNG",
    assignedTo: (data.assigned_to as string) || null,
    dueDate: (data.due_date as string) || null,
    hamletId: (data.hamlet_id as string) || null,
    version: Number(data.version) || 1,
    idempotencyKey: (data.idempotency_key as string) || null,
    createdAt: String(data.created_at),
    createdBy: String(data.created_by),
    updatedAt: String(data.updated_at),
    updatedBy: String(data.updated_by),
  };
}
