import { NextRequest,NextResponse } from "next/server";
import { z } from "zod";
import { getRequestContext } from "@/lib/auth/request-context";
import { jobService } from "@/lib/jobs/job-service";
export const dynamic="force-dynamic";
const Schema=z.object({
 snapshotId:z.string().uuid(),
 format:z.enum(["PDF","XLSX"]),
 idempotencyKey:z.string().min(8).max(200),
});
export async function POST(request:NextRequest){
 try{
  const ctx=await getRequestContext();
  const body=Schema.parse(await request.json());
  const result=await jobService.enqueueReportExport(ctx,body);
  return NextResponse.json(result,{status:result.ok?202:result.error.code==="FORBIDDEN"?403:500,
   headers:{"Cache-Control":"no-store"}});
 }catch(error){
  const msg=error instanceof Error?error.message:"";
  return NextResponse.json({error:"ACCESS_DENIED_OR_INVALID_INPUT"},
   {status:msg.includes("UNAUTHENTICATED")?401:msg.includes("FORBIDDEN")?403:400});
 }
}
