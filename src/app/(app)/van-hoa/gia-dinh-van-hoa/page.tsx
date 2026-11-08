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
            Bình xét Gia đình văn hóa (DEM-VH)
          </h1>
          <p className="text-sm text-gray-500">
            Đợt đánh giá thường niên theo Bộ quy tắc TN-DEMO-ILLUSTRATIVE-01
          </p>
        </div>
        <div className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-md font-medium">
          [MÔ PHỎNG DEMO — KHÔNG CÓ GIÁ TRỊ PHÁP LÝ]
        </div>
      </div>
      <CultureDossierManager initialSubmissions={submissions} userPermissions={ctx.permissions} />
    </div>
  );
}
