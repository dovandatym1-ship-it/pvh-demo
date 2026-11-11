"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { requestPasswordResetAction } from "@/lib/auth/actions";
import { deploymentBrand } from "@/config/deployment-brand";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError(null);
    setPending(true);
    try {
      const data = new FormData();
      data.set("email", email.trim());
      const result = await requestPasswordResetAction(data);
      if (result.success) setSubmitted(true);
      else setError(result.error || "Không gửi được yêu cầu. Vui lòng thử lại.");
    } catch {
      setError("Không thể kết nối hệ thống xác thực. Vui lòng thử lại.");
    } finally {
      setPending(false);
    }
  }

  return <main className="flex min-h-screen items-center justify-center bg-[#edf4f4] px-4 py-8">
    <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-emerald-950/5 sm:p-9" aria-label="Khôi phục mật khẩu">
      <div className="mb-6 flex items-center gap-3">
        <span className="rounded-xl bg-emerald-50 p-3 text-emerald-800"><ShieldCheck size={25} aria-hidden="true"/></span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Nền tảng PVH</p>
          <h1 className="text-xl font-bold text-slate-900">Khôi phục mật khẩu</h1>
        </div>
      </div>
      <p className="mb-5 text-sm text-slate-600">{deploymentBrand.organizationName}</p>
      {submitted ? (
        <div role="status" className="space-y-4">
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
            Nếu email thuộc một tài khoản đã được cấp, hướng dẫn đặt lại mật khẩu sẽ được gửi đến hộp thư đó.
            Hãy kiểm tra cả thư rác. Liên kết chỉ sử dụng một lần và cần mở bằng trình duyệt đã gửi yêu cầu.
          </p>
          <Link className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-emerald-800 hover:underline" href="/login"><ArrowLeft size={16}/>Trở lại đăng nhập</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <p className="text-sm leading-6 text-slate-600">Nhập email công vụ đã được cấp để nhận liên kết khôi phục. Hệ thống không hiển thị thông tin về sự tồn tại của tài khoản.</p>
          <label htmlFor="pvh-recovery-email" className="block text-sm font-semibold text-slate-800">
            Email công vụ
            <span className="relative mt-2 flex items-center">
              <Mail size={18} aria-hidden="true" className="absolute left-3 text-slate-500"/>
              <input id="pvh-recovery-email" type="email" name="email" required
                autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
                disabled={pending} maxLength={254} placeholder="Nhập email công vụ"
                className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:opacity-60"/>
            </span>
          </label>
          {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
          <button type="submit" disabled={pending}
            className="flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:opacity-60">
            {pending ? "Đang gửi yêu cầu..." : "Gửi liên kết khôi phục"}
          </button>
          <Link href="/login" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-emerald-800 hover:underline"><ArrowLeft size={16}/>Trở lại đăng nhập</Link>
        </form>
      )}
    </section>
  </main>;
}
