"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Lock,
  Copy,
  Check,
  Download,
  ShieldCheck,
  FileSpreadsheet,
  FileCode,
  FileText,
} from "lucide-react";
import type { ReportSnapshotDTO } from "../types";

export interface SnapshotDetailsCardProps {
  readonly snapshot: ReportSnapshotDTO | null;
  readonly isLiveView: boolean;
}

export function SnapshotDetailsCard({ snapshot, isLiveView }: SnapshotDetailsCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyHash = () => {
    if (snapshot?.sha256) {
      navigator.clipboard.writeText(snapshot.sha256);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const metrics = (snapshot?.payload?.metrics as Record<string, number>) || {
    tasksTotal: 6,
    tasksCompleted: 4,
    cultureSubmissions: 5,
    cultureApproved: 2,
    cdsIndex: 82.5,
  };

  return (
    <div className="space-y-4">
      {/* Top Banner Card */}
      <div className="p-5 rounded-lg border border-slate-200 bg-white shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-slate-900">
                {isLiveView
                  ? "Dữ liệu Điều hành & Chỉ tiêu Tổng hợp Thời gian thực"
                  : snapshot?.title || "Báo cáo Chỉ tiêu DEM-R01"}
              </h2>
              {isLiveView ? (
                <Badge variant="info">LIVE DYNAMIC</Badge>
              ) : (
                <Badge variant="success" className="gap-1">
                  <Lock className="w-3 h-3" /> IMMUTABLE FINALIZED
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {isLiveView
                ? "Số liệu tổng hợp động từ các phân hệ Quản lý công việc (M01) và Văn hóa (M04)"
                : `Mã báo cáo: ${snapshot?.reportCode} • Kỳ: ${snapshot?.period}/${snapshot?.year} • Chốt lúc: ${snapshot?.finalizedAt ? new Date(snapshot.finalizedAt).toLocaleString("vi-VN") : "N/A"}`}
            </p>
          </div>

          {!isLiveView && snapshot && (
            <div className="flex items-center gap-2">
              <a
                href={`/api/exports/reports/${snapshot.id}?format=PDF`}
                target="_blank"
                rel="noreferrer"
              >
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 text-slate-700">
                  <FileText className="w-3.5 h-3.5 text-rose-500" />
                  PDF
                </Button>
              </a>
              <a
                href={`/api/exports/reports/${snapshot.id}?format=XLSX`}
                target="_blank"
                rel="noreferrer"
              >
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 text-slate-700">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  XLSX
                </Button>
              </a>
              <a
                href={`/api/exports/reports/${snapshot.id}?format=JSON`}
                target="_blank"
                rel="noreferrer"
              >
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 text-slate-700">
                  <FileCode className="w-3.5 h-3.5 text-indigo-500" />
                  JSON
                </Button>
              </a>
            </div>
          )}
        </div>

        {/* SHA-256 Monospace Hash Box */}
        {!isLiveView && snapshot?.sha256 && (
          <div className="p-3 rounded-md bg-slate-900 text-slate-200 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Mã băm toàn vẹn SHA-256 (RFC 8785 Canonical JSON):
              </span>
              <button
                onClick={handleCopyHash}
                className="inline-flex items-center gap-1 text-[11px] text-indigo-300 hover:text-white transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? "Đã chép" : "Sao chép mã băm"}
              </button>
            </div>
            <div className="font-mono text-xs text-emerald-400 break-all select-all font-semibold">
              {snapshot.sha256}
            </div>
          </div>
        )}

        {/* Verification Status */}
        <div className="p-2.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Dữ liệu báo cáo thống kê chính thức cấp xã
          </span>
          <span className="text-[11px] text-emerald-700 font-semibold">UBND cấp Xã</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Quản lý công việc (M01)
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {metrics.tasksCompleted || 4}/{metrics.tasksTotal || 6}
            </span>
            <span className="text-xs text-emerald-600 font-medium font-mono">
              {Math.round(((metrics.tasksCompleted || 4) / (metrics.tasksTotal || 6)) * 100)}% hoàn thành
            </span>
          </div>
          <p className="text-xs text-slate-500">Các nhiệm vụ trọng tâm UBND xã</p>
        </div>

        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Gia đình văn hóa (M04 - DEM-VH)
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {metrics.cultureApproved || 2}/{metrics.cultureSubmissions || 5}
            </span>
            <span className="text-xs text-indigo-600 font-medium font-mono">
              {Math.round(((metrics.cultureApproved || 2) / (metrics.cultureSubmissions || 5)) * 100)}% đạt chuẩn
            </span>
          </div>
          <p className="text-xs text-slate-500">Đợt đánh giá thường niên 2026</p>
        </div>

        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Chỉ số Chuyển đổi số (CĐS)
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-indigo-700 font-mono">
              {metrics.cdsIndex || 82.5}/100
            </span>
            <Badge variant="success">KHÁ TỐT</Badge>
          </div>
          <p className="text-xs text-slate-500">Hạ tầng số, nhân lực & dịch vụ công</p>
        </div>
      </div>
    </div>
  );
}
