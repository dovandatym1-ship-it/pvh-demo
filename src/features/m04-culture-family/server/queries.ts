import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { RequestContext } from "@/lib/auth/request-context";
import type { CultureSubmissionDTO } from "../types";
import { cultureRepository } from "./repository";

export async function getCultureSubmissions(
  ctx: RequestContext,
  hamletId?: string
): Promise<CultureSubmissionDTO[]> {
  return await cultureRepository.listSubmissions(ctx, hamletId);
}

export async function getCultureCampaigns(
  ctx: RequestContext
): Promise<Array<{ id: string; year: number; title: string; status: string }>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("campaigns")
      .select("id, year, title, status")
      .eq("tenant_id", ctx.tenantId)
      .order("year", { ascending: false });

    if (error || !data) return [];
    return data.map((c) => ({
      id: String(c.id),
      year: Number(c.year),
      title: String(c.title),
      status: String(c.status),
    }));
  } catch {
    return [];
  }
}
