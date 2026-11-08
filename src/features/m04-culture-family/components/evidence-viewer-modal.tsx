"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, ExternalLink, AlertCircle, ShieldAlert } from "lucide-react";
import type { CultureSubmissionDTO } from "../types";

export interface EvidenceViewerModalProps {
  readonly submission: CultureSubmissionDTO | null;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onRequestSupplementation: (submissionId: string, comment: string) => Promise<void>;
  readonly userCanEvaluate: boolean;
}

export function EvidenceViewerModal({
  submission,
  isOpen,
  onClose,
  onRequestSupplementation,
  userCanEvaluate,
}: EvidenceViewerModalProps) {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCommentBox, setShowCommentBox] = useState(false);

  if (!submission) return null;

  const handleSendSupplementation = async () => {
    if (!comment.trim() || comment.trim().length < 5) {
      alert("Vui lòng nhập nhận xét/lý do yêu cầu bổ sung từ 5 ký tự trở lên.");
      return;
    }
    try {
      setIsSubmitting(true);
      await onRequestSupplementation(submission.id, comment);
      setComment("");
      setShowCommentBox(false);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi không xác định";
      alert(`Không thể gửi yêu cầu bổ sung: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Hồ sơ & Tài liệu minh chứng bình xét"
      description={`Chủ hộ: ${submission.householdHeadName} (${submission.hamletName || submission.hamletId})`}
    >
      <div className="space-y-4 text-sm">
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
          <div>
            <div className="text-xs text-slate-500">Mã hộ gia đình:</div>
            <div className="font-semibold text-slate-800">{submission.householdId}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">Trạng thái:</div>
            <Badge
              variant={
                submission.status === "DAT"
                  ? "success"
                  : submission.status === "KHONG_DAT"
                  ? "danger"
                  : submission.status === "THIEU_MINH_CHUNG"
                  ? "warning"
                  : "info"
              }
            >
              {submission.status}
            </Badge>
          </div>
        </div>

        <div>
          <div className="font-medium text-slate-700 mb-1 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-indigo-600" />
            Đường dẫn lưu trữ Private Storage:
          </div>
          {submission.hasEvidence && submission.evidencePath ? (
            <div className="p-2.5 rounded-md bg-slate-900 text-slate-100 font-mono text-xs break-all">
              {submission.evidencePath}
            </div>
          ) : (
            <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Chưa đính kèm tệp minh chứng. Hồ sơ hiện mang trạng thái THIẾU MINH CHỨNG.</span>
            </div>
          )}
        </div>

        {submission.reviewerComment && (
          <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
            <div className="text-xs font-medium text-slate-500 mb-1">Ý kiến cán bộ rà soát:</div>
            <div className="text-xs text-slate-700 italic">&ldquo;{submission.reviewerComment}&rdquo;</div>
          </div>
        )}

        <div className="p-3 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <span>
            Hồ sơ được bảo vệ qua chính sách Supabase Private Storage RLS. Chỉ cán bộ có thẩm quyền mới có thể truy cập qua URL ký số tạm thời (TTL &le; 60s).
          </span>
        </div>

        {userCanEvaluate && (
          <div className="pt-2 border-t border-slate-200">
            {!showCommentBox ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-amber-700 border-amber-300 hover:bg-amber-50"
                onClick={() => setShowCommentBox(true)}
              >
                Trả hồ sơ yêu cầu bổ sung minh chứng
              </Button>
            ) : (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700">
                  Lý do / Hướng dẫn bổ sung tài liệu (bắt buộc):
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Ví dụ: Thiếu biên bản họp bình xét của xóm hoặc giấy khen thành tích..."
                  className="w-full h-20 p-2 text-xs border rounded-md border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCommentBox(false)}
                    disabled={isSubmitting}
                  >
                    Hủy
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSendSupplementation}
                    disabled={isSubmitting}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    {isSubmitting ? "Đang gửi..." : "Xác nhận yêu cầu"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
