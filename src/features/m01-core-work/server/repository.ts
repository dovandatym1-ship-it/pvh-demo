import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { type Result, ok, fail } from "@/lib/types/result";
import type { RequestContext } from "@/lib/auth/request-context";
import type { CreateWorkItemInput } from "../schemas/work-item.schema";
import type { WorkItemDTO } from "../types";

export const workItemRepository = {
  /**
   * Invokes PostgreSQL single-transaction RPC app.create_work_item.
   */
  async createWorkItem(
    ctx: RequestContext,
    input: CreateWorkItemInput
  ): Promise<Result<WorkItemDTO>> {
    try {
      const supabase = await createServerSupabaseClient();

      const { data, error } = await supabase.rpc("create_work_item", {
        p_idempotency_key: input.idempotencyKey || null,
        p_title: input.title,
        p_description: input.description || null,
        p_priority: input.priority || "MEDIUM",
        p_assigned_to: input.assignedTo || null,
        p_due_date: input.dueDate || null,
        p_category: input.category || "CHUNG",
        p_hamlet_id: input.hamletId || null,
        p_tenant_id: ctx.tenantId,
      });

      if (error) {
        if (error.message.includes("VERSION_CONFLICT")) {
          return fail("VERSION_CONFLICT", "Xung đột phiên bản dữ liệu khi tạo công việc", error);
        }
        if (error.message.includes("DUPLICATE_REQUEST") || error.code === "23505") {
          return fail("DUPLICATE_REQUEST", "Yêu cầu bị trùng lặp idempotency key", error);
        }
        if (error.message.includes("FORBIDDEN") || error.code === "42501") {
          return fail("FORBIDDEN", "Không có quyền thực hiện thao tác trên CSDL (FORBIDDEN)", error);
        }
        if (error.message.includes("UNAUTHENTICATED") || error.code === "28000") {
          return fail("UNAUTHENTICATED", "Chưa xác thực danh tính hợp lệ (UNAUTHENTICATED)", error);
        }
        return fail("INTERNAL", `Lỗi CSDL khi gọi RPC create_work_item: ${error.message}`, error);
      }

      const row = data as Record<string, unknown>;
      const dto: WorkItemDTO = {
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
      };

      return ok(dto);
    } catch (err: unknown) {
      return fail("INTERNAL", "Đã xảy ra lỗi hệ thống tại repository layer", err);
    }
  },
};
