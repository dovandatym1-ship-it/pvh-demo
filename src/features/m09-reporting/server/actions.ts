"use server";

import { revalidatePath } from "next/cache";
import { getRequestContext } from "@/lib/auth/request-context";
import { assertPermission } from "@/lib/authorization/assert-permission";
import { type Result, ok, fail } from "@/lib/types/result";
import {
  CreateReportSnapshotSchema,
  FinalizeReportSnapshotSchema,
} from "../schemas";
import { reportingService, computeCanonicalSha256 } from "./service";
import { assertCanReadReports } from "./policy";
import type { ReportSnapshotDTO, SnapshotLineageDTO } from "../types";

/**
 * Server Action: Create Draft Report Snapshot.
 */
export async function createDraftSnapshotAction(
  input: unknown
): Promise<Result<ReportSnapshotDTO>> {
  try {
    const parsed = CreateReportSnapshotSchema.safeParse(input);
    if (!parsed.success) {
      return fail("VALIDATION", "Dữ liệu tạo bản nháp snapshot không hợp lệ", parsed.error.flatten());
    }

    const ctx = await getRequestContext();
    assertPermission(ctx, "m09:draft");

    const result = await reportingService.createDraftSnapshot(ctx, parsed.data);
    if (!result.ok) return result;

    revalidatePath("/bao-cao");
    return result;
  } catch (err: unknown) {
    return fail("INTERNAL", "Lỗi hệ thống khi tạo bản nháp snapshot", err);
  }
}

/**
 * Server Action: Create and atomically finalize snapshot with SHA-256 calculation.
 */
export async function createAndFinalizeSnapshotAction(
  input: { period: string; year: number; title: string; reportCode?: string }
): Promise<Result<{ id: string; sha256: string; snapshot: ReportSnapshotDTO }>> {
  try {
    const ctx = await getRequestContext();
    assertPermission(ctx, "m09:snapshot:sign");

    const result = await reportingService.createAndFinalizeSnapshot(ctx, input);
    if (!result.ok) return result;

    revalidatePath("/bao-cao");
    return result;
  } catch (err: unknown) {
    return fail("INTERNAL", "Lỗi hệ thống khi chốt snapshot báo cáo", err);
  }
}

/**
 * Server Action: Finalize existing draft snapshot.
 */
export async function finalizeSnapshotAction(
  input: unknown
): Promise<Result<{ id: string; sha256: string }>> {
  try {
    const parsed = FinalizeReportSnapshotSchema.safeParse(input);
    if (!parsed.success) {
      return fail("VALIDATION", "Dữ liệu chốt snapshot không hợp lệ", parsed.error.flatten());
    }

    const ctx = await getRequestContext();
    assertPermission(ctx, "m09:snapshot:sign");

    // Call service to finalize with canonical sha256
    const sha256 = computeCanonicalSha256(parsed.data.canonicalPayload);
    const { reportingRepository } = await import("./repository");
    const rpcRes = await reportingRepository.finalizeSnapshotViaRpc(
      ctx,
      parsed.data.snapshotId,
      parsed.data.canonicalPayload,
      sha256
    );

    if (!rpcRes.ok) return rpcRes;

    revalidatePath("/bao-cao");
    return rpcRes;
  } catch (err: unknown) {
    return fail("INTERNAL", "Lỗi hệ thống khi chốt snapshot", err);
  }
}

/**
 * Server Action: Query genuine snapshot lineage records.
 */
export async function getSnapshotLineageAction(
  snapshotId: string
): Promise<Result<SnapshotLineageDTO[]>> {
  try {
    const ctx = await getRequestContext();
    assertCanReadReports(ctx);

    const { reportingRepository } = await import("./repository");
    const lineage = await reportingRepository.getLineage(ctx, snapshotId);
    return ok(lineage);
  } catch (err: unknown) {
    return fail("INTERNAL", "Lỗi hệ thống khi truy vấn lineage của snapshot", err);
  }
}
