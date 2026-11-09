"use client";

import * as React from "react";
import { ArrowRight, Eye, EyeOff, Layers3, LockKeyhole, Mail, ShieldCheck, Zap } from "lucide-react";
import { loginWithCredentialsAction } from "@/lib/auth/actions";
import { deploymentBrand } from "@/config/deployment-brand";


const configuredSupport = process.env.NEXT_PUBLIC_PVH_SUPPORT_EMAIL?.trim() || "";
const SUPPORT_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(configuredSupport) ? configuredSupport : null;

function LoginForm() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const formData = new FormData();
      formData.append("email", email.trim());
      formData.append("password", password);
      const result = await loginWithCredentialsAction(formData);
      if (result?.error) setErrorMsg(result.error);
    } catch (error) {
      // Preserve Next.js redirect control flow on successful authentication.
      if (error && typeof error === "object" && "digest" in error && String(error.digest).startsWith("NEXT_REDIRECT;")) throw error;
      setErrorMsg("Không thể kết nối hệ thống. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorMsg && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMsg}</div>}
      <div className="space-y-2">
        <label htmlFor="login-email" className="flex items-center gap-2 text-sm font-semibold text-slate-800"><Mail size={17} aria-hidden="true" /> Địa chỉ email công vụ</label>
        <input id="login-email" name="email" type="email" autoComplete="username" required value={email} onChange={event => setEmail(event.target.value)} className={inputClass} placeholder="Nhập email công vụ" disabled={loading} />
      </div>
      <div className="space-y-2">
        <label htmlFor="login-password" className="flex items-center gap-2 text-sm font-semibold text-slate-800"><LockKeyhole size={17} aria-hidden="true" /> Mật khẩu</label>
        <div className="relative">
          <input id="login-password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} className={inputClass + " pr-12"} placeholder="Nhập mật khẩu" disabled={loading} />
          <button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} aria-pressed={showPassword} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-slate-500 hover:text-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700">
            {showPassword ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
          </button>
        </div>
      </div>
      <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-3 rounded-xl bg-emerald-800 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 disabled:cursor-wait disabled:opacity-60">
        {loading ? "Đang đăng nhập..." : "Đăng nhập"} {!loading && <ArrowRight size={18} aria-hidden="true" />}
      </button>
      <p className="text-center text-xs leading-relaxed text-slate-500">Chỉ dành cho cán bộ, công chức và người dùng được cấp quyền truy cập.</p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#edf4f4] px-4 py-6 text-slate-900 sm:px-6 lg:flex lg:items-center lg:justify-center lg:py-10">
      <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-slate-900/10 lg:min-h-[690px] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative isolate flex min-h-[245px] flex-col overflow-hidden bg-gradient-to-br from-[#004e4c] via-[#00675b] to-[#0d8063] p-7 text-white sm:p-10 lg:min-h-full lg:p-12" aria-label="Giới thiệu nền tảng">
          <div className="absolute -bottom-28 -left-24 -z-10 h-80 w-[135%] rotate-[-12deg] rounded-[50%] bg-[#157b66]/80" />
          <div className="absolute -bottom-40 -right-20 -z-10 h-80 w-[130%] rotate-[12deg] rounded-[50%] bg-[#31a27d]/60" />
          <div className="absolute right-[-80px] top-[-90px] -z-10 h-72 w-72 rounded-full border border-white/10" />
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/15 text-xl font-black tracking-tight">PVH</div>
            <div className="border-l border-white/40 pl-3">
              <p className="text-lg font-bold tracking-wide">PVH</p>
              <p className="max-w-[250px] text-[11px] font-medium uppercase leading-snug tracking-wide text-emerald-50">Nền tảng quản lý Văn hóa – Xã hội cấp xã</p>
            </div>
          </div>
          <div className="mt-12 max-w-lg lg:mt-auto lg:mb-auto">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">Nền tảng số dùng chung</p>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-[42px]">Số hóa quản lý lĩnh vực Văn hóa – Xã hội tại cơ sở</h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-emerald-50/95 sm:text-base">Hỗ trợ UBND cấp xã quản lý thông tin, hồ sơ và nghiệp vụ Văn hóa – Xã hội thống nhất, hiệu quả và an toàn.</p>
            <div className="mt-9 hidden grid-cols-3 gap-3 sm:grid lg:mt-12">
              <div className="space-y-2"><Layers3 size={25} aria-hidden="true" /><p className="text-xs font-medium">Liên thông dữ liệu</p></div>
              <div className="space-y-2"><Zap size={25} aria-hidden="true" /><p className="text-xs font-medium">Xử lý nghiệp vụ</p></div>
              <div className="space-y-2"><ShieldCheck size={25} aria-hidden="true" /><p className="text-xs font-medium">An toàn, bảo mật</p></div>
            </div>
          </div>
          <p className="mt-8 hidden text-xs text-emerald-100/80 lg:block">Chuyển đổi số • Quản lý tập trung • Phục vụ người dân</p>
        </section>
        <section className="flex items-center justify-center px-6 py-10 sm:px-12 sm:py-14 lg:px-14" aria-label="Đăng nhập">
          <div className="w-full max-w-[420px]">
            <div className="mb-9 text-center">
              <div className="mx-auto mb-5 flex h-14 w-20 items-center justify-center rounded-2xl bg-emerald-50 text-2xl font-extrabold text-emerald-800">PVH</div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Đăng nhập hệ thống</h2>
              <p className="mt-2 text-sm text-slate-500">{deploymentBrand.organizationName}</p>
            </div>
            <LoginForm />
            <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5 text-xs text-slate-500">
              <span>{SUPPORT_EMAIL ? <>Hỗ trợ: <a className="font-medium text-emerald-800 hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></> : "Liên hệ quản trị viên để được hỗ trợ"}</span>
              <span>Nền tảng dùng chung</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
