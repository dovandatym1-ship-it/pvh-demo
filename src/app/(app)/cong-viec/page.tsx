import Link from "next/link";
import { getRequestContext } from "@/lib/auth/request-context";
import { assertRoutePermission } from "@/config/navigation";
import { getActiveHamlets, getAssignees, getWorkItemsPage, type WorkFilter, type WorkSort, type WorkQuick } from "@/features/m01-core-work/server/queries";
import { CreateWorkItemForm } from "@/features/m01-core-work/components/create-work-item-form";
import { workStatusLabel, workPriorityLabel } from "@/features/m01-core-work/types/presentation";

export const dynamic = "force-dynamic";

const filters: { id: WorkFilter; label: string }[] = [
  { id: "scope", label: "Phạm vi của tôi" }, { id: "mine", label: "Việc được giao" }, { id: "created", label: "Do tôi tạo" },
  { id: "review", label: "Chờ rà soát" }, { id: "hamlet", label: "Theo thôn/xóm" },
  { id: "all", label: "Toàn đơn vị" },
];

export default async function CongViecPage({ searchParams }: {
  searchParams: Promise<{ view?: string; page?: string; q?: string; hamlet?: string; sort?: string; quick?: string; category?: string }>;
}) {
  const ctx = await getRequestContext();
  assertRoutePermission("/cong-viec", ctx.permissions, ctx.roles);
  const params = await searchParams;
  const view = filters.find(f => f.id === params.view)?.id || "scope";
  const showAll = ctx.permissions.includes("m01:work:read_all");
  const selectedView = view === "all" && !showAll ? "mine" : view;
  const pageNum = Math.max(1, Number.parseInt(params.page || "1", 10) || 1);
  const search = (params.q || "").slice(0, 100);
  const sort: WorkSort = (["newest", "oldest", "due_soon"] as const).find(s => s === params.sort) || "newest";
  const hamletId = params.hamlet || "";
  const quicks: WorkQuick[] = ["overdue", "soon", "returned", "review", "unassigned", "progress", "open", "urgent"];
  const quick = quicks.find(item => item === params.quick);
  const category = /^[A-Z_]{2,100}$/.test(params.category || "") ? params.category : undefined;
  const [list, assignees, hamlets] = await Promise.all([
    getWorkItemsPage(ctx, { filter: selectedView, page: pageNum, search, hamletId, sort, quick, category }),
    ctx.permissions.includes("m01:work:create") ? getAssignees(ctx) : Promise.resolve([]),
    getActiveHamlets(ctx),
  ]);
  const filterParams = `view=${selectedView}&q=${encodeURIComponent(search)}&hamlet=${encodeURIComponent(hamletId)}&sort=${sort}&quick=${quick || ""}&category=${category || ""}`;
  const linkTo = (nextPage: number) => `/cong-viec?${filterParams}&page=${nextPage}`;

  return (
    <div className="space-y-6">
      <header><h1 className="text-xl font-bold text-slate-900">Quản lý công việc</h1>
        <p className="text-sm text-slate-500">Tạo, giao, theo dõi và rà soát nhiệm vụ theo phân quyền; bộ lọc liên thông từ Dashboard.</p></header>
      {ctx.permissions.includes("m01:work:create") && <CreateWorkItemForm assignees={assignees} hamlets={hamlets} />}
      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="p-4 border-b space-y-3">
          <nav aria-label="Bộ lọc công việc" className="flex gap-2 flex-wrap text-sm">
            {filters.filter(f => f.id !== "all" || showAll).map(f =>
              <Link key={f.id} href={`/cong-viec?view=${f.id}&q=${encodeURIComponent(search)}&hamlet=${encodeURIComponent(hamletId)}&sort=${sort}&quick=${quick || ""}&category=${category || ""}`}
                aria-current={selectedView === f.id ? "page" : undefined}
                className={`rounded-full px-3 py-1.5 ${selectedView === f.id ? "bg-emerald-800 text-white" : "bg-slate-100 text-slate-700"}`}>{f.label}</Link>)}
          </nav>
          <form method="GET" className="flex gap-2 flex-wrap">
            <input type="hidden" name="view" value={selectedView} />
            {category && <input type="hidden" name="category" value={category} />}
            <label className="sr-only" htmlFor="work-quick">Điều kiện công việc</label>
            <select id="work-quick" name="quick" defaultValue={quick || ""} className="rounded-md border border-slate-300 px-2 py-2 text-sm">
              <option value="">Tất cả trạng thái</option><option value="open">Chưa đóng</option>
              <option value="overdue">Quá hạn</option><option value="soon">Hạn trong 7 ngày</option>
              <option value="returned">Cần bổ sung</option><option value="review">Chờ rà soát</option>
              <option value="unassigned">Chưa giao</option><option value="progress">Đang xử lý</option>
            </select>
            <label className="sr-only" htmlFor="work-sort">Sắp xếp</label>
            <select id="work-sort" name="sort" defaultValue={sort} className="rounded-md border border-slate-300 px-2 py-2 text-sm">
              <option value="newest">Mới nhất</option><option value="oldest">Cũ nhất</option>
              <option value="due_soon">Hạn gần nhất</option>
            </select>
            {selectedView === "hamlet" && <>
              <label className="sr-only" htmlFor="work-hamlet">Thôn/xóm</label>
              <select id="work-hamlet" name="hamlet" defaultValue={hamletId}
                className="rounded-md border border-slate-300 px-2 py-2 text-sm">
                <option value="">Chọn thôn/xóm</option>
                {hamlets.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </>}
            <input name="q" defaultValue={search} maxLength={100} aria-label="Tìm công việc theo tiêu đề" placeholder="Tìm theo tiêu đề..."
              className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <button className="rounded-md bg-slate-800 px-4 py-2 text-sm text-white">Tìm kiếm</button>
          </form>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[650px] w-full text-left text-sm">
            <thead className="bg-slate-50 border-b text-slate-600"><tr>
              <th className="px-4 py-3">Công việc</th><th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Ưu tiên</th><th className="px-4 py-3">Hạn xử lý</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {list.items.map(item => <tr key={item.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium"><Link className="text-emerald-800 hover:underline" href={`/cong-viec/${item.id}`}>{item.title}</Link></td>
                <td className="px-4 py-3">{workStatusLabel(item.status)}</td><td className="px-4 py-3">{workPriorityLabel(item.priority)}</td>
                <td className="px-4 py-3">{item.dueDate ? new Date(item.dueDate).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "—"}</td>
              </tr>)}
              {list.items.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-500">Không có công việc phù hợp bộ lọc</td></tr>}
            </tbody>
          </table>
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t p-4 text-sm text-slate-600">
          <span>{list.total} công việc · Trang {list.page}</span>
          <div className="flex gap-3">
            {list.page > 1 && <Link className="text-emerald-800" href={linkTo(list.page - 1)}>Trang trước</Link>}
            {list.page * list.pageSize < list.total && <Link className="text-emerald-800" href={linkTo(list.page + 1)}>Trang sau</Link>}
          </div>
        </footer>
      </section>
    </div>
  );
}
