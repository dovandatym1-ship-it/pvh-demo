"use client";

import React, { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { createReligiousEstablishmentAction } from "../server/actions";
import type { ReligiousEstablishmentDTO } from "../types";

interface CreateEstablishmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newEstablishment: ReligiousEstablishmentDTO) => void;
}

export function CreateEstablishmentModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateEstablishmentModalProps) {
  const [name, setName] = useState("");
  const [religionType, setReligionType] = useState<"PHAT_GIAO" | "TIN_LANH" | "CONG_GIAO" | "TIN_NGUONG_DAN_GIAN">("PHAT_GIAO");
  const [representativeName, setRepresentativeName] = useState("");
  const [hamletId, setHamletId] = useState("xom-a1");
  const [address, setAddress] = useState("");
  const [followerCount, setFollowerCount] = useState<number>(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 3) {
      setError("Tên cơ sở tôn giáo phải có ít nhất 3 ký tự");
      return;
    }
    if (!representativeName.trim() || representativeName.trim().length < 2) {
      setError("Họ và tên người đại diện tối thiểu 2 ký tự");
      return;
    }

    setLoading(true);
    setError(null);

    const generatedCode = `CS-${Date.now().toString().slice(-4)}`;

    try {
      const payload = {
        code: generatedCode,
        name: name.trim(),
        religionType,
        representativeName: representativeName.trim(),
        hamletId,
        address: address.trim() || `Xóm ${hamletId}`,
        followerCount: Number(followerCount) || 0,
      };

      const res = await createReligiousEstablishmentAction(payload);
      if (!res.ok) {
        setError(res.error.message || "Không thể lưu cơ sở tôn giáo");
        return;
      }

      onSuccess(res.data);
      onClose();
      setName("");
      setRepresentativeName("");
      setAddress("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lỗi hệ thống khi đăng ký cơ sở");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Đăng ký cơ sở tín ngưỡng / tôn giáo mới"
      description="Tiếp nhận thông báo thành lập cơ sở tôn giáo hoặc điểm nhóm sinh hoạt tập trung"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Hủy bỏ
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} disabled={loading}>
            {loading ? "Đang lưu..." : "Lưu đăng ký"}
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
            Tên cơ sở / Điểm nhóm tôn giáo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Vd: Chùa An Lạc, Điểm nhóm Tin Lành Xóm A1..."
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tôn giáo / Hệ phái <span className="text-red-500">*</span>
            </label>
            <select
              value={religionType}
              onChange={(e) => setReligionType(e.target.value as "PHAT_GIAO" | "TIN_LANH" | "CONG_GIAO" | "TIN_NGUONG_DAN_GIAN")}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
            >
              <option value="PHAT_GIAO">Phật giáo</option>
              <option value="TIN_LANH">Tin Lành</option>
              <option value="CONG_GIAO">Công giáo</option>
              <option value="TIN_NGUONG_DAN_GIAN">Tín ngưỡng dân gian</option>
            </select>
          </div>

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
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Họ và tên người đại diện / Trụ trì / Trưởng nhóm <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={representativeName}
            onChange={(e) => setRepresentativeName(e.target.value)}
            placeholder="Vd: Đại đức Thích Tâm An, Mục sư Ma Văn B..."
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Địa chỉ cụ thể
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Vd: Thôn Bãi Chè, Xã Định Hóa"
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Số lượng tín đồ sinh hoạt
          </label>
          <input
            type="number"
            min={0}
            value={followerCount}
            onChange={(e) => setFollowerCount(Number(e.target.value))}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>
      </form>
    </Modal>
  );
}
