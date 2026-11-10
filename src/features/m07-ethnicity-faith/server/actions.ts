"use server";

import { revalidatePath } from "next/cache";
import { getRequestContext } from "@/lib/auth/request-context";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { type Result, ok, fail } from "@/lib/types/result";
import { assertCanManageFaith, assertCanAccessHamlet } from "./policy";
import {
  CreateReligiousEstablishmentSchema,
  RegisterReligiousEventSchema,
  type CreateReligiousEstablishmentInput,
  type RegisterReligiousEventInput,
} from "../schemas/religious-establishment.schema";
import type { ReligiousEstablishmentDTO, ReligiousEventDTO } from "../types";

function failSql(error: {code?:string;message?:string}|null): Result<never> {
  switch (error?.code) {
    case "42501": return fail("FORBIDDEN","Không có quyền hoặc vượt phạm vi địa bàn.");
    case "23505": return fail("VALIDATION","Mã cơ sở đã tồn tại trong đơn vị.");
    case "23503": return fail("VALIDATION","Mã địa bàn hoặc cơ sở không hợp lệ.");
    case "22023": return fail("VALIDATION","Trường dữ liệu chưa hợp lệ hoặc địa bàn không còn hiệu lực.");
    case "P0002": return fail("NOT_FOUND","Không tìm thấy cơ sở thuộc đơn vị.");
    default: return fail("INTERNAL","Không thể ghi dữ liệu. Chưa có xác nhận thành công.");
  }
}

/** Transactional RPC: insert + audit. Never write protected data directly. */
export async function createReligiousEstablishmentAction(
 input: CreateReligiousEstablishmentInput,
): Promise<Result<ReligiousEstablishmentDTO>> {
  const parsed=CreateReligiousEstablishmentSchema.safeParse(input);
  if(!parsed.success)return fail("VALIDATION","Dữ liệu đăng ký cơ sở chưa hợp lệ",parsed.error.flatten());
  try {
    const ctx=await getRequestContext();
    assertCanManageFaith(ctx);
    assertCanAccessHamlet(ctx,parsed.data.hamletId);
    const db=await createServerSupabaseClient();
    const {data,error}=await db.schema("app").rpc("create_faith_establishment",{
      p_code:parsed.data.code,p_name:parsed.data.name,p_religion_type:parsed.data.religionType,
      p_representative_name:parsed.data.representativeName,p_hamlet_id:parsed.data.hamletId,
      p_address:parsed.data.address,p_follower_count:parsed.data.followerCount,
    });
    if(error)return failSql(error);
    if(!data?.id || data.tenant_id!==ctx.tenantId || data.status!=="PENDING_REGISTRATION")
      return fail("INTERNAL","Chưa nhận được xác nhận tiếp nhận hồ sơ.");
    revalidatePath("/dan-toc-ton-giao");
    return ok({
      id:String(data.id),tenantId:String(data.tenant_id),code:String(data.code),
      name:String(data.name),religionType:String(data.religion_type),
      representativeName:String(data.representative_name),
      hamletId:String(data.hamlet_id),address:String(data.address),
      status:"PENDING_REGISTRATION",followerCount:Number(data.follower_count),
      version:Number(data.version),createdAt:String(data.created_at),updatedAt:String(data.updated_at),
    });
  }catch {
    return fail("FORBIDDEN","Phiên đăng nhập hoặc phân công công tác không hợp lệ.");
  }
}

/** Register an event as an intake receipt, never an administrative approval. */
export async function registerReligiousEventAction(
 input: RegisterReligiousEventInput,
): Promise<Result<ReligiousEventDTO>> {
  const parsed=RegisterReligiousEventSchema.safeParse(input);
  if(!parsed.success)return fail("VALIDATION","Thông tin tiếp nhận hoạt động chưa hợp lệ",parsed.error.flatten());
  try{
    const ctx=await getRequestContext();
    assertCanManageFaith(ctx);
    const db=await createServerSupabaseClient();
    const {data,error}=await db.schema("app").rpc("register_faith_event",{
      p_establishment_id:parsed.data.establishmentId,p_title:parsed.data.title,
      p_event_date:parsed.data.eventDate,p_expected_attendees:parsed.data.expectedAttendees,
    });
    if(error)return failSql(error);
    if(!data?.id||data.tenant_id!==ctx.tenantId||data.status!=="CHO_TIEP_NHAN")
      return fail("INTERNAL","Không nhận được xác nhận tiếp nhận hoạt động.");
    revalidatePath("/dan-toc-ton-giao");
    return ok({
      id:String(data.id),tenantId:String(data.tenant_id),establishmentId:String(data.establishment_id),
      title:String(data.title),eventDate:String(data.event_date),
      expectedAttendees:Number(data.expected_attendees),status:"CHO_TIEP_NHAN",
      rejectionReason:data.rejection_reason?String(data.rejection_reason):null,
      version:Number(data.version),createdAt:String(data.created_at),
    });
  }catch{return fail("FORBIDDEN","Phiên đăng nhập hoặc quyền tiếp nhận không hợp lệ.");}
}
