"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { maskPII } from "@/lib/authorization/pii-mask";
import { recordSocialAidPaymentAction } from "../server/actions";
import { CreateBeneficiaryModal } from "./create-beneficiary-modal";
import type { SocialBeneficiaryDTO } from "../types";
import { CheckCircle2, Clock, ShieldAlert, HeartHandshake, Plus, Search } from "lucide-react";

interface BeneficiaryTableProps {
  readonly items: SocialBeneficiaryDTO[];
  readonly canUnmaskPII: boolean;
  readonly canManage: boolean;
}

export function BeneficiaryTable({ items: initialItems, canUnmaskPII, canManage }: BeneficiaryTableProps) {
  const [items, setItems] = React.useState<SocialBeneficiaryDTO[]>(initialItems);
  const [selectedHamlet, setSelectedHamlet] = React.useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [successToast, setSuccessToast] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    return items.filter((item) => {
      if (selectedHamlet !== "ALL" && item.hamletId !== selectedHamlet) return false;
      if (selectedStatus !== "ALL" && item.paymentStatus !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!item.fullName.toLowerCase().includes(q) && !item.cccd.toLowerCase().includes(q) && !item.code.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [items, selectedHamlet, selectedStatus, searchQuery]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handlePay = async (id: string) => {
    setPendingId(id);
    try {
      const res = await recordSocialAidPaymentAction({ beneficiaryId: id });
      if (res.ok) {
        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, paymentStatus: "PAID" } : item)));
        showToast("Đã ghi nhận chi trả trợ cấp xã hội thành công!");
      } else {
        alert(res.error.message || "Không thể thực hiện chi trả");
      }
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {successToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-700 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{successToast}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2">
          <HeartHandshake className="w-5 h-5 text-emerald-700" />
          <h3 className="font-semibold text-slate-800 text-sm">Hồ sơ đối tượng bảo trợ xã hội</h3>
          <Badge variant="neutral">{filtered.length} đối tượng</Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Tìm theo họ tên, CCCD..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <select
            value={selectedHamlet}
            onChange={(e) => setSelectedHamlet(e.target.value)}
            className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-700"
          >
            <option value="ALL">Tất cả thôn/xóm</option>
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

          {canManage && (
            <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)} className="flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              <span>Thêm đối tượng</span>
            </Button>
          )}
        </div>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Mã số</TableHead>
              <TableHead>Họ và tên</TableHead>
              <TableHead>CCCD (PII)</TableHead>
              <TableHead>Địa bàn</TableHead>
              <TableHead>Diện trợ cấp</TableHead>
              <TableHead className="text-right">Mức trợ cấp</TableHead>
              <TableHead>Bệnh lý / Tình trạng</TableHead>
              <TableHead className="text-center">Trạng thái</TableHead>
              {canManage && <TableHead className="text-right">Tác vụ</TableHead>}
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
                  <TableCell className="font-mono text-xs font-medium text-slate-600">{item.code}</TableCell>
                  <TableCell className="font-medium text-slate-900">{item.fullName}</TableCell>
                  <TableCell className="font-mono text-xs">
                    <span className={canUnmaskPII ? "text-slate-700" : "text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded"}>
                      {maskPII(item.cccd, "cccd", canUnmaskPII)}
                    </span>
                  </TableCell>
                  <TableCell><Badge variant="neutral">Xóm {item.hamletId}</Badge></TableCell>
                  <TableCell className="text-xs text-slate-700">{item.aidCategory}</TableCell>
                  <TableCell className="text-right font-medium text-xs text-slate-900">
                    {maskPII(item.monthlyAmount, "money", canUnmaskPII)}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 max-w-xs truncate">
                    {maskPII(item.diagnosis || "Bình thường", "medical", canUnmaskPII)}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.paymentStatus === "PAID" ? (
                      <Badge variant="success"><CheckCircle2 className="w-3 h-3 mr-1 inline" /> Đã chi trả</Badge>
                    ) : (
                      <Badge variant="warning"><Clock className="w-3 h-3 mr-1 inline" /> Chưa chi trả</Badge>
                    )}
                  </TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      {item.paymentStatus === "PENDING" && (
                        <Button variant="secondary" size="xs" disabled={pendingId === item.id} onClick={() => handlePay(item.id)}>
                          {pendingId === item.id ? "Đang ghi..." : "Chi trả"}
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
            Chính sách bảo mật PII (ADR-002 / D03): Dữ liệu căn cước công dân và chẩn đoán bệnh án được che giấu đối với vai trò hiện tại.
          </span>
        </div>
      )}

      <CreateBeneficiaryModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(newItem) => {
          setItems((prev) => [newItem, ...prev]);
          showToast(`Đã thêm đối tượng bảo trợ [${newItem.code}] thành công!`);
        }}
      />
    </div>
  );
}
