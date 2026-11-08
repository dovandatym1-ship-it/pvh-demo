import { getRequestContext } from "@/lib/auth/request-context";
import { assertPermission } from "@/lib/authorization/assert-permission";
import { getCultureWorkspace } from "@/features/m04-culture-family/server/ph03-queries";
import { CultureWorkspace } from "@/features/m04-culture-family/components/ph03-culture-workspace";

export const dynamic="force-dynamic";
export default async function GiaDinhVanHoaPage(){
  const ctx=await getRequestContext();
  assertPermission(ctx,"m04:culture:read");
  const data=await getCultureWorkspace(ctx,"GIA_DINH");
  return <main className="space-y-5">
    <h1 className="text-2xl font-bold">Bình xét Gia đình văn hóa</h1>
    <CultureWorkspace kind="GIA_DINH" {...data}
      canSubmit={ctx.permissions.includes("m04:culture:create")}
      canReview={ctx.permissions.includes("m04:culture:evaluate")}/>
  </main>;
}
