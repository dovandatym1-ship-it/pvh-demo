import { NextRequest,NextResponse } from "next/server";
import { z } from "zod";
import { getRequestContext } from "@/lib/auth/request-context";
import { assertPermission } from "@/lib/authorization/assert-permission";
import { createServerSupabaseClient } from "@/lib/supabase/server";
export const dynamic="force-dynamic";
const BaseSchema=z.object({
 externalId:z.string().min(1).max(150),
 outcome:z.enum(["SUCCESS","TIMEOUT","SCHEMA_ERROR"]),
});
const Schema=z.union([
 BaseSchema.extend({action:z.literal("RECORD").optional()}),
 BaseSchema.extend({action:z.literal("RETRY"),expectedAttempts:z.number().int().min(1).max(2)}),
]);
export async function POST(request:NextRequest){
 try{
  const ctx=await getRequestContext();assertPermission(ctx,"m10:integration:simulate");
  const body=Schema.parse(await request.json());
  const db=await createServerSupabaseClient();
  const {data,error}=body.action==="RETRY"
   ? await db.schema("app").rpc("retry_simulated_integration",{
     p_external_id:body.externalId,p_outcome:body.outcome,p_expected_attempts:body.expectedAttempts,
    })
   : await db.schema("app").rpc("record_simulated_integration",{
     p_external_id:body.externalId,p_outcome:body.outcome,
    });
  if(error||!data)return NextResponse.json({error:"SIMULATION_LEDGER_FAILED"},{status:409});
  return NextResponse.json({simulated:true,liveConnection:false,receipt:data},
   {status:body.outcome==="SUCCESS"?200:502,headers:{"Cache-Control":"no-store"}});
 }catch(error){
  const m=error instanceof Error?error.message:"";
  return NextResponse.json({error:m.includes("UNAUTHENTICATED")?"UNAUTHENTICATED":
   m.includes("FORBIDDEN")?"FORBIDDEN":"INVALID_SIMULATION_REQUEST"},
   {status:m.includes("UNAUTHENTICATED")?401:m.includes("FORBIDDEN")?403:400});
 }
}
