import { z } from "zod";

export const ProposeCulturalTitleSchema = z.object({
  householdHead: z.string().min(2, "Họ và tên chủ hộ phải có ít nhất 2 ký tự"),
  hamletId: z.string().min(1, "Vui lòng chọn xóm/thôn"),
  membersCount: z.number().int().min(1, "Số nhân khẩu phải từ 1 trở lên"),
  score: z.number().min(0).max(100).default(80),
});

export type ProposeCulturalTitleInput = z.infer<typeof ProposeCulturalTitleSchema>;
