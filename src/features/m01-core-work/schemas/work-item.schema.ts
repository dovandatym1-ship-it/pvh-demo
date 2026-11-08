import { z } from "zod";

const key = z.string().trim().min(8, "Thiếu mã chống gửi trùng").max(200);
const uuid = z.string().uuid();

export const CreateWorkItemSchema = z.object({
  title: z.string().trim().min(3, "Tiêu đề tối thiểu 3 ký tự").max(500),
  description: z.string().trim().max(5000).optional().default(""),
  sourceRef: z.string().trim().max(500).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  category: z.string().trim().min(1).max(100).default("CHUNG"),
  assignedTo: uuid.optional(),
  dueDate: z.string().datetime({ offset: true }).optional(),
  hamletId: uuid.optional(),
  idempotencyKey: key,
}).strict();

export type CreateWorkItemInput = z.infer<typeof CreateWorkItemSchema>;

export const TransitionWorkItemSchema = z.object({
  id: uuid,
  toState: z.enum(["ASSIGNED", "IN_PROGRESS", "UNDER_REVIEW", "COMPLETED", "RETURNED", "CANCELLED"]),
  expectedVersion: z.number().int().min(1),
  reason: z.string().trim().max(2000).optional().nullable(),
  idempotencyKey: key,
}).strict();

export type TransitionWorkItemInput = z.infer<typeof TransitionWorkItemSchema>;

export const AssignWorkItemSchema = z.object({
  id: uuid,
  assignedTo: uuid,
  expectedVersion: z.number().int().min(1),
  reason: z.string().trim().max(2000).optional().nullable(),
  idempotencyKey: key,
}).strict();

export type AssignWorkItemInput = z.infer<typeof AssignWorkItemSchema>;

export const UpdateWorkItemDetailsSchema = z.object({
  id: uuid,
  expectedVersion: z.number().int().min(1),
  dueDate: z.string().datetime({ offset: true }).nullable(),
  hamletId: uuid.nullable(),
  reason: z.string().trim().min(3, "Cần lý do điều chỉnh").max(2000),
  idempotencyKey: key,
}).strict();

export type UpdateWorkItemDetailsInput = z.infer<typeof UpdateWorkItemDetailsSchema>;
