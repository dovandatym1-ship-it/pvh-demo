import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isDemoAuthEnabled, isValidDemoPersona } from "@/lib/auth/demo-mode";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Thiếu cấu hình Supabase URL/publishable key");
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>
      ) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options as any)
        );
      },
    },
  });

  // IMPORTANT: Do NOT use supabase.auth.getSession(). It is spoofable.
  // Use supabase.auth.getUser() to authenticate with the Supabase Auth server.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const isAuthRoute = pathname === "/login" || pathname.startsWith("/api/auth/");
  const isStaticRoute =
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/static/") ||
    pathname === "/favicon.ico" ||
    /\.(?:svg|png|jpe?g|gif|webp)$/.test(pathname);

  // Allow demo session when NEXT_PUBLIC_DEMO_MODE is enabled
  const isDemo = isDemoAuthEnabled();
  const demoCookie = request.cookies.get("pvh_demo_session")?.value;
  const isAuthenticated = Boolean(user) || (isDemo && isValidDemoPersona(demoCookie));

  const redirectWithSession = (url: URL) => {
    const response = NextResponse.redirect(url);
    // Keep refreshed SSR auth cookies even when middleware redirects.
    supabaseResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
    return response;
  };

  // Protect all non-auth and non-static routes
  if (!isAuthenticated && !isAuthRoute && !isStaticRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirect", pathname);
    return redirectWithSession(redirectUrl);
  }

  // Redirect authenticated user away from login page
  if (isAuthenticated && pathname.startsWith("/login")) {
    const redirectParam = request.nextUrl.searchParams.get("redirect");
    const targetUrl =
      redirectParam && redirectParam.startsWith("/") &&
      !redirectParam.startsWith("//") && !redirectParam.startsWith("/login")
        ? redirectParam
        : "/ban-lam-viec";
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = targetUrl;
    redirectUrl.search = "";
    return redirectWithSession(redirectUrl);
  }

  return supabaseResponse;
}
