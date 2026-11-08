import { z } from "zod";

export const UpdateIndicatorStatusSchema = z.object({
  indicatorId: z.string().uuid("ID chỉ tiêu không hợp lệ"),
  status: z.enum(["CONFIRMED_ZERO", "CONFIRMED", "UNCONFIRMED", "MISSING", "NOT_APPLICABLE"]),
  value: z.string().min(1, "Giá trị chỉ tiêu không được để trống"),
  idempotencyKey: z.string().optional(),
});

export type UpdateIndicatorStatusInput = z.infer<typeof UpdateIndicatorStatusSchema>;
