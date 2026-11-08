"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CultureSubmissionDTO, SubmissionStatus } from "../types";

export interface EvaluationModalProps {
  readonly submission: CultureSubmissionDTO | null;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSaveEvaluation: (
    submissionId: string,
    status: SubmissionStatus,
    score: number,
    comment?: string,
    evidencePath?: string
  ) => Promise<void>;
}

export function EvaluationModal({
  submission,
  isOpen,
  onClose,
  onSaveEvaluation,
}: EvaluationModalProps) {
  const [crit1, setCrit1] = useState<number>(28);
  const [crit2, setCrit2] = useState<number>(32);
  const [crit3, setCrit3] = useState<number>(30);
  const [comment, setComment] = useState("");
  const [overrideStatus, setOverrideStatus] = useState<SubmissionStatus | "AUTO">("AUTO");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (submission) {
      setCrit1(28);
      setCrit2(32);
      setCrit3(Math.max(0, submission.score - 60) || 30);
      setComment(submission.reviewerComment || "");
      setOverrideStatus("AUTO");
    }
  }, [submission]);

  if (!submission) return null;

  const totalScore = Math.min(100, Math.max(0, crit1 + crit2 + crit3));

  // Determine computed status
  const computedStatus: SubmissionStatus =
    !submission.hasEvidence
      ? "THIEU_MINH_CHUNG"
      : totalScore >= 85
      ? "DAT"
      : "KHONG_DAT";

  const effectiveStatus = overrideStatus === "AUTO" ? computedStatus : overrideStatus;

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      await onSaveEvaluation(
        submission.id,
        effectiveStatus,
        totalScore,
        comment,
        submission.evidencePath || undefined
      );
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi không xác định";
      alert(`Lỗi khi lưu đánh giá: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thẩm định & Chấm điểm danh hiệu Gia đình văn hóa"
      description={`Bộ quy tắc TN-DEMO-ILLUSTRATIVE-01 (Phiên bản ${submission.rulePackVersion})`}
    >
      <div className="space-y-4 text-xs">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
          <div>
            <div className="font-semibold text-slate-800 text-sm">{submission.householdHeadName}</div>
            <div className="text-slate-500">Mã hộ: {submission.householdId} &bull; {submission.hamletName || submission.hamletId}</div>
          </div>
          <div className="text-right">
            <span className="text-slate-500 block mb-0.5">Tình trạng minh chứng:</span>
            <Badge variant={submission.hasEvidence ? "success" : "warning"}>
              {submission.hasEvidence ? "Đã có minh chứng" : "Thiếu minh chứng"}
            </Badge>
          </div>
        </div>

        {/* 3 Criteria according to Rule Pack */}
        <div className="space-y-3">
          <div className="p-2.5 border border-slate-200 rounded-md bg-white">
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium text-slate-700">
                1. Gương mẫu chấp hành chủ trương, chính sách (CRIT-01)
              </span>
              <span className="text-slate-500 font-mono">Tối đa: 30 &bull; Ngưỡng: 25</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="30"
                value={crit1}
                onChange={(e) => setCrit1(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <span className="font-bold text-slate-900 w-8 text-right font-mono">{crit1}</span>
            </div>
          </div>

          <div className="p-2.5 border border-slate-200 rounded-md bg-white">
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium text-slate-700">
                2. Kinh tế gia đình ổn định, phát triển (CRIT-02)
              </span>
              <span className="text-slate-500 font-mono">Tối đa: 35 &bull; Ngưỡng: 30</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="35"
                value={crit2}
                onChange={(e) => setCrit2(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <span className="font-bold text-slate-900 w-8 text-right font-mono">{crit2}</span>
            </div>
          </div>

          <div className="p-2.5 border border-slate-200 rounded-md bg-white">
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium text-slate-700">
                3. Xây dựng nếp sống văn hóa, gia đình hòa thuận (CRIT-03)
              </span>
              <span className="text-slate-500 font-mono">Tối đa: 35 &bull; Ngưỡng: 30</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="35"
                value={crit3}
                onChange={(e) => setCrit3(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <span className="font-bold text-slate-900 w-8 text-right font-mono">{crit3}</span>
            </div>
          </div>
        </div>

        {/* Calculation summary */}
        <div className="p-3 bg-indigo-50/50 border border-indigo-200 rounded-lg flex items-center justify-between">
          <div>
            <div className="text-xs text-indigo-900 font-medium">Tổng điểm thẩm định:</div>
            <div className="text-2xl font-bold text-indigo-700 font-mono">{totalScore}/100</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-indigo-900 font-medium mb-1">Kết luận phân loại:</div>
            <Badge
              variant={
                effectiveStatus === "DAT"
                  ? "success"
                  : effectiveStatus === "KHONG_DAT"
                  ? "danger"
                  : "warning"
              }
            >
              {effectiveStatus}
            </Badge>
          </div>
        </div>

        {/* Reviewer Comment */}
        <div>
          <label className="block text-slate-700 font-medium mb-1">
            Ý kiến nhận xét của cán bộ rà soát:
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Nhận xét tóm tắt về hộ gia đình, lý do công nhận hoặc điểm cần khắc phục..."
            className="w-full h-16 p-2 text-xs border rounded-md border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isSubmitting ? "Đang lưu..." : "Lưu kết quả thẩm định"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
