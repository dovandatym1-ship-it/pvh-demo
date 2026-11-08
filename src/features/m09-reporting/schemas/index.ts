import { z } from "zod";

export const CreateReportSnapshotSchema = z.object({
  reportCode: z.string().min(1, "Mã báo cáo không được để trống").default("DEM-R01"),
  title: z.string().min(5, "Tiêu đề báo cáo phải từ 5 ký tự trở lên"),
  period: z.string().min(2, "Kỳ báo cáo không được để trống"),
  year: z.number().int().min(2020).max(2050).default(2026),
  payload: z.record(z.string(), z.unknown()).optional(),
  idempotencyKey: z.string().optional(),
});

export type CreateReportSnapshotInput = z.infer<typeof CreateReportSnapshotSchema>;

export const FinalizeReportSnapshotSchema = z.object({
  snapshotId: z.string().uuid("ID snapshot không hợp lệ"),
  canonicalPayload: z.record(z.string(), z.unknown()),
});

export type FinalizeReportSnapshotInput = z.infer<typeof FinalizeReportSnapshotSchema>;

export const ExportReportSchema = z.object({
  snapshotId: z.string().uuid("ID snapshot không hợp lệ"),
  format: z.enum(["PDF", "XLSX", "JSON"]).default("JSON"),
});

export type ExportReportInput = z.infer<typeof ExportReportSchema>;
