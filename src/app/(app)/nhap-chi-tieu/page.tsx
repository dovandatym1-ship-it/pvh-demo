import { getRequestContext } from "@/lib/auth/request-context";
import { assertPermission } from "@/lib/authorization/assert-permission";
import { IndicatorImportManager } from "@/features/m10-integrations/components/indicator-import-manager";
export const dynamic="force-dynamic";
export default async function IndicatorImportPage(){
 const ctx=await getRequestContext();assertPermission(ctx,"m10:indicator:import");
 return <main className="space-y-5">
  <h1 className="text-xl font-bold">Nhập dữ liệu chỉ tiêu có nguồn (M10)</h1>
  <IndicatorImportManager/>
 </main>;
}
