"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { WorkItemDTO } from "../types";

interface WorkItemReturnModalProps {
  item: WorkItemDTO | null;
  onClose: () => void;
  transitionLoading: boolean;
  onConfirm: (item: WorkItemDTO, reason: string) => void;
}

export function WorkItemReturnModal({
  item,
  onClose,
  transitionLoading,
  onConfirm,
}: WorkItemReturnModalProps) {
  const [reason, setReason] = React.useState("");

  if (!item) return null;

  return (
    <Modal
      isOpen={!!item}
      onClose={onClose}
      title="Yêu cầu sửa đổi / Làm lại hồ sơ công việc"
      description={`Công việc: ${item.title}`}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={transitionLoading}>
            Hủy bỏ
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled={transitionLoading || !reason.trim()}
            onClick={() => onConfirm(item, reason.trim())}
          >
            {transitionLoading ? "Đang ghi..." : "Xác nhận trả lại"}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <label className="block text-xs font-semibold text-slate-700">
          Lý do yêu cầu làm lại <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={3}
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Nêu rõ nội dung chưa đạt chuẩn hoặc thiếu minh chứng cần bổ sung..."
          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-red-500 focus:border-red-500"
        />
      </div>
    </Modal>
  );
}
