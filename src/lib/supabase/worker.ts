import "server-only";
import { createClient } from "@supabase/supabase-js";
/** Never import this module from Client Components or expose its secret in NEXT_PUBLIC_. */
export function createWorkerSupabaseClient(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!secret||secret.length<24)throw new Error("WORKER_SECRET_MISSING");
 return createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
}
