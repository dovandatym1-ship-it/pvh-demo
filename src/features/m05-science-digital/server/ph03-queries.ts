import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { assertPermission } from "@/lib/authorization/assert-permission";
import type { RequestContext } from "@/lib/auth/request-context";

export type DigitalPlan={id:string;title:string;period:string;status:string;sourceRef:string;taskCount:number};
export type DigitalIndicator={
 id:string;planId:string|null;code:string;name:string;unit:string;period:string;
 numericValue:number|null;status:string;sourceRef:string|null;naReason:string|null;version:number;
};
export async function getDigitalWorkspace(ctx:RequestContext){
 assertPermission(ctx,"m05:digital:read");
 const db=await createServerSupabaseClient();
 const [plans,links,indicators]=await Promise.all([
  db.from("digital_plans").select("id,title,period,status,source_ref")
    .eq("tenant_id",ctx.tenantId).order("created_at",{ascending:false}),
  db.from("digital_plan_tasks").select("plan_id,work_item_id").eq("tenant_id",ctx.tenantId),
  db.from("digital_indicators").select("id,plan_id,code,name,unit,evaluation_period,numeric_value,status,source_ref,na_reason,version")
    .eq("tenant_id",ctx.tenantId).order("code"),
 ]);
 for(const x of [plans,links,indicators])if(x.error)
  throw new Error("Không thể đọc dữ liệu CĐS: "+x.error.code);
 const counts=new Map<string,number>();
 for(const t of links.data??[])counts.set(t.plan_id,(counts.get(t.plan_id)??0)+1);
 const planRows:DigitalPlan[]=(plans.data??[]).map(p=>({
  id:p.id,title:p.title,period:p.period,status:p.status,sourceRef:p.source_ref,
  taskCount:counts.get(p.id)??0,
 }));
 const indicatorRows:DigitalIndicator[]=(indicators.data??[]).map(i=>({
  id:i.id,planId:i.plan_id,code:i.code,name:i.name,unit:i.unit,period:i.evaluation_period,
  numericValue:i.numeric_value===null?null:Number(i.numeric_value),status:i.status,
  sourceRef:i.source_ref,naReason:i.na_reason,version:i.version,
 }));
 return {plans:planRows,indicators:indicatorRows};
}
