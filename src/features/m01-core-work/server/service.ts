import "server-only";

import { type Result, fail } from "@/lib/types/result";
import type { RequestContext } from "@/lib/auth/request-context";
import type { CreateWorkItemInput, TransitionWorkItemInput, AssignWorkItemInput, UpdateWorkItemDetailsInput, SetWorkCollaboratorsInput } from "../schemas/work-item.schema";
import type { WorkItemDTO } from "../types";
import { assertCanCreateWorkItem } from "./policy";
import { workItemRepository } from "./repository";

type MutationResult = { id: string; status: string; version: number; cached?: boolean };

export const workItemService = {
  async createWorkItem(ctx: RequestContext, input: CreateWorkItemInput): Promise<Result<WorkItemDTO>> {
    try { assertCanCreateWorkItem(ctx); }
    catch { return fail("FORBIDDEN", "Không có quyền tạo công việc"); }
    // Never generate a key after the request arrives: a network retry must reuse it.
    return workItemRepository.createWorkItem(ctx, input);
  },

  async transitionWorkItem(ctx: RequestContext, input: TransitionWorkItemInput): Promise<Result<MutationResult>> {
    if (["RETURNED", "CANCELLED"].includes(input.toState) && !input.reason?.trim()) {
      return fail("VALIDATION", "Cần nêu lý do khi trả lại hoặc hủy công việc");
    }
    return workItemRepository.transitionWorkItem(ctx, input);
  },

  async assignWorkItem(ctx: RequestContext, input: AssignWorkItemInput): Promise<Result<MutationResult>> {
    if (!ctx.permissions.includes("m01:work:assign")) {
      return fail("FORBIDDEN", "Không có quyền giao việc");
    }
    return workItemRepository.assignWorkItem(ctx, input);
  },

  async updateWorkItemDetails(ctx: RequestContext, input: UpdateWorkItemDetailsInput): Promise<Result<MutationResult>> {
    if (!ctx.permissions.includes("m01:work:assign")) {
      return fail("FORBIDDEN", "Không có quyền điều chỉnh hạn hoặc địa bàn công việc");
    }
    return workItemRepository.updateWorkItemDetails(ctx, input);
  },

  async setWorkCollaborators(ctx: RequestContext, input: SetWorkCollaboratorsInput): Promise<Result<MutationResult>> {
    if (!ctx.permissions.includes("m01:work:assign")) {
      return fail("FORBIDDEN", "Không có quyền thay đổi người phối hợp");
    }
    return workItemRepository.setWorkCollaborators(ctx, input);
  },
};
