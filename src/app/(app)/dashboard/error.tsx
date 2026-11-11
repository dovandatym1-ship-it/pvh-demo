"use client";

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return <section role="alert" className="mx-auto max-w-2xl rounded-xl border border-rose-200 bg-white p-6 space-y-3">
    <h1 className="text-xl font-semibold text-slate-900">Chưa tải được số liệu điều hành</h1>
    <p className="text-sm text-slate-600">Hệ thống không thể xác minh số liệu ở thời điểm hiện tại. Không hiển thị số 0 thay cho dữ liệu lỗi.</p>
    <button type="button" onClick={reset} className="rounded-lg bg-emerald-800 px-4 py-2 text-sm text-white">Thử tải lại</button>
  </section>;
}
