import { getRequestContext } from "@/lib/auth/request-context";
import { getCatalogWorkspace } from "@/features/m11-catalogs/queries";
import { CatalogConsole } from "@/features/m11-catalogs/catalog-console";

export default async function CatalogsPage() {
  const ctx=await getRequestContext();
  const initial=await getCatalogWorkspace(ctx);
  const canManage=ctx.permissions.includes("m11:catalog:manage");
  return <div className="mx-auto w-full max-w-7xl px-1 py-2 sm:px-2">
    <CatalogConsole initial={initial} canManage={canManage}/>
  </div>;
}
