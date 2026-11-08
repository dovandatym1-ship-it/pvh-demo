import Link from "next/link";
import { notFound } from "next/navigation";
import { getRequestContext } from "@/lib/auth/request-context";
import { assertRoutePermission } from "@/config/navigation";
import { getActiveHamlets, getAssignees, getWorkItemDetail } from "@/features/m01-core-work/server/queries";
import { TransitionActionBar } from "@/features/m01-core-work/components/transition-action-bar";
import { AssignWorkItemForm } from "@/features/m01-core-work/components/assign-work-item-form";
import { EvidenceUploader } from "@/features/m01-core-work/components/evidence-uploader";
import { UpdateWorkItemDetailsForm } from "@/features/m01-core-work/components/update-work-item-details-form";

export const dynamic = "force-dynamic";

export default async function WorkItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getRequestContext();
  assertRoutePermission("/cong-viec", ctx.permissions, ctx.roles);
  const { id } = await params;
  if (!/^[a-f0-9-]{36}$/i.test(id)) notFound();
  const detail = await getWorkItemDetail(ctx, id);
  if (!detail) notFound();
  const { item, timeline, assignments, evidence } = detail;
  const canAssign = ctx.permissions.includes("m01:work:assign");
  const [assignees, hamlets]: [
    Awaited<ReturnType<typeof getAssignees>>,
    Awaited<ReturnType<typeof getActiveHamlets>>,
  ] = canAssign ? await Promise.all([getAssignees(ctx, item.id), getActiveHamlets(ctx)]) : [[], []];
  const mayReview = ctx.permissions.includes("m01:work:review") &&
    (item.createdBy === ctx.userId || ctx.permissions.includes("m01:work:read_all"));
  const mayUpload = ctx.permissions.includes("m01:work:update") &&
    (item.assignedTo === ctx.userId || item.createdBy === ctx.userId || ctx.permissions.includes("m01:work:update_all"));
  const date = (value: string) => new Date(value).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

  return <main className="space-y-5">
    <Link href="/cong-viec" className="text-sm text-emerald-800 hover:underline">← Trở lại danh sách</Link>
    <header className="rounded-xl border bg-white p-5 space-y-2">
      <h1 className="text-xl font-bold text-slate-900">{item.title}</h1>
      <p className="text-sm text-slate-600 whitespace-pre-wrap">{item.description || "Chưa có mô tả"}</p>
      {item.sourceRef && <p className="text-sm text-slate-700">Nguồn tham chiếu: <span className="font-medium break-all">{item.sourceRef}</span></p>}
      <div className="flex flex-wrap gap-3 text-sm text-slate-700">
        <span>Trạng thái: <strong>{item.status}</strong></span><span>Phiên bản: v{item.version}</span>
        <span>Ưu tiên: {item.priority}</span><span>Lĩnh vực: {item.category}</span>
        <span>Hạn: {item.dueDate ? date(item.dueDate) : "Chưa đặt"}</span>
      </div>
      <p className="text-xs text-slate-500">Xác nhận hoàn thành công việc nội bộ không thay thế quyết định hành chính.</p>
    </header>
    <section className="rounded-xl border bg-white p-5 space-y-3">
      <h2 className="font-semibold">Xử lý công việc</h2>
      <TransitionActionBar item={item} userPermissions={ctx.permissions} actorId={ctx.userId} canReview={mayReview} />
    </section>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {canAssign && <AssignWorkItemForm item={item} assignees={assignees} />}
      {mayUpload && <EvidenceUploader workItemId={item.id} />}
      {canAssign && <UpdateWorkItemDetailsForm key={item.version} item={item} hamlets={hamlets} />}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <section className="rounded-xl border bg-white p-5 space-y-3">
        <h2 className="font-semibold">Lịch sử xử lý</h2>
        <ol className="space-y-3 text-sm">{timeline.map(ev => <li key={ev.id} className="border-l-2 border-emerald-200 pl-3">
          <p className="font-medium">{ev.fromStatus || "Tạo mới"} → {ev.toStatus}</p>
          <p className="text-slate-600">{date(ev.createdAt)} · v{ev.version} · {ev.actorId.slice(0,8)}</p>
          {ev.reason && <p className="text-slate-700">Lý do: {ev.reason}</p>}
        </li>)}</ol>
        {timeline.length === 0 && <p className="text-sm text-slate-500">Chưa có sự kiện</p>}
      </section>
      <section className="rounded-xl border bg-white p-5 space-y-3">
        <h2 className="font-semibold">Phân công & minh chứng</h2>
        <p className="text-xs text-slate-600">Người phụ trách hiện tại: {item.assignedTo || "Chưa giao"}</p>
        <ul className="text-sm space-y-1">{assignments.map(a => <li key={a.id} className="border-b py-1">
          v{a.work_item_version} · {a.assignee.slice(0,8)} · {date(a.created_at)}
          {a.reason && <span> — {a.reason}</span>}
        </li>)}</ul>
        <h3 className="text-sm font-semibold">Tệp minh chứng</h3>
        <ul className="space-y-2 text-sm">{evidence.map(file => <li key={file.id}>
          {file.status === "UPLOADED" ? <a className="text-emerald-800 underline" href={`/api/files/${file.id}`} target="_blank" rel="noopener noreferrer">{file.original_name}</a> : <span className="text-amber-700">{file.original_name} (đang chờ lưu)</span>}
          <span className="ml-2 text-xs text-slate-500">{date(file.created_at)}</span>
        </li>)}</ul>
        {evidence.length === 0 && <p className="text-sm text-slate-500">Chưa có minh chứng</p>}
      </section>
    </div>
  </main>;
}
