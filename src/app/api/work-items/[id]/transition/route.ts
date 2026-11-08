import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@/lib/auth/request-context";
import { workItemService } from "@/features/m01-core-work/server/service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Authenticate RequestContext
    let ctx;
    try {
      ctx = await getRequestContext();
    } catch {
      return NextResponse.json(
        { ok: false, error: { code: "UNAUTHENTICATED", message: "Yêu cầu đăng nhập hợp lệ" } },
        { status: 401 }
      );
    }

    // 2. Parse request body
    let body: {
      toState?: string;
      expectedVersion?: number;
      reason?: string | null;
      idempotencyKey?: string | null;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: { code: "VALIDATION", message: "Payload JSON không hợp lệ" } },
        { status: 400 }
      );
    }

    if (!body.toState) {
      return NextResponse.json(
        { ok: false, error: { code: "VALIDATION", message: "Trường toState là bắt buộc" } },
        { status: 400 }
      );
    }

    if (body.expectedVersion === undefined || typeof body.expectedVersion !== "number") {
      return NextResponse.json(
        { ok: false, error: { code: "VALIDATION", message: "Trường expectedVersion phải là số nguyên" } },
        { status: 400 }
      );
    }

    // 3. Delegate to service layer
    const result = await workItemService.transitionWorkItem(ctx, {
      id,
      toState: body.toState,
      expectedVersion: body.expectedVersion,
      reason: body.reason,
      idempotencyKey: body.idempotencyKey,
    });

    if (!result.ok) {
      let status = 500;
      if (result.error.code === "VERSION_CONFLICT") {
        status = 409;
      } else if (result.error.code === "VALIDATION") {
        status = 400;
      } else if (result.error.code === "FORBIDDEN") {
        status = 403;
      } else if (result.error.code === "UNAUTHENTICATED") {
        status = 401;
      } else if (result.error.code === "NOT_FOUND") {
        status = 404;
      }

      return NextResponse.json(
        { ok: false, error: result.error },
        { status }
      );
    }

    return NextResponse.json({ ok: true, data: result.data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi hệ thống khi chuyển trạng thái";
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL", message } },
      { status: 500 }
    );
  }
}
