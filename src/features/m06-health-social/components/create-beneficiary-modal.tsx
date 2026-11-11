"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { createBeneficiaryAction } from "../server/actions";
import type { HamletOption } from "../types/hamlet-options";

interface CreateBeneficiaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  hamlets: readonly HamletOption[];
}

export function CreateBeneficiaryModal({
  isOpen,
  onClose,
  onSuccess,
  hamlets,
}: CreateBeneficiaryModalProps) {
  const [fullName, setFullName] = React.useState("");
  const [cccd, setCccd] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [hamletId, setHamletId] = React.useState("");
  const [aidCategory, setAidCategory] = React.useState("");
  const [monthlyAmount, setMonthlyAmount] = React.useState(0);
  const [diagnosis, setDiagnosis] = React.useState("");
  const [healthInsurance, setHealthInsurance] = React.useState(false);
  const [createLoading, setCreateLoading] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || fullName.trim().length < 2) {
      setCreateError("Họ và tên tối thiểu 2 ký tự");
      return;
    }
    if (!/^\d{12}$/.test(cccd.trim())) {
      setCreateError("Số CCCD phải bao gồm đúng 12 chữ số");
      return;
    }

    if (!hamlets.some(unit=>unit.id===hamletId)) {
      setCreateError("Chọn địa bàn hợp lệ trong phạm vi được phân công.");return;
    }
    if (!aidCategory.trim() || monthlyAmount <= 0) {
      setCreateError("Cần nhập diện chính sách và mức đề nghị theo hồ sơ nguồn.");return;
    }
    setCreateLoading(true);
    setCreateError(null);

    try {
      const payload = {
        fullName: fullName.trim(),
        cccd: cccd.trim(),
        phone: phone.trim() || undefined,
        hamletId,
        aidCategory,
        monthlyAmount: Number(monthlyAmount),
        diagnosis: diagnosis.trim() || undefined,
        healthInsuranceProvided: healthInsurance,
      };

      const res = await createBeneficiaryAction(payload);
      if (!res.ok) {
        setCreateError(res.error.message || "Không thể thêm đối tượng bảo trợ");
        return;
      }

      onSuccess();
      onClose();
      setFullName("");
      setCccd("");
      setPhone("");
      setDiagnosis("");
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Lỗi hệ thống khi thêm đối tượng bảo trợ");
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tiếp nhận hồ sơ bảo trợ xã hội mới"
      description="Tiếp nhận hồ sơ nguồn để xác minh. Việc lưu thông tin không đồng nghĩa đủ điều kiện hưởng hoặc đã chi trả."
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={createLoading}>
            Hủy bỏ
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} disabled={createLoading || hamlets.length===0}>
            {createLoading ? "Đang lưu..." : "Lưu hồ sơ"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {createError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{createError}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Họ và tên đối tượng <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Vd: Hoàng Văn B"
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Số CCCD (12 chữ số) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={12}
              value={cccd}
              onChange={(e) => setCccd(e.target.value.replace(/\D/g, ""))}
              placeholder="Nhập đúng 12 chữ số"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Số điện thoại liên hệ
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Nhập số điện thoại liên hệ"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono focus:ring-1 focus:ring-emerald-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Thôn / Xóm cư trú <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={hamletId}
              onChange={(e) => setHamletId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-emerald-600"
            >
              <option value="">Chọn thôn, xóm</option>
              {hamlets.map(unit=><option key={unit.id} value={unit.id}>{unit.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mức hỗ trợ đề nghị theo hồ sơ (VNĐ) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              step={1000}
              value={monthlyAmount}
              onChange={(e) => setMonthlyAmount(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-mono focus:ring-1 focus:ring-emerald-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Diện trợ cấp xã hội <span className="text-red-500">*</span>
          </label>
          <select
            value={aidCategory}
            onChange={(e) => setAidCategory(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-emerald-600"
          >
            <option value="">Chọn diện chính sách cần xác minh</option>
            <option value="Người cao tuổi (từ 80 tuổi trở lên)">Người cao tuổi (từ 80 tuổi trở lên)</option>
            <option value="Người khuyết tật đặc biệt nặng">Người khuyết tật đặc biệt nặng</option>
            <option value="Người khuyết tật nặng">Người khuyết tật nặng</option>
            <option value="Trẻ em mồ côi không nguồn nuôi dưỡng">Trẻ em mồ côi không nguồn nuôi dưỡng</option>
            <option value="Hộ nghèo đơn thân nuôi con">Hộ nghèo đơn thân nuôi con</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Chẩn đoán bệnh lý / Tình trạng sức khỏe
          </label>
          <input
            type="text"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="Vd: Cao tuổi suy kiệt, Khuyết tật vận động bẩm sinh..."
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-600"
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="bhyt-check"
            checked={healthInsurance}
            onChange={(e) => setHealthInsurance(e.target.checked)}
            className="rounded text-emerald-600 focus:ring-emerald-500"
          />
          <label htmlFor="bhyt-check" className="text-xs text-slate-700 cursor-pointer">
            Đã có chứng từ xác minh cấp thẻ bảo hiểm y tế
          </label>
        </div>
      </form>
    </Modal>
  );
}
