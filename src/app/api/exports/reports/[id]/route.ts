import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/auth/request-context";
import { reportingRepository } from "@/features/m09-reporting/server/repository";
import { exportService } from "@/features/m09-reporting/server/export-service";
import { assertCanReadReports } from "@/features/m09-reporting/server/policy";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: snapshotId } = await params;
    const ctx = await getRequestContext();

    // Check read permission
    try {
      assertCanReadReports(ctx);
    } catch {
      return NextResponse.json(
        { error: "FORBIDDEN: Không có quyền truy cập báo cáo" },
        { status: 403 }
      );
    }

    // Fetch snapshot
    const res = await reportingRepository.findSnapshotById(ctx, snapshotId);
    if (!res.ok) {
      return NextResponse.json(
        { error: res.error.message },
        { status: res.error.code === "NOT_FOUND" ? 404 : 500 }
      );
    }

    const snapshot = res.data;

    // Strict Tenant Isolation check
    if (snapshot.tenantId !== ctx.tenantId) {
      return NextResponse.json(
        { error: "FORBIDDEN: Không thể truy xuất snapshot của đơn vị khác" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const formatParam = (searchParams.get("format") || "JSON").toUpperCase();
    const format = formatParam === "PDF" ? "PDF" : formatParam === "XLSX" ? "XLSX" : "JSON";

    const exportResult = exportService.exportSnapshot(snapshot, format);

    return new NextResponse(new Uint8Array(exportResult.buffer), {
      status: 200,
      headers: {
        "Content-Type": exportResult.contentType,
        "Content-Disposition": `attachment; filename="${exportResult.filename}"`,
        "X-Demo-Watermark": "[MÔ PHỎNG DEMO — KHÔNG CÓ GIÁ TRỊ PHÁP LÝ]",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
