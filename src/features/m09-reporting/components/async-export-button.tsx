"use client";
import React,{useEffect,useState} from "react";
export function AsyncExportButton({snapshotId}:{readonly snapshotId:string}){
 const [jobId,setJobId]=useState<string|null>(null);
 const [status,setStatus]=useState("");
 const [downloadUrl,setDownloadUrl]=useState<string|null>(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 async function refresh(id:string){
  try{
   const response=await fetch("/api/jobs/exports/"+id,{cache:"no-store"});
   const data=await response.json();
   if(!response.ok){setError(data.error??"Không lấy được trạng thái job");return;}
   setStatus(data.job.status);setDownloadUrl(data.downloadUrl??null);
  }catch{setError("Lỗi mạng khi lấy trạng thái job");}
 }
 useEffect(()=>{
  if(!jobId||status==="SUCCEEDED"||status==="FAILED")return;
  const timer=setTimeout(()=>{void refresh(jobId);},4000);
  return()=>clearTimeout(timer);
 },[jobId,status]);
 async function start(){
  setBusy(true);setError("");setDownloadUrl(null);
  try{
   const response=await fetch("/api/jobs/exports",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({snapshotId,format:"XLSX",idempotencyKey:crypto.randomUUID()}),
   });
   const result=await response.json();
   if(!response.ok||!result.ok){setError(result.error?.message??"Không tạo được tác vụ");return;}
   setJobId(result.data.id);setStatus(result.data.status);
  }catch{setError("Lỗi kết nối khi tạo tác vụ");}finally{setBusy(false);}
 }
 return <div className="inline-flex flex-wrap items-center gap-2 text-xs">
  <button onClick={start} disabled={busy} className="rounded border border-indigo-300 px-3 py-1.5 text-indigo-700 disabled:opacity-50">
   {busy?"Đang xếp hàng...":"Xuất XLSX qua worker"}</button>
  {jobId&&<><span>Job: {status||"PENDING"}</span>
   <button className="underline text-indigo-700" onClick={()=>refresh(jobId)}>Kiểm tra</button></>}
  {downloadUrl&&<a className="text-emerald-700 underline" href={downloadUrl} target="_blank" rel="noreferrer">
   Tải bản xuất (link 60s)</a>}
  {error&&<span role="alert" className="text-rose-700">{error}</span>}
 </div>;
}
