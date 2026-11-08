import { NextRequest,NextResponse } from "next/server";
import crypto from "node:crypto";
import { jobWorker } from "@/lib/jobs/job-worker";
export const dynamic="force-dynamic";
async function execute(request:NextRequest){
 const secret=process.env.CRON_SECRET;
 if(!secret||secret.length<16)return NextResponse.json({error:"CRON_SECRET_NOT_CONFIGURED"},{status:503});
 const expected=Buffer.from("Bearer "+secret),actual=Buffer.from(request.headers.get("authorization")??"");
 if(expected.length!==actual.length||!crypto.timingSafeEqual(expected,actual))
  return NextResponse.json({error:"UNAUTHORIZED"},{status:401});
 // Unique per invocation: a timed-out worker cannot finalize a reclaimed job.
 const result=await jobWorker.processNextJob("pvh-cron-"+crypto.randomUUID());
 return NextResponse.json(result,{status:result.ok?200:500,headers:{"Cache-Control":"no-store"}});
}
export const POST=execute;
export const GET=execute;
