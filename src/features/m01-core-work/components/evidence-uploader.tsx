"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { finalizeEvidenceAction, registerEvidenceAction } from "../server/actions";

const accepted = ["application/pdf", "image/png", "image/jpeg", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

export function EvidenceUploader({ workItemId }: { workItemId: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function upload() {
    if (!file || busy) return;
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
      const client = createClient();
      const { error: storageError } = await client.storage.from("evidence")
        .upload(registration.data.objectPath, file, { upsert: false, contentType: file.type });
      if (storageError) { setError("Tải tệp thất bại. Bản ghi đang chờ lưu, chưa tính là minh chứng hợp lệ."); return; }
      const final = await finalizeEvidenceAction({ id: registration.data.id, sha256 });
      if (!final.ok) { setError("Storage đã nhận tệp nhưng chưa xác nhận metadata: " + final.error.message); return; }
      setSuccess("Đã tải và xác nhận minh chứng"); setFile(null); router.refresh();
    } catch { setError("Không thể tải minh chứng. Kiểm tra kết nối và thử lại."); }
    finally { setBusy(false); }
  }

  return <div className="space-y-3 rounded-lg border bg-white p-4">
    <h2 className="font-semibold">Tải minh chứng</h2>
    <input aria-label="Chọn tệp minh chứng" type="file" accept=".pdf,.png,.jpg,.jpeg,.docx"
      onChange={e => { setFile(e.target.files?.[0] || null); setError(""); setSuccess(""); }}
      className="block w-full text-sm" />
    <p className="text-xs text-slate-500">Tệp riêng tư; tối đa 50MB. Mã SHA-256 tính tại trình duyệt, chờ xác thực hệ thống khi tích hợp kiểm tra nội dung máy chủ.</p>
    <Button type="button" disabled={!file || busy} onClick={upload}>{busy ? "Đang tải..." : "Tải lên"}</Button>
    {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
    {success && <p role="status" className="text-sm text-emerald-700">{success}</p>}
  </div>;
}
