"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { removePendingEvidenceObject, uploadEvidenceObject } from "@/lib/storage/browser-evidence-upload";
import { abandonPendingEvidenceAction, finalizeEvidenceAction, registerEvidenceAction } from "../server/actions";

const accepted = ["application/pdf", "image/png", "image/jpeg", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
type PendingReceipt = { id: string; objectPath: string; sha256: string };

export function EvidenceUploader({ workItemId }: { workItemId: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pendingReceipt, setPendingReceipt] = useState<PendingReceipt | null>(null);

  async function discardPending(receipt: PendingReceipt) {
    try {
      await removePendingEvidenceObject(receipt.objectPath);
      const abandoned = await abandonPendingEvidenceAction({ id: receipt.id });
      if (!abandoned.ok) throw new Error(abandoned.error.message);
      setPendingReceipt(null);
      setFile(null);
      router.refresh();
      return true;
    } catch {
      setError("Không dọn được tệp đang chờ. Bản ghi sẽ giữ trạng thái PENDING; cần kiểm tra Storage trước khi thử lại.");
      return false;
    }
  }

  async function retryFinalize() {
    if (!pendingReceipt || busy) return;
    setBusy(true); setError(""); setSuccess("");
    try {
      const result = await finalizeEvidenceAction({ id: pendingReceipt.id, sha256: pendingReceipt.sha256 });
      if (!result.ok) { setError(result.error.message); return; }
      setPendingReceipt(null); setFile(null);
      setSuccess("Đã xác nhận lại minh chứng thành công"); router.refresh();
    } catch { setError("Không kết nối được để xác nhận; có thể thử lại với cùng tệp."); }
    finally { setBusy(false); }
  }

  async function cancelPending() {
    if (!pendingReceipt || busy) return;
    setBusy(true); setError("");
    try { await discardPending(pendingReceipt); }
    finally { setBusy(false); }
  }

  async function upload() {
    if (!file || busy || pendingReceipt) return;
    if (!accepted.includes(file.type) || file.size > 52428800 || file.size === 0) {
      setError("Chỉ nhận PDF, PNG, JPEG, DOCX, dung lượng 1B–50MB"); return;
    }
    setBusy(true); setError(""); setSuccess("");
    try {
      const buffer = await file.arrayBuffer();
      const digest = await crypto.subtle.digest("SHA-256", buffer);
      const sha256 = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2,"0")).join("");
      const registration = await registerEvidenceAction({
        workItemId, fileName: file.name, contentType: file.type, size: file.size,
      });
      if (!registration.ok) { setError(registration.error.message); return; }
      const receipt = { ...registration.data, sha256 };
      try { await uploadEvidenceObject(receipt.objectPath, file); }
      catch {
        const cleaned = await discardPending(receipt);
        if (cleaned) setError("Tải tệp thất bại; đã dọn bản ghi chờ. Chọn tệp để thử lại.");
        return;
      }
      setPendingReceipt(receipt);
      const final = await finalizeEvidenceAction({ id: registration.data.id, sha256 });
      if (!final.ok) {
        setError("Storage đã nhận tệp nhưng chưa xác nhận metadata: " + final.error.message);
        return;
      }
      setPendingReceipt(null); setSuccess("Đã tải và xác nhận minh chứng"); setFile(null); router.refresh();
    } catch { setError("Không thể tải minh chứng. Kiểm tra kết nối và thử lại."); }
    finally { setBusy(false); }
  }

  return <div className="space-y-3 rounded-lg border bg-white p-4">
    <h2 className="font-semibold">Tải minh chứng</h2>
    <input aria-label="Chọn tệp minh chứng" type="file" accept=".pdf,.png,.jpg,.jpeg,.docx"
      disabled={!!pendingReceipt || busy}
      onChange={e => { setFile(e.target.files?.[0] || null); setError(""); setSuccess(""); }}
      className="block w-full text-sm" />
    <p className="text-xs text-slate-500">Tệp riêng tư; tối đa 50MB. Mã SHA-256 tính tại trình duyệt, chờ xác thực hệ thống khi tích hợp kiểm tra nội dung máy chủ.</p>
    <Button type="button" disabled={!file || busy || !!pendingReceipt} onClick={upload}>{busy ? "Đang xử lý..." : "Tải lên"}</Button>
    {pendingReceipt && <div className="flex flex-wrap gap-2">
      <Button type="button" disabled={busy} onClick={retryFinalize}>Thử xác nhận lại</Button>
      <Button type="button" variant="outline" disabled={busy} onClick={cancelPending}>Hủy tệp chờ</Button>
    </div>}
    {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
    {success && <p role="status" className="text-sm text-emerald-700">{success}</p>}
  </div>;
}
