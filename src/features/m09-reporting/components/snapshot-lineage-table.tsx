"use client";
import React from "react";
import type { SnapshotLineageDTO } from "../types";
export function SnapshotLineageTable({lineage,expectedCount}:{
 readonly lineage:readonly SnapshotLineageDTO[];readonly expectedCount:number;
}){
 return <div className="rounded-lg border bg-white p-4 space-y-3">
  <h3 className="font-semibold text-sm">Truy vết bản ghi đóng góp</h3>
  <p className="text-xs text-slate-600">Được xem {lineage.length}/{expectedCount} bản ghi.
   Nguồn ngoài phạm vi quyền không được tiết lộ ID; tổng KPI và bản chụp vẫn bất biến.</p>
  {lineage.length===0?<p className="text-sm text-slate-500">Không có contributor được phép xem.</p>:
   <div className="overflow-auto max-h-96"><table className="w-full text-xs">
    <thead><tr className="border-b text-left"><th className="p-2">Nguồn</th><th className="p-2">Mã</th>
     <th className="p-2">Nhóm</th><th className="p-2">Phiên bản</th></tr></thead>
    <tbody>{lineage.map(x=><tr key={x.id} className="border-b">
     <td className="p-2">{x.sourceTable}</td><td className="p-2 font-mono">{x.sourceId}</td>
     <td className="p-2">{x.metricGroup}</td><td className="p-2">{x.sourceVersion}</td></tr>)}</tbody>
   </table></div>}
 </div>;
}
