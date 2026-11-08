import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { RequestContext } from "@/lib/auth/request-context";
import type { CultureSubmissionDTO, HamletCultureSummaryDTO } from "../types";
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

export async function getHamletCultureSummary(
  _ctx: RequestContext
): Promise<HamletCultureSummaryDTO[]> {
  return [
    {
      hamletId: "b0000000-0000-0000-0000-000000000001",
      hamletCode: "XOM_A1",
      hamletName: "Xóm A1",
      leaderName: "Hoàng Văn Tuấn",
      totalHouseholds: 240,
      culturalHouseholds: 220,
      rate: 91.6,
      culturalHouseStatus: "DAT_CHUAN",
      titleStatus: "CONG_NHAN",
    },
    {
      hamletId: "b0000000-0000-0000-0000-000000000002",
      hamletCode: "XOM_A2",
      hamletName: "Xóm A2",
      leaderName: "Nguyễn Văn Hòa",
      totalHouseholds: 180,
      culturalHouseholds: 162,
      rate: 90.0,
      culturalHouseStatus: "DAT_CHUAN",
      titleStatus: "CONG_NHAN",
    },
    {
      hamletId: "b0000000-0000-0000-0000-000000000003",
      hamletCode: "XOM_A3",
      hamletName: "Xóm A3",
      leaderName: "Trần Văn Cường",
      totalHouseholds: 100,
      culturalHouseholds: 89,
      rate: 89.0,
      culturalHouseStatus: "DAT_CHUAN",
      titleStatus: "CONG_NHAN",
    },
  ];
}
