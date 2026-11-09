"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Database, Moon, RefreshCw, Sun, X } from "lucide-react";
import type { DashboardModel } from "../metrics.mjs";
import { buildRolePresentation } from "../role-semantics.mjs";
import type { QueueFilter } from "../role-semantics.mjs";
import { DashboardQueue } from "./dashboard-queue";
import {
  DashboardAgingPanel, DashboardContextPanel, DashboardDomainsPanel,
  DashboardStatusPanel, DashboardWeeklyPanel, DashboardWorkloadPanel,
} from "./dashboard-insights";
import styles from "./dashboard.module.css";

function formatDay(day: string) {
  const match = day.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? match[3] + "/" + match[2] + "/" + match[1] : day;
}
function formatMoment(instant: string | null) {
  if (!instant) return "Chưa có mốc cập nhật";
  const date = new Date(instant);
  if (Number.isNaN(date.getTime())) return "Chưa có mốc cập nhật";
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "short",
  }).format(date);
}

export function DashboardView({
  model, allowedRoutes,
}: {
  readonly model: DashboardModel;
  readonly allowedRoutes: readonly string[];
}) {
  const router = useRouter();
  const roleView = React.useMemo(() => buildRolePresentation(model), [model]);
  const [dark, setDark] = React.useState(false);
  const [sourcesOpen, setSourcesOpen] = React.useState(false);
  const [filter, setFilter] = React.useState<QueueFilter>("urgent");
  const hasAlerts = roleView.cards.some((card) => card.tone === "bad" && card.value > 0);
  const scope = model.roleLabel + " · " + model.scopeLabel;

  return (
    <section className={styles.dashboard} data-theme={dark ? "dark" : "light"} aria-label={roleView.title}>
      <div className={styles.topbar}>
        <div className={styles.pillGroup}>
          <span className={styles.locationPill}>Hệ thống Văn hóa – Xã hội</span>
          <span className={styles.datePill}>Ngày {formatDay(model.today)}</span>
          {model.demo && <span className={styles.demoPill}>Dữ liệu minh họa</span>}
        </div>
        <div className={styles.actions}>
          <span className={styles.rolePill}>{scope}</span>
          <button type="button" className={styles.iconButton} onClick={() => setDark((x) => !x)} aria-label={dark ? "Bật giao diện sáng" : "Bật giao diện tối"} title="Sáng/tối">
            {dark ? <Sun size={17}/> : <Moon size={17}/>}
          </button>
          <button type="button" className={styles.sourceButton} onClick={() => setSourcesOpen((x) => !x)} aria-expanded={sourcesOpen} aria-controls="pvh-dashboard-sources">
            <Database size={15}/> Nguồn dữ liệu
          </button>
          <button type="button" className={styles.iconButton} onClick={() => router.refresh()} aria-label="Tải lại số liệu" title="Tải lại số liệu">
            <RefreshCw size={16}/>
          </button>
        </div>
      </div>

      <header className={styles.titleArea}>
        <p className={styles.roleEyebrow}>TỔNG QUAN THEO VAI TRÒ</p>
        <h1>{roleView.title}</h1>
        <p className={styles.subTitle}>{roleView.subtitle}</p>
        <p className={hasAlerts ? styles.takeaway : styles.takeawaySafe}>
          {hasAlerts ? <AlertTriangle size={15} aria-hidden="true"/> : <CheckCircle2 size={15} aria-hidden="true"/>}
          {roleView.totalFocus === 0
            ? "Chưa có bản ghi công việc trong phạm vi đang xem; không suy ra rằng mọi nhiệm vụ đã hoàn thành."
            : "Đang theo dõi " + roleView.totalFocusOpen + " việc chưa đóng trong " + roleView.totalFocus + " công việc thuộc phạm vi thống kê."}
        </p>
      </header>

      {sourcesOpen && (
        <aside id="pvh-dashboard-sources" className={styles.sourcePanel} aria-label="Nguồn và định nghĩa số liệu">
          <div className={styles.cardHead}>
            <h2>Nguồn và giới hạn thống kê</h2>
            <button type="button" className={styles.iconButton} onClick={() => setSourcesOpen(false)} aria-label="Đóng thông tin nguồn"><X size={15}/></button>
          </div>
          <div className={styles.sourceGrid}>
            <p><strong>Đầu việc:</strong> <code>work_items</code>, giới hạn theo tenant, vai trò và địa bàn trước khi hiển thị.</p>
            <p><strong>Thống kê theo vai trò:</strong> {model.role === "officer" ? "Chỉ việc assigned_to = người đang đăng nhập." : model.scopeLabel + "."}</p>
            <p><strong>Thời hạn:</strong> Ngày đến hạn theo lịch Việt Nam, chưa phải SLA theo từng quy định chuyên ngành.</p>
            <p><strong>Xu hướng hoàn thành:</strong> {model.eventsAvailable ? "Dựa vào work_item_events, tối đa một lần hoàn thành mỗi việc trong một tuần." : "Lịch sử chưa đủ tin cậy nên không vẽ giả số hoàn thành."}</p>
            <p><strong>Giới hạn tích hợp:</strong> Các KPI hiện tại chỉ phản ánh công việc M01. Số lượng hồ sơ chuyên ngành M02–M08, báo cáo M09 và dữ liệu nhập M10 KHÔNG được cộng tự động vào các KPI này.</p>
            <p><strong>M05 – Chuyển đổi số:</strong> <code>linkDigitalPlanWorkAction</code> liên kết kế hoạch với <code>work_item_id</code> (nhánh <code>fix/pvh-ph03-crud-ux-20261109</code>). Chỉ công việc M01 đã liên kết và nằm trong phạm vi phân quyền mới xuất hiện trong số liệu M01.</p>
            <p><strong>M08 – Kiểm tra:</strong> <code>createInspectionRecommendationAction</code> trả về <code>work_item_id</code> (cùng nhánh Phase 3). Chưa có KPI độc lập cho số cuộc kiểm tra hoặc kiến nghị.</p>
            <p><strong>M04 – Văn hóa:</strong> <code>submitCultureDossierAction</code> và <code>reviewCultureDossierAction</code> ghi hồ sơ qua RPC riêng. Chưa có truy vấn tổng hợp hồ sơ M04 vào Dashboard.</p>
            <p><strong>M02/M03/M06:</strong> Các thao tác nghiệp vụ ghi bảng chuyên ngành (ví dụ <code>labor_disputes</code>, <code>tuition_exemptions</code>, <code>social_protection_beneficiaries</code>); chưa có bộ tổng hợp KPI chuyên ngành.</p>
            <p><strong>M09/M10:</strong> Có <code>report_snapshots</code>, nguồn truy xuất <code>report_snapshot_lineage</code> và nhập chỉ tiêu qua <code>commit_indicator_import</code> trên nhánh Phase 4; chưa kết nối vào biểu đồ Dashboard.</p>
            <p><strong>Điều kiện sau merge:</strong> Merge nhánh code không tự triển khai migration, không tự tạo bản ghi và không tự kết nối KPI. Cần áp dụng migration, xác nhận RPC/RLS, bổ sung truy vấn tổng hợp và kiểm thử dữ liệu đầu-cuối trước khi bật các KPI chuyên ngành.</p>
          </div>
          <p className={styles.sourceFoot}>Cập nhật bản ghi gần nhất: {formatMoment(model.lastUpdated)} · {model.demo ? "Chế độ minh họa." : "Dữ liệu truy vấn tại thời điểm tải trang."}</p>
        </aside>
      )}

      <div className={styles.kpiGrid} aria-label="Các chỉ số chính theo vai trò">
        {roleView.cards.map((card) => (
          <button type="button" key={card.id} className={styles.kpi + " " + (
            card.tone === "bad" ? styles.kpiBad : card.tone === "warn" ? styles.kpiWarn : card.tone === "info" ? styles.kpiInfo : styles.kpiPrimary
          )} onClick={() => setFilter(card.filter)}>
            <span className={styles.kpiLabel}>{card.label}</span>
            <span className={styles.kpiValue}>{card.value}</span>
            <span className={styles.kpiFoot}>{card.detail} <span aria-hidden="true">↗</span></span>
          </button>
        ))}
      </div>

      <div className={styles.roleMainGrid}>
        <DashboardQueue model={model} roleView={roleView} filter={filter} onFilterChange={setFilter} canOpenWork={allowedRoutes.includes("/cong-viec")}/>
        <div className={styles.column}>
          <DashboardDomainsPanel roleView={roleView} allowedRoutes={allowedRoutes}/>
          {model.role === "leader" ? <DashboardWorkloadPanel model={model}/> : <DashboardStatusPanel roleView={roleView}/>}
        </div>
      </div>

      <div className={styles.roleInsightsGrid}>
        <DashboardAgingPanel roleView={roleView}/>
        {model.role === "leader" ? <DashboardWeeklyPanel model={model}/> : <DashboardContextPanel roleView={roleView} model={model}/>}
      </div>

      <footer className={styles.footerNote}>
        <span>Ngày thống kê: {formatDay(model.today)} · Múi giờ Việt Nam</span>
        <span>Các số liệu được phân quyền theo phiên đăng nhập · Không hiển thị thông tin cá nhân nhạy cảm</span>
      </footer>
    </section>
  );
}
