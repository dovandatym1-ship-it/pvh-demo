"use client";

export default function CongViecError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-6 space-y-3">
    <h1 className="text-lg font-semibold text-rose-900">Chưa tải được dữ liệu công việc</h1>
    <p className="text-sm text-rose-800">Dữ liệu thực tế không khả dụng hoặc phiên quyền truy cập đã thay đổi. Hãy thử lại hoặc đăng nhập lại nếu lỗi tiếp diễn.</p>
    <button type="button" onClick={reset} className="rounded-md bg-rose-800 px-4 py-2 text-sm text-white">Thử tải lại</button>
  </main>;
}
