"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { WorkItemDTO } from "../types";
import { updateWorkItemDetailsAction } from "../server/actions";
import { vietnameseLocalToIso } from "../types/presentation";

type Hamlet = { id: string; name: string };

function vietnameseLocalDate(value: string | null): string {
  if (!value) return "";
  return new Date(value).toLocaleString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh", hour12: false })
    .replace(" ", "T").slice(0, 16);
}

export function UpdateWorkItemDetailsForm({ item, hamlets }: {
  item: WorkItemDTO; hamlets: Hamlet[];
}) {
  const router = useRouter();
  const key = useRef<string | null>(null);
  const [dueDate, setDueDate] = useState(vietnameseLocalDate(item.dueDate ?? null));
  const [hamletId, setHamletId] = useState(item.hamletId || "");
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const changed = () => { key.current = null; setError(""); setNotice(""); };
  const hasChanges = dueDate !== vietnameseLocalDate(item.dueDate ?? null) || hamletId !== (item.hamletId || "");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !hasChanges || !reason.trim()) return;
    const isoDate = dueDate ? vietnameseLocalToIso(dueDate) : null;
    if (dueDate && !isoDate) { setError("Hạn xử lý không hợp lệ"); return; }
    key.current ||= crypto.randomUUID();
    setPending(true); setError(""); setNotice("");
    try {
      const result = await updateWorkItemDetailsAction({
        id: item.id, expectedVersion: item.version,
        dueDate: isoDate,
        hamletId: hamletId || null,
        reason: reason.trim(), idempotencyKey: key.current,
      });
      if (!result.ok) { setError(`${result.error.code}: ${result.error.message}`); return; }
      setNotice("Đã cập nhật hạn và địa bàn; lịch sử thay đổi đã được ghi nhận.");
      router.refresh();
    } catch { setError("Không kết nối được. Có thể thử lại với cùng mã yêu cầu."); }
    finally { setPending(false); }
  }

  if (item.status === "COMPLETED" || item.status === "CANCELLED") return null;

  return <form onSubmit={submit} className="rounded-xl border bg-white p-4 space-y-3" aria-label="Điều chỉnh hạn và địa bàn công việc">
    <h2 className="font-semibold">Điều chỉnh hạn / địa bàn</h2>
    <label className="block text-sm">Hạn xử lý
      <input type="datetime-local" value={dueDate} onChange={e => { changed(); setDueDate(e.target.value); }}
        className="mt-1 block w-full rounded-md border border-slate-300 p-2" />
    </label>
    <label className="block text-sm">Địa bàn
      <select value={hamletId} onChange={e => { changed(); setHamletId(e.target.value); }}
        className="mt-1 block w-full rounded-md border border-slate-300 p-2">
        <option value="">Toàn xã / chưa xác định</option>
        {hamlets.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
      </select>
    </label>
    <label className="block text-sm">Lý do điều chỉnh *
      <textarea required minLength={3} maxLength={2000} rows={2} value={reason}
        onChange={e => { changed(); setReason(e.target.value); }}
        className="mt-1 block w-full rounded-md border border-slate-300 p-2" />
    </label>
    <p className="text-xs text-slate-500">Đổi địa bàn phải giữ người phụ trách trong đúng phạm vi được giao; nếu không, hãy giao lại việc trước.</p>
    <Button type="submit" disabled={pending || !hasChanges || reason.trim().length < 3}>
      {pending ? "Đang lưu..." : "Lưu điều chỉnh"}
    </Button>
    {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
    {notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}
  </form>;
}
