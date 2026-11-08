"use client";

import { type FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createWorkItemAction } from "../server/actions";

type Assignee = { userId: string; fullName: string; allowedHamlets: string[] | null };
type Hamlet = { id: string; name: string };

export function CreateWorkItemForm({ assignees, hamlets }: { assignees: Assignee[]; hamlets: Hamlet[] }) {
  const router = useRouter();
  const intentKey = useRef<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sourceRef, setSourceRef] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [category, setCategory] = useState("CHUNG");
  const [dueDate, setDueDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [hamletId, setHamletId] = useState("");
  const eligibleAssignees = assignees.filter(a => !a.allowedHamlets ||
    (hamletId !== "" && a.allowedHamlets.includes(hamletId)));
  const change = (fn: () => void) => { intentKey.current = null; setError(""); fn(); };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (dueDate && Number.isNaN(new Date(dueDate).getTime())) { setError("Ngày hạn xử lý không hợp lệ"); return; }
    intentKey.current ||= crypto.randomUUID();
    setPending(true);
    try {
      const result = await createWorkItemAction({
        title, description, category, priority, ...(assignedTo ? { assignedTo } : {}),
        ...(sourceRef.trim() ? { sourceRef: sourceRef.trim() } : {}),
        ...(hamletId ? { hamletId } : {}),
        ...(dueDate ? { dueDate: new Date(dueDate).toISOString() } : {}),
        idempotencyKey: intentKey.current,
      });
      if (!result.ok) { setError(`${result.error.code}: ${result.error.message}`); return; }
      router.push(`/cong-viec/${result.data.id}`);
      router.refresh();
    } catch { setError("Mất kết nối. Gửi lại sẽ sử dụng cùng mã yêu cầu, không tạo việc trùng."); }
    finally { setPending(false); }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4" aria-label="Tạo công việc mới">
      <h2 className="text-base font-semibold text-slate-900">Tạo công việc</h2>
      <label className="block text-sm font-medium text-slate-700">Tiêu đề *
        <input required minLength={3} maxLength={500} value={title} onChange={e => change(() => setTitle(e.target.value))}
          className="mt-1 block w-full rounded-md border border-slate-300 p-2" placeholder="Nội dung nhiệm vụ" />
      </label>
      <label className="block text-sm font-medium text-slate-700">Mô tả
        <textarea value={description} maxLength={5000} onChange={e => change(() => setDescription(e.target.value))}
          className="mt-1 block w-full rounded-md border border-slate-300 p-2" rows={3} />
      </label>
      <label className="block text-sm font-medium text-slate-700">Nguồn giao việc / số văn bản tham chiếu
        <input maxLength={500} value={sourceRef} onChange={e => change(() => setSourceRef(e.target.value))}
          className="mt-1 block w-full rounded-md border border-slate-300 p-2"
          placeholder="VD: Công văn 123/UBND-VHXH hoặc đường dẫn hồ sơ" />
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block text-sm font-medium text-slate-700">Lĩnh vực
          <input required maxLength={100} value={category} onChange={e => change(() => setCategory(e.target.value))}
            className="mt-1 block w-full rounded-md border border-slate-300 p-2" />
        </label>
        <label className="block text-sm font-medium text-slate-700">Ưu tiên
          <select value={priority} onChange={e => change(() => setPriority(e.target.value as typeof priority))}
            className="mt-1 block w-full rounded-md border border-slate-300 p-2">
            <option value="LOW">Thấp</option><option value="MEDIUM">Trung bình</option>
            <option value="HIGH">Cao</option><option value="URGENT">Khẩn</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">Hạn xử lý
          <input type="datetime-local" value={dueDate} onChange={e => change(() => setDueDate(e.target.value))}
            className="mt-1 block w-full rounded-md border border-slate-300 p-2" />
        </label>
        {hamlets.length > 0 && <label className="block text-sm font-medium text-slate-700">Địa bàn (thôn/xóm)
          <select value={hamletId} onChange={e => change(() => { setHamletId(e.target.value); setAssignedTo(""); })}
            className="mt-1 block w-full rounded-md border border-slate-300 p-2">
            <option value="">Toàn xã / chưa xác định</option>
            {hamlets.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </label>}
        {assignees.length > 0 && <label className="block text-sm font-medium text-slate-700">Người phụ trách
          <select value={assignedTo} onChange={e => change(() => setAssignedTo(e.target.value))}
            className="mt-1 block w-full rounded-md border border-slate-300 p-2">
            <option value="">Chưa giao</option>
            {eligibleAssignees.map(a => <option key={a.userId} value={a.userId}>{a.fullName}</option>)}
          </select>
        </label>}
      </div>
      {assignedTo && <p className="text-xs text-amber-700">Người được chọn là người phụ trách dự kiến. Sau khi lưu, đầu mối cần bấm “Xác nhận giao việc” để chuyển từ Mới sang Đã giao và gửi thông báo.</p>}
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      <Button disabled={pending} type="submit">{pending ? "Đang lưu..." : "Lưu công việc"}</Button>
    </form>
  );
}
