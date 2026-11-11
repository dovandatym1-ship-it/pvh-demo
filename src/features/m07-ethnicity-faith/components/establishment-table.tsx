"use client";

import React, { useState, useMemo } from "react";
import type { ReligiousEstablishmentDTO } from "../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Landmark, Plus, Search, Eye, CheckCircle2 } from "lucide-react";
import { CreateEstablishmentModal } from "./create-establishment-modal";
import { useRouter } from "next/navigation";
import type { FaithHamletOption } from "../server/queries";

interface EstablishmentTableProps {
  items: ReligiousEstablishmentDTO[];
  userPermissions?: readonly string[];
  hamlets: readonly FaithHamletOption[];
}

export function EstablishmentTable({
  items: initialItems,
  userPermissions = [],
  hamlets,
}: EstablishmentTableProps) {
  const [items, setItems] = useState<ReligiousEstablishmentDTO[]>(initialItems);
  const router = useRouter();
  const hamletNames = useMemo(() => new Map(hamlets.map(h => [h.id,h.name])), [hamlets]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [selectedItem, setSelectedItem] = useState<ReligiousEstablishmentDTO | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const canManage = userPermissions.includes("m07:faith:manage");

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (typeFilter !== "ALL" && item.religionType !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!item.name.toLowerCase().includes(q) && !item.representativeName.toLowerCase().includes(q) && !item.code.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [items, typeFilter, searchQuery]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const getReligionBadge = (type: string) => {
    switch (type) {
      case "PHAT_GIAO": return <Badge variant="warning">Phật giáo</Badge>;
      case "TIN_LANH": return <Badge variant="info">Tin Lành</Badge>;
      case "CONG_GIAO": return <Badge variant="neutral">Công giáo</Badge>;
      default: return <Badge variant="neutral">Tín ngưỡng</Badge>;
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
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm theo tên cơ sở, người đại diện..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-700"
          >
            <option value="ALL">Tất cả tôn giáo</option>
            <option value="PHAT_GIAO">Phật giáo</option>
            <option value="TIN_LANH">Tin Lành</option>
            <option value="CONG_GIAO">Công giáo</option>
            <option value="TIN_NGUONG_DAN_GIAN">Tín ngưỡng dân gian</option>
          </select>

          {canManage && (
            <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)} className="flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              <span>Đăng ký cơ sở</span>
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white shadow-xs">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4 w-24">Mã số</th>
              <th className="py-3 px-4">Tên cơ sở / Điểm nhóm</th>
              <th className="py-3 px-4 w-36">Tôn giáo</th>
              <th className="py-3 px-4">Người đại diện</th>
              <th className="py-3 px-4 w-28">Địa bàn</th>
              <th className="py-3 px-4 w-24 text-right">Tín đồ</th>
              <th className="py-3 px-4 text-right w-24">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  <Landmark className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  Chưa có cơ sở tôn giáo nào phù hợp với bộ lọc hiện tại.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{item.code}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900 truncate max-w-xs">{item.name}</td>
                  <td className="py-3 px-4">{getReligionBadge(item.religionType)}</td>
                  <td className="py-3 px-4 text-slate-700">{item.representativeName}</td>
                  <td className="py-3 px-4 text-slate-600">{hamletNames.get(item.hamletId) ?? "Địa bàn chưa xác định"}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900 text-right font-mono">
                    {item.followerCount.toLocaleString("vi-VN")}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button size="xs" variant="outline" onClick={() => setSelectedItem(item)} className="h-7 text-[11px]">
                      <Eye className="w-3 h-3 mr-1" /> Xem
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedItem && (
        <Modal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          title="Thông tin cơ sở tín ngưỡng / tôn giáo"
          description={`Mã quản lý: ${selectedItem.code}`}
          footer={
            <Button variant="outline" size="sm" onClick={() => setSelectedItem(null)}>
              Đóng
            </Button>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="text-sm font-bold text-slate-900">{selectedItem.name}</h4>
              <p className="text-slate-600 mt-1">Địa chỉ: {selectedItem.address}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-500 block">Tôn giáo:</span>
                <span className="mt-0.5 inline-block">{getReligionBadge(selectedItem.religionType)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Người đại diện:</span>
                <span className="font-semibold text-slate-800">{selectedItem.representativeName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Địa bàn hành chính:</span>
                <span className="font-semibold text-slate-800">{hamletNames.get(selectedItem.hamletId) ?? "Địa bàn chưa xác định"}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Tín đồ sinh hoạt:</span>
                <span className="font-semibold text-slate-900 font-mono">{selectedItem.followerCount} người</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      <CreateEstablishmentModal
        hamlets={hamlets}
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(newItem) => {
          setItems((prev) => [newItem, ...prev]);
          router.refresh();
          showToast(`Đã đăng ký cơ sở [${newItem.name}] thành công!`);
        }}
      />
    </div>
  );
}
