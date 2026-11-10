import React from "react";
import { getRequestContext } from "@/lib/auth/request-context";
import { assertCanViewFaith } from "@/features/m07-ethnicity-faith/server/policy";
import { getReligiousEstablishments, getReputablePersons, getReligiousHamlets, getReligiousEvents } from "@/features/m07-ethnicity-faith/server/queries";
import { EstablishmentTable } from "@/features/m07-ethnicity-faith/components/establishment-table";
import { ReputablePersonTable } from "@/features/m07-ethnicity-faith/components/reputable-person-table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Compass, Users, Landmark, HeartHandshake } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DanTocTonGiaoPage() {
  const ctx = await getRequestContext();
  assertCanViewFaith(ctx);
  const [establishments, reputablePersons, hamlets, events] = await Promise.all([
    getReligiousEstablishments(ctx), getReputablePersons(ctx), getReligiousHamlets(ctx), getReligiousEvents(ctx),
  ]);

  const totalFollowers = establishments.reduce((sum, item) => sum + item.followerCount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Công tác dân tộc và tôn giáo
        </h1>
        <p className="text-sm text-gray-500">
          Quản lý cơ sở tín ngưỡng, điểm nhóm sinh hoạt và chính sách đồng bào dân tộc thiểu số trên địa bàn xã
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-600">Cơ sở tín ngưỡng, tôn giáo</CardTitle>
            <Landmark className="w-4 h-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{establishments.length}</div>
            <p className="text-xs text-gray-500 mt-1">Hồ sơ đang được quản lý, chưa suy ra đã được phê duyệt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-600">Tổng số tín đồ</CardTitle>
            <Users className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalFollowers}</div>
            <p className="text-xs text-gray-500 mt-1">Số liệu kê khai trong hồ sơ, chưa đối soát nguồn độc lập</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-600">Người có uy tín trong đồng bào dân tộc thiểu số</CardTitle>
            <HeartHandshake className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{reputablePersons.length}</div>
            <p className="text-xs text-gray-500 mt-1">Tổng số hồ sơ trong danh sách, không đồng nghĩa đang hưởng chính sách</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Danh mục cơ sở tín ngưỡng và điểm nhóm tôn giáo</h2>
        <EstablishmentTable items={establishments} events={events} hamlets={hamlets} userPermissions={ctx.permissions} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Danh sách người có uy tín trong đồng bào dân tộc thiểu số</h2>
        <ReputablePersonTable items={reputablePersons} userPermissions={ctx.permissions} />
      </div>
    </div>
  );
}
