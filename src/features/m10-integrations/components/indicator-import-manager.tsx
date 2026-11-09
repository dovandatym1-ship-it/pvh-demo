"use client";
import React,{useState} from "react";
import type { RowError } from "../import-contract";
interface Preview {
 summary:{valid:number;invalid:number;errors:RowError[];fileSha256:string;templateVersion:number};
 sourceOwner:string;policy:string;
}
export function IndicatorImportManager(){
 const [file,setFile]=useState<File|null>(null);
 const [owner,setOwner]=useState("");
 const [policy,setPolicy]=useState<"REJECT_ALL"|"ACCEPT_VALID">("REJECT_ALL");
 const [preview,setPreview]=useState<Preview|null>(null);
 const [receipt,setReceipt]=useState<Record<string,unknown>|null>(null);
 const [error,setError]=useState("");
 const [busy,setBusy]=useState(false);
 async function invoke(mode:"preview"|"commit"){
  if(!file){setError("Hãy chọn file CSV");return;}
  setBusy(true);setError("");setReceipt(null);
  const form=new FormData();form.set("file",file);form.set("sourceOwner",owner);form.set("policy",policy);
  try{
   const response=await fetch("/api/imports/indicators/"+mode,{method:"POST",body:form,cache:"no-store"});
   const result=await response.json();
   if(!response.ok){setError(result.error??"Không thể xử lý file");return;}
   if(mode==="preview")setPreview(result as Preview);
   else{setReceipt(result.receipt as Record<string,unknown>);setPreview(null);}
  }catch{setError("Lỗi mạng, chưa ghi nhận dữ liệu");}
  finally{setBusy(false);}
 }
 const changed=()=>{setPreview(null);setReceipt(null);setError("");};
 return <div className="space-y-5">
  <div className="rounded-lg border bg-white p-5 space-y-4">
   <h2 className="text-lg font-semibold">Nhập chỉ tiêu từ CSV có nguồn</h2>
   <p className="text-sm text-slate-600">Kết nối mô phỏng, chưa có hợp đồng tích hợp với hệ thống bên ngoài.
    Mẫu phiên bản 1, tối đa 2 MB/5.000 dòng. File được phân tích và kiểm tra lại trên server khi commit.</p>
   <a href="/api/imports/indicators/template" className="text-sm text-indigo-700 underline">
    Tải mẫu CSV demo và danh mục trường</a>
   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <label className="text-sm">File CSV
     <input type="file" accept=".csv,text/csv" className="mt-1 block w-full text-sm"
      onChange={e=>{setFile(e.target.files?.[0]??null);changed();}}/></label>
    <label className="text-sm">Chủ sở hữu nguồn
     <input value={owner} required minLength={3} maxLength={150} placeholder="Tên đơn vị cung cấp dữ liệu"
      onChange={e=>{setOwner(e.target.value);changed();}}
      className="mt-1 block w-full rounded border p-2"/></label>
    <label className="text-sm">Chính sách lỗi
     <select value={policy} onChange={e=>{setPolicy(e.target.value as typeof policy);changed();}}
      className="mt-1 block w-full rounded border p-2">
      <option value="REJECT_ALL">Có lỗi: từ chối toàn bộ</option>
      <option value="ACCEPT_VALID">Có lỗi: chỉ nhận dòng hợp lệ, lưu lỗi</option>
     </select></label>
   </div>
   <button className="rounded bg-indigo-700 px-4 py-2 text-sm text-white disabled:opacity-50"
    disabled={busy||!file||owner.trim().length<3} onClick={()=>invoke("preview")}>{busy?"Đang xử lý...":"Kiểm tra và xem trước"}</button>
  </div>
  {error&&<p role="alert" className="rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
  {preview&&<div className="rounded-lg border bg-white p-5 space-y-3">
   <h3 className="font-semibold">Kết quả kiểm tra — chưa ghi CSDL</h3>
   <p className="text-sm">Hợp lệ: {preview.summary.valid} • Lỗi: {preview.summary.invalid} •
    Template v{preview.summary.templateVersion}</p>
   <p className="font-mono break-all text-xs text-slate-500">SHA-256 file: {preview.summary.fileSha256}</p>
   {preview.summary.errors.length>0&&<div className="max-h-72 overflow-auto">
    <table className="w-full text-xs"><thead><tr><th className="p-2 text-left">Dòng</th>
     <th className="p-2 text-left">Lỗi</th></tr></thead>
     <tbody>{preview.summary.errors.map(e=><tr key={e.line} className="border-t">
      <td className="p-2">{e.line}</td><td className="p-2">{e.reason}</td></tr>)}</tbody></table>
   </div>}
   <button className="rounded bg-emerald-700 px-4 py-2 text-sm text-white disabled:opacity-50"
    disabled={busy||preview.summary.valid===0|| (policy==="REJECT_ALL"&&preview.summary.invalid>0)}
    onClick={()=>invoke("commit")}>Xác nhận ghi và tạo receipt</button>
   {policy==="REJECT_ALL"&&preview.summary.invalid>0&&
    <p className="text-sm text-amber-700">Sửa lỗi CSV hoặc chọn chính sách chấp nhận dòng hợp lệ.</p>}
  </div>}
  {receipt&&<div className="rounded-lg border bg-emerald-50 p-5 space-y-2">
   <h3 className="font-semibold">Biên nhận nhập dữ liệu</h3>
   <p className="text-sm">Trạng thái: {String(receipt.status)} • Tổng dòng: {String(receipt.total_rows)}
    {" • "}Đã thêm: {String(receipt.inserted_rows)} • Lỗi: {String(receipt.invalid_rows)}</p>
   <p className="font-mono text-xs break-all">Mã đợt nhập: {String(receipt.id)}</p>
   <pre className="text-xs max-h-72 overflow-auto whitespace-pre-wrap">{JSON.stringify(receipt.receipt,null,2)}</pre>
  </div>}
  <p className="text-xs text-rose-700">MÔ PHỎNG DEMO — KHÔNG CÓ GIÁ TRỊ PHÁP LÝ.
   Việc kiểm tra mã độc qua hạ tầng phải hoàn tất trước khi dùng với nguồn thực tế.</p>
 </div>;
}
