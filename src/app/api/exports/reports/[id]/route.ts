import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/auth/request-context";
import { reportingRepository } from "@/features/m09-reporting/server/repository";
import { exportService } from "@/features/m09-reporting/server/export-service";
import { assertCanReadReports, assertCanExportReports } from "@/features/m09-reporting/server/policy";
import { ExportReportSchema } from "@/features/m09-reporting/schemas";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest,{params}:{params:Promise<{id:string}>}) {
  try {
    const {id} = await params;
    const format = request.nextUrl.searchParams.get("format");
    const parsed = ExportReportSchema.safeParse({snapshotId:id,format});
    if (!parsed.success) return NextResponse.json({error:"INVALID_FORMAT_OR_SNAPSHOT_ID"},{status:400});
    const ctx = await getRequestContext();
    assertCanReadReports(ctx); assertCanExportReports(ctx);
    const res = await reportingRepository.findSnapshotById(ctx,id);
    if (!res.ok) return NextResponse.json({error:res.error.message},
      {status:res.error.code==="NOT_FOUND"?404:res.error.code==="FORBIDDEN"?403:500});
    if (res.data.tenantId!==ctx.tenantId) return NextResponse.json({error:"FORBIDDEN"},{status:403});
    const exported = await exportService.exportSnapshot(res.data,parsed.data.format);
    return new NextResponse(new Uint8Array(exported.buffer),{
      status:200,headers:{
        "Content-Type":exported.contentType,
        "Content-Disposition":'attachment; filename="'+exported.filename+'"',
        "Cache-Control":"private, no-store, max-age=0",
        "X-Content-Type-Options":"nosniff",
        "X-Demo-Watermark":"SIMULATED-NO-LEGAL-VALUE",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("UNAUTHENTICATED")) return NextResponse.json({error:"UNAUTHENTICATED"},{status:401});
    if (message.includes("FORBIDDEN")) return NextResponse.json({error:"FORBIDDEN"},{status:403});
    if (message==="SNAPSHOT_INTEGRITY_ERROR") return NextResponse.json({error:message},{status:409});
    return NextResponse.json({error:"EXPORT_FAILED"},{status:500});
  }
}
