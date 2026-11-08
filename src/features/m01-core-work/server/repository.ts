import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { type Result, ok, fail } from "@/lib/types/result";
import type { RequestContext } from "@/lib/auth/request-context";
import type { CreateWorkItemInput, TransitionWorkItemInput, AssignWorkItemInput, UpdateWorkItemDetailsInput } from "../schemas/work-item.schema";
import type { WorkItemDTO } from "../types";

function dbFailure(error: { message: string; code?: string }): Result<never> {
  if (error.code === "PV409" || /VERSION_CONFLICT|IDEMPOTENCY_CONFLICT/.test(error.message)) {
    return fail("VERSION_CONFLICT", "Dữ liệu đã được xử lý hoặc thay đổi ở phiên khác", error.message);
  }
  if (/INVALID_TRANSITION/.test(error.message)) return fail("INVALID_TRANSITION", "Không thể chuyển trạng thái này");
  if (/DUPLICATE_REQUEST/.test(error.message) || error.code === "23505") return fail("DUPLICATE_REQUEST", "Yêu cầu đã tồn tại với nội dung khác");
  if (error.code === "42501" || /FORBIDDEN/.test(error.message)) return fail("FORBIDDEN", "Không có quyền hoặc ngoài phạm vi công việc");
  if (error.code === "28000" || /UNAUTHENTICATED/.test(error.message)) return fail("UNAUTHENTICATED", "Cần đăng nhập lại");
  if (error.code === "P0002" || /NOT_FOUND/.test(error.message)) return fail("NOT_FOUND", "Không tìm thấy công việc");
  if (error.code === "22023" || /VALIDATION|INVALID_ASSIGNEE/.test(error.message)) return fail("VALIDATION", error.message);
  return fail("INTERNAL", "Không thể lưu thay đổi vào cơ sở dữ liệu", error.message);
}

type Mutation = { id: string; status: string; version: number; cached?: boolean };
function mutationResult(data: unknown): Result<Mutation> {
  if (!data || typeof data !== "object" || Array.isArray(data)) return fail("INTERNAL", "RPC không trả kết quả ghi hợp lệ");
  const row = data as Record<string, unknown>;
  if (typeof row.id !== "string" || typeof row.status !== "string" ||
    typeof row.version !== "number" || !Number.isInteger(row.version)) {
    return fail("INTERNAL", "Phản hồi RPC thiếu id, trạng thái hoặc phiên bản");
  }
  return ok({ id: row.id, status: row.status, version: row.version, cached: row.cached === true });
}

export const workItemRepository = {
  async createWorkItem(ctx: RequestContext, input: CreateWorkItemInput): Promise<Result<WorkItemDTO>> {
    try {
      const db = await createServerSupabaseClient();
      const { data, error } = await db.schema("app").rpc("create_work_item", {
        p_idempotency_key: input.idempotencyKey,
        p_title: input.title,
        p_description: input.description || null,
        p_priority: input.priority,
        p_assigned_to: input.assignedTo || null,
        p_due_date: input.dueDate || null,
        p_category: input.category,
        p_hamlet_id: input.hamletId || null,
        p_tenant_id: ctx.tenantId,
      });
      if (error) return dbFailure(error);
      if (!data || typeof data !== "object" || Array.isArray(data)) return fail("INTERNAL", "RPC tạo công việc không trả bản ghi");
      const r = data as Record<string, unknown>;
      if (!r.id || !r.tenant_id || !r.created_at) return fail("INTERNAL", "Phản hồi tạo công việc không đầy đủ");
      return ok({
        id: String(r.id), tenantId: String(r.tenant_id), title: String(r.title),
        description: r.description ? String(r.description) : null,
        status: r.status as WorkItemDTO["status"],
        priority: r.priority as WorkItemDTO["priority"], category: String(r.category),
        assignedTo: r.assigned_to ? String(r.assigned_to) : null,
        dueDate: r.due_date ? String(r.due_date) : null,
        hamletId: r.hamlet_id ? String(r.hamlet_id) : null,
        version: Number(r.version), idempotencyKey: String(r.idempotency_key),
        createdAt: String(r.created_at), createdBy: String(r.created_by),
        updatedAt: String(r.updated_at), updatedBy: String(r.updated_by),
      });
    } catch { return fail("INTERNAL", "Không kết nối được cơ sở dữ liệu"); }
  },

  async transitionWorkItem(_ctx: RequestContext, input: TransitionWorkItemInput): Promise<Result<Mutation>> {
    try {
      const db = await createServerSupabaseClient();
      const { data, error } = await db.schema("app").rpc("transition_work_item", {
        p_id: input.id, p_to_state: input.toState, p_expected_version: input.expectedVersion,
        p_reason: input.reason || null, p_idempotency_key: input.idempotencyKey,
      });
      return error ? dbFailure(error) : mutationResult(data);
    } catch { return fail("INTERNAL", "Không kết nối được cơ sở dữ liệu"); }
  },

  async assignWorkItem(_ctx: RequestContext, input: AssignWorkItemInput): Promise<Result<Mutation>> {
    try {
      const db = await createServerSupabaseClient();
      const { data, error } = await db.schema("app").rpc("assign_work_item", {
        p_id: input.id, p_assigned_to: input.assignedTo, p_expected_version: input.expectedVersion,
        p_reason: input.reason || null, p_idempotency_key: input.idempotencyKey,
      });
      return error ? dbFailure(error) : mutationResult(data);
    } catch { return fail("INTERNAL", "Không kết nối được cơ sở dữ liệu"); }
  },

  async updateWorkItemDetails(_ctx: RequestContext, input: UpdateWorkItemDetailsInput): Promise<Result<Mutation>> {
    try {
      const db = await createServerSupabaseClient();
      const { data, error } = await db.schema("app").rpc("update_work_item_details", {
        p_id: input.id, p_expected_version: input.expectedVersion,
        p_due_date: input.dueDate, p_hamlet_id: input.hamletId,
        p_reason: input.reason, p_idempotency_key: input.idempotencyKey,
      });
      return error ? dbFailure(error) : mutationResult(data);
    } catch { return fail("INTERNAL", "Không kết nối được cơ sở dữ liệu"); }
  },
};
