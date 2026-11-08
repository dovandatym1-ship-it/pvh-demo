import { z } from "zod";

export const CreateBeneficiarySchema = z.object({
  fullName: z.string().min(2, "Họ và tên tối thiểu 2 ký tự"),
  cccd: z.string().regex(/^\d{12}$/, "CCCD phải đúng 12 chữ số"),
  phone: z.string().optional(),
  hamletId: z.string().min(1, "Vui lòng chọn xóm"),
  aidCategory: z.string().min(1, "Vui lòng chọn diện trợ cấp"),
  monthlyAmount: z.number().positive("Mức trợ cấp phải lớn hơn 0"),
  diagnosis: z.string().optional(),
  healthInsuranceProvided: z.boolean().default(true),
});

export type CreateBeneficiaryInput = z.infer<typeof CreateBeneficiarySchema>;

export const RecordPaymentSchema = z.object({
  beneficiaryId: z.string().uuid("ID đối tượng không hợp lệ"),
  idempotencyKey: z.string().optional(),
});

export type RecordPaymentInput = z.infer<typeof RecordPaymentSchema>;
