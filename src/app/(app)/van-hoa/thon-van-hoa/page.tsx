import React from "react";
import { getRequestContext } from "@/lib/auth/request-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Landmark, FileText, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ThonVanHoaPage() {
  const ctx = await getRequestContext();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Bình xét Thôn / Xóm văn hóa
          </h1>
          <p className="text-sm text-gray-500">
            Đợt đánh giá danh hiệu Làng văn hóa / Thôn văn hóa năm 2026
          </p>
        </div>
        <div className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-md font-medium">
          [MÔ PHỎNG DEMO — KHÔNG CÓ GIÁ TRỊ PHÁP LÝ]
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Tổng số thôn/xóm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">3</div>
            <p className="text-xs text-gray-500 mt-1">Xóm A1, Xóm A2, Xóm A3</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Đạt danh hiệu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">3</div>
            <p className="text-xs text-gray-500 mt-1">100% thôn đạt chuẩn văn hóa</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Tỷ lệ Gia đình văn hóa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">90.5%</div>
            <p className="text-xs text-gray-500 mt-1">Vượt chỉ tiêu tối thiểu</p>
          </CardContent>
        </Card>
      </div>

      <div className="p-8 text-center border rounded-lg bg-white shadow-sm space-y-3">
        <Landmark className="w-12 h-12 text-indigo-500 mx-auto" />
        <h3 className="text-base font-semibold text-gray-800">
          Danh mục Thôn / Xóm văn hóa đã được phê duyệt
        </h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Quyết định công nhận dựa trên kết quả thẩm tra thực tế và minh chứng lưu trữ tại hệ thống Private Storage.
        </p>
      </div>
    </div>
  );
}
