"use client";
import React,{useEffect,useState} from "react";
import { ReportSnapshotSelector } from "./report-snapshot-selector";
import { SnapshotDetailsCard } from "./snapshot-details-card";
import { SnapshotLineageTable } from "./snapshot-lineage-table";
import { FinalizeSnapshotModal } from "./finalize-snapshot-modal";
import { getSnapshotLineageAction,advanceSnapshotAction } from "../server/actions";
import type { ReportSnapshotDTO,SnapshotLineageDTO,ReportCatalogEntry,SnapshotTransition } from "../types";
import { metricDelta, metricNameLabel, metricValueLabel } from "../types/presentation";
interface Props {
 readonly initialSnapshots:ReportSnapshotDTO[];
 readonly userPermissions:readonly string[];
 readonly userId:string;
 readonly catalog:readonly ReportCatalogEntry[];
}
export function ReportManager({initialSnapshots,userPermissions,userId,catalog}:Props){
 const [snapshots,setSnapshots]=useState([...initialSnapshots]);
 const [selectedId,setSelectedId]=useState<string|null>(initialSnapshots[0]?.id??null);
 const [lineage,setLineage]=useState<SnapshotLineageDTO[]>([]);
 const [lineageError,setLineageError]=useState("");
 const [busy,setBusy]=useState(false);
 const [actionError,setActionError]=useState("");
 const [modalOpen,setModalOpen]=useState(false);
 const selected=snapshots.find(s=>s.id===selectedId)??null;
 const canDraft=userPermissions.includes("m09:report:draft");
 const canExport=userPermissions.includes("m09:report:export");
 const canReview=userPermissions.includes("m09:report:review");
 const canFinalize=userPermissions.includes("m09:report:finalize");
 const transition:SnapshotTransition|null = selected?.status==="DRAFT"&&canDraft&&selected.createdBy===userId?"SUBMIT":
  selected?.status==="SUBMITTED"&&canReview?"START_REVIEW":
  selected?.status==="UNDER_REVIEW"&&canFinalize?"FINALIZE":null;
 const previous=selected?.previousSnapshotId?snapshots.find(s=>s.id===selected.previousSnapshotId):null;
 useEffect(()=>{
  if(!selectedId){setLineage([]);return;}
  let active=true;setLineageError("");
  getSnapshotLineageAction(selectedId).then(res=>{
   if(!active)return;
   if(res.ok)setLineage(res.data);else{setLineage([]);setLineageError(res.error.message);}
  }).catch(()=>{if(active){setLineage([]);setLineageError("Lỗi tải vết nguồn");}});
  return()=>{active=false;};
 },[selectedId]);
 async function changeState(){
  if(!selected||!transition)return;
  setBusy(true);setActionError("");
  try{
   const res=await advanceSnapshotAction({snapshotId:selected.id,expectedVersion:selected.version,transition});
   if(!res.ok){setActionError(res.error.message);return;}
   setSnapshots(prev=>prev.map(s=>s.id===res.data.id?res.data:s));
  }catch{setActionError("Không thể chuyển trạng thái");}finally{setBusy(false);}
 }
 function handleCreated(s:ReportSnapshotDTO){setSnapshots(prev=>[s,...prev]);setSelectedId(s.id);}
 const labels:Record<SnapshotTransition,string>={SUBMIT:"Trình rà soát",START_REVIEW:"Tiếp nhận rà soát",FINALIZE:"Chốt số liệu nội bộ"};
 return <div className="space-y-5">
  <ReportSnapshotSelector snapshots={snapshots} selectedId={selectedId} onSelectSnapshot={setSelectedId}
   onOpenFinalizeModal={()=>setModalOpen(true)} canFinalize={canDraft}/>
  {selected&&<div className="flex items-center gap-2">
   {transition&&<button className="rounded bg-indigo-700 px-4 py-2 text-sm text-white disabled:opacity-60"
     onClick={changeState} disabled={busy}>{busy?"Đang xử lý...":labels[transition]}</button>}
   <span className="text-xs text-slate-600">Lần cập nhật {selected.version}; quyền và trạng thái được xác minh lại tại CSDL.</span>
  </div>}
  {actionError&&<p role="alert" className="text-sm text-rose-700">{actionError}</p>}
  <SnapshotDetailsCard snapshot={selected} isLiveView={!selected} canExport={canExport}/>
  {previous&&selected&&<div className="border rounded-lg p-4 bg-white">
   <h3 className="text-sm font-semibold">So sánh với bản v{previous.revision}</h3>
   <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
    {Object.entries((selected.payload.metrics??{}) as Record<string,number>).map(([key,value])=>{
     const old=((previous.payload.metrics??{}) as Record<string,unknown>)[key];
     const delta=metricDelta(value,old);
     return <p key={key} className="text-xs">{metricNameLabel(key)}: {metricValueLabel(old)} → {metricValueLabel(value)}
      {delta===null?" (Không đủ dữ liệu để so sánh)":` (${delta>=0?"+":""}${delta})`}</p>;
    })}
   </div></div>}
  {selected&&<>{lineageError&&<p role="alert" className="text-xs text-rose-600">{lineageError}</p>}
   <SnapshotLineageTable lineage={lineage} expectedCount={Number(selected.payload.sourceRecords??0)}/></>}
  <FinalizeSnapshotModal isOpen={modalOpen} onClose={()=>setModalOpen(false)}
   onSnapshotCreated={handleCreated} catalog={catalog} snapshots={snapshots}/>
 </div>;
}
