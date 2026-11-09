"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { recordSocialAidPaymentAction } from "../server/actions";
import type { SocialBeneficiaryDisplayDTO } from "../types";
import { CheckCircle2, Clock, ShieldAlert, HeartHandshake } from "lucide-react";
import { useRouter } from "next/navigation";

interface BeneficiaryTableProps {
  readonly items: SocialBeneficiaryDisplayDTO[];
  readonly canUnmaskPII: boolean;
  readonly canManage: boolean;
}

export function BeneficiaryTable({ items, canUnmaskPII, canManage }: BeneficiaryTableProps) {
  const [selectedHamlet, setSelectedHamlet] = React.useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("ALL");
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const router = useRouter();

  const filtered = items.filter((item) => {
    if (selectedHamlet !== "ALL" && item.hamletId !== selectedHamlet) return false;
    if (selectedStatus !== "ALL" && item.paymentStatus !== selectedStatus) return false;
    return true;
  });

  const handlePay = async (id: string) => {
    setPendingId(id);
    setFeedback(null);
    try {
      const result = await recordSocialAidPaymentAction({ beneficiaryId: id });
      if (!result.ok) {
        setFeedback(result.error.message);
      } else {
        setFeedback("Đã ghi nhận kết quả đối soát từ nguồn có thẩm quyền.");
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

        <div className="flex items-center gap-3">
          <select
            value={selectedHamlet}
            onChange={(e) => setSelectedHamlet(e.target.value)}
            className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-700"
          >
            <option value="ALL">Tất cả thôn, xóm</option>
            <option value="A1">Xóm A1</option>
            <option value="A2">Xóm A2</option>
            <option value="A3">Xóm A3</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-700"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Chưa chi trả</option>
            <option value="PAID">Đã chi trả</option>
          </select>
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
                    <Badge variant="neutral">Xóm {item.hamletId}</Badge>
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
                    ) : (
                      <Badge variant="warning">
                        <Clock className="w-3 h-3 mr-1 inline" /> Chưa chi trả
                      </Badge>
                    )}
                  </TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      {item.paymentStatus === "PENDING" && (
                        <Button
                          variant="secondary"
                          size="xs"
                          disabled={pendingId === item.id}
                          onClick={() => handlePay(item.id)}
                        >
                          {pendingId === item.id ? "Đang ghi..." : "Ghi nhận đối soát"}
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

      {!canUnmaskPII && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 rounded border border-amber-200 text-xs text-amber-800">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-700" />
          <span>
            Chính sách bảo mật PII (ADR-002 / D03): Các trường căn cước, y tế và khoản hỗ trợ đã được xử lý theo quyền truy cập trước khi gửi đến trình duyệt.
          </span>
        </div>
      )}
    </div>
  );
}
