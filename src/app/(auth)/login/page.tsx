"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { loginDemoAction } from "@/lib/auth/actions";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/cong-viec";

  const [email, setEmail] = React.useState("p1.lanhdao@pvh.gov.vn");
  const [password, setPassword] = React.useState("Password123!");
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        // Fallback demo signin for local preview
        await loginDemoAction("P1");
        return;
      }
      router.push(redirectPath);
      router.refresh();
    } catch {
      await loginDemoAction("P1");
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
          <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-600 outline-none"
            placeholder="nhap-email@pvh.gov.vn"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Mật khẩu (Password)</label>
          <input
            type="password"
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
          {loading ? "Đang xử lý..." : "Đăng nhập"}
        </button>
      </form>

      <div className="pt-4 border-t border-slate-200 space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
          Chọn tài khoản xem nhanh giao diện
        </p>
        <div className="grid grid-cols-1 gap-2">
          <button
            type="button"
            onClick={() => loginDemoAction("P1")}
            className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-xs"
          >
            <div className="font-semibold text-slate-800">👤 P1 — Nguyễn Văn An</div>
            <div className="text-slate-500 text-[11px]">Chủ tịch UBND xã (Chỉ đạo điều hành & Phê duyệt)</div>
          </button>
          <button
            type="button"
            onClick={() => loginDemoAction("P2")}
            className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-xs"
          >
            <div className="font-semibold text-slate-800">👤 P2 — Trần Thị Mai</div>
            <div className="text-slate-500 text-[11px]">Công chức VH-XH (Toàn bộ 9 phân hệ nghiệp vụ & PII)</div>
          </button>
          <button
            type="button"
            onClick={() => loginDemoAction("P6")}
            className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-xs"
          >
            <div className="font-semibold text-slate-800">👤 P6 — Đỗ Minh Đức</div>
            <div className="text-slate-500 text-[11px]">Cán bộ Kiểm tra / Thanh tra liên ngành</div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-slate-100">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-6 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold text-slate-900">Đăng nhập Hệ thống PVH</h1>
          <p className="text-xs text-slate-500">UBND Xã Giả Định A — Thái Nguyên</p>
        </div>
        <React.Suspense fallback={<div className="text-xs text-center py-4 text-slate-400">Đang tải...</div>}>
          <LoginForm />
        </React.Suspense>
      </div>
    </main>
  );
}
