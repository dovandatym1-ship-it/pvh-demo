"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { WorkItemDTO } from "../types";
import { allowedTransitions, type WorkItemState } from "../server/workflow";
import { transitionWorkItemAction } from "../server/actions";

const labels: Record<string, string> = {
  ASSIGNED: "Xác nhận giao việc", IN_PROGRESS: "Tiếp nhận / Hoàn thiện",
  UNDER_REVIEW: "Trình rà soát", RETURNED: "Trả lại bổ sung",
  COMPLETED: "Xác nhận hoàn thành", CANCELLED: "Hủy công việc",
};

export function TransitionActionBar({ item, userPermissions = [], actorId, canReview = false }: {
  item: WorkItemDTO; userPermissions?: readonly string[]; actorId: string; canReview?: boolean;
}) {
  const router = useRouter();
  const keys = useRef<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [selected, setSelected] = useState<WorkItemState | null>(null);
  const [error, setError] = useState("");
  const rules = allowedTransitions(item.status, userPermissions, item.assignedTo === actorId,
    canReview && item.assignedTo !== actorId);

  async function transition(toState: WorkItemState, note?: string) {
    if (busy) return;
    setBusy(true); setError("");
    const intent = `${item.version}:${toState}:${note || ""}`;
    keys.current[intent] ||= crypto.randomUUID();
    try {
      const result = await transitionWorkItemAction({
        id: item.id, toState, expectedVersion: item.version,
        reason: note || null, idempotencyKey: keys.current[intent],
      });
      if (!result.ok) { setError(`${result.error.code}: ${result.error.message}`); return; }
      setSelected(null); setReason("");
      router.refresh();
    } catch { setError("Mất kết nối. Bạn có thể thử lại mà không làm trùng sự kiện."); }
    finally { setBusy(false); }
  }

  return (
    <section className="space-y-3" aria-label="Thao tác chuyển trạng thái">
      <div className="flex flex-wrap gap-2">
        {rules.filter(r => r.to !== "ASSIGNED" || !!item.assignedTo).map(rule =>
          <Button key={rule.to} type="button" size="sm" disabled={busy}
            variant={rule.to === "CANCELLED" || rule.to === "RETURNED" ? "outline" : "primary"}
            onClick={() => rule.reason ? (setSelected(rule.to), setError("")) : transition(rule.to)}>
            {labels[rule.to]}
          </Button>)}
      </div>
      {selected && <div className="rounded-md border border-amber-300 bg-amber-50 p-3 space-y-2">
        <label className="block text-sm font-medium">Lý do {selected === "CANCELLED" ? "hủy" : "trả lại"} *
          <textarea className="mt-1 w-full rounded-md border p-2" value={reason} maxLength={2000}
            onChange={e => { setReason(e.target.value); setError(""); }} rows={3} />
        </label>
        <div className="flex gap-2">
          <Button type="button" size="sm" disabled={busy || !reason.trim()}
            onClick={() => transition(selected, reason)}>Xác nhận</Button>
          <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => { setSelected(null); setReason(""); }}>Đóng</Button>
        </div>
      </div>}
      {error && <p role="alert" className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error} Hãy tải lại trang nếu dữ liệu đã thay đổi.</p>}
    </section>
  );
}
