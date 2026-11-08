"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Lock, ShieldCheck } from "lucide-react";
import { createAndFinalizeSnapshotAction } from "../server/actions";
import type { ReportSnapshotDTO } from "../types";

export interface FinalizeSnapshotModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSnapshotCreated: (snapshot: ReportSnapshotDTO) => void;
}

export function FinalizeSnapshotModal({
  isOpen,
  onClose,
  onSnapshotCreated,
}: FinalizeSnapshotModalProps) {
  const [title, setTitle] = useState("Báo cáo tổng hợp kết quả công tác VH-XH & Điều hành Quý 4/2026");
  const [period, setPeriod] = useState("Q4/2026");
  const [year, setYear] = useState<number>(2026);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !period.trim()) {
      alert("Vui lòng nhập đầy đủ tiêu đề và kỳ báo cáo.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await createAndFinalizeSnapshotAction({
        reportCode: "DEM-R01",
        title,
        period,
        year,
      });

      if (!res.ok) {
        alert(`Không thể chốt snapshot: ${res.error.message}`);
        return;
      }

      onSnapshotCreated(res.data.snapshot);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi không xác định";
      alert(`Lỗi ngoại lệ: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chốt Báo cáo Tổng hợp Bất biến (DEM-R01)"
      description="Hệ thống sẽ tính toán mã băm SHA-256 từ Canonical JSON (RFC 8785) và khóa dữ liệu vĩnh viễn qua Trigger CSDL."
    >
      <div className="space-y-4 text-xs">
        <div>
          <label className="block text-slate-700 font-medium mb-1">Tiêu đề báo cáo snapshot:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 text-xs border rounded-md border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Kỳ báo cáo:</label>
            <input
              type="text"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full p-2 text-xs border rounded-md border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-medium mb-1">Năm báo cáo:</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full p-2 text-xs border rounded-md border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-slate-600 space-y-1.5">
          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Cơ chế bảo vệ tính toàn vẹn số liệu:
          </div>
          <p className="text-[11px] text-slate-500">
            1. Trích xuất tự động số liệu từ CSDL PostgreSQL (Công việc, Văn hóa).
          </p>
          <p className="text-[11px] text-slate-500">
            2. Ghi nhận vết nguồn (Lineage) từng bản ghi và số phiên bản tương ứng.
          </p>
          <p className="text-[11px] text-slate-500">
            3. Khóa cứng bản ghi (Trigger <code>trg_report_snapshot_immutable</code>) chặn mọi thao tác UPDATE/DELETE sau khi chốt.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          >
            <Lock className="w-3.5 h-3.5" />
            {isSubmitting ? "Đang tính toán & chốt..." : "Ký duyệt & Chốt Snapshot"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
