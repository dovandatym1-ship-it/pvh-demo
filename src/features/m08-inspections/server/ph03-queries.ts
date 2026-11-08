import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { assertPermission } from "@/lib/authorization/assert-permission";
import type { RequestContext } from "@/lib/auth/request-context";

export type InspectionRecord={
 id:string;code:string;targetName:string;category:string;hamletId:string;
 inspectorName:string;inspectionDate:string;checklistVersion:string;
 authorityRef:string|null;notes:string|null;
};
export type InspectionRecommendation={
 id:string;inspectionId:string;code:string;title:string;dueDate:string;
 status:string;workItemId:string;version:number;reviewNote:string|null;
};
export async function getInspectionWorkspace(ctx:RequestContext){
 assertPermission(ctx,"m08:inspection:read");
 const db=await createServerSupabaseClient();
 const [records,recommendations,hamlets]=await Promise.all([
  db.from("inspection_records").select("id,code,target_name,category,hamlet_id,inspector_name,inspection_date,checklist_version,authority_ref,notes")
    .eq("tenant_id",ctx.tenantId).order("inspection_date",{ascending:false}),
  db.from("inspection_recommendations").select("id,inspection_id,code,title,due_date,status,work_item_id,version,review_note")
    .eq("tenant_id",ctx.tenantId).order("due_date",{ascending:true}),
  db.from("org_units").select("id,name").eq("tenant_id",ctx.tenantId).eq("kind","HAMLET").eq("is_active",true),
 ]);
 for(const x of [records,recommendations,hamlets])if(x.error)
  throw new Error("Không đọc được hồ sơ kiểm tra: "+x.error.code);
 const inspected:InspectionRecord[]=(records.data??[]).map(r=>({
  id:r.id,code:r.code,targetName:r.target_name,category:r.category,hamletId:r.hamlet_id,
  inspectorName:r.inspector_name,inspectionDate:r.inspection_date,
  checklistVersion:r.checklist_version,authorityRef:r.authority_ref,notes:r.notes,
 }));
 const visible=new Set(inspected.map(x=>x.id));
 const recs:InspectionRecommendation[]=(recommendations.data??[])
  .filter(r=>visible.has(r.inspection_id)).map(r=>({
   id:r.id,inspectionId:r.inspection_id,code:r.code,title:r.title,
   dueDate:r.due_date,status:r.status,workItemId:r.work_item_id,
   version:r.version,reviewNote:r.review_note,
  }));
 let assignees:Array<{id:string;name:string}>=[];
 if(ctx.permissions.includes("m01:work:assign")){
  const {data,error}=await db.schema("app").rpc("list_work_assignees");
  if(error)throw new Error("Không đọc được đầu mối giao công việc: "+error.code);
  if(Array.isArray(data))assignees=data.map((a:Record<string,unknown>)=>({
   id:String(a.user_id),name:String(a.full_name),
  }));
 }
 return {
  records:inspected,recommendations:recs,
  hamlets:(hamlets.data??[]).filter(h=>!ctx.scopes.hamletIds||
   ctx.scopes.hamletIds.includes(h.id)).map(h=>({id:h.id,name:h.name})),
  assignees,
 };
}
