"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { markWorkInboxReadAction } from "../server/actions";

export function MarkInboxReadButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function markRead() {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const result = await markWorkInboxReadAction({ id });
      if (!result.ok) { setError(result.error.message); return; }
      router.refresh();
    } catch { setError("Mất kết nối, vui lòng thử lại"); }
    finally { setBusy(false); }
  }

  return <span className="inline-flex flex-col items-end gap-1">
    <button type="button" disabled={busy} onClick={markRead}
      className="rounded border border-emerald-700 px-2 py-1 text-xs text-emerald-800 disabled:opacity-60">
      {busy ? "Đang lưu..." : "Đánh dấu đã đọc"}
    </button>
    {error && <span role="alert" className="text-xs text-rose-700">{error}</span>}
  </span>;
}
