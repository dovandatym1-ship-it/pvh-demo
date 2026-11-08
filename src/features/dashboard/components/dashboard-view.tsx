"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle, ArrowRight, CalendarClock, CheckCheck, ChevronRight,
  ClipboardList, Database, Filter, Layers3, Moon, RefreshCw, Search,
  Sun, Users, X,
} from "lucide-react";
import type { DashboardItem, DashboardModel } from "../metrics.mjs";
import { deadlineState } from "../metrics.mjs";
import styles from "./dashboard.module.css";

type QueueMode = "urgent" | "overdue" | "soon" | "review" | "progress" | "all";

const MODE_LABELS: Record<QueueMode, string> = {
  urgent: "Việc cần ưu tiên", overdue: "Đã quá hạn", soon: "Trong 7 ngày tới",
  review: "Chờ rà soát", progress: "Đang xử lý", all: "Tất cả công việc",
};

const STATUS_COLORS: Record<string, string> = {
  IN_PROGRESS: "amber", UNDER_REVIEW: "blue", ASSIGNED: "slate",
  NEW: "slate", COMPLETED: "green", RETURNED: "red", CANCELLED: "slate",
};
const STATUS_LABELS: Record<string, string> = {
  IN_PROGRESS: "Đang xử lý", UNDER_REVIEW: "Chờ rà soát", ASSIGNED: "Đã giao",
  NEW: "Mới tạo", COMPLETED: "Hoàn thành", RETURNED: "Yêu cầu bổ sung", CANCELLED: "Đã hủy",
};

function formatDay(day: string | null | undefined) {
  if (!day) return "Chưa có hạn";
  const match = day.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : "Chưa có hạn";
}

function formatMoment(instant: string | null) {
  if (!instant) return "Chưa có mốc cập nhật";
  const value = new Date(instant);
  if (Number.isNaN(value.getTime())) return "Chưa có mốc cập nhật";
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "short",
  }).format(value);
}

function deadlineLabel(item: DashboardItem, today: string) {
  const state = deadlineState(item, today);
  if (state.kind === "closed") return { text: "Đã đóng", tone: "muted" };
  if (state.kind === "overdue") return { text: `Quá ${Math.abs(state.days ?? 0)} ngày`, tone: "bad" };
  if (state.kind === "soon") return { text: state.days === 0 ? "Đến hạn hôm nay" : `Còn ${state.days} ngày`, tone: "warn" };
  return { text: formatDay(item.dueDate), tone: "muted" };
}

