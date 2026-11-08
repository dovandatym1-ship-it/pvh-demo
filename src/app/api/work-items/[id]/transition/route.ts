import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/auth/request-context";
import { ForbiddenError } from "@/lib/errors/app-error";
import { TransitionWorkItemSchema } from "@/features/m01-core-work/schemas/work-item.schema";
import { workItemService } from "@/features/m01-core-work/server/service";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let ctx;
  try { ctx = await getRequestContext(); }
  catch (e) { return NextResponse.json({ ok: false, error: { code: e instanceof ForbiddenError ? "FORBIDDEN" : "UNAUTHENTICATED" } },
    { status: e instanceof ForbiddenError ? 403 : 401 }); }
  let raw: unknown;
  try { raw = await request.json(); }
  catch { return NextResponse.json({ ok: false, error: { code: "VALIDATION", message: "JSON không hợp lệ" } }, { status: 400 }); }
  const { id } = await params;
  const parsed = TransitionWorkItemSchema.safeParse({ ...(typeof raw === "object" && raw !== null && !Array.isArray(raw) ? raw : {}), id });
  if (!parsed.success) return NextResponse.json({ ok: false, error: { code: "VALIDATION", message: "Đầu vào không hợp lệ", details: parsed.error.flatten() } }, { status: 400 });
  const result = await workItemService.transitionWorkItem(ctx, parsed.data);
  if (!result.ok) {
    const status = { UNAUTHENTICATED: 401, FORBIDDEN: 403, NOT_FOUND: 404,
      VERSION_CONFLICT: 409, DUPLICATE_REQUEST: 409, INVALID_TRANSITION: 422,
      VALIDATION: 422, INTERNAL: 500 }[result.error.code] || 500;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json(result);
}
