"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Camera, Trash2, UploadCloud } from "lucide-react";
import { uploadOwnAvatarAction, removeOwnAvatarAction } from "../server/avatar-actions";
import { AvatarImage } from "./avatar-image";
import { MAX_AVATAR_BYTES } from "../avatar-contract";

const INPUT_MAX_BYTES = 8 * 1024 * 1024;
const ACCEPTED = new Set(["image/jpeg", "image/png", "image/webp"]);

function normalizeToJpeg(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      try {
        if (image.naturalWidth > 6000 || image.naturalHeight > 6000) throw new Error("Ảnh gốc quá lớn.");
        const canvas = document.createElement("canvas");
        canvas.width = 320; canvas.height = 320;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Trình duyệt không hỗ trợ xử lý ảnh.");
        // Central square crop, re-encode to strip EXIF metadata and normalize PNG/WebP.
        context.fillStyle = "#ffffff"; context.fillRect(0, 0, 320, 320);
        const side = Math.min(image.naturalWidth, image.naturalHeight);
        context.drawImage(image,
          (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2, side, side,
          0, 0, 320, 320);
        canvas.toBlob(blob => {
          URL.revokeObjectURL(url);
          if (blob && blob.type === "image/jpeg" && blob.size <= MAX_AVATAR_BYTES) resolve(blob);
          else reject(new Error("Không thể nén ảnh xuống dưới 1 MB."));
        }, "image/jpeg", .82);
      } catch (error) { URL.revokeObjectURL(url); reject(error); }
    };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Không đọc được ảnh đã chọn.")); };
    image.src = url;
  });
}

export function AvatarUploader({ editable, initialVersion }: { editable: boolean; initialVersion: number }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [version, setVersion] = useState(initialVersion);
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  async function pick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !editable || busy) return;
    event.target.value = "";
    if (!ACCEPTED.has(file.type) || file.size > INPUT_MAX_BYTES) {
      setFeedback({ ok: false, message: "Chỉ chọn ảnh PNG, JPEG, WebP dưới 8 MB." }); return;
    }
    setBusy(true); setFeedback(null); setConfirmRemove(false);
    try {
      const normalized = await normalizeToJpeg(file);
      const data = new FormData();
      data.append("avatar", normalized, "avatar.jpg");
      const result = await uploadOwnAvatarAction(data);
      if (!result.ok) { setFeedback({ ok: false, message: result.error.message }); return; }
      setVersion(result.data.version);
      setFeedback({ ok: true, message: "Ảnh đại diện đã được cập nhật." });
      router.refresh();
    } catch (error) {
      setFeedback({ ok: false, message: error instanceof Error ? error.message : "Không tải ảnh lên được." });
    } finally { setBusy(false); }
  }

  async function remove() {
    if (!editable || busy) return;
    setConfirmRemove(false); setBusy(true); setFeedback(null);
    try {
      const result = await removeOwnAvatarAction();
      if (result.ok) {
        setVersion(result.data.version);
        setFeedback({ ok: true, message: "Đã xóa ảnh đại diện." });
        router.refresh();
      } else setFeedback({ ok: false, message: result.error.message });
    } catch { setFeedback({ ok: false, message: "Không thể xóa ảnh. Vui lòng thử lại." }); }
    finally { setBusy(false); }
  }

  return <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6" aria-label="Ảnh đại diện">
    <div className="flex flex-wrap items-center gap-4">
      <AvatarImage size="lg" version={version}/>
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-semibold text-slate-900">Ảnh đại diện</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">PNG, JPEG hoặc WebP. Hệ thống tự cắt ảnh vuông 320px, nén JPEG, xóa dữ liệu EXIF và lưu riêng tư.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input ref={input} type="file" accept="image/png,image/jpeg,image/webp"
            onChange={pick} disabled={!editable || busy} className="sr-only" aria-label="Chọn ảnh đại diện"/>
          <button type="button" onClick={() => input.current?.click()} disabled={!editable || busy}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#1F633E] px-3 py-2 text-xs font-semibold text-white hover:bg-[#174E31] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-50">
            <UploadCloud size={16} aria-hidden="true"/>{busy ? "Đang xử lý..." : "Tải ảnh lên"}
          </button>
          <button type="button" onClick={() => setConfirmRemove(v => !v)} disabled={!editable || busy}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-50">
            <Trash2 size={16} aria-hidden="true"/> Xóa ảnh
          </button>
        </div>
      </div>
    </div>
    {confirmRemove && <div role="group" aria-label="Xác nhận xóa ảnh" className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
      <p className="min-w-0 flex-1 text-xs text-amber-900">Xóa ảnh đại diện đang dùng? Hành động này không xóa thông tin tài khoản.</p>
      <button type="button" disabled={busy} onClick={remove}
        className="min-h-9 rounded-lg bg-rose-700 px-3 text-xs font-semibold text-white hover:bg-rose-800">
        Xác nhận xóa
      </button>
      <button type="button" onClick={() => setConfirmRemove(false)}
        className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700">Hủy</button>
    </div>}
    {feedback && <p className={`mt-3 text-sm ${feedback.ok ? "text-emerald-700" : "text-rose-700"}`}
      role={feedback.ok ? "status" : "alert"}><Camera className="mr-1 inline" size={14} aria-hidden="true"/>{feedback.message}</p>}
  </section>;
}
