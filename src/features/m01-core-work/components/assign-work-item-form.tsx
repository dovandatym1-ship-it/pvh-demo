"use client";

import { type FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { WorkItemDTO } from "../types";
import { assignWorkItemAction } from "../server/actions";

export function AssignWorkItemForm({ item, assignees }: {
  item: WorkItemDTO; assignees: { userId: string; fullName: string }[];
}) {
  const router = useRouter();
  const key = useRef<string | null>(null);
  const [assignee, setAssignee] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const resetKey = () => { key.current = null; setError(""); };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!assignee || busy) return;
    key.current ||= crypto.randomUUID();
    setBusy(true); setError("");
    try {
      const result = await assignWorkItemAction({ id: item.id, assignedTo: assignee,
        expectedVersion: item.version, reason: reason || null, idempotencyKey: key.current });
      if (!result.ok) { setError(`${result.error.code}: ${result.error.message}`); return; }
      router.refresh();
    } catch { setError("Mất kết nối. Thử lại sẽ dùng cùng mã giao việc."); }
    finally { setBusy(false); }
  }

  if (["COMPLETED", "CANCELLED", "UNDER_REVIEW"].includes(item.status)) return null;
  return <form onSubmit={submit} className="space-y-3 rounded-lg border bg-white p-4">
    <h2 className="font-semibold text-slate-900">Giao / điều chỉnh người phụ trách</h2>
    <label className="block text-sm">Người nhận *
      <select required className="mt-1 w-full rounded-md border p-2" value={assignee}
        onChange={e => { setAssignee(e.target.value); resetKey(); }}>
        <option value="">Chọn công chức còn hiệu lực</option>
        {assignees.filter(a => a.userId !== item.assignedTo).map(a =>
          <option key={a.userId} value={a.userId}>{a.fullName}</option>)}
      </select>
    </label>
    <label className="block text-sm">Lý do {item.assignedTo ? "đổi người phụ trách *" : "giao việc"}
      <textarea className="mt-1 w-full rounded-md border p-2" value={reason} maxLength={2000} rows={2}
        onChange={e => { setReason(e.target.value); resetKey(); }} />
    </label>
    {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
    <Button type="submit" disabled={busy || !assignee || !!item.assignedTo && !reason.trim()}>
      {busy ? "Đang lưu..." : item.assignedTo ? "Giao lại" : "Giao việc"}
    </Button>
  </form>;
}
