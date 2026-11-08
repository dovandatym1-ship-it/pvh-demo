"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { createWorkItemAction } from "../server/actions";
import type { WorkItemDTO } from "../types";

interface CreateWorkItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newItem: WorkItemDTO) => void;
}

export function CreateWorkItemModal({ isOpen, onClose, onSuccess }: CreateWorkItemModalProps) {
  const [title, setTitle] = React.useState("");
  const [desc, setDesc] = React.useState("");
  const [category, setCategory] = React.useState("VAN_HOA");
  const [priority, setPriority] = React.useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [dueDate, setDueDate] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || title.trim().length < 3) {
      setError("Tiêu đề công việc phải có ít nhất 3 ký tự");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        title: title.trim(),
        description: desc.trim(),
        category,
        priority,
        dueDate: dueDate ? new Date(dueDate + "T17:00:00.000Z").toISOString() : undefined,
        idempotencyKey: `create-task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      };

      const res = await createWorkItemAction(payload);
      if (!res.ok) {
        setError(res.error.message || "Không thể tạo công việc mới");
        return;
      }

      onSuccess(res.data);
      onClose();
      setTitle("");
      setDesc("");
      setDueDate("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lỗi hệ thống khi tạo công việc");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Giao nhiệm vụ công việc mới"
      description="Nhập thông tin giao việc điều hành hoặc phân công chuyên môn cấp xã"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Hủy bỏ
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} disabled={loading}>
            {loading ? "Đang lưu..." : "Tạo & Phân công"}
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
            Tiêu đề nhiệm vụ <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Vd: Chuẩn bị hồ sơ bình xét Gia đình văn hóa năm 2026..."
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Nội dung & Yêu cầu chỉ đạo
          </label>
          <textarea
            rows={3}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Chi tiết nội dung cần thực hiện, căn cứ pháp lý, tài liệu đính kèm..."
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Lĩnh vực chuyên môn
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
            >
              <option value="VAN_HOA">Văn hóa - Gia đình</option>
              <option value="LAO_DONG_XH">Lao động - An sinh</option>
              <option value="CHUYEN_DOI_SO">Chuyển đổi số & KHCN</option>
              <option value="GIAO_DUC">Giáo dục & Đào tạo</option>
              <option value="CHUNG">Hành chính chung</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Độ ưu tiên
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH" | "URGENT")}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
            >
              <option value="URGENT">Khẩn cấp</option>
              <option value="HIGH">Cao</option>
              <option value="MEDIUM">Bình thường</option>
              <option value="LOW">Thấp</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Hạn hoàn thành (Deadline)
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>
      </form>
    </Modal>
  );
}
