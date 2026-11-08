"use client";

import * as React from "react";
import { loginWithCredentialsAction } from "@/lib/auth/actions";

function LoginForm() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    const res = await loginWithCredentialsAction(formData);
    if (res?.error) {
      setErrorMsg(res.error);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 text-xs rounded-lg bg-red-50 text-red-700 border border-red-200">
            {errorMsg}
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Email công vụ</label>
          <input
            type="email"
            name="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-600 outline-none"
            placeholder="canbo@pvh.gov.vn"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Mật khẩu</label>
          <input
            type="password"
            name="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-600 outline-none"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
        >
          {loading ? "Đang xác thực thông tin..." : "Đăng nhập hệ thống"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-slate-100">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-6 space-y-6">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-700 text-white font-bold text-lg mb-2 shadow-sm">
            PVH
          </div>
          <h1 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Hệ thống Quản lý Văn hóa - Xã hội</h1>
          <p className="text-xs text-slate-500 font-medium">Ủy ban nhân dân cấp Xã — Tỉnh Thái Nguyên</p>
        </div>
        <React.Suspense fallback={<div className="text-xs text-center py-4 text-slate-400">Đang tải...</div>}>
          <LoginForm />
        </React.Suspense>
      </div>
    </main>
  );
}
