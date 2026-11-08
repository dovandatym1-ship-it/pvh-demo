import { z } from "zod";

export const CreateWorkItemSchema = z.object({
  title: z.string().min(3, "Tiêu đề công việc phải có ít nhất 3 ký tự").max(255),
  description: z.string().optional().default(""),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  category: z.string().default("CHUNG"),
  assignedTo: z.string().uuid("Người nhận việc phải là UUID hợp lệ").optional(),
  dueDate: z.string().datetime("Hạn xử lý phải là định dạng ISO datetime").optional(),
  hamletId: z.string().uuid("Thôn/xóm phải là UUID hợp lệ").optional(),
  idempotencyKey: z.string().optional(),
});

export type CreateWorkItemInput = z.infer<typeof CreateWorkItemSchema>;

export const TransitionWorkItemSchema = z.object({
  id: z.string().uuid("ID công việc phải là UUID hợp lệ"),
  toState: z.enum([
    "NEW",
    "ASSIGNED",
    "IN_PROGRESS",
    "UNDER_REVIEW",
    "COMPLETED",
    "RETURNED",
    "CANCELLED",
  ]),
  expectedVersion: z.number().int().min(1, "Phiên bản kỳ vọng phải >= 1"),
  reason: z.string().optional().nullable(),
  idempotencyKey: z.string().optional().nullable(),
});

export type TransitionWorkItemInput = z.infer<typeof TransitionWorkItemSchema>;
