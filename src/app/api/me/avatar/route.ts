import { NextResponse } from "next/server";
import { getRequestContext } from "@/lib/auth/request-context";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AVATAR_BUCKET, avatarObjectPath } from "@/features/self-service/avatar-contract";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const ctx = await getRequestContext();
    const db = await createServerSupabaseClient();
    const { data: { user } } = await db.auth.getUser();
    if (!user || user.id !== ctx.userId) return new NextResponse(null, { status: 403 });
    const { data, error } = await db.storage.from(AVATAR_BUCKET).download(avatarObjectPath(user.id));
    if (error || !data) return new NextResponse(null, { status: 404, headers: { "Cache-Control": "no-store" } });
    const bytes = await data.arrayBuffer();
    return new NextResponse(bytes, { headers: {
      "Content-Type": "image/jpeg",
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    } });
  } catch {
    return new NextResponse(null, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
}
