import { z } from "zod";

export const ApproveExemptionSchema = z.object({
  exemptionId: z.string().uuid("ID hồ sơ không hợp lệ"),
  status: z.enum(["APPROVED", "REJECTED"]),
  idempotencyKey: z.string().optional(),
});

export type ApproveExemptionInput = z.infer<typeof ApproveExemptionSchema>;
