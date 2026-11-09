"use client";
import React,{useState} from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { createDraftSnapshotAction } from "../server/actions";
import type { ReportSnapshotDTO,ReportCatalogEntry } from "../types";
interface Props {
 readonly isOpen:boolean;readonly onClose:()=>void;
 readonly onSnapshotCreated:(snapshot:ReportSnapshotDTO)=>void;
 readonly catalog:readonly ReportCatalogEntry[];
 readonly snapshots:readonly ReportSnapshotDTO[];
}
export function FinalizeSnapshotModal({isOpen,onClose,onSnapshotCreated,catalog,snapshots}:Props){
 const [code,setCode]=useState<string>("RPT-SUMMARY");
 const [title,setTitle]=useState("Báo cáo tổng hợp Văn hóa – Xã hội");
 const [period,setPeriod]=useState("Q4/2026");
 const [year,setYear]=useState(2026);
 const [previous,setPrevious]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const matching=snapshots.filter(s=>s.reportCode===code && s.period===period && s.year===year && s.isFinalized);
 async function submit(){
  setError("");setBusy(true);
  try {
   const result=await createDraftSnapshotAction({reportCode:code,title,period,year,
     idempotencyKey:crypto.randomUUID(),previousSnapshotId:previous||null});
   if(!result.ok){setError(result.error.message);return;}
   onSnapshotCreated(result.data);onClose();
  } catch {setError("Không thể tạo bản nháp; vui lòng thử lại.");}
  finally{setBusy(false);}
 }
 return <Modal isOpen={isOpen} onClose={onClose} title="Tạo bản nháp báo cáo từ CSDL"
  description="Tính KPI và lưu toàn bộ vết nguồn ngay trong một giao dịch. Chốt báo cáo là bước riêng sau khi rà soát.">
  <div className="space-y-3 text-sm">
   <label className="block">Loại báo cáo
    <select value={code} onChange={e=>{setCode(e.target.value);setPrevious("");}}
      className="block w-full border rounded p-2 mt-1">
      {catalog.map(c=><option key={c.code} value={c.code}>{c.title}</option>)}
    </select>
   </label>
   <label className="block">Tiêu đề
    <input value={title} onChange={e=>setTitle(e.target.value)} maxLength={250}
     className="block w-full border rounded p-2 mt-1"/></label>
   <div className="grid grid-cols-2 gap-2">
    <label>Kỳ (Qn/YYYY hoặc YYYY-MM)<input value={period} onChange={e=>{setPeriod(e.target.value);setPrevious("");}}
      className="block w-full border rounded p-2 mt-1"/></label>
    <label>Năm<input type="number" value={year} min={2020} max={2200}
      onChange={e=>setYear(Number(e.target.value))} className="block w-full border rounded p-2 mt-1"/></label>
   </div>
   {matching.length>0&&<label className="block">Điều chỉnh bản đã chốt
    <select value={previous} onChange={e=>setPrevious(e.target.value)}
      className="block w-full border rounded p-2 mt-1">
      <option value="">Chọn bản trước để tạo revision</option>
      {matching.map(s=><option key={s.id} value={s.id}>Bản {s.revision} — {s.title}</option>)}
    </select></label>}
   <p className="text-xs text-rose-700">MÔ PHỎNG DEMO — KHÔNG CÓ GIÁ TRỊ PHÁP LÝ.
    Chưa có thao tác ký số hoặc phát hành văn bản.</p>
   {error&&<p role="alert" className="text-rose-700">{error}</p>}
   <div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose} disabled={busy}>Hủy</Button>
    <Button onClick={submit} disabled={busy||catalog.length===0}>{busy?"Đang tạo...":"Tạo bản nháp"}</Button></div>
  </div>
 </Modal>;
}
