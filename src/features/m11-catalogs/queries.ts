import "server-only";
import { assertPermission } from "@/lib/authorization/assert-permission";
import type { RequestContext } from "@/lib/auth/request-context";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Catalog,CatalogValue,CatalogEvent } from "./catalog-schema";

export type CatalogWorkspace = {
 catalogs: Catalog[];
 values: CatalogValue[];
 history: CatalogEvent[];
 catalogsTotal: number;
 valuesTotal: number;
 historyTotal: number;
};

export async function getCatalogWorkspace(ctx: RequestContext): Promise<CatalogWorkspace> {
  assertPermission(ctx,"m11:catalog:read");
  const db=await createServerSupabaseClient();
  const [catalogs,values,events]=await Promise.all([
    db.from("pvh_catalogs").select("*",{count:"exact"}).eq("tenant_id",ctx.tenantId)
      .order("code").limit(500),
    db.from("pvh_catalog_values").select("*",{count:"exact"}).eq("tenant_id",ctx.tenantId)
      .order("catalog_id").order("sort_order").order("code").limit(1000),
    db.from("pvh_catalog_events").select("id,catalog_id,value_id,actor_id,action,before_value,after_value,created_at",{count:"exact"})
      .eq("tenant_id",ctx.tenantId).order("created_at",{ascending:false}).limit(100),
  ]);
  if(catalogs.error||values.error||events.error){
    throw new Error("Không thể tải danh mục dùng chung từ dữ liệu đã phân quyền.");
  }
  return {
    catalogs:(catalogs.data||[]) as Catalog[],
    values:(values.data||[]) as CatalogValue[],
    history:(events.data||[]) as CatalogEvent[],
    catalogsTotal:catalogs.count??0,valuesTotal:values.count??0,historyTotal:events.count??0,
  };
}
