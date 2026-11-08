"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getRequestContext } from "@/lib/auth/request-context";
import { assertPermission } from "@/lib/authorization/assert-permission";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fail, ok, type Result } from "@/lib/types/result";

const Plan = z.object({
 title:z.string().trim().min(3).max(250),period:z.string().trim().min(2).max(50),
 sourceRef:z.string().trim().min(3).max(500),
}).strict();
const Indicator = z.object({
 planId:z.string().uuid().nullable(),code:z.string().trim().min(1).max(60),
 name:z.string().trim().min(2).max(250),unit:z.string().trim().min(1).max(50),
 period:z.string().trim().min(2).max(50),meaning:z.string().trim().max(500),
}).strict();
const Update = z.object({
 indicatorId:z.string().uuid(),status:z.enum([
  "NOT_REPORTED","UNVERIFIED","CONFIRMED","CONFIRMED_ZERO","NOT_APPLICABLE"]),
 numericValue:z.number().finite().nullable(),sourceRef:z.string().trim().max(500).nullable(),
 naReason:z.string().trim().max(500).nullable(),expectedVersion:z.number().int().positive(),
}).strict().superRefine((x,ctx)=>{
 if(x.status==="CONFIRMED_ZERO"&&x.numericValue!==0)
  ctx.addIssue({code:"custom",path:["numericValue"],message:"Số 0 phải là giá trị số bằng 0"});
 if(x.status==="CONFIRMED"&&x.numericValue===null)
  ctx.addIssue({code:"custom",path:["numericValue"],message:"Thiếu giá trị xác nhận"});
 if(["CONFIRMED","CONFIRMED_ZERO"].includes(x.status)&&(!x.sourceRef||x.sourceRef.length<3))
  ctx.addIssue({code:"custom",path:["sourceRef"],message:"Thiếu nguồn số liệu"});
 if(x.status==="NOT_APPLICABLE"&&(!x.naReason||x.naReason.length<5))
  ctx.addIssue({code:"custom",path:["naReason"],message:"Phải có lý do không áp dụng"});
});
const Link = z.object({planId:z.string().uuid(),workItemId:z.string().uuid()}).strict();

async function write<T>(rpc:string,params:Record<string,unknown>):Promise<Result<T>>{
 try {
  const ctx=await getRequestContext();
  assertPermission(ctx,"m05:digital:write");
  const db=await createServerSupabaseClient();
  const {data,error}=await db.schema("app").rpc(rpc,params);
  if(error){
   if(error.code==="42501")return fail("FORBIDDEN","Không có quyền hoặc ngoài phạm vi");
   if(error.code==="PV409")return fail("VERSION_CONFLICT","Dữ liệu đã thay đổi, hãy tải lại");
   if(error.code==="23505")return fail("DUPLICATE_REQUEST","Mã chỉ tiêu/kế hoạch đã tồn tại");
   if(error.code==="P0002")return fail("NOT_FOUND","Không tìm thấy kế hoạch hoặc chỉ tiêu");
   if(error.code==="22023"||error.code==="23514")return fail("VALIDATION",error.message);
   return fail("INTERNAL","Lỗi CSDL khi ghi chỉ tiêu/kế hoạch");
  }
  if(!data||typeof data!=="object"||Array.isArray(data))return fail("INTERNAL","RPC không xác nhận dữ liệu");
  revalidatePath("/khcn-chuyen-doi-so");
  return ok(data as T);
 }catch{return fail("FORBIDDEN","Phiên không hợp lệ hoặc không kết nối được CSDL");}
}

export async function createDigitalPlanAction(raw:unknown):Promise<Result<{id:string}>>{
 const p=Plan.safeParse(raw);
 if(!p.success)return fail("VALIDATION","Kế hoạch cần tên, kỳ và nguồn");
 return write<{id:string}>("create_digital_plan",{
  p_title:p.data.title,p_period:p.data.period,p_source_ref:p.data.sourceRef,
 });
}
export async function createDigitalIndicatorAction(raw:unknown):Promise<Result<{id:string}>>{
 const p=Indicator.safeParse(raw);
 if(!p.success)return fail("VALIDATION","Định nghĩa chỉ tiêu không hợp lệ");
 const x=p.data;
 return write<{id:string}>("create_digital_indicator",{
  p_plan_id:x.planId,p_code:x.code,p_name:x.name,p_unit:x.unit,
  p_period:x.period,p_meaning:x.meaning,
 });
}
export async function linkDigitalPlanWorkAction(raw:unknown):Promise<Result<{plan_id:string;work_item_id:string}>>{
 const p=Link.safeParse(raw);
 if(!p.success)return fail("VALIDATION","Mã kế hoạch/công việc không hợp lệ");
 return write<{plan_id:string;work_item_id:string}>("link_digital_plan_work",{
  p_plan_id:p.data.planId,p_work_item_id:p.data.workItemId,
 });
}
export async function updateDigitalIndicatorStatusAction(raw:unknown):Promise<Result<{id:string;version:number;status:string}>>{
 const p=Update.safeParse(raw);
 if(!p.success)return fail("VALIDATION",p.error.issues.map(x=>x.message).join("; "));
 const x=p.data;
 return write<{id:string;version:number;status:string}>("update_digital_indicator_status",{
  p_indicator_id:x.indicatorId,p_status:x.status,p_value:x.numericValue,
  p_source_ref:x.sourceRef,p_expected_version:x.expectedVersion,p_na_reason:x.naReason,
 });
}
