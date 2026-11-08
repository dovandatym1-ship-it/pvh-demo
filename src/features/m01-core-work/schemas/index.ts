import { z } from "zod";

export const CreateWorkTaskSchema = z.object({
  title: z.string().min(3, "Tiêu đề nhiệm vụ không được để trống"),
  category: z.string().min(1, "Vui lòng chọn lĩnh vực"),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  dueDate: z.string(),
  assignedTo: z.string().optional(),
});

export type CreateWorkTaskInput = z.infer<typeof CreateWorkTaskSchema>;
