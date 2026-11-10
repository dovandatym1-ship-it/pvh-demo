"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { recordSocialAidPaymentAction } from "../server/actions";
import type { SocialBeneficiaryDisplayDTO } from "../types";
import { buildSocialHamletOptions, type HamletOption } from "../types/hamlet-options";
import { CheckCircle2, Clock, ShieldAlert, HeartHandshake, Plus } from "lucide-react";
import { CreateBeneficiaryModal } from "./create-beneficiary-modal";
import { useRouter } from "next/navigation";

interface BeneficiaryTableProps {
  readonly items: SocialBeneficiaryDisplayDTO[];
  readonly hamlets: readonly HamletOption[];
  readonly canUnmaskPII: boolean;
  readonly canManage: boolean;
}

export function BeneficiaryTable({ items, hamlets, canUnmaskPII, canManage }: BeneficiaryTableProps) {
  const [selectedHamlet, setSelectedHamlet] = React.useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("ALL");
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [reconcileId, setReconcileId] = React.useState<string | null>(null);
  const [sourceReference, setSourceReference] = React.useState("");
  const [requestKey, setRequestKey] = React.useState("");
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const router = useRouter();
  const hamletOptions = React.useMemo(() => buildSocialHamletOptions(items, hamlets), [items, hamlets]);
  const hamletNames = React.useMemo(() => new Map(hamletOptions.map(({ id, name }) => [id, name])), [hamletOptions]);

  const filtered = items.filter((item) => {
    if (selectedHamlet !== "ALL" && item.hamletId !== selectedHamlet) return false;
    if (selectedStatus !== "ALL" && item.paymentStatus !== selectedStatus) return false;
    return true;
  });

  const handlePay = async (id: string) => {
    if (sourceReference.trim().length < 5 || !requestKey) {
      setFeedback("Cần mã nguồn/chứng từ đối chiếu tối thiểu 5 ký tự.");return;
    }
    setPendingId(id);
    setFeedback(null);
    try {
      const result = await recordSocialAidPaymentAction({ beneficiaryId: id, sourceReference: sourceReference.trim(), idempotencyKey: requestKey });
      if (!result.ok) {
        setFeedback(result.error.message);
      } else {
        setFeedback("Đã tiếp nhận yêu cầu đối soát. Chưa xác nhận tiền đã được chi trả.");
        setReconcileId(null);setSourceReference("");setRequestKey("");
        router.refresh();
      }
    } catch {
      setFeedback("Không thể đối soát dữ liệu. Vui lòng thử lại.");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2">
          <HeartHandshake className="w-5 h-5 text-emerald-700" />
          <h3 className="font-semibold text-slate-800">Danh sách đối tượng bảo trợ xã hội</h3>
          <Badge variant="neutral">{filtered.length} đối tượng</Badge>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedHamlet}
            onChange={(e) => setSelectedHamlet(e.target.value)}
            className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-700"
          >
            <option value="ALL">Tất cả thôn, xóm</option>
            {hamletOptions.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-700"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Chưa xác nhận chi trả</option>
            <option value="PAID">Đã chi trả</option>
            <option value="SUSPENDED">Tạm dừng chi trả</option>
          </select>
          {canManage && <Button variant="primary" size="sm" disabled={hamlets.length===0} onClick={()=>setCreateOpen(true)}>
            <Plus className="mr-1 inline h-4 w-4" /> Tiếp nhận hồ sơ
          </Button>}
        </div>
      </div>

      {feedback && <p role="status" className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-slate-800">{feedback}</p>}
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Mã số</TableHead>
              <TableHead>Họ và tên</TableHead>
              <TableHead>CCCD</TableHead>
              <TableHead>Địa bàn</TableHead>
              <TableHead>Diện trợ cấp</TableHead>
              <TableHead className="text-right">Mức trợ cấp</TableHead>
              <TableHead>Bệnh lý hoặc tình trạng</TableHead>
              <TableHead className="text-center">Trạng thái</TableHead>
              {canManage && <TableHead className="text-right">Thao tác</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 9 : 8} className="text-center py-8 text-slate-500">
                  Không tìm thấy hồ sơ bảo trợ xã hội nào phù hợp điều kiện lọc.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs font-medium text-slate-600">
                    {item.code}
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">
                    {item.fullName}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    <span className={canUnmaskPII ? "text-slate-700" : "text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded"}>
                      {item.cccdDisplay}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{hamletNames.get(item.hamletId) ?? "Địa bàn chưa xác định"}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-700">
                    {item.aidCategory}
                  </TableCell>
                  <TableCell className="text-right font-medium text-xs text-slate-900">
                    {item.amountDisplay}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 max-w-xs truncate">
                    {item.diagnosisDisplay}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.paymentStatus === "PAID" ? (
                      <Badge variant="success">
                        <CheckCircle2 className="w-3 h-3 mr-1 inline" /> Đã chi trả
                      </Badge>
                    ) : item.paymentStatus === "SUSPENDED" ? (
                      <Badge variant="neutral"><ShieldAlert className="w-3 h-3 mr-1 inline" /> Tạm dừng chi trả</Badge>
                    ) : (
                      <Badge variant="warning">
                        <Clock className="w-3 h-3 mr-1 inline" /> Chưa chi trả
                      </Badge>
                    )}
                  </TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      {item.paymentStatus === "PENDING" && (
                        reconcileId===item.id ?
                          <div className="min-w-48 space-y-2">
                            <label className="block text-left text-xs text-slate-700">Mã nguồn/chứng từ đối soát
                              <input className="mt-1 w-full rounded border border-slate-300 p-2 text-sm"
                                value={sourceReference} onChange={event=>setSourceReference(event.target.value)}
                                placeholder="Mã bảng kê hoặc chứng từ" maxLength={200}/>
                            </label>
                            <div className="flex justify-end gap-2">
                              <Button size="xs" variant="outline" onClick={()=>{setReconcileId(null);setSourceReference("");}}>Hủy</Button>
                              <Button size="xs" variant="primary" disabled={pendingId===item.id||sourceReference.trim().length<5}
                                onClick={()=>handlePay(item.id)}>{pendingId===item.id?"Đang gửi...":"Gửi yêu cầu"}</Button>
                            </div>
                          </div> :
                          <Button variant="secondary" size="xs" disabled={pendingId!==null}
                            onClick={()=>{setReconcileId(item.id);setSourceReference("");setRequestKey(crypto.randomUUID());}}>
                            Lập yêu cầu đối soát
                          </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CreateBeneficiaryModal isOpen={createOpen} onClose={()=>setCreateOpen(false)}
        hamlets={hamlets} onSuccess={()=>router.refresh()}/>

      {!canUnmaskPII && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 rounded border border-amber-200 text-xs text-amber-800">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-700" />
          <span>
            Thông tin căn cước, y tế và khoản hỗ trợ đã được ẩn theo quyền truy cập của tài khoản.
          </span>
        </div>
      )}
    </div>
  );
}
