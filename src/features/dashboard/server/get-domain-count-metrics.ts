import "server-only";

import type { RequestContext } from "@/lib/auth/request-context";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface DomainCountMetric {
  code:string;
  label:string;
  source:string;
  route:string;
  count:number|null;
  status:"ready"|"unavailable";
}
const SOURCES = [
  {code:"M02",label:"Vụ việc tranh chấp lao động",permission:"m02:internal:read",source:"labor_disputes",route:"/noi-vu"},
  {code:"M03",label:"Hồ sơ miễn, giảm học phí",permission:"m03:education:read",source:"tuition_exemptions",route:"/giao-duc"},
  {code:"M04",label:"Hồ sơ văn hóa được tiếp nhận",permission:"m04:culture:read",source:"submissions",route:"/van-hoa/gia-dinh-van-hoa"},
  {code:"M05",label:"Kế hoạch chuyển đổi số",permission:"m05:digital:read",source:"digital_plans",route:"/khcn-chuyen-doi-so"},
  {code:"M06",label:"Lượt kiểm tra an toàn thực phẩm",permission:"m06:social:read",source:"food_safety_inspections",route:"/y-te-an-sinh"},
  {code:"M07",label:"Cơ sở tín ngưỡng, tôn giáo",permission:"m07:faith:read",source:"religious_establishments",route:"/dan-toc-ton-giao"},
  {code:"M08",label:"Hồ sơ kiểm tra",permission:"m08:inspection:read",source:"inspection_records",route:"/kiem-tra"},
  {code:"M09",label:"Bản tổng hợp báo cáo",permission:"m09:report:read",source:"report_snapshots",route:"/bao-cao"},
  {code:"M10",label:"Lượt nhập chỉ tiêu có nguồn",permission:"m10:indicator:import",source:"indicator_import_batches",route:"/nhap-chi-tieu"},
  {code:"M11",label:"Giá trị danh mục dùng chung",permission:"m11:catalog:read",source:"pvh_catalog_values",route:"/danh-muc-dung-chung"},
] as const;

export async function getDomainCountMetrics(ctx:RequestContext):Promise<DomainCountMetric[]> {
  const permitted=SOURCES.filter(item=>ctx.permissions.includes(item.permission));
  if(!permitted.length)return [];
  let db: Awaited<ReturnType<typeof createServerSupabaseClient>>;
  try {
    db = await createServerSupabaseClient();
  } catch {
    return permitted.map(item => ({
      code: item.code, label: item.label, source: item.source, route: item.route,
      count: null, status: "unavailable" as const,
    }));
  }
  return Promise.all(permitted.map(async item=>{
    try{
      // The table SELECT and forced RLS must both allow this request. Counting
      // exactly via HEAD is independent of the PostgREST list row cap.
      const result=await db.from(item.source).select("id",{count:"exact",head:true})
        .eq("tenant_id",ctx.tenantId);
      if(result.error||result.count===null)return {
        code:item.code,label:item.label,source:item.source,route:item.route,
        count:null,status:"unavailable" as const,
      };
      return {code:item.code,label:item.label,source:item.source,route:item.route,
        count:result.count,status:"ready" as const};
    }catch{
      return {code:item.code,label:item.label,source:item.source,route:item.route,
        count:null,status:"unavailable" as const};
    }
  }));
}
