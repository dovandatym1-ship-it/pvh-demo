import { z } from "zod";

/** Shared by browser forms and server actions; no user-controlled authorization fields. */
export const PersonalContactSchema = z.object({
  displayName: z.string().trim()
    .min(2, "Tên hiển thị phải từ 2 ký tự.")
    .max(80, "Tên hiển thị không quá 80 ký tự.")
    .refine(value => !/[<>\r\n]/.test(value), "Tên hiển thị chứa ký tự không được phép."),
  contactPhone: z.string().trim().max(20, "Số liên hệ không quá 20 ký tự.")
    .refine(value => {
      if (!value) return true;
      const digits = value.replace(/\D/g, "");
      return /^\+?[0-9 ()-]+$/.test(value) && digits.length >= 9 && digits.length <= 15;
    }, "Số liên hệ phải có 9–15 chữ số."),
}).strict();

export type PersonalContactInput = z.infer<typeof PersonalContactSchema>;

export const PasswordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại."),
  newPassword: z.string().min(12, "Mật khẩu mới phải từ 12 ký tự.")
    .max(72, "Mật khẩu mới không được vượt 72 ký tự."),
  confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu mới."),
}).superRefine(({ currentPassword, newPassword, confirmPassword }, context) => {
  if (currentPassword === newPassword) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["newPassword"],
      message: "Mật khẩu mới phải khác mật khẩu hiện tại." });
  }
  if (newPassword !== confirmPassword) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["confirmPassword"],
      message: "Xác nhận mật khẩu không khớp." });
  }
});

export type PasswordChangeInput = z.infer<typeof PasswordChangeSchema>;

/** Password recovery requires a fresh single-use Supabase PKCE code, not a login session. */
export const PasswordRecoverySchema = z.object({
  code: z.string().trim().min(10, "Liên kết đặt lại mật khẩu không hợp lệ.").max(4096),
  newPassword: z.string().min(12, "Mật khẩu mới phải có ít nhất 12 ký tự.")
    .max(72, "Mật khẩu mới không được vượt 72 ký tự."),
  confirmPassword: z.string().min(1, "Vui lòng nhập lại mật khẩu mới."),
}).strict().superRefine(({ newPassword, confirmPassword }, context) => {
  if (newPassword !== confirmPassword) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["confirmPassword"],
      message: "Hai lần nhập mật khẩu chưa khớp." });
  }
});

export type PasswordRecoveryInput = z.infer<typeof PasswordRecoverySchema>;
