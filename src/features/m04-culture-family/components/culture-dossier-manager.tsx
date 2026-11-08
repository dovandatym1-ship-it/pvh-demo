"use client";

import React, { useState, useMemo } from "react";
import { Plus, Search, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HamletFilter } from "./hamlet-filter";
import { CultureStatsCards } from "./culture-stats-cards";
import { CultureSubmissionsTable } from "./culture-submissions-table";
import { EvidenceViewerModal } from "./evidence-viewer-modal";
import { EvaluationModal } from "./evaluation-modal";
import { ProposeHouseholdModal } from "./propose-household-modal";
import {
  evaluateSubmissionAction,
  requestSupplementationAction,
} from "../server/actions";
import type { CultureSubmissionDTO, SubmissionStatus } from "../types";

export interface CultureDossierManagerProps {
  readonly initialSubmissions: CultureSubmissionDTO[];
  readonly userPermissions: readonly string[];
}

export function CultureDossierManager({
  initialSubmissions,
  userPermissions,
}: CultureDossierManagerProps) {
  const [submissions, setSubmissions] = useState<CultureSubmissionDTO[]>(initialSubmissions);
  const [selectedHamlet, setSelectedHamlet] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [evidenceSub, setEvidenceSub] = useState<CultureSubmissionDTO | null>(null);
  const [evalSub, setEvalSub] = useState<CultureSubmissionDTO | null>(null);
  const [isProposeOpen, setIsProposeOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const userCanEvaluate =
    userPermissions.includes("m04:culture:evaluate") ||
    userPermissions.includes("m04:full") ||
    userPermissions.includes("m00:admin");

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      if (selectedHamlet !== "ALL" && s.hamletId !== selectedHamlet) return false;
      if (selectedStatus !== "ALL" && s.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!s.householdHeadName.toLowerCase().includes(q) && !(s.householdId?.toLowerCase().includes(q) ?? false)) {
          return false;
        }
      }
      return true;
    });
  }, [submissions, selectedHamlet, selectedStatus, searchQuery]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleSaveEvaluation = async (
    submissionId: string,
    status: SubmissionStatus,
    score: number,
    comment?: string,
    evidencePath?: string
  ) => {
    const res = await evaluateSubmissionAction({
      submissionId,
      status,
      score,
      reviewerComment: comment,
      evidencePath,
    });

    if (!res.ok) throw new Error(res.error.message);

    setSubmissions((prev) => prev.map((s) => (s.id === submissionId ? res.data : s)));
    showToast("Đã cập nhật đánh giá hồ sơ thành công!");
  };

  const handleRequestSupplementation = async (submissionId: string, comment: string) => {
    const res = await requestSupplementationAction({ submissionId, reviewerComment: comment });
    if (!res.ok) throw new Error(res.error.message);

    setSubmissions((prev) =>
      prev.map((s) => (s.id === submissionId ? { ...s, status: "YEU_CAU_BO_SUNG", reviewerComment: comment } : s))
    );
    showToast("Đã gửi yêu cầu bổ sung minh chứng tới cơ sở xóm!");
  };

  return (
    <div className="space-y-6">
      {successToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-700 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{successToast}</span>
        </div>
      )}

      <CultureStatsCards submissions={submissions} />

      <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm kiếm chủ hộ hoặc mã hộ gia đình..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <HamletFilter selectedHamlet={selectedHamlet} onSelectHamlet={setSelectedHamlet} />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-700"
            >
              <option value="ALL">Tất cả kết quả</option>
              <option value="CHO_RA_SOAT">Chờ rà soát</option>
              <option value="DAT">Đạt tiêu chuẩn</option>
              <option value="KHONG_DAT">Không đạt</option>
              <option value="YEU_CAU_BO_SUNG">Yêu cầu bổ sung</option>
              <option value="THIEU_MINH_CHUNG">Thiếu minh chứng</option>
            </select>
            <Button variant="primary" size="sm" onClick={() => setIsProposeOpen(true)} className="flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              <span>Đề xuất hồ sơ</span>
            </Button>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
          <span>
            Hiển thị <span className="font-semibold text-slate-800">{filteredSubmissions.length}</span> / {submissions.length} hồ sơ bình xét
          </span>
          <span className="text-slate-400">Niên độ đánh giá: 2026</span>
        </div>
      </div>

      <CultureSubmissionsTable
        submissions={filteredSubmissions}
        onOpenEvidence={setEvidenceSub}
        onOpenEvaluation={setEvalSub}
        userCanEvaluate={userCanEvaluate}
      />

      <EvidenceViewerModal
        submission={evidenceSub}
        isOpen={!!evidenceSub}
        onClose={() => setEvidenceSub(null)}
        onRequestSupplementation={handleRequestSupplementation}
        userCanEvaluate={userCanEvaluate}
      />

      <EvaluationModal
        submission={evalSub}
        isOpen={!!evalSub}
        onClose={() => setEvalSub(null)}
        onSaveEvaluation={handleSaveEvaluation}
      />

      <ProposeHouseholdModal
        isOpen={isProposeOpen}
        onClose={() => setIsProposeOpen(false)}
        onSuccess={(newSub) => {
          setSubmissions((prev) => [newSub, ...prev]);
          showToast("Đã lập hồ sơ đề xuất Gia đình văn hóa mới thành công!");
        }}
      />
    </div>
  );
}
