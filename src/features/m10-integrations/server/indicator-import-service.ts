import "server-only";
import crypto from "node:crypto";
import { z } from "zod";
import type { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { RequestContext } from "@/lib/auth/request-context";
import { assertPermission } from "@/lib/authorization/assert-permission";
import { MAX_CSV_BYTES, parseIndicatorCsv, type ImportPreview } from "../import-contract";

export const ImportPolicy = z.enum(["REJECT_ALL","ACCEPT_VALID"]);
export interface PreparedImport {
 readonly preview:ImportPreview;
 readonly sourceOwner:string;
 readonly policy:z.infer<typeof ImportPolicy>;
}
export async function prepareIndicatorImport(request:NextRequest,ctx:RequestContext):Promise<PreparedImport> {
 assertPermission(ctx,"m10:indicator:import");
 const form=await request.formData();
 const file=form.get("file");
 if(!(file instanceof File)||!file.name.toLowerCase().endsWith(".csv"))throw new Error("CSV_FILE_REQUIRED");
 if(file.size===0||file.size>MAX_CSV_BYTES)throw new Error("CSV_SIZE_INVALID");
 const sourceOwner=String(form.get("sourceOwner")??"").trim();
 if(sourceOwner.length<3||sourceOwner.length>150||/^[\s]*[=+@-]/.test(sourceOwner))
  throw new Error("SOURCE_OWNER_INVALID");
 const policy=ImportPolicy.parse(form.get("policy")??"REJECT_ALL");
 const bytes=Buffer.from(await file.arrayBuffer());
 const text=new TextDecoder("utf-8",{fatal:true}).decode(bytes);
 // No external malware scan is claimed. In staging, scanner integration remains a G4 gate.
 if(text.includes("EICAR-STANDARD-ANTIVIRUS-TEST-FILE"))throw new Error("FILE_REJECTED");
 const sha=crypto.createHash("sha256").update(bytes).digest("hex");
 return {preview:parseIndicatorCsv(text,sha),sourceOwner,policy};
}
export async function commitIndicatorImport(ctx:RequestContext,prepared:PreparedImport) {
 assertPermission(ctx,"m10:indicator:import");
 const db=await createServerSupabaseClient();
 const {data,error}=await db.schema("app").rpc("commit_indicator_import",{
  p_source_owner:prepared.sourceOwner,
  p_file_sha256:prepared.preview.fileSha256,
  p_template_version:prepared.preview.templateVersion,
  p_policy:prepared.policy,p_rows:prepared.preview.rows,
 });
 if(error)throw new Error(error.code==="42501"?"FORBIDDEN":"IMPORT_COMMIT_FAILED");
 if(!data||typeof data!=="object"||!data.id)throw new Error("IMPORT_RECEIPT_MISSING");
 return data as Record<string,unknown>;
}
