"use server";

import { revalidatePath } from "next/cache";
import { getRequestContext } from "@/lib/auth/request-context";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CreateBeneficiarySchema, RecordPaymentSchema } from "../schemas/health-social.schema";
import { assertCanManageBeneficiaries, assertCanRecordPayment, assertCanAccessHamlet } from "./policy";
import { type Result, ok, fail } from "@/lib/types/result";

function sqlError(error:{code?:string}|null):Result<never>{
  switch(error?.code){
    case "42501":return fail("FORBIDDEN","Không có quyền hoặc vượt phạm vi địa bàn.");
    case "23505":return fail("VALIDATION","Số định danh hoặc mã hồ sơ đã tồn tại trong đơn vị.");
    case "23503":return fail("VALIDATION","Địa bàn hoặc hồ sơ đối tượng không còn hợp lệ.");
    case "P0002":return fail("NOT_FOUND","Không tìm thấy đối tượng thuộc đơn vị.");
    case "PV409":return fail("VERSION_CONFLICT","Mã yêu cầu đối soát đã dùng với nội dung khác.");
    case "22023":return fail("VALIDATION","Thông tin đề nghị hoặc nguồn đối soát chưa hợp lệ.");
    default:return fail("INTERNAL","CSDL chưa xác nhận ghi dữ liệu. Không hiển thị thành công.");
  }
}

export async function createBeneficiaryAction(
 rawInput:unknown
):Promise<Result<{id:string;code:string}>>{
  const parsed=CreateBeneficiarySchema.safeParse(rawInput);
  if(!parsed.success)return fail("VALIDATION","Thông tin tiếp nhận hồ sơ không hợp lệ",parsed.error.flatten());
  try{
    const ctx=await getRequestContext();
    assertCanManageBeneficiaries(ctx);
    assertCanAccessHamlet(ctx,parsed.data.hamletId);
    const db=await createServerSupabaseClient();
    const {data,error}=await db.schema("app").rpc("create_social_beneficiary",{
      p_full_name:parsed.data.fullName,p_cccd:parsed.data.cccd,
      p_phone:parsed.data.phone||null,p_hamlet_id:parsed.data.hamletId,
      p_aid_category:parsed.data.aidCategory,p_monthly_amount:parsed.data.monthlyAmount,
      p_diagnosis:parsed.data.diagnosis||null,
      p_health_insurance_provided:parsed.data.healthInsuranceProvided,
    });
    if(error)return sqlError(error);
    if(!data?.id||!data?.code||data.status!=="PENDING")
      return fail("INTERNAL","Không nhận được xác nhận lưu hồ sơ tiếp nhận.");
    revalidatePath("/y-te-an-sinh");
    return ok({id:String(data.id),code:String(data.code)});
  }catch{return fail("FORBIDDEN","Phiên đăng nhập hoặc phân công không hợp lệ.");}
}

/** A source-backed request is NOT evidence that public funds were paid. */
export async function recordSocialAidPaymentAction(
 rawInput:unknown
):Promise<Result<{success:boolean;beneficiaryId:string}>>{
  const parsed=RecordPaymentSchema.safeParse(rawInput);
  if(!parsed.success)return fail("VALIDATION","Mã hồ sơ, mã yêu cầu hoặc nguồn đối soát không hợp lệ",parsed.error.flatten());
  try{
    const ctx=await getRequestContext();
    assertCanRecordPayment(ctx);
    const db=await createServerSupabaseClient();
    const {data,error}=await db.schema("app").rpc("request_social_aid_reconciliation",{
      p_beneficiary_id:parsed.data.beneficiaryId,
      p_source_reference:parsed.data.sourceReference,
      p_idempotency_key:parsed.data.idempotencyKey,
    });
    if(error)return sqlError(error);
    if(!data?.id||data.status!=="REQUESTED")
      return fail("INTERNAL","Chưa nhận được biên nhận yêu cầu đối soát.");
    revalidatePath("/y-te-an-sinh");
    return ok({success:true,beneficiaryId:parsed.data.beneficiaryId});
  }catch{return fail("FORBIDDEN","Không đủ quyền lập yêu cầu đối soát.");}
}
