import { NextRequest,NextResponse } from "next/server";
import { getRequestContext } from "@/lib/auth/request-context";
import { jobService } from "@/lib/jobs/job-service";
import { createWorkerSupabaseClient } from "@/lib/supabase/worker";
export const dynamic="force-dynamic";
export async function GET(_request:NextRequest,{params}:{params:Promise<{id:string}>}){
 try{
  const ctx=await getRequestContext();
  const {id}=await params;
  if(!/^[0-9a-f-]{36}$/i.test(id))return NextResponse.json({error:"INVALID_JOB_ID"},{status:400});
  const result=await jobService.getExportJob(ctx,id);
  if(!result.ok)return NextResponse.json(result,{status:result.error.code==="NOT_FOUND"?404:403});
  const job=result.data;
  let downloadUrl:string|undefined;
  if(job.status==="SUCCEEDED"&&job.receipt){
   const objectPath=String(job.receipt.storagePath??"");
   if(!objectPath.startsWith(ctx.tenantId+"/report_exports/"+job.id+"/"))
    return NextResponse.json({error:"ARTIFACT_SCOPE_MISMATCH"},{status:409});
   const worker=createWorkerSupabaseClient();
   const {data,error}=await worker.storage.from("pvh-report-exports").createSignedUrl(objectPath,60);
   if(error||!data)return NextResponse.json({error:"DOWNLOAD_UNAVAILABLE"},{status:503});
   downloadUrl=data.signedUrl;
  }
  return NextResponse.json({job,downloadUrl,expiresInSeconds:downloadUrl?60:null},
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  const msg=error instanceof Error?error.message:"";
  return NextResponse.json({error:"JOB_STATUS_FAILED"},
   {status:msg.includes("UNAUTHENTICATED")?401:msg.includes("FORBIDDEN")?403:500});
 }
}
