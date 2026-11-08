import { getRequestContext } from "@/lib/auth/request-context";
import { assertRoutePermission } from "@/config/navigation";
import { getHamletCultureSummary } from "@/features/m04-culture-family/server/queries";
import { HamletCultureTable } from "@/features/m04-culture-family/components/hamlet-culture-table";

export const dynamic = "force-dynamic";

export default async function ThonVanHoaPage() {
  const ctx = await getRequestContext();
  assertRoutePermission("/van-hoa/thon-van-hoa", ctx.permissions, ctx.roles);
  const hamlets = await getHamletCultureSummary(ctx);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Bình xét Thôn / Xóm văn hóa
          </h1>
          <p className="text-sm text-gray-500">
            Đợt đánh giá danh hiệu Thôn / Xóm văn hóa năm 2026
          </p>
        </div>
        <div className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Niên độ đánh giá 2026
        </div>
      </div>
      <HamletCultureTable items={hamlets} />
    </div>
  );
}
