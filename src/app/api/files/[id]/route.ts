import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/auth/request-context";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createEvidenceSignedUrl } from "@/lib/storage/storage-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const rawPath = url.searchParams.get("path") || decodeURIComponent(id);

    // Defense against directory traversal
    if (rawPath.includes("..") || rawPath.includes("\\")) {
      return NextResponse.json(
        { ok: false, error: { code: "VALIDATION", message: "Đường dẫn không hợp lệ" } },
        { status: 400 }
      );
    }

    // 1. Authenticate RequestContext
    let ctx;
    try {
      ctx = await getRequestContext();
    } catch {
      return NextResponse.json(
        { ok: false, error: { code: "UNAUTHENTICATED", message: "Yêu cầu đăng nhập" } },
        { status: 401 }
      );
    }

    // 2. Tenant isolation verification: Path must begin with user's tenantId
    const pathSegments = rawPath.split("/").filter(Boolean);
    const targetTenantId = pathSegments[0];
    if (targetTenantId !== ctx.tenantId) {
      return NextResponse.json(
        { ok: false, error: { code: "FORBIDDEN", message: "Truy cập ngoài phạm vi xã bị từ chối" } },
        { status: 403 }
      );
    }

    // 3. Permission check
    const hasStoragePermission =
      ctx.permissions.includes("m01:work:read") ||
      ctx.permissions.includes("m04:culture:read") ||
      ctx.permissions.includes("storage:read") ||
      ctx.roles.includes("LANH_DAO_XA");

    if (!hasStoragePermission) {
      return NextResponse.json(
        { ok: false, error: { code: "FORBIDDEN", message: "Bạn không có quyền xem tệp tin này" } },
        { status: 403 }
      );
    }

    // 4. Generate signed URL with TTL strictly <= 60s
    const supabase = await createServerSupabaseClient();
    const result = await createEvidenceSignedUrl(supabase, rawPath, 60);

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 404 }
      );
    }

    // 5. Response: JSON if requested, otherwise redirect (307)
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
