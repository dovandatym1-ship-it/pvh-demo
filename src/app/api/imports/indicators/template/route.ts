import { NextResponse } from "next/server";
import { getRequestContext } from "@/lib/auth/request-context";
import { assertPermission } from "@/lib/authorization/assert-permission";
import { SAMPLE_TEMPLATE } from "@/features/m10-integrations/import-contract";
export const dynamic="force-dynamic";
export async function GET(){
 try{
  const ctx=await getRequestContext();assertPermission(ctx,"m10:indicator:import");
  return new NextResponse("\uFEFF"+SAMPLE_TEMPLATE,{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="pvh-indicator-v1-demo.csv"',
   "Cache-Control":"no-store","X-Content-Type-Options":"nosniff",
  }});
 }catch(error){
  const m=error instanceof Error?error.message:"";
  return NextResponse.json({error:"ACCESS_DENIED"},{status:m.includes("UNAUTHENTICATED")?401:403});
 }
}
