"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getRequestContext } from "@/lib/auth/request-context";
import { assertPermission } from "@/lib/authorization/assert-permission";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fail, ok, type Result } from "@/lib/types/result";

const RecordInput=z.object({
 code:z.string().trim().min(2).max(60),targetName:z.string().trim().min(3).max(250),
 category:z.string().trim().min(2).max(80),hamletId:z.string().uuid(),
 inspectorName:z.string().trim().min(3).max(250),checklistVersion:z.string().trim().min(1).max(50),
 inspectionDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
 authorityRef:z.string().trim().max(500).nullable(),notes:z.string().trim().max(2000).nullable(),
}).strict();
const RecommendationInput=z.object({
 inspectionId:z.string().uuid(),code:z.string().trim().min(2).max(60),
 title:z.string().trim().min(5).max(500),dueDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
 assignedTo:z.string().uuid(),idempotencyKey:z.string().uuid(),
}).strict();
const ReviewInput=z.object({
 recommendationId:z.string().uuid(),status:z.enum(["FEEDBACK_UNVERIFIED","RESOLVED_CLOSED"]),
 reason:z.string().trim().min(5).max(2000),expectedVersion:z.number().int().positive(),
}).strict();
async function write<T>(permission:string,rpc:string,args:Record<string,unknown>):Promise<Result<T>>{
 try{
  const ctx=await getRequestContext();assertPermission(ctx,permission);
  const db=await createServerSupabaseClient();
  const {data,error}=await db.schema("app").rpc(rpc,args);
  if(error){
   if(error.code==="42501")return fail("FORBIDDEN","Ngoài phạm vi, thiếu quyền hoặc chưa đủ thẩm quyền");
   if(error.code==="PV409")return fail("VERSION_CONFLICT","Bản ghi đã thay đổi/khóa gửi không khớp");
   if(error.code==="23505")return fail("DUPLICATE_REQUEST","Mã kiểm tra/kiến nghị đã tồn tại");
   if(error.code==="P0002")return fail("NOT_FOUND","Không tìm thấy đợt kiểm tra hoặc kiến nghị");
   if(error.code==="22023"||error.code==="23514")return fail("VALIDATION",error.message);
   return fail("INTERNAL","Không lưu được dữ liệu kiểm tra vào CSDL");
  }
  if(!data||typeof data!=="object"||Array.isArray(data)||!("id" in data))
   return fail("INTERNAL","RPC không trả mã bản ghi đã lưu");
  revalidatePath("/kiem-tra");
  revalidatePath("/cong-viec");
  return ok(data as T);
 }catch{return fail("FORBIDDEN","Phiên đăng nhập không hợp lệ hoặc lỗi kết nối");}
}
export async function createInspectionRecordAction(raw:unknown):Promise<Result<{id:string}>>{
 const p=RecordInput.safeParse(raw);
 if(!p.success)return fail("VALIDATION","Thông tin cuộc kiểm tra/checklist không hợp lệ");
 const x=p.data;
 return write<{id:string}>("m08:inspection:write","create_inspection_record",{
  p_code:x.code,p_target_name:x.targetName,p_category:x.category,p_hamlet_id:x.hamletId,
  p_inspector_name:x.inspectorName,p_checklist_version:x.checklistVersion,
  p_inspection_date:x.inspectionDate,p_authority_ref:x.authorityRef,p_notes:x.notes,
 });
}
export async function createInspectionRecommendationAction(raw:unknown):Promise<Result<{id:string;work_item_id:string}>>{
 const p=RecommendationInput.safeParse(raw);
 if(!p.success)return fail("VALIDATION","Kiến nghị cần mã, nội dung, người giao và khóa gửi hợp lệ");
 const x=p.data;
 return write<{id:string;work_item_id:string}>("m08:inspection:write","create_inspection_recommendation",{
  p_inspection_id:x.inspectionId,p_code:x.code,p_title:x.title,p_due_date:x.dueDate,
  p_assigned_to:x.assignedTo,p_idempotency_key:x.idempotencyKey,
 });
}
export async function resolveInspectionRecommendationAction(raw:unknown):Promise<Result<{id:string;version:number;status:string}>>{
 const p=ReviewInput.safeParse(raw);
 if(!p.success)return fail("VALIDATION","Cần lý do, trạng thái và phiên bản kiến nghị hợp lệ");
 const x=p.data;
 return write<{id:string;version:number;status:string}>("m08:inspection:review","resolve_inspection_recommendation",{
  p_recommendation_id:x.recommendationId,p_status:x.status,p_reason:x.reason,
  p_expected_version:x.expectedVersion,
 });
}
