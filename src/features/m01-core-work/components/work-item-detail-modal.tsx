"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { WorkItemDTO } from "../types";

interface WorkItemDetailModalProps {
  item: WorkItemDTO | null;
  onClose: () => void;
  canEdit: boolean;
  canApprove: boolean;
  transitionLoading: boolean;
  onTransition: (item: WorkItemDTO, toState: string) => void;
  onRequestReturn: (item: WorkItemDTO) => void;
  getStatusBadge: (status: string) => React.ReactNode;
  getPriorityBadge: (priority: string) => React.ReactNode;
  getCategoryLabel: (category?: string | null) => string;
}

export function WorkItemDetailModal({
  item,
  onClose,
  canEdit,
  canApprove,
  transitionLoading,
  onTransition,
  onRequestReturn,
  getStatusBadge,
  getPriorityBadge,
  getCategoryLabel,
}: WorkItemDetailModalProps) {
  if (!item) return null;

  return (
    <Modal
      isOpen={!!item}
      onClose={onClose}
      title="Chi tiết nhiệm vụ công việc"
      description={`Mã việc: ${item.id} • Phiên bản: v${item.version}`}
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[11px] text-slate-500 font-mono">
            Cập nhật lúc: {new Date(item.updatedAt).toLocaleString("vi-VN")}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Đóng
            </Button>
            {item.status === "NEW" && canEdit && (
              <Button
                variant="primary"
                size="sm"
                disabled={transitionLoading}
                onClick={() => onTransition(item, "IN_PROGRESS")}
              >
                Tiếp nhận xử lý
              </Button>
            )}
            {item.status === "IN_PROGRESS" && canEdit && (
              <Button
                variant="primary"
                size="sm"
                disabled={transitionLoading}
                onClick={() => onTransition(item, "UNDER_REVIEW")}
              >
                Trình phê duyệt
              </Button>
            )}
            {item.status === "UNDER_REVIEW" && canApprove && (
              <>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={transitionLoading}
                  onClick={() => onRequestReturn(item)}
                >
                  Yêu cầu làm lại
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={transitionLoading}
                  onClick={() => onTransition(item, "COMPLETED")}
                  className="bg-emerald-700 hover:bg-emerald-800"
                >
                  Ký duyệt hoàn thành
                </Button>
              </>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-800 text-sm">{item.title}</span>
            {getStatusBadge(item.status)}
          </div>
          <p className="text-slate-600 leading-relaxed">
            {item.description || "Không có nội dung mô tả chi tiết."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-slate-500 block">Lĩnh vực:</span>
            <span className="font-semibold text-slate-800">{getCategoryLabel(item.category)}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Mức độ ưu tiên:</span>
            <span>{getPriorityBadge(item.priority)}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Hạn hoàn thành:</span>
            <span className="font-semibold text-slate-800 font-mono">
              {item.dueDate ? new Date(item.dueDate).toLocaleDateString("vi-VN") : "Không ấn định"}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Kiểm soát tương tranh (OCC):</span>
            <span className="font-mono text-emerald-700 font-semibold">Version {item.version}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
