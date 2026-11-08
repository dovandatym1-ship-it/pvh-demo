import { NextRequest,NextResponse } from "next/server";
import { getRequestContext } from "@/lib/auth/request-context";
import { prepareIndicatorImport,commitIndicatorImport } from "@/features/m10-integrations/server/indicator-import-service";
export const dynamic="force-dynamic";
export async function POST(request:NextRequest){
 try{
  const ctx=await getRequestContext();
  const prepared=await prepareIndicatorImport(request,ctx);
  const receipt=await commitIndicatorImport(ctx,prepared);
  return NextResponse.json({receipt},{headers:{"Cache-Control":"no-store"}});
 }catch(error){
  const m=error instanceof Error?error.message:"";
  const status=m.includes("UNAUTHENTICATED")?401:m.includes("FORBIDDEN")?403:
   m==="IMPORT_COMMIT_FAILED"?409:400;
  return NextResponse.json({error:status===400?m:"IMPORT_FAILED_OR_FORBIDDEN"},{status});
 }
}
