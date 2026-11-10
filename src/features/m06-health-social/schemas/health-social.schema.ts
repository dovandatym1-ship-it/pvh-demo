import { z } from "zod";

export const CreateBeneficiarySchema=z.object({
  fullName:z.string().trim().min(2,"Họ và tên tối thiểu 2 ký tự").max(150),
  cccd:z.string().regex(/^\d{12}$/,"Số định danh cần đủ 12 chữ số"),
  phone:z.string().trim().regex(/^\+?[0-9]{9,15}$/,"Số liên hệ không hợp lệ").optional(),
  hamletId:z.string().uuid("Vui lòng chọn thôn, xóm hợp lệ"),
  aidCategory:z.string().trim().min(2,"Cần ghi rõ diện chính sách").max(150),
  monthlyAmount:z.number().finite().positive("Mức đề nghị phải lớn hơn 0").max(1_000_000_000),
  diagnosis:z.string().trim().max(1000).optional(),
  healthInsuranceProvided:z.boolean().default(false),
}).strict();
export type CreateBeneficiaryInput=z.infer<typeof CreateBeneficiarySchema>;

// This operation only creates an independently verifiable request. It does
// not mark payment as PAID, issue a benefit or certify an administrative act.
export const RecordPaymentSchema=z.object({
  beneficiaryId:z.string().uuid("Mã hồ sơ không hợp lệ"),
  sourceReference:z.string().trim().min(5,"Cần mã chứng từ/nguồn đối chiếu").max(200),
  idempotencyKey:z.string().uuid("Mã lần gửi yêu cầu không hợp lệ"),
}).strict();
export type RecordPaymentInput=z.infer<typeof RecordPaymentSchema>;
