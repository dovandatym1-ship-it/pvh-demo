"use server";

import { revalidatePath } from "next/cache";
import { getRequestContext } from "@/lib/auth/request-context";
import { assertPermission } from "@/lib/authorization/assert-permission";
import { type Result, fail } from "@/lib/types/result";
import {
  CreateWorkItemSchema,
  type CreateWorkItemInput,
  TransitionWorkItemSchema,
  type TransitionWorkItemInput,
} from "../schemas/work-item.schema";
import { workItemService } from "./service";
import type { WorkItemDTO } from "../types";

/**
 * Server Action for creating a new work item.
 * Acts as a thin coordinator per ADR-002 §9.2.
 */
export async function createWorkItemAction(input: unknown): Promise<Result<WorkItemDTO>> {
  try {
    // 1. Input schema validation
    const parsed = CreateWorkItemSchema.safeParse(input);
    if (!parsed.success) {
      return fail("VALIDATION", "Dữ liệu đầu vào không hợp lệ", parsed.error.flatten());
    }

    // 2. Extract server-side RequestContext (never trust client identity)
    let ctx;
    try {
      ctx = await getRequestContext();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("UNAUTHENTICATED")) {
        return fail("UNAUTHENTICATED", "Người dùng chưa đăng nhập hoặc phiên đã hết hạn (UNAUTHENTICATED)");
      }
      return fail("FORBIDDEN", "Không thể xác định ngữ cảnh công tác hợp lệ (FORBIDDEN)");
    }

    // 3. Authorization assertion
    try {
      assertPermission(ctx, "m01:work:create");
    } catch {
      return fail("FORBIDDEN", "Bạn không có quyền tạo công việc (FORBIDDEN)");
    }

    // 4. Delegate to service layer
    const result = await workItemService.createWorkItem(ctx, parsed.data);
    if (!result.ok) {
      return result;
    }

    // 5. Invalidate relevant caches
    revalidatePath("/cong-viec");

    return result;
  } catch (err: unknown) {
    return fail("INTERNAL", "Đã xảy ra lỗi nội bộ không mong muốn", err);
  }
}

/**
 * Server Action for transitioning work item state with OCC.
 */
export async function transitionWorkItemAction(
  input: unknown
): Promise<Result<{ id: string; status: string; version: number; cached?: boolean }>> {
  try {
    // 1. Input schema validation
    const parsed = TransitionWorkItemSchema.safeParse(input);
    if (!parsed.success) {
      return fail("VALIDATION", "Dữ liệu chuyển trạng thái không hợp lệ", parsed.error.flatten());
    }

    // 2. Extract server-side RequestContext
    let ctx;
    try {
      ctx = await getRequestContext();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("UNAUTHENTICATED")) {
        return fail("UNAUTHENTICATED", "Người dùng chưa đăng nhập hoặc phiên đã hết hạn (UNAUTHENTICATED)");
      }
      return fail("FORBIDDEN", "Không thể xác định ngữ cảnh công tác hợp lệ (FORBIDDEN)");
    }

    // 3. Delegate to service layer
    const result = await workItemService.transitionWorkItem(ctx, parsed.data);
    if (!result.ok) {
      return result;
    }

    // 4. Invalidate relevant caches
    revalidatePath("/cong-viec");
    revalidatePath("/ban-lam-viec");

    return result;
  } catch (err: unknown) {
    return fail("INTERNAL", "Đã xảy ra lỗi nội bộ không mong muốn khi chuyển trạng thái", err);
  }
}
