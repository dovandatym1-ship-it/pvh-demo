"use client";

import React, { useState } from "react";
import type { WorkItemDTO } from "../types";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, CheckCircle, XCircle } from "lucide-react";

interface TransitionActionBarProps {
  item: WorkItemDTO;
  userPermissions?: readonly string[];
  onTransitionSuccess?: () => void;
}

export function TransitionActionBar({
  item,
  userPermissions = [],
  onTransitionSuccess,
}: TransitionActionBarProps) {
  const [loading, setLoading] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [showReturnModal, setShowReturnModal] = useState(false);

  const canEdit = userPermissions.includes("m01:work:update");
  const canApprove = userPermissions.includes("m01:work_item:approve");

  const handleTransition = async (toState: string, reason?: string) => {
    setLoading(true);
    setConflictError(null);

    try {
      const response = await fetch(`/api/work-items/${item.id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toState,
          expectedVersion: item.version,
          reason,
        }),
      });

      const res = await response.json();

      if (!response.ok || !res.ok) {
        if (res.error?.code === "VERSION_CONFLICT" || response.status === 409) {
          setConflictError(
            "Xung đột phiên bản (409 VERSION_CONFLICT): Dữ liệu công việc đã được cập nhật bởi một phiên làm việc khác. Vui lòng tải lại trang để nhận dữ liệu mới nhất."
          );
        } else {
          alert(res.error?.message || "Có lỗi xảy ra khi chuyển trạng thái.");
        }
        return;
      }

      onTransitionSuccess?.();
    } catch {
      setConflictError("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {conflictError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{conflictError}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 ml-3"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Tải lại trang
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {item.status === "NEW" && (
          <Button
            size="sm"
            variant="primary"
            disabled={loading || !canEdit}
            onClick={() => handleTransition("IN_PROGRESS")}
          >
            Tiếp nhận & Xử lý
          </Button>
        )}

        {item.status === "IN_PROGRESS" && (
          <Button
            size="sm"
            variant="primary"
            disabled={loading || !canEdit}
            onClick={() => handleTransition("UNDER_REVIEW")}
          >
            Trình rà soát & Phê duyệt
          </Button>
        )}

        {item.status === "UNDER_REVIEW" && (
          <>
            <Button
              size="sm"
              variant="primary"
              disabled={loading || !canApprove}
              title={!canApprove ? "Cần quyền phê duyệt (m01:work_item:approve) để hoàn thành" : ""}
              onClick={() => handleTransition("COMPLETED")}
            >
              <CheckCircle className="w-4 h-4 mr-1 text-green-400" />
              Phê duyệt hoàn thành
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-rose-600 border-rose-200 hover:bg-rose-50"
              disabled={loading || !canApprove}
              onClick={() => setShowReturnModal(true)}
            >
              <XCircle className="w-4 h-4 mr-1" />
              Trả lại bổ sung
            </Button>
          </>
        )}

        {item.status === "RETURNED" && (
          <Button
            size="sm"
            variant="primary"
            disabled={loading || !canEdit}
            onClick={() => handleTransition("IN_PROGRESS")}
          >
            Tiếp tục hoàn thiện
          </Button>
        )}
      </div>

      {showReturnModal && (
        <div className="p-4 border border-rose-200 bg-rose-50/50 rounded-lg space-y-3">
          <div className="text-sm font-medium text-rose-900">
            Lý do trả lại hồ sơ công việc (bắt buộc)
          </div>
          <textarea
            className="w-full text-sm p-2 border rounded border-gray-300 focus:outline-none focus:ring-1 focus:ring-rose-500"
            rows={2}
            placeholder="Nhập lý do cụ thể và yêu cầu chỉnh sửa..."
            value={returnReason}
            onChange={(e) => setReturnReason(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowReturnModal(false)}
            >
              Hủy
            </Button>
            <Button
              size="sm"
              variant="danger"
              disabled={loading || !returnReason.trim()}
              onClick={() => {
                handleTransition("RETURNED", returnReason);
                setShowReturnModal(false);
              }}
            >
              Xác nhận trả lại
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
