import { getRequestContext } from "@/lib/auth/request-context";
import { assertRoutePermission } from "@/config/navigation";
import { getWorkItems } from "@/features/m01-core-work/server/queries";
import { WorkItemManager } from "@/features/m01-core-work/components/work-item-manager";

export const dynamic = "force-dynamic";

export default async function CongViecPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ focus?: string }>;
}) {
  const ctx = await getRequestContext();
  assertRoutePermission("/cong-viec", ctx.permissions, ctx.roles);

  const [workItems, { focus }] = await Promise.all([getWorkItems(ctx), searchParams]);

  return (
    <WorkItemManager
      initialItems={workItems}
      userPermissions={ctx.permissions}
      userRoles={ctx.roles}
      focusItemId={focus}
    />
  );
}
