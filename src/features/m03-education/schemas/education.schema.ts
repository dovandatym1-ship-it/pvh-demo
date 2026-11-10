import { z } from "zod";

export const ApproveExemptionSchema=z.object({
  exemptionId:z.string().uuid("Mã hồ sơ không hợp lệ"),
  status:z.enum(["APPROVED","REJECTED"]),
  expectedVersion:z.number().int().min(1,"Thiếu phiên bản hồ sơ"),
  decisionReference:z.string().trim().min(5,"Cần mã hồ sơ/quyết định từ nguồn có thẩm quyền").max(200),
  idempotencyKey:z.string().uuid().optional(),
}).strict();

export type ApproveExemptionInput=z.infer<typeof ApproveExemptionSchema>;
