"use client";
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { ReportSnapshotDTO } from "../types";
import { metricNameLabel, metricValueLabel, qualityStatusLabel, reportStatusLabel } from "../types/presentation";
import { AsyncExportButton } from "./async-export-button";
export function SnapshotDetailsCard({snapshot,canExport=false}:{readonly snapshot:ReportSnapshotDTO|null;readonly isLiveView?:boolean;readonly canExport?:boolean}){
 const [copied,setCopied]=useState(false);
 if(!snapshot) return <div className="rounded-lg border bg-white p-8 text-sm text-slate-600">
  Chưa chọn báo cáo. Hãy tạo bản nháp từ dữ liệu CSDL; không có chỉ tiêu mẫu được thay thế cho dữ liệu thật.</div>;
 const metrics=(snapshot.payload.metrics ?? {}) as Record<string,unknown>;
 const quality=(snapshot.payload.quality ?? {}) as Record<string,{value:unknown;status:string}>;
 return <section className="space-y-4">
  <div className="rounded-lg border bg-white p-5 space-y-4">
   <div className="flex flex-wrap justify-between gap-3">
    <div><h2 className="text-lg font-bold text-slate-900">{snapshot.title}</h2>
     <p className="text-xs text-slate-500">{snapshot.reportCode} • {snapshot.period} • Bản {snapshot.revision}
      {" • "}Trạng thái: {reportStatusLabel(snapshot.status)}</p>
    </div>
    <Badge variant={snapshot.isFinalized?"success":"info"}>{snapshot.isFinalized?"ĐÃ CHỐT NỘI BỘ":"CHƯA CHỐT"}</Badge>
   </div>
   <p className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded p-2">
    {snapshot.watermark}. Không phải chữ ký số, quyết định hoặc báo cáo đã phát hành.</p>
   <div className="rounded bg-slate-900 p-3 text-slate-100 text-xs">
    <div className="flex justify-between gap-2"><span>SHA-256 ({snapshot.hashAlgorithm})</span>
     <button onClick={async()=>{try{await navigator.clipboard.writeText(snapshot.sha256);setCopied(true);}catch{setCopied(false);}}}
       className="text-indigo-200 underline">{copied?"Đã sao chép":"Sao chép"}</button></div>
    <div className="font-mono break-all mt-2 text-emerald-300">{snapshot.sha256}</div>
   </div>
   {canExport&&<div className="flex gap-2 flex-wrap text-xs">
    {(["PDF","XLSX","JSON"] as const).map(format=><a key={format}
      className="rounded border border-slate-200 px-3 py-1.5 text-indigo-700 hover:bg-slate-50"
      href={"/api/exports/reports/"+snapshot.id+"?format="+format}>Tải {format}</a>)}
   </div>}
   {canExport&&<AsyncExportButton snapshotId={snapshot.id}/>}
  </div>
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
   {Object.entries(metrics).map(([key,value])=><div key={key} className="rounded-lg border bg-white p-4">
    <div className="text-xs text-slate-500">{metricNameLabel(key)}</div>
    <div className="text-2xl font-semibold tabular-nums">{metricValueLabel(value)}</div>
   </div>)}
   {Object.entries(quality).map(([key,detail])=><div key={key} className="rounded-lg border bg-amber-50 p-4">
    <div className="text-xs text-slate-600">{metricNameLabel(key)}</div>
    <div className="text-lg font-medium">{detail?.value===null?"Chưa có số liệu":String(detail?.value??"Chưa có số liệu")}</div>
    <div className="text-xs text-amber-800">{qualityStatusLabel(detail?.status??"NOT_REPORTED")}</div>
   </div>)}
  </div>
  <p className="text-xs text-slate-500">Nguồn: {String(snapshot.payload.sourceType??"Không rõ")} •
   Số contributor tại thời điểm chụp: {String(snapshot.payload.sourceRecords??"Không rõ")} •
   Phạm vi kỳ: {snapshot.period}. Sửa dữ liệu nguồn không làm thay đổi snapshot đã tạo.</p>
 </section>;
}
