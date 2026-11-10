"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { approveTuitionExemptionAction } from "../server/actions";
import type { TuitionExemptionDTO } from "../types";
import { BookOpen, CheckCircle2, Clock, XCircle } from "lucide-react";

interface ExemptionTableProps {
  readonly items: TuitionExemptionDTO[];
  readonly canManage: boolean;
}

export function ExemptionTable({ items, canManage }: ExemptionTableProps) {
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [decision, setDecision] = React.useState<{id:string;status:"APPROVED"|"REJECTED";version:number}|null>(null);
  const [decisionReference, setDecisionReference] = React.useState("");
  const [feedback, setFeedback] = React.useState<{ok:boolean;message:string}|null>(null);
  const router = useRouter();

  const handleDecision = async () => {
    if(!decision || decisionReference.trim().length<5 || pendingId)return;
    setPendingId(decision.id);setFeedback(null);
    try {
      const result=await approveTuitionExemptionAction({
        exemptionId:decision.id,status:decision.status,
        expectedVersion:decision.version,decisionReference:decisionReference.trim(),
      });
      if(!result.ok){setFeedback({ok:false,message:result.error.message});return;}
      setFeedback({ok:true,message:"Đã ghi nhận kết quả từ nguồn có thẩm quyền và lưu nhật ký."});
      setDecision(null);setDecisionReference("");router.refresh();
    } catch {
      setFeedback({ok:false,message:"Không thể xác nhận hồ sơ. Chưa có thay đổi được ghi nhận."});
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-700" />
          <h3 className="font-semibold text-slate-800">
            Chính sách miễn, giảm học phí và hỗ trợ chi phí học tập
          </h3>
          <Badge variant="neutral">{items.length} học sinh</Badge>
        </div>
      </div>

      {feedback&&<p role={feedback.ok?"status":"alert"} className={feedback.ok?"rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900":"rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900"}>{feedback.message}</p>}
      {decision&&<div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-semibold">Xác nhận {decision.status==="APPROVED"?"đủ căn cứ duyệt":"kết quả từ chối"} hồ sơ</p>
        <label className="block text-sm">Mã văn bản/hồ sơ từ nguồn có thẩm quyền *
          <input required minLength={5} maxLength={200} value={decisionReference}
            onChange={event=>setDecisionReference(event.target.value)}
            className="mt-1 min-h-10 w-full rounded border border-slate-300 bg-white px-3 text-sm"
            placeholder="Nhập mã văn bản đã được xác minh" />
        </label>
        <p className="text-xs text-amber-900">Chỉ ghi quyết định đã có căn cứ và đúng thẩm quyền; không tự ban hành quyết định.</p>
        <div className="flex gap-2"><Button size="sm" variant="secondary"
          disabled={Boolean(pendingId)||decisionReference.trim().length<5}
          onClick={handleDecision}>Ghi nhận kết quả</Button>
          <Button size="sm" variant="outline" onClick={()=>{setDecision(null);setDecisionReference("");}}>Hủy</Button>
        </div>
      </div>}
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Học sinh</TableHead>
              <TableHead>Trường học và lớp</TableHead>
              <TableHead>Đối tượng miễn giảm</TableHead>
              <TableHead className="text-center">Tỷ lệ miễn giảm</TableHead>
              <TableHead className="text-right">Mức hỗ trợ/tháng</TableHead>
              <TableHead className="text-center">Trạng thái</TableHead>
              {canManage && <TableHead className="text-right">Tác vụ</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-semibold text-slate-900">
                  {item.studentName}
                </TableCell>
                <TableCell className="text-xs text-slate-700">
                  <div className="font-medium text-slate-900">{item.schoolName}</div>
                  <div className="text-slate-500">{item.grade}</div>
                </TableCell>
                <TableCell className="text-xs text-slate-700">
                  {item.category === "POOR_HOUSEHOLD"
                    ? "Hộ nghèo"
                    : item.category === "NEAR_POOR"
                    ? "Hộ cận nghèo"
                    : item.category === "ORPHAN"
                    ? "Trẻ mồ côi"
                    : "Khuyết tật"}
                </TableCell>
                <TableCell className="text-center font-semibold text-xs text-slate-900">
                  {item.exemptionPercent}%
                </TableCell>
                <TableCell className="text-right font-medium text-xs text-slate-900">
                  {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(item.supportAmount)}
                </TableCell>
                <TableCell className="text-center">
                  {item.status === "APPROVED" ? (
                    <Badge variant="success">
                      <CheckCircle2 className="w-3 h-3 mr-1 inline" /> Đã duyệt
                    </Badge>
                  ) : item.status === "REJECTED" ? (
                    <Badge variant="danger">
                      <XCircle className="w-3 h-3 mr-1 inline" /> Từ chối
                    </Badge>
                  ) : (
                    <Badge variant="warning">
                      <Clock className="w-3 h-3 mr-1 inline" /> Chờ xét duyệt
                    </Badge>
                  )}
                </TableCell>
                {canManage && (
                  <TableCell className="text-right">
                    {item.status === "PENDING" && (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="xs"
                          disabled={pendingId !== null}
                          onClick={() => {setDecision({id:item.id,status:"APPROVED",version:item.version});setDecisionReference("");}}
                        >
                          Duyệt
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          disabled={pendingId !== null}
                          onClick={() => {setDecision({id:item.id,status:"REJECTED",version:item.version});setDecisionReference("");}}
                        >
                          Từ chối
                        </Button>
                      </div>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
