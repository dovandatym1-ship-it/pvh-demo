"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight, Search } from "lucide-react";
import { deadlineState } from "../metrics.mjs";
import type { DashboardItem, DashboardModel } from "../metrics.mjs";
import type { RolePresentation, QueueFilter } from "../role-semantics.mjs";
import styles from "./dashboard.module.css";

const FILTERS: { value: QueueFilter; label: string }[] = [
  { value: "urgent", label: "Cần ưu tiên" },
  { value: "overdue", label: "Đã quá hạn" },
  { value: "soon", label: "Đến hạn trong 7 ngày" },
  { value: "returned", label: "Bị trả lại" },
  { value: "review", label: "Chờ rà soát" },
  { value: "unassigned", label: "Chưa phân công" },
  { value: "progress", label: "Đang xử lý" },
  { value: "all", label: "Tất cả trong phạm vi" },
];
const LABELS: Record<string, string> = {
  NEW: "Mới tạo", ASSIGNED: "Đã giao", IN_PROGRESS: "Đang xử lý",
  UNDER_REVIEW: "Chờ rà soát", RETURNED: "Yêu cầu bổ sung",
  COMPLETED: "Hoàn thành", CANCELLED: "Đã hủy",
};
const TONES: Record<string, string> = {
  NEW: "slate", ASSIGNED: "slate", IN_PROGRESS: "amber",
  UNDER_REVIEW: "blue", RETURNED: "red", COMPLETED: "green", CANCELLED: "slate",
};
function formatDue(item: DashboardItem, day: string) {
  const state = deadlineState(item, day);
  if (state.kind === "closed") return { label: "Đã đóng", tone: "muted" };
  if (state.kind === "overdue") return { label: "Quá " + Math.abs(state.days ?? 0) + " ngày", tone: "bad" };
  if (state.kind === "soon") return {
    label: state.days === 0 ? "Hạn hôm nay" : "Còn " + state.days + " ngày", tone: "warn",
  };
  if (!item.dueDate) return { label: "Chưa có hạn", tone: "muted" };
  const m = item.dueDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return { label: m ? m[3] + "/" + m[2] + "/" + m[1] : "Chưa rõ hạn", tone: "muted" };
}

export function DashboardQueue({
  model, roleView, filter, onFilterChange, canOpenWork,
}: {
  model: DashboardModel;
  roleView: RolePresentation;
  filter: QueueFilter;
  onFilterChange: (value: QueueFilter) => void;
  canOpenWork: boolean;
}) {
  const [search, setSearch] = React.useState("");
  const [limit, setLimit] = React.useState(8);
  const items = React.useMemo(() => {
    let filtered = filter === "urgent"
      ? roleView.priorityIds.map((id) => roleView.focusItems.find((item) => item.id === id)).filter((x): x is DashboardItem => Boolean(x))
      : roleView.focusItems;
    if (filter === "overdue") filtered = filtered.filter((i) => deadlineState(i, model.today).kind === "overdue");
    if (filter === "soon") filtered = filtered.filter((i) => deadlineState(i, model.today).kind === "soon");
    if (filter === "returned") filtered = filtered.filter((i) => i.status === "RETURNED");
    if (filter === "review") filtered = filtered.filter((i) => i.status === "UNDER_REVIEW");
    if (filter === "unassigned") filtered = filtered.filter((i) => !i.assignedTo && i.status !== "COMPLETED" && i.status !== "CANCELLED");
    if (filter === "progress") filtered = filtered.filter((i) => i.status === "IN_PROGRESS");
    const query = search.trim().toLocaleLowerCase("vi");
    if (query) filtered = filtered.filter((i) => (i.title + " " + i.id + " " + i.category).toLocaleLowerCase("vi").includes(query));
    return filtered;
  }, [roleView, filter, model.today, search]);
  const changeFilter = (value: QueueFilter) => { onFilterChange(value); setLimit(8); };
  return (
    <section className={styles.card + " " + styles.queueCard} aria-label={roleView.queueTitle}>
      <div className={styles.cardHead}>
        <div>
          <h2>{roleView.queueTitle}</h2>
          <p className={styles.muted}>{roleView.queueSubtitle}</p>
        </div>
        <span className={styles.queueBadge}>{items.length} việc</span>
      </div>
      <div className={styles.controls}>
        <label className={styles.selectWrap}>
          <span className={styles.srOnly}>Lọc theo tình trạng</span>
          <select value={filter} onChange={(event) => changeFilter(event.target.value as QueueFilter)}>
            {FILTERS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className={styles.searchWrap}>
          <Search size={15} aria-hidden="true" />
          <span className={styles.srOnly}>Tìm mã, tên công việc</span>
          <input type="search" placeholder="Tìm tên, mã công việc…" value={search} onChange={(event) => { setSearch(event.target.value); setLimit(8); }} />
        </label>
      </div>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead><tr><th>Công việc</th><th>Trạng thái</th><th>Thời hạn</th><th>Phụ trách</th><th><span className={styles.srOnly}>Chi tiết</span></th></tr></thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={5} className={styles.empty}>Không có công việc phù hợp trong danh sách ưu tiên đang hiển thị. Vào phân hệ để xem đầy đủ.</td></tr>
            ) : items.slice(0, limit).map((item) => {
              const due = formatDue(item, model.today);
              const owner = item.assignedTo ? "…" + item.assignedTo.slice(-6) : "Chưa giao";
              return (
                <tr key={item.id}>
                  <td><strong className={styles.taskTitle}>{item.title}</strong><span className={styles.taskMeta}>{item.category} · {item.id.slice(0, 12)}</span></td>
                  <td><span className={styles.statusBadge} data-tone={TONES[item.status] ?? "slate"}>{LABELS[item.status] ?? item.status}</span></td>
                  <td><span className={styles.deadline} data-tone={due.tone}>{due.label}</span></td>
                  <td className={styles.assignee} title="Mã người được giao">{owner}</td>
                  <td>{canOpenWork && <Link className={styles.detailLink} href={"/cong-viec/" + encodeURIComponent(item.id)} title="Mở chi tiết công việc" aria-label={"Chi tiết " + item.title}><ArrowRight size={16}/></Link>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className={styles.queueFoot}>
        <span>Đang hiện {Math.min(items.length, limit)}/{items.length} trong tối đa 30 việc ưu tiên · {model.scopeLabel}</span>
        {limit < items.length && <button type="button" onClick={() => setLimit((value) => value + 8)}>Xem thêm 8 <ChevronRight size={14}/></button>}
      </div>
      {canOpenWork && <Link href="/cong-viec?view=scope" className={styles.viewAllLink}>Đến phân hệ quản lý công việc <ArrowRight size={15}/></Link>}
    </section>
  );
}
