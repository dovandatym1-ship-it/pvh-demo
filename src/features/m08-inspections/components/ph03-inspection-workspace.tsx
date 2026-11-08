"use client";

import { useRef,useState } from "react";
import { useRouter } from "next/navigation";
import { createInspectionRecordAction,createInspectionRecommendationAction,
 resolveInspectionRecommendationAction } from "../server/ph03-actions";
import type { InspectionRecord,InspectionRecommendation } from "../server/ph03-queries";

type Choice={id:string;name:string};
type Props={records:InspectionRecord[];recommendations:InspectionRecommendation[];
 hamlets:Choice[];assignees:Choice[];canWrite:boolean;canReview:boolean};
const field="rounded border border-slate-300 px-3 py-2 text-sm w-full";
const button="rounded bg-emerald-700 px-4 py-2 text-sm text-white disabled:opacity-40";
export function InspectionWorkspace({records,recommendations,hamlets,assignees,canWrite,canReview}:Props){
 const router=useRouter();const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
 const [code,setCode]=useState("");const [target,setTarget]=useState("");
 const [category,setCategory]=useState("VAN_HOA");const [hamlet,setHamlet]=useState(hamlets[0]?.id??"");
 const [inspector,setInspector]=useState("");const [checklist,setChecklist]=useState("ILLUSTRATIVE-v1");
 const [inspectionDate,setInspectionDate]=useState(new Date().toISOString().slice(0,10));
 const [authority,setAuthority]=useState("");const [notes,setNotes]=useState("");
 const [inspectionId,setInspectionId]=useState("");
 const [recCode,setRecCode]=useState("");const [recTitle,setRecTitle]=useState("");
 const [recDue,setRecDue]=useState("");const [assignedTo,setAssignedTo]=useState("");
 const [reviewId,setReviewId]=useState("");
 const [reviewStatus,setReviewStatus]=useState("FEEDBACK_UNVERIFIED");
 const [reviewReason,setReviewReason]=useState("");
 const retryKey=useRef<string|null>(null);
 const reviewItem=recommendations.find(r=>r.id===reviewId);
 async function invoke(fn:()=>Promise<{ok:boolean;error?:{message:string}}>,success:string){
  setBusy(true);setMessage("");
  try{
   const result=await fn();
   if(!result.ok)throw new Error(result.error?.message??"CSDL từ chối yêu cầu");
   setMessage(success);router.refresh();return true;
  }catch(e){setMessage(e instanceof Error?e.message:"Không thể xử lý");return false;}
  finally{setBusy(false);}
 }
 return <div className="space-y-6">
  <p className="rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
   Đây là hồ sơ theo dõi/kiến nghị nội bộ. Quyền kiểm tra, thanh tra, xử phạt và
   ban hành quyết định phải được xác minh độc lập; hệ thống không tự suy diễn thẩm quyền.
   Checklist minh họa không được sử dụng làm căn cứ xử phạt.
  </p>
  {canWrite&&<div className="grid gap-4 lg:grid-cols-2">
   <form className="rounded border bg-white p-4 space-y-3" onSubmit={e=>{
    e.preventDefault();void invoke(()=>createInspectionRecordAction({
     code,targetName:target,category,hamletId:hamlet,inspectorName:inspector,
     checklistVersion:checklist,inspectionDate,authorityRef:authority||null,notes:notes||null,
    }),"Đã lưu biên bản ghi nhận nội bộ.");
   }}>
    <h2 className="font-semibold">Ghi nhận cuộc kiểm tra</h2>
    <div className="grid gap-2 sm:grid-cols-2">
     <input className={field} required placeholder="Mã cuộc kiểm tra" value={code} onChange={e=>setCode(e.target.value)}/>
     <input className={field} required placeholder="Lĩnh vực" value={category} onChange={e=>setCategory(e.target.value)}/>
    </div>
    <input className={field} required placeholder="Cơ sở/đối tượng" value={target} onChange={e=>setTarget(e.target.value)}/>
    <select className={field} required value={hamlet} onChange={e=>setHamlet(e.target.value)}>
     <option value="">Chọn thôn/xóm</option>{hamlets.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}
    </select>
    <input className={field} required placeholder="Đoàn/đầu mối thực hiện" value={inspector}
     onChange={e=>setInspector(e.target.value)}/>
    <div className="grid gap-2 sm:grid-cols-2">
     <input className={field} required placeholder="Phiên bản checklist" value={checklist}
      onChange={e=>setChecklist(e.target.value)}/>
     <input className={field} type="date" required value={inspectionDate}
      onChange={e=>setInspectionDate(e.target.value)}/>
    </div>
    <input className={field} placeholder="Văn bản/nguồn thẩm quyền (nếu có)" value={authority}
     onChange={e=>setAuthority(e.target.value)}/>
    <textarea className={field} placeholder="Ghi nhận phát hiện, không kết luận xử phạt" value={notes}
     onChange={e=>setNotes(e.target.value)}/>
    <button className={button} disabled={busy||!hamlets.length}>Lưu ghi nhận</button>
   </form>
   <form className="rounded border bg-white p-4 space-y-3" onSubmit={e=>{
    e.preventDefault();retryKey.current??=crypto.randomUUID();
    void invoke(()=>createInspectionRecommendationAction({
     inspectionId,code:recCode,title:recTitle,dueDate:recDue,
     assignedTo,idempotencyKey:retryKey.current,
    }),"Đã tạo kiến nghị và công việc khắc phục M01 trong một giao dịch.").then(ok=>{
     if(ok){retryKey.current=null;setRecTitle("");setRecCode("");}
    });
   }}>
    <h2 className="font-semibold">Kiến nghị và giao việc M01</h2>
    <select className={field} value={inspectionId} onChange={e=>setInspectionId(e.target.value)} required>
     <option value="">Chọn cuộc kiểm tra</option>
     {records.map(r=><option key={r.id} value={r.id}>{r.code} – {r.targetName}</option>)}
    </select>
    <input className={field} required placeholder="Mã kiến nghị" value={recCode} onChange={e=>setRecCode(e.target.value)}/>
    <textarea className={field} required minLength={5} placeholder="Nội dung khắc phục" value={recTitle}
     onChange={e=>setRecTitle(e.target.value)}/>
    <input className={field} type="date" required value={recDue} onChange={e=>setRecDue(e.target.value)}/>
    <select className={field} required value={assignedTo} onChange={e=>setAssignedTo(e.target.value)}>
     <option value="">Đầu mối nhận việc M01</option>
     {assignees.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
    </select>
    {!assignees.length&&<p className="text-xs text-amber-700">
     Cần quyền giao việc M01 và danh sách phân công có hiệu lực để lập kiến nghị.</p>}
    <button className={button} disabled={busy||!inspectionId||!assignees.length}>Tạo kiến nghị + việc</button>
   </form>
  </div>}
  <div className="overflow-x-auto rounded border bg-white">
   <h2 className="font-semibold p-4">Hồ sơ kiểm tra có nguồn</h2>
   <table className="min-w-full text-sm text-left">
    <thead className="bg-slate-100"><tr>
     {["Mã","Đối tượng","Lĩnh vực","Ngày","Checklist","Kiến nghị"].map(x=><th className="p-3" key={x}>{x}</th>)}
    </tr></thead>
    <tbody>{records.map(r=><tr key={r.id} className="border-t">
     <td className="p-3">{r.code}</td><td className="p-3">{r.targetName}</td>
     <td className="p-3">{r.category}</td><td className="p-3">{r.inspectionDate}</td>
     <td className="p-3">{r.checklistVersion}</td>
     <td className="p-3">{recommendations.filter(x=>x.inspectionId===r.id).length}</td>
    </tr>)}</tbody>
   </table>
   {!records.length&&<p className="p-5 text-sm text-slate-500">Chưa có hồ sơ kiểm tra trong CSDL.</p>}
  </div>
  <div className="overflow-x-auto rounded border bg-white">
   <h2 className="font-semibold p-4">Theo dõi kiến nghị và công việc khắc phục</h2>
   <table className="min-w-full text-sm text-left">
    <thead className="bg-slate-100"><tr>{["Mã","Nội dung","Hạn","Trạng thái","Công việc M01","Thẩm tra"].map(x=>
     <th className="p-3" key={x}>{x}</th>)}</tr></thead>
    <tbody>{recommendations.map(r=><tr className="border-t" key={r.id}>
     <td className="p-3">{r.code}</td><td className="p-3">{r.title}</td>
     <td className="p-3">{r.dueDate}</td><td className="p-3">{r.status} · v{r.version}</td>
     <td className="p-3"><a className="text-emerald-800 underline"
      href={"/cong-viec/"+r.workItemId}>Mở công việc</a></td>
     <td className="p-3">{canReview&&r.status!=="RESOLVED_CLOSED"&&
      <button className="text-emerald-800 underline" onClick={()=>setReviewId(r.id)}>Đối soát</button>}</td>
    </tr>)}</tbody>
   </table>
   {!recommendations.length&&<p className="p-5 text-sm text-slate-500">Chưa có kiến nghị.</p>}
  </div>
  {reviewItem&&<form className="rounded border bg-white p-4 space-y-3" onSubmit={e=>{
   e.preventDefault();void invoke(()=>resolveInspectionRecommendationAction({
    recommendationId:reviewItem.id,status:reviewStatus,reason:reviewReason,
    expectedVersion:reviewItem.version,
   }),"Đã lưu hậu kiểm. Chỉ đóng khi công việc M01 đã hoàn thành.");
  }}>
   <h2 className="font-semibold">Hậu kiểm · {reviewItem.code}</h2>
   <select className={field} value={reviewStatus} onChange={e=>setReviewStatus(e.target.value)}>
    <option value="FEEDBACK_UNVERIFIED">Đã nhận phản hồi, chưa xác minh</option>
    <option value="RESOLVED_CLOSED">Đã hậu kiểm và đóng (yêu cầu M01 hoàn thành)</option>
   </select>
   <textarea className={field} required minLength={5} placeholder="Căn cứ, nhận xét hậu kiểm"
    value={reviewReason} onChange={e=>setReviewReason(e.target.value)}/>
   <button className={button} disabled={busy}>Lưu kết quả hậu kiểm</button>
  </form>}
  {message&&<p role="status" className="rounded border bg-white p-3 text-sm">{message}</p>}
 </div>;
}
