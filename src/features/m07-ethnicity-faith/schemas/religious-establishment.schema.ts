import { z } from "zod";

export const CreateReligiousEstablishmentSchema = z.object({
  code: z.string().min(2, "Mã cơ sở tối thiểu 2 ký tự"),
  name: z.string().min(3, "Tên cơ sở tôn giáo phải có ít nhất 3 ký tự"),
  religionType: z.enum(["PHAT_GIAO", "TIN_LANH", "CONG_GIAO", "TIN_NGUONG_DAN_GIAN"]),
  representativeName: z.string().min(2, "Họ và tên người đại diện phải có ít nhất 2 ký tự"),
  hamletId: z.string().min(1, "Vui lòng chọn xóm/thôn"),
  address: z.string().min(3, "Địa chỉ cơ sở tối thiểu 3 ký tự"),
  followerCount: z.number().int().min(0).default(0),
});

export type CreateReligiousEstablishmentInput = z.infer<typeof CreateReligiousEstablishmentSchema>;

export const RegisterReligiousEventSchema = z.object({
  establishmentId: z.string().uuid("ID cơ sở tôn giáo không hợp lệ"),
  title: z.string().min(3, "Tên sự kiện/buổi sinh hoạt tôn giáo tối thiểu 3 ký tự"),
  eventDate: z.string().min(10, "Vui lòng nhập ngày tổ chức (YYYY-MM-DD)"),
  expectedAttendees: z.number().int().min(1).default(50),
});

export type RegisterReligiousEventInput = z.infer<typeof RegisterReligiousEventSchema>;
