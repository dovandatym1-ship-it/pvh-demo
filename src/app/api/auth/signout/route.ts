import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return NextResponse.json({ ok: false, error: { code: "INTERNAL", message: "Không thể kết thúc phiên đăng nhập" } }, { status: 500 });
  }
  const response = NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  response.cookies.delete("pvh_demo_session");
  return response;
}
