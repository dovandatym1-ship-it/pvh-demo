import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { RequestContext } from "@/lib/auth/request-context";
import { assertPermission } from "@/lib/authorization/assert-permission";

export type TitleType = "GIA_DINH" | "THON" | "XA_TIEU_BIEU";
export type CultureCampaign = {
  id:string; title:string; year:number; titleType:TitleType; rulePackId:string;
  ruleVersion:number; ruleStatus:string; closesAt:string; status:string;
};
export type CultureDossier = {
  id:string;campaignId:string;subjectRef:string;subjectName:string;hamletId:string;
  status:string;score:number|null;reason:string|null;sourceRef:string;
  version:number;ruleVersion:number;createdAt:string;
};
export type HamletOption = {id:string;name:string};

export async function getCultureWorkspace(ctx:RequestContext,titleType:TitleType) {
  assertPermission(ctx,"m04:culture:read");
  const db=await createServerSupabaseClient();
  const [campaignRes,packRes,dossierRes,hamletRes]=await Promise.all([
    db.from("campaigns").select("id,title,year,title_type,rule_pack_id,closes_at,status")
      .eq("tenant_id",ctx.tenantId).eq("title_type",titleType).order("year",{ascending:false}),
    db.from("culture_rule_packs").select("id,version,status")
      .eq("tenant_id",ctx.tenantId),
    db.from("submissions").select("id,campaign_id,subject_ref,household_head_name,hamlet_id,status,score,reviewer_comment,source_ref,version,rule_pack_version,created_at")
      .eq("tenant_id",ctx.tenantId).eq("submission_type",titleType).order("created_at",{ascending:false}),
    db.from("org_units").select("id,name")
      .eq("tenant_id",ctx.tenantId).eq("kind","HAMLET").eq("is_active",true).order("name"),
  ]);
  for(const result of [campaignRes,packRes,dossierRes,hamletRes]) {
    if(result.error) throw new Error("Không tải được dữ liệu M04 từ CSDL: "+result.error.code);
  }
  const packs=new Map((packRes.data??[]).map(r=>[r.id,r]));
  const campaigns:CultureCampaign[]=(campaignRes.data??[]).map(c=>({
    id:c.id,title:c.title,year:c.year,titleType:c.title_type as TitleType,
    rulePackId:c.rule_pack_id,ruleVersion:packs.get(c.rule_pack_id)?.version??0,
    ruleStatus:packs.get(c.rule_pack_id)?.status??"UNVERIFIED",
    closesAt:c.closes_at,status:c.status,
  }));
  const dossiers:CultureDossier[]=(dossierRes.data??[]).map(s=>({
    id:s.id,campaignId:s.campaign_id,subjectRef:s.subject_ref,subjectName:s.household_head_name,
    hamletId:s.hamlet_id,status:s.status,
    score:s.score===null?null:Number(s.score),reason:s.reviewer_comment,
    sourceRef:s.source_ref,version:s.version,ruleVersion:s.rule_pack_version,createdAt:s.created_at,
  }));
  return {
    campaigns,dossiers,
    hamlets:(hamletRes.data??[]).filter(h=>!ctx.scopes.hamletIds ||
      ctx.scopes.hamletIds.includes(h.id)).map(h=>({id:h.id,name:h.name})),
  };
}
