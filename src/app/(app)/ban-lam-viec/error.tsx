"use client";

export default function WorkbenchError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-6 space-y-3">
    <h1 className="text-lg font-semibold text-rose-900">Không tải được bàn làm việc</h1>
    <p className="text-sm text-rose-800">Đã xảy ra lỗi khi đọc dữ liệu thật từ hệ thống. Không hiển thị số liệu mẫu thay thế.</p>
    <button type="button" onClick={reset} className="rounded-md bg-rose-800 px-4 py-2 text-sm text-white">Thử tải lại</button>
  </main>;
}
