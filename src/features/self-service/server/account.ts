import "server-only";

import { getRequestContext } from "@/lib/auth/request-context";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/** Auth user_metadata is display-only. Official identity, roles and scope come from DB. */
export async function getPersonalAccount() {
  const ctx = await getRequestContext();
  const db = await createServerSupabaseClient();
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user || user.id !== ctx.userId) {
    return {
      userId: ctx.userId, email: null, displayName: null, contactPhone: null,
      roles: [...ctx.roles], tenantId: ctx.tenantId, editable: false, avatarVersion: 0,
    };
  }
  const meta = user.user_metadata ?? {};
  return {
    userId: user.id,
    email: user.email ?? null,
    displayName: typeof meta.display_name === "string" ? meta.display_name : null,
    contactPhone: typeof meta.contact_phone === "string" ? meta.contact_phone : null,
    roles: [...ctx.roles],
    tenantId: ctx.tenantId,
    editable: true,
    avatarVersion: typeof meta.avatar_updated_at === "number" && Number.isFinite(meta.avatar_updated_at)
      ? meta.avatar_updated_at : 0,
  };
}
