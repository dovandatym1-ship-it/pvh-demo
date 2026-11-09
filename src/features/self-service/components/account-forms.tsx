"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Save, ShieldCheck } from "lucide-react";
import { updateOwnProfileAction, changeOwnPasswordAction } from "../server/actions";

export function PersonalDetailsForm({ displayName, contactPhone, editable }: {
  displayName: string; contactPhone: string; editable: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(displayName);
  const [phone, setPhone] = useState(contactPhone);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editable || pending) return;
    setPending(true); setFeedback(null);
    try {
      const result = await updateOwnProfileAction({ displayName: name, contactPhone: phone });
      setFeedback(result.ok ? { ok: true, text: "Đã lưu thông tin liên hệ." } :
        { ok: false, text: result.error.message });
      if (result.ok) router.refresh();
    } catch {
      setFeedback({ ok: false, text: "Không thể kết nối. Vui lòng thử lại." });
    } finally {
      setPending(false);
    }
  }

  return <form onSubmit={submit} className="space-y-5">
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block space-y-1.5 text-sm font-medium text-slate-700">
        Tên hiển thị
        <input autoComplete="name" name="displayName" value={name} disabled={!editable || pending}
          onChange={e => setName(e.target.value)} maxLength={80} required minLength={2}
          className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:opacity-60" />
      </label>
      <label className="block space-y-1.5 text-sm font-medium text-slate-700">
        Số điện thoại liên hệ
        <input autoComplete="tel" type="tel" name="contactPhone" value={phone} disabled={!editable || pending}
          onChange={e => setPhone(e.target.value)} maxLength={20} placeholder="Nhập số liên hệ"
          className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:opacity-60" />
      </label>
    </div>
    <p className="text-xs leading-5 text-slate-500">Đây là thông tin liên hệ tự khai, không thay đổi hồ sơ cán bộ hay quyền công tác chính thức.</p>
    {feedback && <p role={feedback.ok ? "status" : "alert"}
      className={feedback.ok ? "text-sm text-emerald-700" : "text-sm text-rose-700"}>{feedback.text}</p>}
    <button type="submit" disabled={!editable || pending || name.trim().length < 2}
      className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#1F633E] px-4 text-sm font-semibold text-white hover:bg-[#174E31] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50">
      <Save size={16} aria-hidden="true" />{pending ? "Đang lưu..." : "Lưu thay đổi"}
    </button>
    {!editable && <p className="text-sm text-amber-700">Phiên demo chỉ được xem, không thể cập nhật hồ sơ thật.</p>}
  </form>;
}

export function ChangePasswordForm({ editable }: { editable: boolean }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{ok: boolean; text: string} | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editable || pending) return;
    if (next !== confirm) {
      setFeedback({ ok: false, text: "Xác nhận mật khẩu mới không khớp." });
      return;
    }
    setPending(true); setFeedback(null);
    try {
      const result = await changeOwnPasswordAction({ currentPassword: current, newPassword: next });
      if (result.ok) {
        setCurrent(""); setNext(""); setConfirm("");
        setFeedback({ ok: true, text: "Mật khẩu đã được cập nhật. Bạn nên đăng nhập lại trên thiết bị khác." });
      } else {
        setFeedback({ ok: false, text: result.error.message });
      }
    } catch {
      setFeedback({ ok: false, text: "Không thể xác minh mật khẩu. Vui lòng thử lại." });
    } finally { setPending(false); }
  }

  return <form onSubmit={submit} className="space-y-4">
    <div className="flex items-center gap-2 text-sm text-slate-600"><ShieldCheck size={17} aria-hidden="true" />
      Mật khẩu chỉ được xử lý qua dịch vụ xác thực; không lưu trong hồ sơ cá nhân.</div>
    {[["Mật khẩu hiện tại", current, setCurrent, "current-password"], ["Mật khẩu mới", next, setNext, "new-password"],
      ["Nhập lại mật khẩu mới", confirm, setConfirm, "new-password"]].map(([label, value, setter, auto], i) => {
      const change = setter as (v: string) => void;
      return <label key={i} className="block space-y-1.5 text-sm font-medium text-slate-700">
        {label as string}
        <input type="password" value={value as string} autoComplete={auto as string}
          onChange={e => change(e.target.value)} minLength={i === 0 ? 1 : 12}
          maxLength={72} required disabled={!editable || pending}
          className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:opacity-60" />
      </label>;
    })}
    {feedback && <p role={feedback.ok ? "status" : "alert"}
      className={feedback.ok ? "text-sm text-emerald-700" : "text-sm text-rose-700"}>{feedback.text}</p>}
    <button type="submit" disabled={!editable || pending || next.length < 12 || next !== confirm}
      className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-50">
      <KeyRound size={16} aria-hidden="true"/>{pending ? "Đang cập nhật..." : "Đổi mật khẩu"}
    </button>
  </form>;
}
