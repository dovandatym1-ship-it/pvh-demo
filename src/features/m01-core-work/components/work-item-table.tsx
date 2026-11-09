"use client";

import React from "react";
import type { WorkItemDTO } from "../types";
import { workStatusLabel } from "../types/presentation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

interface WorkItemTableProps {
  items: WorkItemDTO[];
  userPermissions?: readonly string[];
  actorId?: string;
  onSelect?: (item: WorkItemDTO) => void;
  onTransition?: (item: WorkItemDTO, toState: string) => void;
}

export function WorkItemTable({
  items,
  userPermissions = [],
  actorId,
  onSelect,
  onTransition,
}: WorkItemTableProps) {
  if (!items || items.length === 0) {
    return (
      <div className="p-8 text-center border rounded-lg bg-gray-50/50">
        <FileText className="w-10 h-10 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600 font-medium">Chưa có công việc nào trong danh sách</p>
        <p className="text-sm text-gray-400 mt-1">Các công việc mới được tạo sẽ xuất hiện tại đây</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "NEW":
        return <Badge variant="info">Mới tạo</Badge>;
      case "ASSIGNED":
        return <Badge variant="neutral">Đã giao</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="warning">Đang xử lý</Badge>;
      case "UNDER_REVIEW":
        return <Badge variant="info">Chờ rà soát</Badge>;
      case "COMPLETED":
        return <Badge variant="success">Hoàn thành</Badge>;
      case "RETURNED":
        return <Badge variant="danger">Trả lại</Badge>;
      case "CANCELLED":
        return <Badge variant="neutral">{workStatusLabel(status)}</Badge>;
      default:
        return <Badge variant="neutral">{workStatusLabel(status)}</Badge>;
    }
  };

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case "URGENT":
        return <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">Khẩn cấp</span>;
      case "HIGH":
        return <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">Cao</span>;
      case "LOW":
        return <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-2 py-0.5 rounded">Thấp</span>;
      default:
        return <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Bình thường</span>;
    }
  };

  const canEdit = (item: WorkItemDTO) => !!onTransition && !!actorId &&
    userPermissions.includes("m01:work:update") && item.assignedTo === actorId;
  const canApprove = (item: WorkItemDTO) => !!onTransition && !!actorId &&
    userPermissions.includes("m01:work:review") && item.assignedTo !== actorId &&
    (item.createdBy === actorId || userPermissions.includes("m01:work:read_all"));

  return (
    <div className="overflow-x-auto border rounded-lg bg-white shadow-sm">
      <table className="w-full text-sm text-left border-collapse">
        <thead className="bg-gray-50 text-gray-600 font-medium border-b">
          <tr>
            <th className="py-3 px-4">Mã việc</th>
            <th className="py-3 px-4">Tiêu đề & Nội dung</th>
            <th className="py-3 px-4">Độ ưu tiên</th>
            <th className="py-3 px-4">Trạng thái</th>
            <th className="py-3 px-4">Phiên bản</th>
            <th className="py-3 px-4 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50/75 transition-colors">
              <td className="py-3 px-4 font-mono text-xs text-gray-500">
                {item.id.slice(0, 8)}
              </td>
              <td className="py-3 px-4 max-w-md">
                <div className="font-medium text-gray-900 truncate break-words">
                  {item.title}
                </div>
                {item.description && (
                  <div className="text-xs text-gray-500 line-clamp-1 break-words mt-0.5">
                    {item.description}
                  </div>
                )}
              </td>
              <td className="py-3 px-4">
                {getPriorityBadge(item.priority)}
              </td>
              <td className="py-3 px-4">
                {getStatusBadge(item.status)}
              </td>
              <td className="py-3 px-4 text-xs font-mono text-gray-400">
                v{item.version}
              </td>
              <td className="py-3 px-4 text-right space-x-2">
                {onSelect && <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSelect(item)}
                >
                  Chi tiết
                </Button>}
                {item.status === "UNDER_REVIEW" && onTransition && (
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={!canApprove(item)}
                    title={!canApprove(item) ? "Bạn không có quyền rà soát công việc này" : ""}
                    onClick={() => onTransition?.(item, "COMPLETED")}
                  >
                    Duyệt
                  </Button>
                )}
                {item.status === "ASSIGNED" && onTransition && (
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={!canEdit(item)}
                    onClick={() => onTransition?.(item, "IN_PROGRESS")}
                  >
                    Bắt đầu
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
