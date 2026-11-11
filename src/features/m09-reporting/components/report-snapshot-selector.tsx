"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import type { ReportSnapshotDTO } from "../types";
import { reportStatusLabel } from "../types/presentation";
export interface ReportSnapshotSelectorProps {
 readonly snapshots:ReportSnapshotDTO[];readonly selectedId:string|null;
 readonly onSelectSnapshot:(id:string|null)=>void;
 readonly onOpenFinalizeModal:()=>void;readonly canFinalize:boolean;
}
export function ReportSnapshotSelector({snapshots,selectedId,onSelectSnapshot,onOpenFinalizeModal,canFinalize}:ReportSnapshotSelectorProps){
 return <div className="flex flex-wrap items-center gap-3 bg-white p-4 border rounded-lg">
  <label className="text-sm font-medium" htmlFor="report-snapshot-select">Bản báo cáo</label>
  <select id="report-snapshot-select" value={selectedId??""} onChange={e=>onSelectSnapshot(e.target.value||null)}
   className="min-w-64 flex-1 rounded border border-slate-300 p-2 text-sm">
   <option value="">Chưa chọn báo cáo</option>
   {snapshots.map(s=><option key={s.id} value={s.id}>{s.reportCode} · {s.period} · Bản {s.revision} · {reportStatusLabel(s.status)}</option>)}
  </select>
  {canFinalize&&<Button size="sm" onClick={onOpenFinalizeModal}>Tạo bản nháp mới</Button>}
 </div>;
}
