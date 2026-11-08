import { getRequestContext } from "@/lib/auth/request-context";
import { assertRoutePermission } from "@/config/navigation";
import { getCultureSubmissions } from "@/features/m04-culture-family/server/queries";
import { CultureDossierManager } from "@/features/m04-culture-family/components/culture-dossier-manager";

export const dynamic = "force-dynamic";

export default async function GiaDinhVanHoaPage() {
  const ctx = await getRequestContext();
  assertRoutePermission("/van-hoa/gia-dinh-van-hoa", ctx.permissions, ctx.roles);
  const submissions = await getCultureSubmissions(ctx);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Bình xét Danh hiệu Gia đình văn hóa
          </h1>
          <p className="text-sm text-gray-500">
            Đợt đánh giá thường niên theo Bộ tiêu chí Gia đình văn hóa cấp xã
          </p>
        </div>
        <div className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Niên độ đánh giá 2026
        </div>
      </div>
      <CultureDossierManager initialSubmissions={submissions} userPermissions={ctx.permissions} />
    </div>
  );
}
