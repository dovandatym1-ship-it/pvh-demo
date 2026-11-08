"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createIllustrativeRulePackAction, createCultureCampaignAction,
  submitCultureDossierAction, reviewCultureDossierAction } from "../server/ph03-actions";
import type { CultureCampaign, CultureDossier, HamletOption, TitleType } from "../server/ph03-queries";

type Props = {kind:TitleType;campaigns:CultureCampaign[];dossiers:CultureDossier[];
  hamlets:HamletOption[];canSubmit:boolean;canReview:boolean};
const field="rounded border border-slate-300 px-3 py-2 text-sm w-full";
const button="rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-40";
const names:Record<TitleType,string>={GIA_DINH:"Gia đình văn hóa",THON:"Thôn/Xóm văn hóa",XA_TIEU_BIEU:"Xã tiêu biểu"};

export function CultureWorkspace({kind,campaigns,dossiers,hamlets,canSubmit,canReview}:Props) {
  const router=useRouter();
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [campaignId,setCampaignId]=useState(campaigns.find(c=>c.status==="OPEN")?.id??"");
  const [subjectRef,setSubjectRef]=useState("");
  const [subjectName,setSubjectName]=useState("");
  const [hamletId,setHamletId]=useState(hamlets[0]?.id??"");
  const [sourceRef,setSourceRef]=useState("");
  const [reviewId,setReviewId]=useState("");
  const [reviewStatus,setReviewStatus]=useState("THIEU_MINH_CHUNG");
  const [reviewScore,setReviewScore]=useState("");
  const [reason,setReason]=useState("");
  const [newYear,setNewYear]=useState(new Date().getFullYear());
  const [campaignTitle,setCampaignTitle]=useState("");
  const retryKey=useRef<string|null>(null);
  const chosen=campaigns.find(c=>c.id===campaignId);
  const reviewDossier=dossiers.find(d=>d.id===reviewId);
  const reviewCampaign=campaigns.find(c=>c.id===reviewDossier?.campaignId);
  const reviewRuleVerified=reviewCampaign?.ruleStatus==="VERIFIED";
  function resetRetryKey(){retryKey.current=null;}

  async function createCampaign(event:FormEvent) {
    event.preventDefault();setBusy(true);setMessage("");
    try {
      const pack=await createIllustrativeRulePackAction({
        titleType:kind,version:Math.floor(Date.now()/1000),jurisdiction:"MINH HỌA / CHƯA XÁC MINH",
        criteria:[],minScore:null,
      });
      if(!pack.ok) throw new Error(pack.error.message);
      const opened=await createCultureCampaignAction({
        rulePackId:pack.data.id,year:newYear,title:campaignTitle,
        closesAt:new Date(Date.UTC(newYear,11,31,16,59,59)).toISOString(),
      });
      if(!opened.ok) throw new Error(opened.error.message);
      setCampaignId(opened.data.id);
      setMessage("Đã mở đợt minh họa; không có giá trị công nhận.");router.refresh();
    } catch(error) {setMessage(error instanceof Error?error.message:"Không thể mở đợt");}
    finally {setBusy(false);}
  }
  async function submit(event:FormEvent) {
    event.preventDefault();setBusy(true);setMessage("");
    retryKey.current??=crypto.randomUUID();
    try {
      const result=await submitCultureDossierAction({
        campaignId,subjectRef,subjectName,hamletId,sourceRef,idempotencyKey:retryKey.current,
      });
      if(!result.ok) throw new Error(result.error.message);
      retryKey.current=null;setSubjectRef("");setSubjectName("");setSourceRef("");
      setMessage("CSDL đã tiếp nhận hồ sơ nội bộ, chưa phải kết quả công nhận.");router.refresh();
    }catch(error){setMessage(error instanceof Error?error.message:"Không gửi được hồ sơ");}
    finally{setBusy(false);}
  }
  async function review(event:FormEvent) {
    event.preventDefault();if(!reviewDossier)return;
    setBusy(true);setMessage("");
    try {
      const result=await reviewCultureDossierAction({
        submissionId:reviewDossier.id,status:reviewStatus,
        score:reviewScore.trim()===""?null:Number(reviewScore),
        reason,expectedVersion:reviewDossier.version,evidenceId:null,
      });
      if(!result.ok) throw new Error(result.error.message);
      setReviewId("");setReason("");setReviewScore("");
      setMessage("Đã lưu rà soát nội bộ; quyết định chính thức chưa được tạo.");router.refresh();
    }catch(error){setMessage(error instanceof Error?error.message:"Không lưu được rà soát");}
    finally{setBusy(false);}
  }

  return <div className="space-y-6">
    <div className="rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
      <strong>CHẾ ĐỘ MINH HỌA – CHƯA XÁC MINH CĂN CỨ PHÁP LÝ.</strong>
      {" "}Đây là hồ sơ và trạng thái rà soát nội bộ; không có chức năng ký, ban hành
      hoặc công nhận danh hiệu. Mỗi đợt gắn một phiên bản tiêu chí cố định.
    </div>

    {canReview&&<form onSubmit={createCampaign} className="rounded bg-white border p-4 space-y-3">
      <h2 className="font-semibold">Mở đợt {names[kind]} (minh họa)</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <input className={field} type="number" min={2000} max={2200} value={newYear}
          onChange={e=>setNewYear(Number(e.target.value))} aria-label="Năm bình xét"/>
        <input className={field+" sm:col-span-2"} required minLength={3}
          placeholder="Tên đợt bình xét" value={campaignTitle}
          onChange={e=>setCampaignTitle(e.target.value)}/>
      </div>
      <button className={button} disabled={busy}>Tạo bộ tiêu chí minh họa và mở đợt</button>
    </form>}

    <div className="rounded bg-white border p-4 space-y-3">
      <h2 className="font-semibold">Đợt đang theo dõi</h2>
      <select className={field} value={campaignId} onChange={e=>{setCampaignId(e.target.value);resetRetryKey();setReviewId("");}}>
        <option value="">Chọn đợt bình xét</option>
        {campaigns.map(c=><option key={c.id} value={c.id}>{c.title} · {c.year} · {c.status}
          {" "}· quy tắc v{c.ruleVersion} ({c.ruleStatus})</option>)}
      </select>
      {chosen&&<p className="text-sm text-slate-600">Hạn tiếp nhận: {new Date(chosen.closesAt).toLocaleDateString("vi-VN")}.
        {" "}Quy tắc: {chosen.ruleStatus}; không phát hành kết quả chính thức.</p>}
    </div>

    {canSubmit&&<form onSubmit={submit} className="rounded bg-white border p-4 space-y-3">
      <h2 className="font-semibold">Tiếp nhận hồ sơ có nguồn</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={field} required placeholder="Mã đối tượng/hồ sơ nguồn"
          value={subjectRef} onChange={e=>{setSubjectRef(e.target.value);resetRetryKey();}}/>
        <input className={field} required placeholder={kind==="THON"?"Tên thôn/xóm":"Tên đại diện hồ sơ"}
          value={subjectName} onChange={e=>{setSubjectName(e.target.value);resetRetryKey();}}/>
        <select className={field} value={hamletId} onChange={e=>{setHamletId(e.target.value);resetRetryKey();}} required>
          <option value="">Chọn địa bàn được phân quyền</option>
          {hamlets.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
        <input className={field} required placeholder="Nguồn tiếp nhận (số văn bản/biểu mẫu)"
          value={sourceRef} onChange={e=>{setSourceRef(e.target.value);resetRetryKey();}}/>
      </div>
      <button className={button} disabled={busy||!chosen||chosen.status!=="OPEN"||!hamlets.length}>
        Gửi hồ sơ vào đợt
      </button>
    </form>}

    <div className="overflow-x-auto rounded border bg-white">
      <table className="min-w-full text-sm text-left">
        <thead className="bg-slate-100"><tr>{["Mã nguồn","Đối tượng","Địa bàn","Trạng thái nội bộ",
          "Điểm","Phiên bản","Nguồn","Rà soát"].map(x=><th key={x} className="p-3">{x}</th>)}</tr></thead>
        <tbody>{dossiers.filter(d=>!campaignId||d.campaignId===campaignId).map(d=><tr key={d.id} className="border-t">
          <td className="p-3">{d.subjectRef}</td><td className="p-3">{d.subjectName}</td>
          <td className="p-3">{hamlets.find(h=>h.id===d.hamletId)?.name??"Trong phạm vi"}</td>
          <td className="p-3">{d.status}</td><td className="p-3">{d.score??"Chưa đánh giá"}</td>
          <td className="p-3">v{d.ruleVersion} / #{d.version}</td>
          <td className="p-3">{d.sourceRef}</td>
          <td className="p-3">{canReview&&!["DAT","KHONG_DAT"].includes(d.status)&&<button
            type="button" className="text-emerald-800 underline"
            onClick={()=>setReviewId(d.id)}>Rà soát</button>}</td>
        </tr>)}</tbody>
      </table>
      {!dossiers.length&&<p className="p-6 text-center text-slate-500">Chưa có hồ sơ trong CSDL.</p>}
    </div>

    {reviewDossier&&<form onSubmit={review} className="rounded bg-white border p-4 space-y-3">
      <h2 className="font-semibold">Rà soát nội bộ · {reviewDossier.subjectName}</h2>
      <select className={field} value={reviewStatus} onChange={e=>setReviewStatus(e.target.value)}>
        <option value="THIEU_MINH_CHUNG">Thiếu minh chứng</option>
        <option value="YEU_CAU_BO_SUNG">Yêu cầu bổ sung</option>
        <option value="KHONG_DAT">Chưa đạt đánh giá nội bộ</option>
        {reviewRuleVerified&&<option value="DAT">Đủ điều kiện theo pack đã xác minh</option>}
      </select>
      <input className={field} type="number" min="0" step="0.01" placeholder="Điểm nội bộ (nếu có)"
        value={reviewScore} onChange={e=>setReviewScore(e.target.value)}/>
      <textarea className={field} required minLength={5} placeholder="Lý do/căn cứ rà soát"
        value={reason} onChange={e=>setReason(e.target.value)}/>
      <button className={button} disabled={busy}>Lưu rà soát</button>
    </form>}
    {message&&<p role="status" className="rounded border bg-white p-3 text-sm">{message}</p>}
  </div>;
}
