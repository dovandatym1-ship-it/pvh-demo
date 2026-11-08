"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Lock, History, PlusCircle } from "lucide-react";
import type { ReportSnapshotDTO } from "../types";

export interface ReportSnapshotSelectorProps {
  readonly snapshots: ReportSnapshotDTO[];
  readonly selectedId: string | null;
  readonly onSelectSnapshot: (id: string | null) => void;
  readonly onOpenFinalizeModal: () => void;
  readonly canFinalize: boolean;
}

export function ReportSnapshotSelector({
  snapshots,
  selectedId,
  onSelectSnapshot,
  onOpenFinalizeModal,
  canFinalize,
}: ReportSnapshotSelectorProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200">
      <div className="flex items-center gap-2 flex-wrap">
        <History className="w-4 h-4 text-slate-400" />
        <span className="text-xs font-semibold text-slate-700">Phiên bản dữ liệu:</span>
        <button
          onClick={() => onSelectSnapshot(null)}
          className={`px-3 py-1.5 text-xs rounded-md font-medium border transition-colors ${
            selectedId === null
              ? "bg-slate-900 text-white border-slate-900 shadow-sm"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
          }`}
        >
          Dữ liệu thời gian thực (Live View)
        </button>

        {snapshots.map((s) => {
          const isSelected = selectedId === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onSelectSnapshot(s.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md font-medium border transition-colors ${
                isSelected
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Lock className="w-3 h-3" />
              <span>
                {s.reportCode} - {s.period} ({s.year})
              </span>
            </button>
          );
        })}
      </div>

      {canFinalize && (
        <Button
          size="sm"
          onClick={onOpenFinalizeModal}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs shrink-0"
        >
          <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
          Chốt Snapshot Bất biến (DEM-R01)
        </Button>
      )}
    </div>
  );
}
