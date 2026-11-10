"use client";

import { useState,type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ReligiousEstablishmentDTO,ReligiousEventDTO } from "../types";
import { registerReligiousEventAction } from "../server/actions";

const inputClass="mt-1 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700";

export function ReligiousEventsPanel({establishments,events,canManage}:{
 establishments:readonly ReligiousEstablishmentDTO[];
 events:readonly ReligiousEventDTO[];
 canManage:boolean;
}){
  const router=useRouter();
  const [source,setSource]=useState(establishments[0]?.id||"");
  const [title,setTitle]=useState("");
  const [date,setDate]=useState("");
  const [attendees,setAttendees]=useState(1);
  const [pending,setPending]=useState(false);
  const [feedback,setFeedback]=useState<{ok:boolean;message:string}|null>(null);
  const names=new Map(establishments.map(v=>[v.id,v.name]));
  const visible=events.filter(v=>names.has(v.establishmentId));
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(pending||!canManage)return;
    if(!names.has(source)||!date||title.trim().length<3||attendees<1){
      setFeedback({ok:false,message:"Chọn cơ sở thuộc quyền quản lý, ngày tổ chức, số người và tên hoạt động hợp lệ."});return;
    }
    setPending(true);setFeedback(null);
    try{
      const receipt=await registerReligiousEventAction({
        establishmentId:source,title:title.trim(),eventDate:date,expectedAttendees:attendees,
      });
      if(!receipt.ok){setFeedback({ok:false,message:receipt.error.message});return;}
      setFeedback({ok:true,message:"Đã tiếp nhận hoạt động và ghi nhật ký. Đây chưa phải quyết định chấp thuận."});
      setTitle("");setDate("");setAttendees(1);router.refresh();
    }catch{setFeedback({ok:false,message:"Không thể kết nối. Hoạt động chưa được ghi nhận."});}
    finally{setPending(false);}
  }
  return <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
    <h2 className="text-lg font-semibold text-slate-900">Hoạt động tín ngưỡng, tôn giáo đã tiếp nhận</h2>
    <p className="text-sm text-slate-600">Theo dõi hoạt động theo hồ sơ cơ sở; trạng thái “Chờ tiếp nhận” không phải quyết định cho phép.</p>
    {feedback&&<p role={feedback.ok?"status":"alert"} className={feedback.ok?"text-sm text-emerald-800":"text-sm text-rose-700"}>{feedback.message}</p>}
    {canManage&&<form onSubmit={submit} className="grid gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-2">
      <label className="text-sm">Cơ sở *
        <select className={inputClass} value={source} required onChange={e=>setSource(e.target.value)}>
          <option value="">Chọn cơ sở</option>
          {establishments.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
      </label>
      <label className="text-sm">Tên hoạt động *
        <input className={inputClass} required minLength={3} maxLength={250} value={title} onChange={e=>setTitle(e.target.value)}/>
      </label>
      <label className="text-sm">Ngày dự kiến tổ chức *
        <input className={inputClass} required type="date" value={date} onChange={e=>setDate(e.target.value)}/>
      </label>
      <label className="text-sm">Số người dự kiến *
        <input className={inputClass} required type="number" min={1} max={100000} value={attendees}
          onChange={e=>setAttendees(Number(e.target.value))}/>
      </label>
      <button type="submit" disabled={pending||establishments.length===0}
        className="min-h-10 rounded-lg bg-[#1F633E] px-4 font-semibold text-white disabled:opacity-50 sm:col-span-2">
        {pending?"Đang lưu...":"Tiếp nhận hoạt động"}
      </button>
    </form>}
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] text-left text-sm">
        <thead className="bg-slate-50 text-slate-700"><tr>
          <th scope="col" className="p-3">Cơ sở</th><th scope="col" className="p-3">Hoạt động</th>
          <th scope="col" className="p-3">Ngày dự kiến</th><th scope="col" className="p-3">Số người</th>
          <th scope="col" className="p-3">Trạng thái</th>
        </tr></thead>
        <tbody className="divide-y divide-slate-100">{visible.map(x=><tr key={x.id}>
          <td className="p-3">{names.get(x.establishmentId)}</td>
          <td className="p-3 font-medium">{x.title}</td>
          <td className="p-3">{x.eventDate}</td>
          <td className="p-3 tabular-nums">{x.expectedAttendees}</td>
          <td className="p-3">{x.status==="CHO_TIEP_NHAN"?"Chờ tiếp nhận":x.status==="DA_TIEP_NHAN"?"Đã tiếp nhận":"Từ chối"}</td>
        </tr>)}
        {visible.length===0&&<tr><td colSpan={5} className="p-8 text-center text-slate-500">Chưa có hoạt động nào được ghi nhận từ nguồn dữ liệu thực.</td></tr>}
        </tbody>
      </table>
    </div>
  </section>;
}
