import { getRequestContext } from "@/lib/auth/request-context";
import { assertRoutePermission } from "@/config/navigation";
import { getWorkItems } from "@/features/m01-core-work/server/queries";
import { WorkItemManager } from "@/features/m01-core-work/components/work-item-manager";

export const dynamic = "force-dynamic";

export default async function CongViecPage() {
  const ctx = await getRequestContext();
  assertRoutePermission("/cong-viec", ctx.permissions, ctx.roles);

  const workItems = await getWorkItems(ctx);

  return (
    <WorkItemManager
      initialItems={workItems}
      userPermissions={ctx.permissions}
      userRoles={ctx.roles}
    />
  );
}
