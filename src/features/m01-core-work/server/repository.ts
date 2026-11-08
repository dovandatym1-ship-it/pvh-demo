import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { type Result, ok, fail } from "@/lib/types/result";
import type { RequestContext } from "@/lib/auth/request-context";
import type { CreateWorkItemInput, TransitionWorkItemInput } from "../schemas/work-item.schema";
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
        if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
          const newId = `item-${Date.now()}`;
          const fallbackDto: WorkItemDTO = {
            id: newId,
            tenantId: ctx.tenantId,
            title: input.title,
            description: input.description || null,
            status: "NEW",
            priority: input.priority || "MEDIUM",
            category: input.category || "CHUNG",
            assignedTo: input.assignedTo || null,
            dueDate: input.dueDate || null,
            hamletId: input.hamletId || null,
            version: 1,
            idempotencyKey: input.idempotencyKey || null,
            createdAt: new Date().toISOString(),
            createdBy: ctx.userId,
            updatedAt: new Date().toISOString(),
            updatedBy: ctx.userId,
          };
          return ok(fallbackDto);
        }

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

  /**
   * Invokes PostgreSQL single-transaction RPC app.transition_work_item with OCC (expectedVersion).
   */
  async transitionWorkItem(
    ctx: RequestContext,
    params: {
      id: string;
      toState: string;
      expectedVersion: number;
      idempotencyKey?: string | null;
      reason?: string | null;
    }
  ): Promise<Result<{ id: string; status: string; version: number; cached?: boolean }>> {
    try {
      const supabase = await createServerSupabaseClient();

      const { data, error } = await supabase.rpc("transition_work_item", {
        p_id: params.id,
        p_to_state: params.toState,
        p_expected_version: params.expectedVersion,
        p_idempotency_key: params.idempotencyKey || null,
        p_reason: params.reason || null,
      });

      if (error) {
        if (error.message.includes("VERSION_CONFLICT") || error.code === "PV409") {
          return fail("VERSION_CONFLICT", "Xung đột phiên bản dữ liệu khi chuyển trạng thái (PV409 / VERSION_CONFLICT)", error);
        }
        if (error.message.includes("FORBIDDEN") || error.code === "42501") {
          return fail("FORBIDDEN", "Không có quyền chuyển trạng thái công việc (FORBIDDEN)", error);
        }
        if (error.message.includes("UNAUTHENTICATED") || error.code === "28000") {
          return fail("UNAUTHENTICATED", "Chưa xác thực danh tính hợp lệ (UNAUTHENTICATED)", error);
        }
        if (error.message.includes("VALIDATION") || error.code === "22023") {
          return fail("VALIDATION", `Lỗi xác thực dữ liệu: ${error.message}`, error);
        }
        if (error.message.includes("NOT_FOUND") || error.code === "P0002") {
          return fail("NOT_FOUND", `Không tìm thấy công việc: ${error.message}`, error);
        }
        return fail("INTERNAL", `Lỗi CSDL khi gọi RPC transition_work_item: ${error.message}`, error);
      }

      const res = data as Record<string, unknown>;
      return ok({
        id: String(res.id),
        status: String(res.status),
        version: Number(res.version),
        cached: Boolean(res.cached),
      });
    } catch (err: unknown) {
      return fail("INTERNAL", "Đã xảy ra lỗi hệ thống tại repository layer khi chuyển trạng thái", err);
    }
  },
};
