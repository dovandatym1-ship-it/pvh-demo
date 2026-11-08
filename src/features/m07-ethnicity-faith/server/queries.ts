import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { RequestContext } from "@/lib/auth/request-context";
import type { ReligiousEstablishmentDTO, ReligiousEventDTO, ReputablePersonDTO } from "../types";

export async function getReligiousEstablishments(ctx: RequestContext): Promise<ReligiousEstablishmentDTO[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("religious_establishments")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .order("created_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: String(row.id),
    tenantId: String(row.tenant_id),
    code: String(row.code),
    name: String(row.name),
    religionType: String(row.religion_type),
    representativeName: String(row.representative_name),
    hamletId: String(row.hamlet_id),
    address: String(row.address),
    status: (row.status as ReligiousEstablishmentDTO["status"]) || "ACTIVE",
    followerCount: Number(row.follower_count) || 0,
    version: Number(row.version) || 1,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }));
}

export async function getReputablePersons(ctx: RequestContext): Promise<ReputablePersonDTO[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("reputable_persons")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .order("full_name", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: String(row.id),
    tenantId: String(row.tenant_id),
    fullName: String(row.full_name),
    ethnicGroup: String(row.ethnic_group),
    hamletId: String(row.hamlet_id),
    yearRecognized: Number(row.year_recognized) || 2024,
    policyStatus: (row.policy_status as ReputablePersonDTO["policyStatus"]) || "DANG_HUONG",
    monthlyAllowance: Number(row.monthly_allowance) || 800000,
    version: Number(row.version) || 1,
    createdAt: String(row.created_at),
  }));
}
