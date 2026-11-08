import React from "react";
import { getRequestContext } from "@/lib/auth/request-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, FileText, CheckCircle2, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function GiaDinhVanHoaPage() {
  const ctx = await getRequestContext();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Bình xét Gia đình văn hóa
          </h1>
          <p className="text-sm text-gray-500">
            Đợt đánh giá thường niên theo Bộ quy tắc TN-DEMO-ILLUSTRATIVE-01
          </p>
        </div>
        <div className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-md font-medium">
          [MÔ PHỎNG DEMO — KHÔNG CÓ GIÁ TRỊ PHÁP LÝ]
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Tổng hồ sơ đề xuất</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">42</div>
            <p className="text-xs text-gray-500 mt-1">Từ các xóm gửi lên</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Đủ điều kiện (Đạt)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">38</div>
            <p className="text-xs text-gray-500 mt-1">Điểm $\ge$ 85 & đủ minh chứng</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Thiếu minh chứng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">3</div>
            <p className="text-xs text-gray-500 mt-1">Yêu cầu bổ sung tài liệu</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Không đạt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">1</div>
            <p className="text-xs text-gray-500 mt-1">Vi phạm tiêu chí bắt buộc</p>
          </CardContent>
        </Card>
      </div>

      <div className="p-8 text-center border rounded-lg bg-white shadow-sm space-y-3">
        <Award className="w-12 h-12 text-yellow-500 mx-auto" />
        <h3 className="text-base font-semibold text-gray-800">
          Danh sách hồ sơ bình xét Gia đình văn hóa đợt 2026
        </h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Các hồ sơ được trích xuất trực tiếp từ cơ sở dữ liệu PostgreSQL qua hệ thống RLS cô lập theo đơn vị xã.
        </p>
        <div className="pt-2">
          <Button variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-1.5" />
            Xem tiêu chí Rule Pack TN-DEMO-ILLUSTRATIVE-01
          </Button>
        </div>
      </div>
    </div>
  );
}
