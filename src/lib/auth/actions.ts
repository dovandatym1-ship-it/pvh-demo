"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function loginDemoAction(personaCode: string) {
  const cookieStore = await cookies();
  cookieStore.set("pvh_demo_session", personaCode, { path: "/", httpOnly: true });
  redirect("/ban-lam-viec");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("pvh_demo_session");
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}
