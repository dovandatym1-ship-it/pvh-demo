import { z } from "zod";

export const SubmissionStatusSchema = z.enum([
  "DAT",
  "KHONG_DAT",
  "THIEU_MINH_CHUNG",
  "CHO_RA_SOAT",
  "YEU_CAU_BO_SUNG",
]);

export const ProposeCulturalTitleSchema = z.object({
  householdHead: z.string().min(2, "Họ và tên chủ hộ phải có ít nhất 2 ký tự"),
  hamletId: z.string().min(1, "Vui lòng chọn xóm/thôn"),
  membersCount: z.number().int().min(1, "Số nhân khẩu phải từ 1 trở lên"),
  score: z.number().min(0).max(100).default(80),
  campaignId: z.string().uuid().optional(),
});

export type ProposeCulturalTitleInput = z.infer<typeof ProposeCulturalTitleSchema>;

export const EvaluateSubmissionSchema = z
  .object({
    submissionId: z.string().uuid("ID hồ sơ không hợp lệ"),
    status: z.enum(["DAT", "KHONG_DAT", "THIEU_MINH_CHUNG", "YEU_CAU_BO_SUNG"]),
    score: z.number().min(0).max(100),
    reviewerComment: z.string().optional(),
    evidencePath: z.string().optional(),
    criteriaScores: z
      .array(
        z.object({
          criteriaCode: z.string(),
          score: z.number().min(0).max(100),
        })
      )
      .optional(),
  })
  .refine(
    (data) => {
      // YEU_CAU_BO_SUNG bắt buộc phải có nhận xét của cán bộ rà soát
      if (data.status === "YEU_CAU_BO_SUNG") {
        return !!data.reviewerComment && data.reviewerComment.trim().length > 0;
      }
      return true;
    },
    {
      message: "Ý kiến cán bộ rà soát là bắt buộc khi yêu cầu bổ sung hồ sơ",
      path: ["reviewerComment"],
    }
  )
  .refine(
    (data) => {
      // Không thể phê duyệt ĐẠT nếu thiếu minh chứng
      if (data.status === "DAT") {
        return !!data.evidencePath && data.evidencePath.trim().length > 0;
      }
      return true;
    },
    {
      message: "Không thể phê duyệt ĐẠT khi hồ sơ chưa có tệp minh chứng",
      path: ["status"],
    }
  );

export type EvaluateSubmissionInput = z.infer<typeof EvaluateSubmissionSchema>;

export const RequestSupplementationSchema = z.object({
  submissionId: z.string().uuid("ID hồ sơ không hợp lệ"),
  reviewerComment: z
    .string()
    .min(5, "Nội dung yêu cầu bổ sung phải từ 5 ký tự trở lên")
    .refine((v) => v.trim().length > 0, "Nội dung nhận xét không được chỉ chứa khoảng trắng"),
});

export type RequestSupplementationInput = z.infer<typeof RequestSupplementationSchema>;

export const AttachEvidenceSchema = z.object({
  submissionId: z.string().uuid("ID hồ sơ không hợp lệ"),
  evidencePath: z.string().min(5, "Đường dẫn minh chứng không hợp lệ"),
  filename: z.string().min(1, "Tên tệp không hợp lệ"),
});

export type AttachEvidenceInput = z.infer<typeof AttachEvidenceSchema>;