export function DashboardView({
  model,
  allowedRoutes,
}: {
  readonly model: DashboardModel;
  readonly allowedRoutes: readonly string[];
}) {
  const router = useRouter();
  const [dark, setDark] = React.useState(false);
  const [sourcesOpen, setSourcesOpen] = React.useState(false);
  const [mode, setMode] = React.useState<QueueMode>("urgent");
  const [search, setSearch] = React.useState("");
  const [onlyMine, setOnlyMine] = React.useState(false);
  const [visibleCount, setVisibleCount] = React.useState(7);
  const canOpenWork = allowedRoutes.includes("/cong-viec");

  const setQueueMode = (next: QueueMode) => {
    setMode(next);
    setVisibleCount(7);
  };

  const filtered = React.useMemo(() => {
    const byId = new Map(model.items.map((item) => [item.id, item]));
    let items = mode === "urgent" ? model.queueIds.map((id) => byId.get(id)).filter((item): item is DashboardItem => Boolean(item)) : model.items;
    if (mode === "overdue") items = items.filter((item) => deadlineState(item, model.today).kind === "overdue");
    if (mode === "soon") items = items.filter((item) => deadlineState(item, model.today).kind === "soon");
    if (mode === "review") items = items.filter((item) => item.status === "UNDER_REVIEW");
    if (mode === "progress") items = items.filter((item) => item.status === "IN_PROGRESS");
    if (onlyMine && model.role === "officer") items = items.filter((item) => item.assignedTo === model.userId);
    const needle = search.trim().toLocaleLowerCase("vi");
    if (needle) items = items.filter((item) => `${item.title} ${item.id} ${item.category}`.toLocaleLowerCase("vi").includes(needle));
    return items;
  }, [mode, search, onlyMine, model]);

  const maxWeekly = Math.max(1, ...model.weekly.map((week) => Math.max(week.created, week.completed)));
  const maxWorkload = Math.max(1, ...model.workload.map((person) => person.count));
  const roleScope = `${model.roleLabel} · ${model.scopeLabel}`;
  const showNote = model.overdue > 0 || model.review > 0;
  const handleFocus = (next: QueueMode) => setQueueMode(next);

  return (
    <section className={styles.dashboard} data-theme={dark ? "dark" : "light"} aria-label="Trung tâm điều hành Văn hóa – Xã hội">
      <div className={styles.topbar}>
        <div className={styles.pillGroup}>
          <span className={styles.locationPill}>Trung tâm điều hành PVH</span>
          <span className={styles.datePill}>Ngày {formatDay(model.today)}</span>
          {model.demo && <span className={styles.demoPill}>Dữ liệu minh họa</span>}
        </div>
        <div className={styles.actions}>
          <span className={styles.rolePill}>{roleScope}</span>
          <button type="button" className={styles.iconButton} onClick={() => setDark((value) => !value)} aria-label={dark ? "Chuyển sang nền sáng" : "Chuyển sang nền tối"} title="Đổi giao diện sáng/tối">
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button type="button" className={styles.sourceButton} onClick={() => setSourcesOpen((value) => !value)} aria-expanded={sourcesOpen} aria-controls="pvh-dashboard-sources">
            <Database size={15} /> Nguồn dữ liệu
          </button>
          <button type="button" className={styles.iconButton} onClick={() => router.refresh()} aria-label="Làm mới số liệu" title="Làm mới số liệu">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className={styles.titleArea}>
        <h1>Trung tâm điều hành Văn hóa – Xã hội cấp xã</h1>
        <p className={styles.subTitle}>Theo dõi tình hình thực hiện công việc và ưu tiên xử lý theo phạm vi được phân quyền.</p>
        <p className={showNote ? styles.takeaway : styles.takeawaySafe}>
          {showNote ? <AlertTriangle size={15} aria-hidden="true" /> : <CheckCheck size={15} aria-hidden="true" />}
          {showNote ? (
            <>Có <strong>{model.overdue} việc quá hạn</strong> và <strong>{model.review} việc chờ rà soát</strong> trong phạm vi của bạn.</>
          ) : "Hiện chưa có công việc quá hạn hoặc chờ rà soát trong phạm vi này."}
        </p>
      </div>

      {sourcesOpen && (
        <aside id="pvh-dashboard-sources" className={styles.sourcePanel} aria-label="Căn cứ thống kê">
          <div className={styles.cardHead}>
            <h2>Thông tin nguồn và phương pháp tính</h2>
            <button type="button" className={styles.iconButton} onClick={() => setSourcesOpen(false)} aria-label="Đóng bảng nguồn"><X size={16} /></button>
          </div>
          <div className={styles.sourceGrid}>
            <p><strong>Nguồn M01:</strong> <code>work_items</code> có kiểm soát tenant và phạm vi công tác. {model.demo ? "Bản ghi đang là dữ liệu minh họa." : "Hiển thị dữ liệu truy vấn tại thời điểm tải trang."}</p>
            <p><strong>Thời hạn:</strong> So sánh ngày hoàn thành dự kiến theo giờ Việt Nam. Chưa áp dụng lịch ngày nghỉ hoặc SLA chuyên biệt.</p>
            <p><strong>Lịch sử:</strong> {model.eventsAvailable ? "Số hoàn thành theo sổ sự kiện work_item_events." : "Chưa đủ dữ liệu lịch sử xác thực; biểu đồ không giả lập cột hoàn thành."}</p>
            <p><strong>Chuyên ngành:</strong> Các số ở cột phải là số công việc M01 theo lĩnh vực, không phải số lượng hồ sơ của từng phân hệ.</p>
          </div>
          <p className={styles.sourceFoot}>Cập nhật gần nhất của công việc: {formatMoment(model.lastUpdated)} · Tập dữ liệu trong phạm vi: {model.total} việc</p>
        </aside>
      )}

      <div className={styles.kpiGrid} aria-label="Bốn chỉ số trọng tâm">
        <button type="button" className={`${styles.kpi} ${styles.kpiBad}`} onClick={() => handleFocus("overdue")}>
          <span className={styles.kpiLabel}>Công việc quá hạn</span>
          <span className={styles.kpiValue}>{model.overdue}</span>
          <span className={styles.kpiFoot}>Chưa đóng và đã qua ngày hạn <ChevronRight size={14} /></span>
        </button>
        <button type="button" className={`${styles.kpi} ${styles.kpiWarn}`} onClick={() => handleFocus("soon")}>
          <span className={styles.kpiLabel}>Sắp đến hạn (≤ 7 ngày)</span>
          <span className={styles.kpiValue}>{model.dueSoon}</span>
          <span className={styles.kpiFoot}>Tính cả ngày hiện tại <ChevronRight size={14} /></span>
        </button>
        <button type="button" className={`${styles.kpi} ${styles.kpiInfo}`} onClick={() => handleFocus("review")}>
          <span className={styles.kpiLabel}>Đang chờ rà soát</span>
          <span className={styles.kpiValue}>{model.review}</span>
          <span className={styles.kpiFoot}>Trạng thái UNDER_REVIEW <ChevronRight size={14} /></span>
        </button>
        <button type="button" className={`${styles.kpi} ${styles.kpiPrimary}`} onClick={() => {
          if (model.role === "officer") { setOnlyMine(true); setQueueMode("all"); }
          else setQueueMode("all");
        }}>
          <span className={styles.kpiLabel}>{model.focus.label}</span>
          <span className={styles.kpiValue}>{model.focus.value}</span>
          <span className={styles.kpiFoot}>Theo vai trò đang đăng nhập <ChevronRight size={14} /></span>
        </button>
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.column}>
          <section className={styles.card} aria-label="Xu hướng công việc 6 tuần">
            <div className={styles.cardHead}><h2>Xu hướng 6 tuần gần nhất</h2><span className={styles.muted}>Từ dữ liệu ghi nhận</span></div>
            <div className={styles.chart} role="img" aria-label={`Số công việc tạo mới theo 6 tuần: ${model.weekly.map((w) => `${w.label}: ${w.created}`).join(", ")}`}>
              {model.weekly.map((week) => (
                <div className={styles.chartGroup} key={week.start}>
                  <div className={styles.chartColumns}>
                    <div className={`${styles.chartBar} ${styles.chartCreated}`} style={{ height: `${week.created ? Math.max(2, week.created / maxWeekly * 100) : 0}%` }} title={`${week.created} việc tạo mới`} />
                    {model.eventsAvailable && <div className={`${styles.chartBar} ${styles.chartDone}`} style={{ height: `${week.completed ? Math.max(2, week.completed / maxWeekly * 100) : 0}%` }} title={`${week.completed} việc hoàn thành`} />}
                  </div>
                  <span className={styles.chartLabel}>{week.label}</span>
                </div>
              ))}
            </div>
            <div className={styles.legend}><span><i className={styles.legendGreen} /> Tạo mới</span>{model.eventsAvailable && <span><i className={styles.legendBlue} /> Hoàn thành</span>}</div>
            {!model.eventsAvailable && <p className={styles.inlineNote}>Chưa có lịch sử sự kiện đủ tin cậy để biểu diễn số hoàn thành.</p>}
          </section>

          <section className={styles.card} aria-label="Vòng đời công việc">
            <div className={styles.cardHead}><h2>Vòng đời công việc (M01)</h2><span className={styles.muted}>{model.total} việc</span></div>
            <div className={styles.barList}>
              {model.statuses.map((status) => (
                <div className={styles.barRow} key={status.code}>
                  <span title={status.label}>{status.label}</span>
                  <div className={styles.barTrack} role="progressbar" aria-label={status.label} aria-valuemin={0} aria-valuemax={model.total} aria-valuenow={status.count}>
                    <div className={styles.barFill} style={{ width: `${model.total ? status.count / model.total * 100 : 0}%` }} />
                  </div>
                  <strong>{status.count}</strong>
                </div>
              ))}
            </div>
            <p className={styles.inlineNote}>Bao gồm cả việc hoàn thành, trả lại và đã hủy để tổng trạng thái khớp số liệu.</p>
          </section>
        </div>

        <section className={`${styles.card} ${styles.queueCard}`} aria-label="Hàng đợi công việc">
          <div className={styles.cardHead}>
            <div><h2>Hàng đợi công việc cần xử lý</h2><p className={styles.muted}>Quá hạn → Trả lại → Chờ rà soát → Sắp đến hạn</p></div>
            <span className={styles.queueBadge}>{filtered.length} việc</span>
          </div>
          <div className={styles.controls}>
            <label className={styles.selectWrap}>
              <Filter size={15} aria-hidden="true" />
              <span className={styles.srOnly}>Lọc trạng thái</span>
              <select value={mode} onChange={(event) => setQueueMode(event.target.value as QueueMode)}>
                {(Object.keys(MODE_LABELS) as QueueMode[]).map((value) => <option value={value} key={value}>{MODE_LABELS[value]}</option>)}
              </select>
            </label>
            <label className={styles.searchWrap}>
              <Search size={15} aria-hidden="true" />
              <span className={styles.srOnly}>Tìm công việc</span>
              <input type="search" placeholder="Tên, mã hoặc lĩnh vực…" value={search} onChange={(event) => { setSearch(event.target.value); setVisibleCount(7); }} />
            </label>
            {model.role === "officer" && <label className={styles.checkLabel}><input type="checkbox" checked={onlyMine} onChange={(event) => { setOnlyMine(event.target.checked); setVisibleCount(7); }} /> Việc tôi</label>}
          </div>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead><tr><th>Công việc chuyên môn</th><th>Trạng thái</th><th>Thời hạn</th><th>Phụ trách</th><th><span className={styles.srOnly}>Chi tiết</span></th></tr></thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className={styles.empty}>Không có công việc phù hợp với bộ lọc hiện tại.</td></tr>
                ) : filtered.slice(0, visibleCount).map((item) => {
                  const due = deadlineLabel(item, model.today);
                  const assignee = item.assignedTo ? item.assignedTo.startsWith("user-p") ? item.assignedTo.replace("user-", "").toUpperCase() : `…${item.assignedTo.slice(-6)}` : "Chưa giao";
                  return (
                    <tr key={item.id}>
                      <td><strong className={styles.taskTitle}>{item.title}</strong><span className={styles.taskMeta}>{item.category} · {item.id.slice(0, 12)}</span></td>
                      <td><span className={styles.statusBadge} data-tone={STATUS_COLORS[item.status] ?? "slate"}>{STATUS_LABELS[item.status] ?? item.status}</span></td>
                      <td><span className={styles.deadline} data-tone={due.tone}>{due.text}</span></td>
                      <td className={styles.assignee}>{assignee}</td>
                      <td>{canOpenWork && <Link className={styles.detailLink} href={`/cong-viec?focus=${encodeURIComponent(item.id)}`} aria-label={`Xem chi tiết công việc ${item.title}`} title="Mở hồ sơ công việc"><ArrowRight size={16} /></Link>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className={styles.queueFoot}>
            <span>Đang hiện {Math.min(visibleCount, filtered.length)}/{filtered.length} việc · {model.scopeLabel}</span>
            {visibleCount < filtered.length && <button type="button" onClick={() => setVisibleCount((n) => n + 7)}>Xem thêm 7 việc <ChevronRight size={14} /></button>}
          </div>
          {canOpenWork && <Link href="/cong-viec" className={styles.viewAllLink}>Mở Quản lý công việc <ArrowRight size={15} /></Link>}
        </section>

        <div className={styles.column}>
          <section className={styles.card} aria-label="Công việc theo lĩnh vực">
            <div className={styles.cardHead}><h2>Việc tồn theo lĩnh vực</h2><span className={styles.muted}>Nguồn M01</span></div>
            <div className={styles.domainList}>
              {model.domains.map((domain) => {
                const allowed = allowedRoutes.includes(domain.href);
                return (
                  <div className={styles.domain} key={domain.code}>
                    <div className={styles.domainTop}><strong>{domain.label} <span>({domain.code})</span></strong><span className={styles.domainCount}>{domain.count} việc</span></div>
                    <p>{domain.overdue ? `${domain.overdue} việc đã quá hạn` : "Chưa có việc quá hạn trong nhóm"}</p>
                    {allowed && <Link href={domain.href}>Vào phân hệ <ChevronRight size={13} /></Link>}
                  </div>
                );
              })}
            </div>
            <p className={styles.inlineNote}>Các số liệu này không thay thế báo cáo chuyên ngành M02–M09.</p>
          </section>

          <section className={styles.card} aria-label="Khối lượng công việc">
            <div className={styles.cardHead}><h2>Phân bổ việc chưa đóng</h2><Users size={16} aria-hidden="true" /></div>
            {model.workload.length === 0 ? <p className={styles.inlineNote}>Chưa có việc cần phân bổ.</p> : (
              <div className={styles.barList}>
                {model.workload.map((person) => (
                  <div className={styles.barRow} key={person.id}>
                    <span title={person.label}>{person.label}</span>
                    <div className={styles.barTrack} role="progressbar" aria-label={`Việc của ${person.label}`} aria-valuemin={0} aria-valuemax={maxWorkload} aria-valuenow={person.count}><div className={`${styles.barFill} ${styles.barGold}`} style={{ width: `${person.count / maxWorkload * 100}%` }} /></div>
                    <strong>{person.count}</strong>
                  </div>
                ))}
              </div>
            )}
            <div className={styles.hamletSection}>
              <span><Layers3 size={14} aria-hidden="true" /> Theo địa bàn:</span>
              <p>{model.hamlets.length ? model.hamlets.map((h) => `${h.id}: ${h.count} việc`).join(" · ") : "Chưa gắn địa bàn"}</p>
            </div>
            <p className={styles.inlineNote}>Số việc là khối lượng đang mở, chưa quy đổi theo độ phức tạp hoặc năng lực cán bộ.</p>
          </section>
        </div>
      </div>

      <div className={styles.footerNote}>
        <span><CalendarClock size={14} /> Thời điểm thống kê: {formatDay(model.today)} · Giờ Việt Nam</span>
        <span><ClipboardList size={14} /> Dữ liệu được giới hạn theo phiên đăng nhập</span>
      </div>
    </section>
  );
}
