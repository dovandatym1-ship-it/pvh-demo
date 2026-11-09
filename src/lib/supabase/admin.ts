import "server-only";
import { createClient } from "@supabase/supabase-js";

/** Server-only Auth invitation client. Never export this to a client component. */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secret) {
    throw new Error("ADMIN_CLIENT_NOT_CONFIGURED: Thiếu Supabase server-only service-role key");
  }
  return createClient(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}
