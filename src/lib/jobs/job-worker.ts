import "server-only";
import crypto from "node:crypto";
import { createWorkerSupabaseClient } from "@/lib/supabase/worker";
import { exportService } from "@/features/m09-reporting/server/export-service";
import { mapSnapshot } from "@/features/m09-reporting/server/repository";
import { type Result,ok,fail } from "@/lib/types/result";

type Claim={ok:boolean;claimed:boolean;jobId?:string;tenantId?:string;
 kind?:string;payload?:{snapshotId?:string;format?:string};attempts?:number};
export const jobWorker={
 async processNextJob(workerId:string):Promise<Result<{processed:boolean;jobId?:string;status:string}>>{
  let db:ReturnType<typeof createWorkerSupabaseClient>;
  try{db=createWorkerSupabaseClient();}
  catch{return fail("INTERNAL","Chưa cấu hình worker service role");}
  const {data:raw,error:claimError}=await db.schema("app").rpc("claim_next_system_job",{p_worker_id:workerId});
  if(claimError)return fail("INTERNAL","Không claim được job");
  const claim=raw as Claim;
  if(!claim?.ok)return fail("INTERNAL","RPC claim trả dữ liệu lỗi");
  if(!claim.claimed)return ok({processed:false,status:"NO_JOB"});
  const jobId=String(claim.jobId);
  try{
   if(claim.kind!=="REPORT_EXPORT_ASYNC")throw new Error("UNSUPPORTED_JOB_TYPE");
   const snapshotId=claim.payload?.snapshotId;const format=claim.payload?.format;
   if(!snapshotId||!["PDF","XLSX"].includes(String(format)))throw new Error("JOB_PAYLOAD_INVALID");
   const {data:rawSnapshot,error:readError}=await db.from("report_snapshots").select("*")
    .eq("id",snapshotId).eq("tenant_id",claim.tenantId).single();
   if(readError||!rawSnapshot)throw new Error("SOURCE_SNAPSHOT_NOT_FOUND");
   const artifact=await exportService.exportSnapshot(mapSnapshot(rawSnapshot as Record<string,unknown>),format as "PDF"|"XLSX");
   if(artifact.buffer.byteLength<100)throw new Error("INVALID_ARTIFACT");
   const sha=crypto.createHash("sha256").update(artifact.buffer).digest("hex");
   const storagePath=String(claim.tenantId)+"/report_exports/"+jobId+"/"+artifact.filename;
   const {error:uploadError}=await db.storage.from("pvh-report-exports")
    .upload(storagePath,artifact.buffer,{contentType:artifact.contentType,upsert:true});
   if(uploadError)throw new Error("STORAGE_UPLOAD_FAILED");
   const receipt={storagePath,sha256:sha,bytes:artifact.buffer.byteLength,
    contentType:artifact.contentType,filename:artifact.filename,
    snapshotId,finishedAt:new Date().toISOString(),workerId};
   const {data:completed,error:completeError}=await db.schema("app").rpc("complete_system_job",{
    p_job_id:jobId,p_worker_id:workerId,p_receipt:receipt,
   });
   if(completeError||!completed||completed.status!=="SUCCEEDED")throw new Error("JOB_COMPLETION_NOT_PERSISTED");
   return ok({processed:true,jobId,status:"SUCCEEDED"});
  }catch(error){
   const reason=error instanceof Error?error.message:"JOB_EXECUTION_ERROR";
   const {error:failError}=await db.schema("app").rpc("fail_system_job",{
    p_job_id:jobId,p_worker_id:workerId,p_error:reason,
   });
   if(failError)return fail("INTERNAL","Lỗi xử lý và ghi thất bại tác vụ");
   return fail("INTERNAL","Tác vụ thất bại; trạng thái retry/dead-letter đã ghi: "+reason);
  }
 },
};
