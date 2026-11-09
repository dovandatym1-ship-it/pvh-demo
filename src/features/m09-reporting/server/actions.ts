"use server";
import { revalidatePath } from "next/cache";
import { getRequestContext } from "@/lib/auth/request-context";
import { type Result, fail } from "@/lib/types/result";
import { CreateReportSnapshotSchema, AdvanceReportSnapshotSchema } from "../schemas";
import { reportingService } from "./service";
import { reportingRepository } from "./repository";
import { assertCanReadReports } from "./policy";
import type { ReportSnapshotDTO, SnapshotLineageDTO } from "../types";

function actionError(err: unknown) {
  const msg = err instanceof Error ? err.message : "";
  if (msg.includes("UNAUTHENTICATED")) return fail("UNAUTHENTICATED","Vui lòng đăng nhập");
  if (msg.includes("FORBIDDEN")) return fail("FORBIDDEN","Không có quyền thực hiện thao tác");
  return fail("INTERNAL","Lỗi máy chủ báo cáo");
}
export async function createDraftSnapshotAction(input: unknown): Promise<Result<ReportSnapshotDTO>> {
  const parsed = CreateReportSnapshotSchema.safeParse(input);
  if (!parsed.success) return fail("VALIDATION","Thông tin báo cáo không hợp lệ",parsed.error.flatten());
  try {
    const ctx = await getRequestContext();
    const result = await reportingService.createDraftSnapshot(ctx,parsed.data);
    if (result.ok) revalidatePath("/bao-cao");
    return result;
  } catch(err) { return actionError(err); }
}
export async function advanceSnapshotAction(input: unknown): Promise<Result<ReportSnapshotDTO>> {
  const parsed = AdvanceReportSnapshotSchema.safeParse(input);
  if (!parsed.success) return fail("VALIDATION","Trạng thái chuyển không hợp lệ",parsed.error.flatten());
  try {
    const ctx = await getRequestContext();
    const result = await reportingService.advanceSnapshot(ctx,parsed.data);
    if (result.ok) revalidatePath("/bao-cao");
    return result;
  } catch(err) { return actionError(err); }
}
export async function getSnapshotLineageAction(snapshotId: string): Promise<Result<SnapshotLineageDTO[]>> {
  if (!/^[0-9a-f-]{36}$/i.test(snapshotId)) return fail("VALIDATION","Mã phiên bản báo cáo không hợp lệ");
  try {
    const ctx = await getRequestContext();
    assertCanReadReports(ctx);
    return await reportingRepository.getLineage(ctx,snapshotId);
  } catch(err) { return actionError(err); }
}
