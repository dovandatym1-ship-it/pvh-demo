import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/auth/request-context";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createEvidenceSignedUrl } from "@/lib/storage/storage-service";
import { ForbiddenError } from "@/lib/errors/app-error";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // The URL identifies an evidence record, never a client-chosen storage path.
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json(
        { ok: false, error: { code: "VALIDATION", message: "Mã tệp không hợp lệ" } },
        { status: 400 }
      );
    }

    // 1. Authenticate RequestContext
    let ctx;
    try {
      ctx = await getRequestContext();
    } catch (err) {
      return NextResponse.json(
        { ok: false, error: { code: err instanceof ForbiddenError ? "FORBIDDEN" : "UNAUTHENTICATED", message: "Không có quyền truy cập tệp" } },
        { status: err instanceof ForbiddenError ? 403 : 401 }
      );
    }

    // RLS on evidence_files checks access to the specific parent work item.
    // A general role or access to another file from the same commune is insufficient.
    const supabase = await createServerSupabaseClient();
    const { data: evidence, error: evidenceError } = await supabase
      .from("evidence_files")
      .select("id, tenant_id, object_path")
      .eq("id", id)
      .maybeSingle();
    if (evidenceError || !evidence) {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Không tìm thấy tệp trong phạm vi được phân quyền" } },
        { status: 404 }
      );
    }
    if (evidence.tenant_id !== ctx.tenantId) {
      return NextResponse.json(
        { ok: false, error: { code: "FORBIDDEN", message: "Tệp ngoài phạm vi xã" } },
        { status: 403 }
      );
    }

    const result = await createEvidenceSignedUrl(supabase, evidence.object_path, 60);

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 404 }
      );
    }

    // Return a short-lived link or redirect, after evidence-level authorization.
    const url = new URL(request.url);
    const acceptHeader = request.headers.get("accept") || "";
    if (acceptHeader.includes("application/json") || url.searchParams.get("format") === "json") {
      return NextResponse.json({ ok: true, data: result.data });
    }

    return NextResponse.redirect(result.data.signedUrl, { status: 307 });
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL", message: "Lỗi hệ thống khi xử lý tệp tin" } },
      { status: 500 }
    );
  }
}
