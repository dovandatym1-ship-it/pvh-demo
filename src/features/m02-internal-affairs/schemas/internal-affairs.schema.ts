import { z } from "zod";

export const ResolveDisputeSchema = z.object({
  disputeId: z.string().uuid("ID vụ việc không hợp lệ"),
  status: z.enum(["SCHEDULED", "RESOLVED_SUCCESS", "RESOLVED_FAILED", "ESCALATED_DISTRICT"]),
  outcome: z.string().min(5, "Tóm tắt kết quả giải quyết tối thiểu 5 ký tự"),
  idempotencyKey: z.string().optional(),
});

export type ResolveDisputeInput = z.infer<typeof ResolveDisputeSchema>;
