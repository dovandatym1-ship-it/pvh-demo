export default function WorkbenchLoading() {
  return <main role="status" aria-live="polite" className="space-y-4 animate-pulse">
    <div className="h-8 w-44 rounded bg-slate-200" />
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[0,1,2].map(i => <div key={i} className="h-28 rounded-xl bg-slate-100" />)}
    </div>
    <div className="h-64 rounded-xl bg-slate-100" />
    <span className="sr-only">Đang tải bàn làm việc</span>
  </main>;
}
