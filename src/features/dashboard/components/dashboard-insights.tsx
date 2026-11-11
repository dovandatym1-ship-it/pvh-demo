import Link from "next/link";
import { ArrowRight, Database, Layers3, Users } from "lucide-react";
import type { DashboardModel } from "../metrics.mjs";
import type { RolePresentation } from "../role-semantics.mjs";
import styles from "./dashboard.module.css";

export function DashboardDomainsPanel({ roleView, allowedRoutes }: {
  roleView: RolePresentation;
  allowedRoutes: readonly string[];
}) {
  const visible = roleView.domains.filter((domain) => domain.count > 0);
  return (
    <section className={styles.card} aria-label={roleView.domainTitle}>
      <div className={styles.cardHead}><h2>{roleView.domainTitle}</h2><span className={styles.muted}>Nguồn M01</span></div>
      {visible.length === 0 ? <p className={styles.inlineNote}>Chưa có công việc đang mở trong các lĩnh vực đã phân loại.</p> : (
        <div className={styles.domainList}>
          {visible.map((domain) => (
            <div className={styles.domain} key={domain.code}>
              <div className={styles.domainTop}>
                <strong>{domain.label} <span>({domain.code})</span></strong>
                <span className={styles.domainCount}>{domain.count} việc</span>
              </div>
              <p>{domain.overdue > 0 ? domain.overdue + " việc quá hạn" : "Không có việc quá hạn"}</p>
              {allowedRoutes.includes(domain.href) && <Link href={domain.href}>Đến phân hệ <ArrowRight size={13}/></Link>}
            </div>
          ))}
        </div>
      )}
      <p className={styles.inlineNote}>Đếm công việc M01 theo lĩnh vực, không phải số hồ sơ chuyên ngành.</p>
    </section>
  );
}

