"use client";

import React, { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { createCultureSubmissionAction } from "../server/actions";
import type { CultureSubmissionDTO } from "../types";

interface ProposeHouseholdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newSubmission: CultureSubmissionDTO) => void;
}

export function ProposeHouseholdModal({
  isOpen,
  onClose,
  onSuccess,
}: ProposeHouseholdModalProps) {
  const [householdHead, setHouseholdHead] = useState("");
  const [hamletId, setHamletId] = useState("xom-a1");
  const [membersCount, setMembersCount] = useState<number>(4);
  const [score, setScore] = useState<number>(85);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!householdHead.trim() || householdHead.trim().length < 2) {
      setError("Họ và tên chủ hộ phải có ít nhất 2 ký tự");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await createCultureSubmissionAction({
        householdHead: householdHead.trim(),
        hamletId,
        membersCount: Number(membersCount) || 4,
        score: Number(score) || 85,
      });

      if (!res.ok) {
        setError(res.error.message || "Không thể đề xuất danh hiệu");
        return;
      }

      onSuccess(res.data);
      onClose();
      setHouseholdHead("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lỗi hệ thống khi đề xuất danh hiệu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Đề xuất danh hiệu Gia đình văn hóa mới"
      description="Lập hồ sơ bình xét thường niên theo Bộ tiêu chí Gia đình văn hóa cấp xã"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Hủy bỏ
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} disabled={loading}>
            {loading ? "Đang lưu..." : "Lưu & Đề xuất"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Họ và tên chủ hộ <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={householdHead}
            onChange={(e) => setHouseholdHead(e.target.value)}
            placeholder="Vd: Nguyễn Văn A"
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Địa bàn xóm / thôn <span className="text-red-500">*</span>
            </label>
            <select
              value={hamletId}
              onChange={(e) => setHamletId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
            >
              <option value="xom-a1">Xóm A1</option>
              <option value="xom-a2">Xóm A2</option>
              <option value="xom-a3">Xóm A3</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Số nhân khẩu
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={membersCount}
              onChange={(e) => setMembersCount(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Điểm tự chấm ban đầu (Thang điểm 100)
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Tiêu chuẩn công nhận Gia đình văn hóa: Điểm đánh giá đạt từ 80/100 trở lên và đầy đủ minh chứng.
          </p>
        </div>
      </form>
    </Modal>
  );
}
