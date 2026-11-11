"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { resolveLaborDisputeAction } from "../server/actions";
import { useRouter } from "next/navigation";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import type { LaborContractDTO, LaborDisputeDTO } from "../types";
import { Briefcase, Scale, CheckCircle2, Clock } from "lucide-react";

interface LaborPanelsProps {
  readonly contracts: LaborContractDTO[];
  readonly disputes: LaborDisputeDTO[];
  readonly canManage: boolean;
}

export function LaborPanels({ contracts, disputes, canManage }: LaborPanelsProps) {
  const router=useRouter();
  const [editing,setEditing]=React.useState<LaborDisputeDTO|null>(null);
  const [outcome,setOutcome]=React.useState("");
  const [source,setSource]=React.useState("");
  const [status,setStatus]=React.useState<"SCHEDULED"|"RESOLVED_SUCCESS"|"RESOLVED_FAILED">("SCHEDULED");
  const [pending,setPending]=React.useState(false);
  const [feedback,setFeedback]=React.useState<{ok:boolean;message:string}|null>(null);

  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();if(!editing||pending||!canManage)return;
    setPending(true);setFeedback(null);
    try{
      const result=await resolveLaborDisputeAction({
        disputeId:editing.id,status,outcome:outcome.trim(),decisionReference:source.trim(),expectedVersion:editing.version,
      });
      if(!result.ok){setFeedback({ok:false,message:result.error.message});return;}
      setFeedback({ok:true,message:"Đã ghi nhận kết quả xử lý từ chứng từ nguồn và lưu nhật ký."});
      setEditing(null);setOutcome("");setSource("");router.refresh();
    }catch{setFeedback({ok:false,message:"Không thể kết nối. Hồ sơ chưa được thay đổi."});}
    finally{setPending(false);}
  }

  const [tab, setTab] = React.useState<"contracts" | "disputes">("contracts");

  return (
    <div className="space-y-4">
      {feedback&&<p role={feedback.ok?"status":"alert"} className={feedback.ok?"rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900":"rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900"}>{feedback.message}</p>}
      {editing&&canManage&&<form onSubmit={submit} className="grid gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 sm:grid-cols-2">
        <p className="font-semibold sm:col-span-2">Ghi nhận xử lý vụ việc {editing.code}</p>
        <label className="text-sm">Trạng thái xử lý
          <select value={status} onChange={e=>setStatus(e.target.value as typeof status)} className="mt-1 min-h-10 w-full rounded border p-2">
            <option value="SCHEDULED">Lên lịch hòa giải</option>
            <option value="RESOLVED_SUCCESS">Hòa giải thành</option>
            <option value="RESOLVED_FAILED">Hòa giải không thành</option>
          </select></label>
        <label className="text-sm">Mã biên bản/văn bản nguồn *
          <input className="mt-1 min-h-10 w-full rounded border p-2" required minLength={5} maxLength={200}
            value={source} onChange={e=>setSource(e.target.value)}/></label>
        <label className="text-sm sm:col-span-2">Nội dung kết quả *
          <textarea className="mt-1 w-full rounded border p-2" required minLength={5} maxLength={2000}
            value={outcome} onChange={e=>setOutcome(e.target.value)} rows={3}/></label>
        <div className="flex gap-2 sm:col-span-2">
          <Button variant="secondary" size="sm" disabled={pending||source.trim().length<5||outcome.trim().length<5}
            type="submit">{pending?"Đang ghi...":"Ghi nhận kết quả"}</Button>
          <Button variant="outline" size="sm" type="button" onClick={()=>setEditing(null)}>Hủy</Button>
        </div>
      </form>}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setTab("contracts")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            tab === "contracts"
              ? "border-[#1F633E] text-[#1F633E]"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Tiền lương và bảo hiểm xã hội tại cơ sở ({contracts.length})
        </button>
        <button
          onClick={() => setTab("disputes")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            tab === "disputes"
              ? "border-[#1F633E] text-[#1F633E]"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Scale className="w-4 h-4" />
          Hòa giải tranh chấp lao động ({disputes.length})
        </button>
      </div>

      {tab === "contracts" && (
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doanh nghiệp / HTX / Cơ sở</TableHead>
                <TableHead>Mã số thuế</TableHead>
                <TableHead className="text-center">Tổng lao động</TableHead>
                <TableHead className="text-right">Mức lương thấp nhất</TableHead>
                <TableHead className="text-center">Tham gia BHXH</TableHead>
                <TableHead className="text-right">Chuẩn lương tối thiểu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-semibold text-slate-900">
                    {item.businessName}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-600">
                    {item.taxCode}
                  </TableCell>
                  <TableCell className="text-center text-xs">
                    <span className="font-semibold text-slate-900">{item.totalWorkers}</span> người
                  </TableCell>
                  <TableCell className="text-right font-medium text-xs text-slate-900">
                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(item.minWagePaid)}
                  </TableCell>
                  <TableCell className="text-center text-xs">
                    <span className="font-semibold text-emerald-700">{item.bhxhRegisteredCount}</span> / {item.totalWorkers}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.isUnderMinWage ? (
                      <Badge variant="danger">Dưới chuẩn vùng</Badge>
                    ) : (
                      <Badge variant="success">Đạt chuẩn vùng</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {tab === "disputes" && (
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">Mã vụ việc</TableHead>
                <TableHead>Bên yêu cầu</TableHead>
                <TableHead>Bên bị yêu cầu</TableHead>
                <TableHead>Nội dung tranh chấp</TableHead>
                <TableHead>Ngày tiếp nhận</TableHead>
                <TableHead className="text-center">Trạng thái</TableHead>
                <TableHead className="text-right">Kết quả hòa giải</TableHead>
                {canManage&&<TableHead className="text-right">Tác vụ</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {disputes.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs font-semibold text-slate-600">
                    {item.code}
                  </TableCell>
                  <TableCell className="font-medium text-slate-900 text-xs">
                    {item.requesterName} ({item.requesterRole === "EMPLOYEE" ? "Người LĐ" : "Người SDLĐ"})
                  </TableCell>
                  <TableCell className="text-xs text-slate-700">
                    {item.respondentName}
                  </TableCell>
                  <TableCell className="text-xs text-slate-700 max-w-xs truncate">
                    {item.disputeContent}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 font-mono">
                    {item.receivedDate}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.status === "RESOLVED_SUCCESS" ? (
                      <Badge variant="success">
                        <CheckCircle2 className="w-3 h-3 mr-1 inline" /> Thành công
                      </Badge>
                    ) : (
                      <Badge variant="warning">
                        <Clock className="w-3 h-3 mr-1 inline" /> Đang thụ lý
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-xs text-slate-600 italic">
                    {item.outcomeSummary || "Chưa có biên bản kết quả"}
                  </TableCell>
                  {canManage&&<TableCell className="text-right">
                    {["RECEIVED","SCHEDULED"].includes(item.status)&&<Button size="xs" variant="outline"
                      disabled={pending} onClick={()=>{setEditing(item);setOutcome("");setSource("");setStatus("SCHEDULED");setTab("disputes");}}>
                      Ghi nhận xử lý
                    </Button>}
                  </TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
