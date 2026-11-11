import Link from "next/link";
import { ArrowUpRight, Database, ShieldCheck } from "lucide-react";
import type { DomainCountMetric } from "../server/get-domain-count-metrics";

export function DomainCountPanel({metrics}:{metrics:readonly DomainCountMetric[]}){
 if(!metrics.length)return null;
 return <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
   aria-label="Số liệu hồ sơ theo phân hệ nghiệp vụ">
   <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
     <div><h2 className="text-lg font-bold text-slate-900">Hồ sơ theo phân hệ nghiệp vụ</h2>
       <p className="mt-1 text-sm text-slate-600">Số bản ghi thực tế theo nguồn và quyền truy cập; không cộng vào các KPI công việc M01.</p>
     </div>
     <div className="flex items-center gap-2 text-xs text-slate-500"><ShieldCheck size={15}/>Phạm vi đã phân quyền</div>
   </header>
   <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
    {metrics.map(metric=><Link href={metric.route} key={metric.code}
      className="group flex min-h-32 flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-emerald-300 hover:bg-emerald-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">
      <div><div className="flex items-center justify-between text-xs font-semibold text-emerald-800"><span>{metric.code}</span><ArrowUpRight size={15} aria-hidden="true"/></div>
        <h3 className="mt-2 text-sm font-semibold text-slate-800">{metric.label}</h3>
      </div>
      {metric.status==="ready" ? <p className="mt-3 text-2xl font-bold tabular-nums text-slate-900">{metric.count?.toLocaleString("vi-VN")}</p>
        : <p className="mt-3 text-sm font-semibold text-amber-800">Chưa kết nối dữ liệu</p>}
      <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500"><Database size={12}/>{metric.source}</p>
    </Link>)}
   </div>
   <p className="mt-4 text-xs leading-5 text-slate-500">Mỗi ô chỉ đếm một loại bản ghi nguồn được chú thích. Không suy diễn tỷ lệ giải quyết, chất lượng dịch vụ hay kết quả xét duyệt từ số bản ghi. Nếu CSDL hoặc quyền lỗi, hiển thị “Chưa kết nối dữ liệu”, không thay bằng 0.</p>
 </section>;
}
