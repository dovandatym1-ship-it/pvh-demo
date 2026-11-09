export default function CongViecLoading() {
  return <main role="status" aria-live="polite" className="space-y-4 animate-pulse">
    <div className="h-8 w-52 rounded bg-slate-200" />
    <div className="h-48 rounded-xl bg-slate-100" />
    <div className="h-72 rounded-xl bg-slate-100" />
    <span className="sr-only">Đang tải công việc</span>
  </main>;
}
