"use server";

import { getRequestContext } from "@/lib/auth/request-context";
import { assertCanManageFaith, assertCanAccessHamlet } from "./policy";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Result, ok, fail } from "@/lib/types/result";
import {
  CreateReligiousEstablishmentSchema,
  CreateReligiousEstablishmentInput,
  RegisterReligiousEventSchema,
  RegisterReligiousEventInput,
} from "../schemas/religious-establishment.schema";
import type { ReligiousEstablishmentDTO, ReligiousEventDTO } from "../types";
import { revalidatePath } from "next/cache";

export async function createReligiousEstablishmentAction(
  input: CreateReligiousEstablishmentInput
): Promise<Result<ReligiousEstablishmentDTO>> {
  const parsed = CreateReligiousEstablishmentSchema.safeParse(input);
  if (!parsed.success) {
    return fail("VALIDATION", "Dữ liệu cơ sở tôn giáo không hợp lệ", parsed.error.flatten());
  }

  const ctx = await getRequestContext();
  assertCanManageFaith(ctx);
  assertCanAccessHamlet(ctx, parsed.data.hamletId);

  const supabase = await createServerSupabaseClient();
  const id = crypto.randomUUID();

  const { data, error } = await supabase
    .from("religious_establishments")
    .insert({
      id,
      tenant_id: ctx.tenantId,
      code: parsed.data.code,
      name: parsed.data.name,
      religion_type: parsed.data.religionType,
      representative_name: parsed.data.representativeName,
      hamlet_id: parsed.data.hamletId,
      address: parsed.data.address,
      status: "ACTIVE",
      follower_count: parsed.data.followerCount,
      version: 1,
    })
    .select()
    .single();

  if (error || !data) {
    return fail("INTERNAL", error?.message || "Không thể lưu cơ sở tôn giáo");
  }

  revalidatePath("/dan-toc-ton-giao");
  return ok({
    id: data.id,
    tenantId: data.tenant_id,
    code: data.code,
    name: data.name,
    religionType: data.religion_type,
    representativeName: data.representative_name,
    hamletId: data.hamlet_id,
    address: data.address,
    status: data.status,
    followerCount: Number(data.follower_count),
    version: Number(data.version),
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  });
}
