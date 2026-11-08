"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit3, FileText, AlertCircle } from "lucide-react";
import type { CultureSubmissionDTO, SubmissionStatus } from "../types";

export interface CultureSubmissionsTableProps {
  readonly submissions: CultureSubmissionDTO[];
  readonly onOpenEvidence: (sub: CultureSubmissionDTO) => void;
  readonly onOpenEvaluation: (sub: CultureSubmissionDTO) => void;
  readonly userCanEvaluate: boolean;
}

export function CultureSubmissionsTable({
  submissions,
  onOpenEvidence,
  onOpenEvaluation,
  userCanEvaluate,
}: CultureSubmissionsTableProps) {
  const getStatusBadge = (status: SubmissionStatus) => {
    switch (status) {
      case "DAT":
        return <Badge variant="success">ĐẠT CHUẨN</Badge>;
      case "CHO_RA_SOAT":
        return <Badge variant="info">CHỜ RÀ SOÁT</Badge>;
      case "THIEU_MINH_CHUNG":
        return <Badge variant="warning">THIẾU MINH CHỨNG</Badge>;
      case "KHONG_DAT":
        return <Badge variant="danger">KHÔNG ĐẠT</Badge>;
      case "YEU_CAU_BO_SUNG":
        return (
          <span className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
            YÊU CẦU BỔ SUNG
          </span>
        );
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  if (submissions.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-lg border border-slate-200">
        <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <h4 className="text-sm font-semibold text-slate-700">Chưa có hồ sơ bình xét nào</h4>
        <p className="text-xs text-slate-500 mt-1">
          Khu vực đã chọn hiện chưa nộp hồ sơ hoặc dữ liệu đang trong quá trình tổng hợp.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
          <tr>
            <th className="px-4 py-3">Mã hộ</th>
            <th className="px-4 py-3">Chủ hộ gia đình</th>
            <th className="px-4 py-3">Thôn / Xóm</th>
            <th className="px-4 py-3 text-center">Điểm số</th>
            <th className="px-4 py-3">Minh chứng</th>
            <th className="px-4 py-3">Trạng thái</th>
            <th className="px-4 py-3 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {submissions.map((sub) => (
            <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-4 py-3 font-mono text-slate-600 font-medium">{sub.householdId}</td>
              <td className="px-4 py-3 font-medium text-slate-900">{sub.householdHeadName}</td>
              <td className="px-4 py-3 text-slate-600">{sub.hamletName || sub.hamletId}</td>
              <td className="px-4 py-3 text-center font-bold font-mono text-slate-800">
                {sub.score}/100
              </td>
              <td className="px-4 py-3">
                {sub.hasEvidence ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                    <FileText className="w-3.5 h-3.5" /> Có tệp đính kèm
                  </span>
                ) : (
                  <span className="text-amber-600 italic">Chưa có file</span>
                )}
              </td>
              <td className="px-4 py-3">{getStatusBadge(sub.status)}</td>
              <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenEvidence(sub)}
                  className="h-7 text-xs px-2 text-slate-700"
                >
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  Minh chứng
                </Button>
                {userCanEvaluate && (
                  <Button
                    size="sm"
                    onClick={() => onOpenEvaluation(sub)}
                    className="h-7 text-xs px-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Edit3 className="w-3.5 h-3.5 mr-1" />
                    Chấm điểm
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
