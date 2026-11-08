"use client";

import React, { useState } from "react";
import { HamletFilter } from "./hamlet-filter";
import { CultureStatsCards } from "./culture-stats-cards";
import { CultureSubmissionsTable } from "./culture-submissions-table";
import { EvidenceViewerModal } from "./evidence-viewer-modal";
import { EvaluationModal } from "./evaluation-modal";
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
  const [evidenceSub, setEvidenceSub] = useState<CultureSubmissionDTO | null>(null);
  const [evalSub, setEvalSub] = useState<CultureSubmissionDTO | null>(null);

  const userCanEvaluate =
    userPermissions.includes("m04:culture:evaluate") ||
    userPermissions.includes("m04:full") ||
    userPermissions.includes("m00:admin");

  const filteredSubmissions =
    selectedHamlet === "ALL"
      ? submissions
      : submissions.filter((s) => s.hamletId === selectedHamlet);

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

    if (!res.ok) {
      throw new Error(res.error.message);
    }

    setSubmissions((prev) =>
      prev.map((s) => (s.id === submissionId ? res.data : s))
    );
  };

  const handleRequestSupplementation = async (
    submissionId: string,
    comment: string
  ) => {
    const res = await requestSupplementationAction({
      submissionId,
      reviewerComment: comment,
    });

    if (!res.ok) {
      throw new Error(res.error.message);
    }

    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === submissionId
          ? {
              ...s,
              status: "YEU_CAU_BO_SUNG",
              reviewerComment: comment,
            }
          : s
      )
    );
  };

  return (
    <div className="space-y-6">
      <CultureStatsCards submissions={submissions} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg border border-slate-200">
        <HamletFilter
          selectedHamlet={selectedHamlet}
          onSelectHamlet={setSelectedHamlet}
        />
        <div className="text-xs text-slate-500">
          Hiển thị <span className="font-semibold text-slate-800">{filteredSubmissions.length}</span> hồ sơ
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
    </div>
  );
}
