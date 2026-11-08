import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { RequestContext } from "@/lib/auth/request-context";
import { assertPermission } from "@/lib/authorization/assert-permission";
import { type Result,ok,fail } from "@/lib/types/result";

export interface ExportJob {
 id:string;tenantId:string;status:"PENDING"|"RUNNING"|"SUCCEEDED"|"FAILED";
 attempts:number;receipt:Record<string,unknown>|null;errorMessage:string|null;
}
function mapJob(row:Record<string,unknown>):ExportJob {
 return {id:String(row.id),tenantId:String(row.tenant_id),status:row.status as ExportJob["status"],
  attempts:Number(row.attempts),receipt:(row.receipt as Record<string,unknown>)??null,
  errorMessage:row.error_message?String(row.error_message):null};
}
export const jobService={
 async enqueueReportExport(ctx:RequestContext,input:{snapshotId:string;format:"PDF"|"XLSX";idempotencyKey:string}):
 Promise<Result<ExportJob>>{
  assertPermission(ctx,"m09:report:export");
  try{
   const db=await createServerSupabaseClient();
   const {data,error}=await db.schema("app").rpc("enqueue_report_export",{
    p_snapshot_id:input.snapshotId,p_format:input.format,p_idempotency_key:input.idempotencyKey,
   });
   if(error)return fail(error.code==="42501"?"FORBIDDEN":"INTERNAL","Không tạo được tác vụ xuất báo cáo");
   if(!data||!data.id)return fail("INTERNAL","RPC không tạo receipt tác vụ");
   return ok(mapJob(data as Record<string,unknown>));
  }catch{return fail("INTERNAL","Lỗi tạo tác vụ nền");}
 },
 async getExportJob(ctx:RequestContext,id:string):Promise<Result<ExportJob>>{
  assertPermission(ctx,"m09:report:export");
  try{
   const db=await createServerSupabaseClient();
   const {data,error}=await db.from("system_jobs").select("id,tenant_id,status,attempts,receipt,error_message")
    .eq("tenant_id",ctx.tenantId).eq("created_by",ctx.userId).eq("kind","REPORT_EXPORT_ASYNC")
    .eq("id",id).maybeSingle();
   if(error)return fail("INTERNAL","Không truy vấn được trạng thái tác vụ");
   return data?ok(mapJob(data)):fail("NOT_FOUND","Không tìm thấy tác vụ");
  }catch{return fail("INTERNAL","Lỗi truy vấn tác vụ");}
 },
};
