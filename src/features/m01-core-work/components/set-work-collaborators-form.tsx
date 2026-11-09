"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { WorkItemDTO } from "../types";
import { setWorkCollaboratorsAction } from "../server/actions";

type Candidate = { userId: string; fullName: string };

export function SetWorkCollaboratorsForm({ item, currentUserIds, candidates }: {
  item: WorkItemDTO; currentUserIds: string[]; candidates: Candidate[];
}) {
  const router = useRouter();
  const key = useRef<string | null>(null);
  const [selected, setSelected] = useState<string[]>(currentUserIds);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const candidateIds = new Set(candidates.map(c => c.userId));
  const noLongerEligible = selected.filter(id => !candidateIds.has(id));
  const sorted = (ids: string[]) => [...ids].sort().join(",");
  const hasChanges = sorted(selected) !== sorted(currentUserIds);

  function toggle(id: string, checked: boolean) {
    key.current = null; setError(""); setNotice("");
    setSelected(prev => checked ? [...prev.filter(u => u !== id), id] : prev.filter(u => u !== id));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasChanges || busy || reason.trim().length < 3) return;
    key.current ||= crypto.randomUUID();
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await setWorkCollaboratorsAction({
        id: item.id, expectedVersion: item.version, userIds: selected,
        reason: reason.trim(), idempotencyKey: key.current,
      });
      if (!result.ok) { setError(`${result.error.code}: ${result.error.message}`); return; }
      setNotice("Đã cập nhật người phối hợp và ghi lịch sử.");
      router.refresh();
    } catch { setError("Mất kết nối; thử lại không tạo sự kiện trùng."); }
    finally { setBusy(false); }
  }

  if (item.status === "COMPLETED" || item.status === "CANCELLED") return null;

  return <form onSubmit={submit} className="rounded-xl border bg-white p-4 space-y-3" aria-label="Quản lý người phối hợp">
    <h2 className="font-semibold">Người phối hợp</h2>
    <p className="text-xs text-slate-600">Người phối hợp được xem hồ sơ đúng phạm vi nhưng không có quyền sửa, giao hoặc phê duyệt chỉ nhờ việc được thêm vào danh sách.</p>
    <div className="max-h-48 overflow-y-auto space-y-2 rounded-md border border-slate-200 p-3">
      {candidates.map(person => <label key={person.userId} className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" checked={selected.includes(person.userId)} disabled={busy}
          onChange={event => toggle(person.userId, event.target.checked)} />
        <span>{person.fullName}</span>
      </label>)}
      {candidates.length === 0 && <p className="text-sm text-slate-500">Không có ứng viên phù hợp phạm vi.</p>}
    </div>
    {noLongerEligible.length > 0 && <button type="button" onClick={() => {
      key.current = null; setSelected(prev => prev.filter(id => candidateIds.has(id)));
    }} className="text-xs text-amber-800 underline">
      Loại {noLongerEligible.length} người không còn đủ điều kiện phối hợp
    </button>}
    <label className="block text-sm">Lý do thay đổi *
      <textarea required minLength={3} maxLength={2000} value={reason} rows={2}
        onChange={event => { key.current = null; setReason(event.target.value); setError(""); }}
        className="mt-1 block w-full rounded-md border border-slate-300 p-2" />
    </label>
    <Button type="submit" disabled={!hasChanges || reason.trim().length < 3 || busy}>
      {busy ? "Đang lưu..." : "Lưu người phối hợp"}
    </Button>
    {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
    {notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}
  </form>;
}
