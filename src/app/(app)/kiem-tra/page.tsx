import { getRequestContext } from "@/lib/auth/request-context";
import { assertPermission } from "@/lib/authorization/assert-permission";
import { getInspectionWorkspace } from "@/features/m08-inspections/server/ph03-queries";
import { InspectionWorkspace } from "@/features/m08-inspections/components/ph03-inspection-workspace";

export const dynamic="force-dynamic";
export default async function KiemTraPage(){
 const ctx=await getRequestContext();
 assertPermission(ctx,"m08:inspection:read");
 const data=await getInspectionWorkspace(ctx);
 return <main className="space-y-5">
  <h1 className="text-2xl font-bold">Kiểm tra, kiến nghị và khắc phục</h1>
  <InspectionWorkspace {...data} canWrite={ctx.permissions.includes("m08:inspection:write")}
   canReview={ctx.permissions.includes("m08:inspection:review")}/>
 </main>;
}
