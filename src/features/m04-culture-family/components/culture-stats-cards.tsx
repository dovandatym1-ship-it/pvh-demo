"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import type { CultureSubmissionDTO } from "../types";

export interface CultureStatsCardsProps {
  readonly submissions: CultureSubmissionDTO[];
}

export function CultureStatsCards({ submissions }: CultureStatsCardsProps) {
  const total = submissions.length;
  const passed = submissions.filter((s) => s.status === "DAT").length;
  const missing = submissions.filter((s) => s.status === "THIEU_MINH_CHUNG").length;
  const failed = submissions.filter((s) => s.status === "KHONG_DAT").length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Tổng hồ sơ đề xuất
          </CardTitle>
          <Award className="w-4 h-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">{total}</div>
          <p className="text-xs text-slate-500 mt-1">Từ các xóm chuyển lên</p>
        </CardContent>
      </Card>

      <Card className="border-emerald-200/60 shadow-sm bg-emerald-50/20">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xs font-medium text-emerald-700 uppercase tracking-wider">
            Đạt theo quy tắc thử nghiệm
          </CardTitle>
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-700">{passed}</div>
          <p className="text-xs text-emerald-600 mt-1">Phân loại theo quy tắc và minh chứng thử nghiệm</p>
        </CardContent>
      </Card>

      <Card className="border-amber-200/60 shadow-sm bg-amber-50/20">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xs font-medium text-amber-700 uppercase tracking-wider">
            Thiếu minh chứng
          </CardTitle>
          <AlertTriangle className="w-4 h-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-700">{missing}</div>
          <p className="text-xs text-amber-600 mt-1">Cần bổ sung tài liệu</p>
        </CardContent>
      </Card>

      <Card className="border-rose-200/60 shadow-sm bg-rose-50/20">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xs font-medium text-rose-700 uppercase tracking-wider">
            Chưa đạt theo quy tắc thử nghiệm
          </CardTitle>
          <XCircle className="w-4 h-4 text-rose-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-rose-700">{failed}</div>
          <p className="text-xs text-rose-600 mt-1">Chưa đạt ngưỡng đánh giá thử nghiệm</p>
        </CardContent>
      </Card>
    </div>
  );
}
