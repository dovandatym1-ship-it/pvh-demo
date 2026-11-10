"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { completePasswordRecoveryAction } from "@/lib/auth/actions";
import { PasswordRecoverySchema } from "@/features/self-service/schemas";

export function PasswordRecoveryForm({ code }: { code: string | null }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!code || pending) return;
    setError(null);
    const validation = PasswordRecoverySchema.safeParse({ code, newPassword, confirmPassword });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? "Mật khẩu chưa hợp lệ.");
      return;
    }
    setPending(true);
    try {
      const result = await completePasswordRecoveryAction(validation.data);
      if (result.success) {
        setComplete(true);
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setError(result.error ?? "Không thể đặt lại mật khẩu.");
      }
    } catch {
      setError("Kết nối bị gián đoạn. Vui lòng yêu cầu liên kết khôi phục mới.");
    } finally {
      setPending(false);
    }
  }

  return <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-emerald-950/5 sm:p-9"
    aria-label="Đặt lại mật khẩu">
    <div className="mb-6 flex items-center gap-3">
      <span className="rounded-xl bg-emerald-50 p-3 text-emerald-800"><KeyRound size={24} aria-hidden="true"/></span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Bảo mật tài khoản PVH</p>
        <h1 className="text-xl font-bold text-slate-900">Đặt lại mật khẩu</h1>
      </div>
    </div>

    {complete ? (
      <div role="status" className="space-y-4">
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
          Mật khẩu đã được thay đổi. Bạn cần đăng nhập lại bằng mật khẩu mới để tiếp tục.
        </p>
        <Link href="/login" className="inline-flex min-h-11 items-center rounded-lg bg-emerald-800 px-5 text-sm font-semibold text-white hover:bg-emerald-900">Về trang đăng nhập</Link>
      </div>
    ) : !code ? (
      <div className="space-y-4">
        <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          Liên kết khôi phục không hợp lệ hoặc thiếu mã xác thực. Vui lòng yêu cầu liên kết mới.
        </p>
        <Link href="/quen-mat-khau" className="inline-flex min-h-11 items-center text-sm font-semibold text-emerald-800 hover:underline">Yêu cầu liên kết mới</Link>
      </div>
    ) : (
      <form onSubmit={submit} noValidate className="space-y-5">
        <p className="flex items-center gap-2 text-sm text-slate-600">
          <ShieldCheck size={18} aria-hidden="true"/>
          Mã khôi phục chỉ sử dụng một lần. Mật khẩu mới phải có ít nhất 12 ký tự.
        </p>
        <div>
          <label htmlFor="pvh-new-recovery-password" className="mb-2 block text-sm font-semibold text-slate-800">Mật khẩu mới</label>
          <div className="relative">
            <input id="pvh-new-recovery-password" autoComplete="new-password" required
              type={showPassword ? "text" : "password"} minLength={12} maxLength={72}
              value={newPassword} onChange={e => setNewPassword(e.target.value)} disabled={pending}
              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 pr-12 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:opacity-60"/>
            <button type="button" onClick={() => setShowPassword(x => !x)}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} aria-pressed={showPassword}
              className="absolute right-0 top-0 flex h-12 w-12 items-center justify-center rounded-r-xl text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">
              {showPassword ? <EyeOff size={18} aria-hidden="true"/> : <Eye size={18} aria-hidden="true"/>}
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="pvh-confirm-recovery-password" className="mb-2 block text-sm font-semibold text-slate-800">Nhập lại mật khẩu mới</label>
          <input id="pvh-confirm-recovery-password" type="password" autoComplete="new-password" required
            minLength={12} maxLength={72} value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)} disabled={pending}
            className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:opacity-60"/>
        </div>
        {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
        <button type="submit" disabled={pending}
          className="min-h-12 w-full rounded-xl bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:opacity-60">
          {pending ? "Đang xác minh..." : "Lưu mật khẩu mới"}
        </button>
        <Link href="/quen-mat-khau" className="inline-flex min-h-10 items-center text-sm font-semibold text-emerald-800 hover:underline">Yêu cầu liên kết khác</Link>
      </form>
    )}
  </section>;
}
