"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CircleAlert, Database, Download, History, Plus, Search, ShieldCheck } from "lucide-react";
import { createCatalogAction,createCatalogValueAction,updateCatalogAction,updateCatalogValueAction } from "./actions";
import type { Catalog,CatalogValue,CatalogWorkspace } from "./catalog-schema";

type Props = { initial: CatalogWorkspace;canManage:boolean };
const inputClass="mt-1 block min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700";
const buttonClass="min-h-10 rounded-lg bg-[#1F633E] px-4 text-sm font-semibold text-white hover:bg-[#174E31] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:cursor-not-allowed disabled:opacity-60";
const secondaryClass="min-h-9 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:opacity-40";
const dateOrNull=(value:string)=>value.trim()||null;
const eventLabel:Record<string,string>={
 CREATE_CATALOG:"Tạo danh mục",UPDATE_CATALOG:"Cập nhật danh mục",
 CREATE_VALUE:"Thêm giá trị",UPDATE_VALUE:"Cập nhật giá trị",
};
const dateTime=(date:string)=>new Date(date).toLocaleString("vi-VN",{timeZone:"Asia/Ho_Chi_Minh"});
const csvValue=(value:unknown)=>{
  const raw=String(value??"");
  const safe=/^[\s]*[=+@\-\t\r]/.test(raw)?"'"+raw:raw;
  return '"'+safe.replace(/"/g,'""')+'"';
};

export function CatalogConsole({initial,canManage}:Props){
  const router=useRouter();
  const [selectedId,setSelectedId]=React.useState(initial.catalogs[0]?.id||"");
  const [query,setQuery]=React.useState("");
  const [pending,setPending]=React.useState(false);
  const [feedback,setFeedback]=React.useState<{message:string;ok:boolean}|null>(null);
  const [tab,setTab]=React.useState<"values"|"history">("values");
  const [editing,setEditing]=React.useState<CatalogValue|null>(null);
  const [catalogDraft,setCatalogDraft]=React.useState({code:"",labelVi:"",description:""});
  const [valueDraft,setValueDraft]=React.useState({code:"",labelVi:"",parentId:"",sortOrder:0,validFrom:"",validTo:""});
  const selected=initial.catalogs.find(x=>x.id===selectedId)||null;
  const values=initial.values.filter(x=>x.catalog_id===selectedId);
  const search=query.trim().toLocaleLowerCase("vi");
  const filtered=values.filter(x=>x.code.toLocaleLowerCase("vi").includes(search) || x.label_vi.toLocaleLowerCase("vi").includes(search));
  const selectedEvents=initial.history.filter(x=>x.catalog_id===selectedId);
  const activeParentOptions=values.filter(x=>x.is_active&&x.id!==editing?.id);
  async function submit<T>(callback:()=>Promise<{ok:true;data:T}|{ok:false;error:{message:string}}>,success:string){
    if(pending)return false;
    setPending(true);setFeedback(null);
    try{
      const result=await callback();
      setFeedback({ok:result.ok,message:result.ok?success:result.error.message});
      if(result.ok){router.refresh();return true;}
    }catch{
      setFeedback({ok:false,message:"Kết nối gián đoạn hoặc phiên làm việc đã hết hạn."});
    }finally{setPending(false);}
    return false;
  }
  async function createCatalog(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(await submit(()=>createCatalogAction(catalogDraft),"Đã tạo danh mục và ghi nhận lịch sử.")){
      setCatalogDraft({code:"",labelVi:"",description:""});
    }
  }
  async function updateCatalog(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!selected||!canManage)return;
    const data=new FormData(event.currentTarget);
    await submit(()=>updateCatalogAction({
      id:selected.id,expectedVersion:selected.version,
      labelVi:String(data.get("labelVi")||""),
      description:String(data.get("description")||""),
      isActive:data.get("isActive")==="true",
    }),"Đã cập nhật danh mục và ghi nhận lịch sử.");
  }
  async function createValue(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();if(!selected||!canManage)return;
    if(await submit(()=>createCatalogValueAction({
      catalogId:selected.id,code:valueDraft.code,labelVi:valueDraft.labelVi,
      parentId:valueDraft.parentId||null,sortOrder:valueDraft.sortOrder,
      validFrom:dateOrNull(valueDraft.validFrom),validTo:dateOrNull(valueDraft.validTo),
    }),"Đã thêm giá trị danh mục và ghi nhận lịch sử.")){
      setValueDraft({code:"",labelVi:"",parentId:"",sortOrder:0,validFrom:"",validTo:""});
    }
  }
  async function updateValue(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();if(!editing||!canManage)return;
    const data=new FormData(event.currentTarget);
    if(await submit(()=>updateCatalogValueAction({
      id:editing.id,expectedVersion:editing.version,
      labelVi:String(data.get("labelVi")||""),
      parentId:String(data.get("parentId")||"")||null,
      sortOrder:Number(data.get("sortOrder")||0),isActive:data.get("isActive")==="true",
      validFrom:dateOrNull(String(data.get("validFrom")||"")),
      validTo:dateOrNull(String(data.get("validTo")||"")),
    }),"Đã cập nhật giá trị và ghi nhận lịch sử.")){setEditing(null);}
  }
  function exportCsv(){
    if(initial.valuesTotal>initial.values.length){
      setFeedback({ok:false,message:"Danh sách dữ liệu đang phân trang, không thể xuất thiếu. Hãy thu hẹp dữ liệu hoặc thực hiện xuất dữ liệu máy chủ."});return;
    }
    const rows=[
      ["Mã danh mục","Tên danh mục","Mã giá trị","Tên giá trị","Mã cha","Thứ tự","Hiệu lực từ","Hiệu lực đến","Trạng thái"],
      ...filtered.map(value=>[
        selected?.code||"",selected?.label_vi||"",value.code,value.label_vi,
        values.find(parent=>parent.id===value.parent_id)?.code||"",value.sort_order,
        value.valid_from||"",value.valid_to||"",value.is_active?"Đang dùng":"Ngừng dùng",
      ]),
    ];
    const csv="\uFEFF"+rows.map(row=>row.map(csvValue).join(",")).join("\r\n");
    const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8;"}));
    const anchor=document.createElement("a");
    anchor.href=url;anchor.download="Danh_muc_"+(selected?.code||"PVH")+".csv";
    document.body.append(anchor);anchor.click();anchor.remove();URL.revokeObjectURL(url);
    setFeedback({ok:true,message:"Đã xuất danh mục trong phạm vi đang hiển thị."});
  }
  return <div className="space-y-5">
    <header className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-3">
          <div className="rounded-xl bg-emerald-50 p-3 text-[#1F633E]"><Database aria-hidden="true" size={24}/></div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Danh mục dùng chung</h1>
            <p className="mt-1 text-sm text-slate-600">Quản lý dữ liệu danh mục theo xã, phân cấp và lưu lịch sử chỉnh sửa. Không xóa vĩnh viễn giá trị đã tham chiếu.</p>
            <p className="mt-2 flex items-center gap-2 text-xs text-slate-500"><ShieldCheck size={15}/> Dữ liệu hiển thị theo quyền cấp cho tài khoản và phạm vi đơn vị.</p>
          </div>
        </div>
        <p className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">{canManage?"Được quản lý":"Chỉ được tra cứu"}</p>
      </div>
    </header>
    {feedback&&<p role={feedback.ok?"status":"alert"} className={"rounded-lg border p-3 text-sm "+(feedback.ok?"border-emerald-200 bg-emerald-50 text-emerald-900":"border-rose-200 bg-rose-50 text-rose-900")}>
      {feedback.ok?<CheckCircle2 className="mr-2 inline" size={16}/>:<CircleAlert className="mr-2 inline" size={16}/>}
      {feedback.message}</p>}
    {(initial.catalogsTotal>initial.catalogs.length||initial.valuesTotal>initial.values.length||initial.historyTotal>initial.history.length)&&
      <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Số bản ghi vượt giới hạn tải một trang. Danh sách và lịch sử dưới đây là một phần dữ liệu; không suy ra đây là toàn bộ.
      </p>}
    <div className="grid gap-5 lg:grid-cols-[minmax(250px,0.85fr)_minmax(0,2fr)]">
      <aside className="space-y-4">
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 font-semibold text-slate-900">Nhóm danh mục ({initial.catalogsTotal})</h2>
          {initial.catalogs.length===0?<p className="text-sm text-slate-500">Chưa có danh mục nào. Người có quyền quản lý có thể tạo danh mục mới.</p>:
          <div className="space-y-1" role="group" aria-label="Chọn danh mục">
            {initial.catalogs.map(c=><button key={c.id} type="button" onClick={()=>{setSelectedId(c.id);setEditing(null);setQuery("");}}
              aria-pressed={selectedId===c.id} className={"w-full rounded-lg px-3 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 "+(selectedId===c.id?"bg-emerald-50 text-emerald-900":"text-slate-700 hover:bg-slate-50")}>
              <span className="block text-sm font-semibold">{c.label_vi}</span><span className="mt-0.5 block text-xs opacity-75">{c.code} · {c.is_active?"Đang sử dụng":"Ngừng sử dụng"}</span>
            </button>)}
          </div>}
        </section>
        {canManage&&<form onSubmit={createCatalog} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="flex items-center gap-2 font-semibold text-slate-900"><Plus size={17}/>Tạo nhóm danh mục</h2>
          <label className="block text-sm">Mã danh mục *
            <input className={inputClass} required maxLength={40} value={catalogDraft.code}
              onChange={e=>setCatalogDraft(x=>({...x,code:e.target.value.toUpperCase()}))}
              placeholder="VD: NHOM_HO_SO"/>
          </label>
          <label className="block text-sm">Tên tiếng Việt *
            <input className={inputClass} required maxLength={150} value={catalogDraft.labelVi}
              onChange={e=>setCatalogDraft(x=>({...x,labelVi:e.target.value}))}/>
          </label>
          <label className="block text-sm">Mô tả
            <textarea className={inputClass} maxLength={500} rows={2} value={catalogDraft.description}
              onChange={e=>setCatalogDraft(x=>({...x,description:e.target.value}))}/>
          </label>
          <button type="submit" disabled={pending} className={buttonClass}>{pending?"Đang lưu...":"Tạo danh mục"}</button>
        </form>}
      </aside>
      <main className="min-w-0 space-y-4">
        {!selected?<section className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Chọn nhóm danh mục để xem giá trị và lịch sử.</section>:<>
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-slate-900">{selected.label_vi}</h2>
            <p className="mt-1 text-sm text-slate-500">{selected.description||"Không có mô tả."}</p>
            {canManage&&<form onSubmit={updateCatalog} key={selected.id+"-"+selected.version} className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
              <label className="block text-sm">Tên hiển thị
                <input name="labelVi" required defaultValue={selected.label_vi} className={inputClass}/></label>
              <label className="block text-sm">Trạng thái
                <select name="isActive" defaultValue={String(selected.is_active)} className={inputClass}>
                  <option value="true">Đang sử dụng</option><option value="false">Ngừng sử dụng</option>
                </select></label>
              <label className="block text-sm sm:col-span-2">Mô tả
                <textarea name="description" defaultValue={selected.description} className={inputClass} rows={2}/></label>
              <button disabled={pending} className={buttonClass} type="submit">Lưu nhóm danh mục</button>
            </form>}
          </section>
          <section className="rounded-xl border border-slate-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
              <div className="flex gap-2">
                <button type="button" className={tab==="values"?"font-semibold text-emerald-800":"text-slate-500"} onClick={()=>setTab("values")}>Giá trị ({values.length})</button>
                <button type="button" className={"ml-3 inline-flex items-center gap-1 "+(tab==="history"?"font-semibold text-emerald-800":"text-slate-500")} onClick={()=>setTab("history")}><History size={15}/>Lịch sử ({selectedEvents.length})</button>
              </div>
              {tab==="values"&&<button type="button" onClick={exportCsv} disabled={initial.valuesTotal>initial.values.length||pending} className={secondaryClass}><Download size={15} className="mr-1 inline"/>Xuất CSV</button>}
            </div>
            {tab==="values"?<>
              <div className="relative p-4"><Search size={16} aria-hidden="true" className="absolute left-7 top-[26px] text-slate-400"/>
                <input aria-label="Tìm theo mã hoặc tên giá trị" className={inputClass+" !mt-0 pl-10"}
                  placeholder="Tìm theo mã hoặc tên giá trị..." value={query} onChange={e=>setQuery(e.target.value)}/>
              </div>
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600"><tr>
                    <th scope="col" className="p-3">Mã</th><th scope="col" className="p-3">Tên tiếng Việt</th>
                    <th scope="col" className="p-3">Cấp cha</th><th scope="col" className="p-3">Thứ tự</th>
                    <th scope="col" className="p-3">Trạng thái</th>{canManage&&<th scope="col" className="p-3">Thao tác</th>}
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map(v=><tr key={v.id}>
                      <td className="p-3 font-mono text-xs">{v.code}</td><td className="p-3 font-medium">{v.label_vi}</td>
                      <td className="p-3">{values.find(parent=>parent.id===v.parent_id)?.label_vi||"—"}</td>
                      <td className="p-3 tabular-nums">{v.sort_order}</td>
                      <td className="p-3">{v.is_active?"Đang dùng":"Ngừng dùng"}</td>
                      {canManage&&<td className="p-3"><button className={secondaryClass} onClick={()=>setEditing(v)} type="button">Sửa</button></td>}
                    </tr>)}
                    {filtered.length===0&&<tr><td colSpan={canManage?6:5} className="p-8 text-center text-slate-500">Không có giá trị phù hợp.</td></tr>}
                  </tbody>
                </table>
              </div>
            </>:<div className="divide-y divide-slate-100">
              {selectedEvents.length===0?<p className="p-6 text-sm text-slate-500">Chưa có lịch sử thay đổi.</p>:
              selectedEvents.map(e=><div key={e.id} className="flex flex-wrap justify-between gap-2 p-4 text-sm">
                <span className="font-medium text-slate-800">{eventLabel[e.action]||"Điều chỉnh dữ liệu"}</span>
                <span className="text-slate-500">{dateTime(e.created_at)}</span>
                <span className="w-full text-xs text-slate-500">Mã thao tác: {e.id}</span>
              </div>)}
            </div>}
          </section>
          {canManage&&tab==="values"&&<div className="grid gap-4 xl:grid-cols-2">
            <form onSubmit={createValue} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="font-semibold text-slate-900">Thêm giá trị danh mục</h3>
              <label className="block text-sm">Mã giá trị *<input className={inputClass} required maxLength={40}
                value={valueDraft.code} onChange={e=>setValueDraft(x=>({...x,code:e.target.value.toUpperCase()}))}/></label>
              <label className="block text-sm">Tên tiếng Việt *<input className={inputClass} required maxLength={150}
                value={valueDraft.labelVi} onChange={e=>setValueDraft(x=>({...x,labelVi:e.target.value}))}/></label>
              <label className="block text-sm">Giá trị cấp cha<select className={inputClass} value={valueDraft.parentId}
                onChange={e=>setValueDraft(x=>({...x,parentId:e.target.value}))}>
                <option value="">Không có (cấp gốc)</option>{values.filter(x=>x.is_active).map(v=><option key={v.id} value={v.id}>{v.label_vi}</option>)}
              </select></label>
              <label className="block text-sm">Thứ tự hiển thị<input className={inputClass} type="number" min={0} max={999999}
                value={valueDraft.sortOrder} onChange={e=>setValueDraft(x=>({...x,sortOrder:Number(e.target.value)}))}/></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm">Hiệu lực từ<input className={inputClass} type="date" value={valueDraft.validFrom}
                  onChange={e=>setValueDraft(x=>({...x,validFrom:e.target.value}))}/></label>
                <label className="block text-sm">Hiệu lực đến<input className={inputClass} type="date" value={valueDraft.validTo}
                  onChange={e=>setValueDraft(x=>({...x,validTo:e.target.value}))}/></label>
              </div>
              <button disabled={pending||!selected.is_active} className={buttonClass} type="submit">Thêm giá trị</button>
            </form>
            {editing?<form onSubmit={updateValue} key={editing.id+"-"+editing.version} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-slate-900">Sửa giá trị: {editing.code}</h3>
                <button type="button" className={secondaryClass} onClick={()=>setEditing(null)}>Đóng</button>
              </div>
              <label className="block text-sm">Tên tiếng Việt *<input name="labelVi" className={inputClass} required defaultValue={editing.label_vi}/></label>
              <label className="block text-sm">Giá trị cấp cha
                <select name="parentId" className={inputClass} defaultValue={editing.parent_id||""}>
                  <option value="">Không có (cấp gốc)</option>{activeParentOptions.map(v=><option key={v.id} value={v.id}>{v.label_vi}</option>)}
                </select></label>
              <label className="block text-sm">Thứ tự<input className={inputClass} name="sortOrder" type="number" min={0} max={999999} defaultValue={editing.sort_order}/></label>
              <label className="block text-sm">Trạng thái
                <select name="isActive" className={inputClass} defaultValue={String(editing.is_active)}>
                  <option value="true">Đang sử dụng</option><option value="false">Ngừng sử dụng</option>
                </select></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm">Hiệu lực từ<input className={inputClass} name="validFrom" type="date" defaultValue={editing.valid_from||""}/></label>
                <label className="block text-sm">Hiệu lực đến<input className={inputClass} name="validTo" type="date" defaultValue={editing.valid_to||""}/></label>
              </div>
              <button disabled={pending} className={buttonClass} type="submit">Lưu thay đổi</button>
            </form>:<section className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
              Chọn <strong>Sửa</strong> ở một giá trị để thay đổi phân cấp, thời hạn, trạng thái hoặc thứ tự. Lịch sử thao tác không bị xóa.
            </section>}
          </div>}
        </>}
      </main>
    </div>
  </div>;
}
