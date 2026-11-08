import { z } from "zod";

export const CreateInspectionSchema = z.object({
  targetName: z.string().min(2, "Tên cơ sở không được để trống"),
  category: z.string().min(1, "Vui lòng chọn lĩnh vực"),
  inspectionDate: z.string(),
  notes: z.string().optional(),
});

export type CreateInspectionInput = z.infer<typeof CreateInspectionSchema>;
