export default function DashboardLoading() {
  return <section role="status" aria-label="Đang tải số liệu điều hành" className="space-y-4 animate-pulse">
    <div className="h-20 rounded-xl bg-slate-200"/>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => <div key={i} className="h-28 rounded-xl bg-slate-200"/>)}
    </div>
    <div className="h-96 rounded-xl bg-slate-200"/>
  </section>;
}
