import { z } from "zod";

export const ReportCodeSchema = z.enum(["RPT-WORK", "RPT-CULTURE", "RPT-DIGITAL", "RPT-INSPECTION", "RPT-SUMMARY"]);
export const ReportPeriodSchema = z.string().regex(/^(Q[1-4]\/\d{4}|\d{4}-(0[1-9]|1[0-2]))$/, "Kỳ phải ở dạng Qn/YYYY hoặc YYYY-MM");
export const CreateReportSnapshotSchema = z.object({
  reportCode: ReportCodeSchema,
  title: z.string().trim().min(5).max(250),
  period: ReportPeriodSchema,
  year: z.number().int().min(2020).max(2200),
  idempotencyKey: z.string().min(8).max(200),
  previousSnapshotId: z.string().uuid().nullable().optional(),
}).refine(x => x.period.includes("/") ? Number(x.period.split("/")[1]) === x.year : Number(x.period.slice(0, 4)) === x.year, {
  message: "Năm và kỳ báo cáo không khớp", path: ["period"],
});
export type CreateReportSnapshotInput = z.infer<typeof CreateReportSnapshotSchema>;
export const AdvanceReportSnapshotSchema = z.object({
  snapshotId: z.string().uuid(),
  expectedVersion: z.number().int().positive(),
  transition: z.enum(["SUBMIT", "START_REVIEW", "FINALIZE"]),
});
export type AdvanceReportSnapshotInput = z.infer<typeof AdvanceReportSnapshotSchema>;
export const ExportReportSchema = z.object({
  snapshotId: z.string().uuid(),
  format: z.enum(["PDF", "XLSX", "JSON"]),
});
