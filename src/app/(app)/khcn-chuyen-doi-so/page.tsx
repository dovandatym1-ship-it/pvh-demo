import { getRequestContext } from "@/lib/auth/request-context";
import { assertPermission } from "@/lib/authorization/assert-permission";
import { getDigitalWorkspace } from "@/features/m05-science-digital/server/ph03-queries";
import { DigitalWorkspace } from "@/features/m05-science-digital/components/ph03-digital-workspace";

export const dynamic="force-dynamic";
export default async function KhcnChuyenDoiSoPage(){
 const ctx=await getRequestContext();
 assertPermission(ctx,"m05:digital:read");
 const data=await getDigitalWorkspace(ctx);
 return <main className="space-y-5">
  <h1 className="text-2xl font-bold">Kế hoạch và chỉ tiêu chuyển đổi số</h1>
  <DigitalWorkspace {...data} canWrite={ctx.permissions.includes("m05:digital:write")}
   canReview={ctx.permissions.includes("m05:digital:review")}/>
 </main>;
}
