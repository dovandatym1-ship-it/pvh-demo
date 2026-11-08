"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDigitalPlanAction,createDigitalIndicatorAction,
 linkDigitalPlanWorkAction,updateDigitalIndicatorStatusAction } from "../server/ph03-actions";
import type { DigitalPlan,DigitalIndicator } from "../server/ph03-queries";

type Props={plans:DigitalPlan[];indicators:DigitalIndicator[];canWrite:boolean;canReview:boolean};
const field="rounded border border-slate-300 px-3 py-2 text-sm w-full";
const button="rounded bg-emerald-700 px-4 py-2 text-sm text-white disabled:opacity-40";
export function DigitalWorkspace({plans,indicators,canWrite,canReview}:Props){
 const router=useRouter();
 const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
 const [title,setTitle]=useState("");const [period,setPeriod]=useState("");
 const [source,setSource]=useState("");const [planId,setPlanId]=useState("");
 const [code,setCode]=useState("");const [name,setName]=useState("");
 const [unit,setUnit]=useState("");const [workId,setWorkId]=useState("");
 const [indicatorId,setIndicatorId]=useState("");
 const [value,setValue]=useState("");const [status,setStatus]=useState("UNVERIFIED");
 const [naReason,setNaReason]=useState("");
 const chosen=indicators.find(i=>i.id===indicatorId);
 async function invoke(fn:()=>Promise<{ok:boolean;error?:{message:string}}>,success:string){
  setBusy(true);setMessage("");
  try {
   const r=await fn();
   if(!r.ok)throw new Error(r.error?.message??"Không ghi được CSDL");
   setMessage(success);router.refresh();
  }catch(e){setMessage(e instanceof Error?e.message:"Không thể hoàn tất");}
  finally{setBusy(false);}
 }
 return <div className="space-y-6">
  <div className="rounded bg-blue-50 border border-blue-200 p-3 text-sm">
   Nguồn số liệu được lưu theo kỳ và đơn vị tính. <strong>Chưa nộp khác số 0 đã xác nhận</strong>;
   không có chỉ tiêu hoặc nguồn thì không tự sinh tỷ lệ mẫu.
  </div>
  {canWrite&&<div className="grid gap-4 lg:grid-cols-2">
   <form className="rounded border bg-white p-4 space-y-3" onSubmit={e=>{
    e.preventDefault();void invoke(()=>createDigitalPlanAction({title,period,sourceRef:source}),
      "Đã tạo kế hoạch nháp, chưa chốt kỳ.");
   }}>
    <h2 className="font-semibold">Tạo kế hoạch CĐS</h2>
    <input className={field} required minLength={3} placeholder="Tên kế hoạch" value={title}
      onChange={e=>setTitle(e.target.value)}/>
    <input className={field} required placeholder="Kỳ báo cáo (VD: 2026-Q4)" value={period}
      onChange={e=>setPeriod(e.target.value)}/>
    <input className={field} required placeholder="Số văn bản/nguồn" value={source}
      onChange={e=>setSource(e.target.value)}/>
    <button className={button} disabled={busy}>Lưu kế hoạch nháp</button>
   </form>
   <form className="rounded border bg-white p-4 space-y-3" onSubmit={e=>{
    e.preventDefault();void invoke(()=>createDigitalIndicatorAction({
      planId:planId||null,code,name,unit,period,meaning:"",
    }),"Đã thêm định nghĩa chỉ tiêu; số liệu đang chưa nộp.");
   }}>
    <h2 className="font-semibold">Định nghĩa chỉ tiêu</h2>
    <select className={field} value={planId} onChange={e=>setPlanId(e.target.value)}>
     <option value="">Chỉ tiêu độc lập</option>
     {plans.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}
    </select>
    <div className="grid grid-cols-2 gap-2">
     <input className={field} required placeholder="Mã chỉ tiêu" value={code} onChange={e=>setCode(e.target.value)}/>
     <input className={field} required placeholder="Đơn vị (%, hồ sơ...)" value={unit} onChange={e=>setUnit(e.target.value)}/>
    </div>
    <input className={field} required placeholder="Tên chỉ tiêu" value={name} onChange={e=>setName(e.target.value)}/>
    <button className={button} disabled={busy||!period}>Thêm chỉ tiêu</button>
   </form>
  </div>}
  {canWrite&&<form className="rounded border bg-white p-4 space-y-3" onSubmit={e=>{
   e.preventDefault();void invoke(()=>linkDigitalPlanWorkAction({planId,workItemId:workId}),
    "Đã liên kết công việc M01 (không sao chép trạng thái).");
  }}>
   <h2 className="font-semibold">Liên kết công việc M01</h2>
   <div className="grid gap-2 sm:grid-cols-2">
    <select className={field} value={planId} required onChange={e=>setPlanId(e.target.value)}>
     <option value="">Chọn kế hoạch</option>{plans.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}
    </select>
    <input className={field} required placeholder="UUID công việc M01" value={workId}
     onChange={e=>setWorkId(e.target.value)}/>
   </div>
   <button className={button} disabled={busy}>Liên kết công việc</button>
  </form>}
  <div className="rounded border bg-white overflow-x-auto">
   <table className="min-w-full text-sm text-left">
    <thead className="bg-slate-100"><tr>
     {["Mã","Chỉ tiêu","Kỳ","Số liệu","Trạng thái","Nguồn","Phiên bản"].map(x=>
      <th className="p-3" key={x}>{x}</th>)}
    </tr></thead>
    <tbody>{indicators.map(i=><tr className="border-t" key={i.id}>
     <td className="p-3">{i.code}</td><td className="p-3">{i.name}</td>
     <td className="p-3">{i.period}</td>
     <td className="p-3">{i.numericValue===null?"Chưa có số liệu":String(i.numericValue)+" "+i.unit}</td>
     <td className="p-3">{i.status}</td><td className="p-3">{i.sourceRef??"—"}</td>
     <td className="p-3">v{i.version}</td>
    </tr>)}</tbody>
   </table>
   {!indicators.length&&<p className="p-5 text-sm text-slate-500">Chưa có chỉ tiêu trong CSDL.</p>}
  </div>
  {canWrite&&<form className="rounded border bg-white p-4 space-y-3" onSubmit={e=>{
   e.preventDefault();if(!chosen)return;
   void invoke(()=>updateDigitalIndicatorStatusAction({
    indicatorId:chosen.id,status,numericValue:value===""?null:Number(value),
    sourceRef:source||null,naReason:naReason||null,expectedVersion:chosen.version,
   }),"CSDL đã ghi nhận giá trị và lịch sử phiên bản chỉ tiêu.");
  }}>
   <h2 className="font-semibold">Ghi nhận / đối soát chỉ tiêu</h2>
   <select className={field} value={indicatorId} required onChange={e=>setIndicatorId(e.target.value)}>
    <option value="">Chọn chỉ tiêu</option>
    {indicators.map(i=><option value={i.id} key={i.id}>{i.code} – {i.name}</option>)}
   </select>
   <div className="grid sm:grid-cols-2 gap-2">
    <select className={field} value={status} onChange={e=>setStatus(e.target.value)}>
     <option value="UNVERIFIED">Chưa đối soát</option>
     <option value="NOT_REPORTED">Chưa nộp</option>
     <option value="NOT_APPLICABLE">Không áp dụng</option>
     {canReview&&<option value="CONFIRMED">Đã xác nhận</option>}
     {canReview&&<option value="CONFIRMED_ZERO">Xác nhận đúng số 0</option>}
    </select>
    <input className={field} type="number" step="any" placeholder="Giá trị số, để trống nếu chưa nộp"
      value={value} onChange={e=>setValue(e.target.value)}/>
   </div>
   <input className={field} placeholder="Nguồn/biểu mẫu của số liệu" value={source}
    onChange={e=>setSource(e.target.value)}/>
   <input className={field} placeholder="Lý do không áp dụng (nếu có)" value={naReason}
    onChange={e=>setNaReason(e.target.value)}/>
   <button className={button} disabled={busy||!chosen}>Ghi nhận vào CSDL</button>
  </form>}
  <p className="text-sm text-slate-600">Kế hoạch có trong CSDL: {plans.length}. {" "}
    {plans.map(p=>p.title+" ("+p.taskCount+" công việc M01)").join("; ")||"Chưa có kế hoạch."}</p>
  {message&&<p className="rounded border bg-white p-3 text-sm" role="status">{message}</p>}
 </div>;
}
