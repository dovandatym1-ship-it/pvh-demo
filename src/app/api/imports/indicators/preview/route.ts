import { NextRequest,NextResponse } from "next/server";
import { getRequestContext } from "@/lib/auth/request-context";
import { prepareIndicatorImport } from "@/features/m10-integrations/server/indicator-import-service";
export const dynamic="force-dynamic";
export async function POST(request:NextRequest){
 try{
  const ctx=await getRequestContext();
  const prepared=await prepareIndicatorImport(request,ctx);
  const {rows,...summary}=prepared.preview;
  return NextResponse.json({summary,sourceOwner:prepared.sourceOwner,policy:prepared.policy},
   {headers:{"Cache-Control":"no-store"}});
 }catch(error){
  const m=error instanceof Error?error.message:"";
  const status=m.includes("UNAUTHENTICATED")?401:m.includes("FORBIDDEN")?403:400;
  return NextResponse.json({error:status===400?m:"ACCESS_DENIED"},{status});
 }
}
