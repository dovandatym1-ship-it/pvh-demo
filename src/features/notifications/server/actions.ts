"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getRequestContext } from "@/lib/auth/request-context";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ok, fail, type Result } from "@/lib/types/result";

const NotificationId = z.string().uuid();

export async function markOwnNotificationReadAction(input: unknown): Promise<Result<{ id: string }>> {
  const id = NotificationId.safeParse(input);
  if (!id.success) return fail("VALIDATION", "Mã thông báo không hợp lệ");
  try {
    const ctx = await getRequestContext();
    const db = await createServerSupabaseClient();
    const { data: { user } } = await db.auth.getUser();
    if (!user || user.id !== ctx.userId) return fail("FORBIDDEN", "Phiên xác thực không hợp lệ");
    const scope = db.from("pvh_user_notifications")
      .select("id,read_at").eq("id", id.data)
      .eq("recipient_id", ctx.userId).eq("tenant_id", ctx.tenantId);
    const { data: item, error: readError } = await scope.maybeSingle();
    if (readError) return fail("INTERNAL", "Không đọc được thông báo");
    if (!item) return fail("NOT_FOUND", "Không tìm thấy thông báo");
    if (!item.read_at) {
      const { error } = await db.from("pvh_user_notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", id.data).eq("tenant_id", ctx.tenantId)
        .eq("recipient_id", ctx.userId).is("read_at", null);
      if (error) return fail("INTERNAL", "Không đánh dấu đã đọc được");
    }
    revalidatePath("/thong-bao");
    revalidatePath("/", "layout");
    return ok({ id: id.data });
  } catch {
    return fail("UNAUTHENTICATED", "Phiên đăng nhập không hợp lệ");
  }
}
