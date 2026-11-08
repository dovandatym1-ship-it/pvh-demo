import "server-only";

import { type Result, fail } from "@/lib/types/result";
import type { RequestContext } from "@/lib/auth/request-context";
import type { CreateWorkItemInput } from "../schemas/work-item.schema";
import type { WorkItemDTO } from "../types";
import { assertCanCreateWorkItem } from "./policy";
import { workItemRepository } from "./repository";

export const workItemService = {
  /**
   * Business service coordinating validation, policies, and repository calls.
   */
  async createWorkItem(
    ctx: RequestContext,
    input: CreateWorkItemInput
  ): Promise<Result<WorkItemDTO>> {
    // 1. Policy assertion
    try {
      assertCanCreateWorkItem(ctx);
    } catch (err: unknown) {
      return fail("FORBIDDEN", "Không có quyền tạo công việc mới (FORBIDDEN)", err);
    }

    // 2. Business rules validation
    if (input.dueDate) {
      const dueDate = new Date(input.dueDate);
      if (isNaN(dueDate.getTime())) {
        return fail("VALIDATION", "Hạn xử lý không đúng định dạng ngày giờ");
      }
    }

    // 3. Ensure idempotency key exists
    const sanitizedInput: CreateWorkItemInput = {
      ...input,
      idempotencyKey:
        input.idempotencyKey ||
        `idem-${ctx.tenantId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    };

    // 4. Delegate to repository
    return await workItemRepository.createWorkItem(ctx, sanitizedInput);
  },
};
