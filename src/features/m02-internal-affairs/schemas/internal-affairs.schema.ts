import { z } from "zod";

export const ResolveDisputeSchema=z.object({
  disputeId:z.string().uuid("Mã vụ việc không hợp lệ"),
  status:z.enum(["SCHEDULED","RESOLVED_SUCCESS","RESOLVED_FAILED"]),
  outcome:z.string().trim().min(5,"Tóm tắt kết quả xử lý tối thiểu 5 ký tự").max(2000),
  expectedVersion:z.number().int().min(1,"Thiếu phiên bản hồ sơ"),
  decisionReference:z.string().trim().min(5,"Cần mã biên bản/văn bản nguồn").max(200),
  idempotencyKey:z.string().uuid().optional(),
}).strict();
export type ResolveDisputeInput=z.infer<typeof ResolveDisputeSchema>;