export function DashboardStatusPanel({ roleView }: { roleView: RolePresentation }) {
  const max = Math.max(1, roleView.totalFocus);
  return (
    <section className={styles.card} aria-label={roleView.statusTitle}>
      <div className={styles.cardHead}><h2>{roleView.statusTitle}</h2><span className={styles.muted}>{roleView.totalFocus} việc</span></div>
      <div className={styles.barList}>
        {roleView.statuses.map((status) => (
          <div className={styles.barRow} key={status.code}>
            <span title={status.label}>{status.label}</span>
            <div className={styles.barTrack} role="progressbar" aria-label={status.label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={status.count}>
              <div className={styles.barFill} style={{ width: status.count / max * 100 + "%" }} />
            </div>
            <strong>{status.count}</strong>
          </div>
        ))}
      </div>
      <p className={styles.inlineNote}>Bao gồm 7 trạng thái, kể cả việc đã hoàn thành và hủy.</p>
    </section>
  );
}

export function DashboardWorkloadPanel({ model }: { model: DashboardModel }) {
  const max = Math.max(1, ...model.workload.map((entry) => entry.count));
  return (
    <section className={styles.card} aria-label="Khối lượng chưa đóng theo cán bộ">
      <div className={styles.cardHead}><h2>Phân bổ việc chưa đóng</h2><Users size={16} aria-hidden="true"/></div>
      {model.workload.length ? <div className={styles.barList}>
        {model.workload.map((entry) => (
          <div className={styles.barRow} key={entry.id}>
            <span title={entry.label}>{entry.label}</span>
            <div className={styles.barTrack} role="progressbar" aria-label={entry.label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={entry.count}>
              <div className={styles.barFill + " " + styles.barGold} style={{ width: entry.count / max * 100 + "%" }} />
            </div><strong>{entry.count}</strong>
          </div>
        ))}
      </div> : <p className={styles.inlineNote}>Chưa có bảng tổng hợp phân bổ theo cán bộ đã xác minh.</p>}
      <div className={styles.hamletSection}>
        <span><Layers3 size={14} aria-hidden="true"/> Tồn theo địa bàn</span>
        <p>{model.hamlets.map((hamlet) => hamlet.id + ": " + hamlet.count).join(" · ") || "Chưa tổng hợp theo địa bàn"}</p>
      </div>
      <p className={styles.inlineNote}>Số đầu việc không phản ánh thời gian hay độ phức tạp.</p>
    </section>
  );
}

export function DashboardAgingPanel({ roleView }: { roleView: RolePresentation }) {
  const max = Math.max(1, roleView.totalFocusOpen);
  return (
    <section className={styles.card} aria-label={roleView.ageTitle}>
      <div className={styles.cardHead}><h2>{roleView.ageTitle}</h2><span className={styles.muted}>{roleView.totalFocusOpen} việc chưa đóng</span></div>
      <div className={styles.barList}>
        {roleView.ageRanges.map((bucket) => (
          <div className={styles.barRow} key={bucket.key}>
            <span title={bucket.label}>{bucket.label}</span>
            <div className={styles.barTrack} role="progressbar" aria-label={bucket.label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={bucket.count}>
              <div className={styles.barFill} style={{ width: bucket.count / max * 100 + "%" }} />
            </div><strong>{bucket.count}</strong>
          </div>
        ))}
      </div>
      <p className={styles.inlineNote}>Các nhóm không trùng nhau; tổng các cột = số việc chưa đóng của vai trò. Chỉ tính hạn công việc, chưa áp dụng lịch SLA chuyên ngành.</p>
    </section>
  );
}

export function DashboardWeeklyPanel({ model }: { model: DashboardModel }) {
  const max = Math.max(1, ...model.weekly.map((week) => Math.max(week.created, week.completed)));
  return (
    <section className={styles.card} aria-label="Xu hướng tạo mới và hoàn thành theo tuần">
      <div className={styles.cardHead}><h2>Xu hướng công việc 6 tuần</h2><span className={styles.muted}>Lãnh đạo · Toàn xã</span></div>
      <div className={styles.chart} role="img" aria-label={"Việc tạo mới: " + model.weekly.map((w) => w.label + " " + w.created).join(", ")}>
        {model.weekly.map((week) => (
          <div className={styles.chartGroup} key={week.start}>
            <div className={styles.chartColumns}>
              <div className={styles.chartBar + " " + styles.chartCreated} style={{ height: (week.created ? Math.max(2, week.created / max * 100) : 0) + "%" }} title={week.created + " việc tạo mới"}/>
              {model.eventsAvailable && <div className={styles.chartBar + " " + styles.chartDone} style={{ height: (week.completed ? Math.max(2, week.completed / max * 100) : 0) + "%" }} title={week.completed + " lượt hoàn thành"}/>}
            </div>
            <span className={styles.chartLabel}>{week.label}</span>
          </div>
        ))}
      </div>
      <div className={styles.legend}>
        <span><i className={styles.legendGreen}/> Tạo mới</span>
        {model.eventsAvailable && <span><i className={styles.legendBlue}/> Hoàn thành (theo sự kiện)</span>}
      </div>
      <p className={styles.inlineNote}>{model.eventsAvailable
        ? "Đếm theo tuần tại Việt Nam. Một công việc hoàn thành được tính tối đa một lần mỗi tuần; không gọi là tỷ lệ hoàn thành."
        : "Lịch sử hoàn thành chưa đủ tin cậy; chỉ hiển thị số tạo mới, không ước lượng cột hoàn thành."}</p>
    </section>
  );
}

export function DashboardContextPanel({ model, roleView }: { model: DashboardModel; roleView: RolePresentation }) {
  const isOfficer = roleView.role === "officer";
  return (
    <section className={styles.card} aria-label="Cách đọc số liệu">
      <div className={styles.cardHead}><h2>Cách đọc số liệu</h2><Database size={16} aria-hidden="true"/></div>
      <div className={styles.contextPoints}>
        <p><strong>Phạm vi:</strong> {isOfficer ? "Chỉ công việc giao trực tiếp cho tài khoản đối với KPI và biểu đồ cá nhân." : model.scopeLabel + "."}</p>
        <p><strong>Trách nhiệm:</strong> {isOfficer
          ? "Việc ở trạng thái chờ rà soát chưa chứng minh tài khoản này có quyền phê duyệt."
          : "Việc có mặt trong danh sách không đồng nghĩa với quyền sửa, duyệt hoặc hoàn thành."}</p>
        <p><strong>Nguồn:</strong> Bảng công việc M01, không phải toàn bộ hồ sơ chuyên ngành hoặc số liệu dân cư.</p>
        <p><strong>Thời hạn:</strong> Ngày đến hạn được giao, chưa phải SLA pháp lý.</p>
      </div>
    </section>
  );
}
