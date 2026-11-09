# UX-first & Performance-first Blueprint — PVH
**Status: TARGET DESIGN, NOT VERIFIED SCREEN QUALITY.** Stack hiện hữu: Next.js 15, React 19, Tailwind, Lucide, Supabase. Không thêm thư viện UI nặng khi chưa có lý do.

## 1. Ngôn ngữ thiết kế mục tiêu
**Tinh thần:** nghiệp vụ nhà nước hiện đại, rõ ràng, tiết chế, chuyên nghiệp; không lạm dụng gradient, shadow, màu badge và hiệu ứng. Người dùng thực thao tác hồ sơ lâu, nên độ tương phản, mật độ thông tin và khả năng tìm nhanh quan trọng hơn phô diễn dashboard.

- **Layout:** app-shell chung; sidebar thu gọn được; topbar rõ đơn vị, vai trò, thông báo, tài khoản; nội dung có max-width hợp lý nhưng bảng rộng được dùng tối đa không gian.
- **Phân cấp:** tiêu đề trang -> mô tả ngắn -> 1 primary CTA -> KPI/toolbar -> nội dung; không lặp tên “Trung tâm điều hành VH-XH cấp xã” trên mọi màn.
- **Tên đề xuất:** `Tổng quan` cho dashboard; `Bàn làm việc` cho hàng đợi cá nhân; `Công việc` cho danh sách; `Báo cáo` cho số liệu/kỳ.
- **Tokens đề xuất (cần test contrast/brand):** nền trung tính sáng, bề mặt trắng, chữ slate 900/600; accent xanh ngọc/emerald tiết chế; warning amber, error red, success green có semantic rõ; spacing 4/8/12/16/24/32; radius 8–12; shadow nhẹ.
- **Typography:** ưu tiên system-ui hoặc font tiếng Việt được tối ưu tải; body 14–16px, label 13–14px, heading 20–24px. Tránh text 10–11px ở bảng nghiệp vụ quan trọng. Tải font có chủ đích, không để FOIT.
- **Modes:** light mặc định. Dark mode chỉ bật sau khi có tokens và kiểm thử trên toàn app; không có theme riêng chỉ ở dashboard.

## 2. Shared UI contract (thực thi trong src/components/ui + shared shell)
| ID | Component | Acceptance |
|---|---|---|
| UX-01 | AppShell / Sidebar / Header | menu permission-filtered, responsive drawer, tenant label từ context, breadcrumbs, focus, no fallback all |
| UX-02 | PageHeader | tiêu đề ngắn, mô tả, 1 CTA primary, secondary contextual |
| UX-03 | StatCard / KPI | số, đơn vị, kỳ, nguồn, tooltip; clickable only if real filter target |
| UX-04 | DataTable | server pagination, sort, filter, search, density, row action, loading, empty/error, aria labels |
| UX-05 | FilterBar | URL state, clear filters, result count, persistent navigation |
| UX-06 | FormField | schema validation, disabled, error below field, required, help text, dirty-state |
| UX-07 | Drawer/Modal/Dialog | trap focus, Escape/cancel, mobile usable, no nested modal soup |
| UX-08 | Toast/InlineAlert/Banner | shared registry according to `SHARED_NOTIFICATION_DESIGN_SYSTEM.md` |
| UX-09 | Empty/Loading/Error/Retry | true state, no fake data; clear action if meaningful |
| UX-10 | ChartCard | grounded formula, source & date, no fabricated comparative trends, skeleton |
| UX-11 | FileUpload/ExportProgress | size/type checks, progress, error per row and authorized download |
| UX-12 | ActivityTimeline | real audit/event data, clock/timezone, sensitive-value masking |

Prefer extending existing components, not recreating duplicates in Mxx features. Central tokens and one message registry.

## 3. Screen-by-screen priorities
| Screen | Design pattern | Data/interaction |
|---|---|---|
| Dashboard (mỗi role) | 4 high-value KPIs + priority queue + max 2 charts + domain summary | All KPIs from authorized scoped aggregate, real periods, display unavailability |
| Bàn làm việc | Inbox/assigned/overdue queue, compact cards and actions | Role-aware, paginated, keyboard accessible |
| Công việc | DataTable + filters + details drawer + create/edit modal | Server paging, OCC, error states, idempotent actions |
| Văn hóa gia đình | Header + guided workflow + status badges + list | Do not present demo approval as legal decision |
| Báo cáo | Period selector + status + report detail/lineage + export | Snapshot source/version, progress/errors, no false success |
| Nhập chỉ tiêu | Template download + preview + validation table + commit summary | 0/NULL distinct, row errors, partial policies |
| M00 quản trị | Structured CRUD forms and permission matrix | Strong warnings for destructive actions and explicit grants |
| M02–M08 chưa verified | Useful read-only overview / explicitly scoped demo | No dead buttons or unverified submit/approve |

## 4. Responsive & accessibility
- Screenshot and UAT at 375/390, 768, 1024, 1440px; touch targets adequate, no horizontal viewport overflow; wide tables may scroll internally with clear affordance.
- Mobile sidebar drawer closed by default, backdrop dismissal, route navigation auto-close, focus retained, Escape closes; sticky actions never cover form fields.
- Keyboard traverse tab order, visible focus, accessible buttons/icons, form label association, dialogue announcements; WCAG 2.2 AA target.
- Empty data, permission denied, partial load, failed request, offline, unknown result after timeout each have distinct truthful UI.
- Reduced motion support; never animate critical context away.

## 5. Dashboard: visual quality AND correct meaning
- Role configurations: Lãnh đạo (tổng hợp có quyền), Công chức VH-XH (việc được giao), cán bộ phụ trách địa bàn (scope), quản trị (system status not privileged personal details).
- Four KPIs suggested: cần xử lý, quá hạn, chờ rà soát, sắp đến hạn. Show units + exact scope + period, not unsupported domain totals.
- Charts: 6-week created vs completed (completion only from event ledger; if truncated show 'chưa đủ dữ liệu'); 7-state distribution. Additional domain breakdown only when there is enough grounded source.
- Avoid all-time totals computed from `getWorkItems().limit(100)`; create `getDashboardSummary(ctx, filters)` via scoped DB aggregates or verified materialized summary. Separate queue endpoint for paginated rows. No client role switch; source badge and drilling must use authorized destination.
- Ensure drill-down does not change KPI denominator silently; label scope and source.
- If demo uses synthetic fixtures, display **Dữ liệu minh họa**. No fake trend or fake number disguised as live.

## 6. Performance budgets (goals, NOT measured)
**Test profile:** production preview build, mobile emulation + desktop, throttled mid-tier device/4G and warmed/cold cache, 10k synthetic work items, 500 reports, 3 roles, configured isolated DB. Capture p75 Web Vitals and p95 server query. Fine-tune budgets after first measurement, never report invented scores.

| Metric | Proposed target | Instrumentation |
|---|---|---|
| LCP p75 | ≤2.5 s | Web Vitals on 4G mobile profile |
| INP p75 | ≤200 ms | Real User Monitoring or repeatable interaction profile |
| CLS p75 | ≤0.10 | Layout shift measurement |
| Main route interaction feedback | ≤100 ms perceived state change | Click-to-feedback recording |
| Navigation feedback | immediate skeleton/progress; usable next screen preferably ≤1s p75 warmed | Trace and nav profiling |
| Tenant-scoped list query p95 | ≤500 ms with benchmark dataset | SQL/route timing |
| Dashboard KPI query p95 | ≤500 ms with benchmark dataset | SQL explain and server timing |
| Client JS / route | Baseline measured and regression budget enforced; no avoidable charts in shell | Bundle analyzer |
| Long task | Visible real progress or queued job receipt | E2E and job logs |
| Accessibility | 0 critical keyboard/focus/contrast defects | Automated + manual audit |

### Optimization order
1. Correct data contract: independent aggregate vs paginated rows. Remove `select('*')` from hot listing APIs where unneeded; choose required fields, verify indexes with EXPLAIN, caching scoped to tenant/role.
2. Do not ship all rows to browser. URL-backed filters, sensible page sizes 20–50, virtualize only after measured bottleneck.
3. Keep Server Components for data and low-interaction surfaces; client components only for interactive islands, avoid hydration of entire page.
4. Lazy-load charts, heavy export UI, rarely opened dialogs; prefetch high-probability routes only if safe.
5. Debounce queries, cancel stale searches, prevent duplicate clicks, preserve scroll/focus; use optimistic UI only for reversible actions with rollback.
6. Skeletons with stable dimensions and accessible loading announcement; no fake progress percentages.
7. Avoid unnecessary re-renders, memoization only where profiler supports; remove redundant effects and expensive client-side totals.
8. Monitor slow queries, route errors, web-vitals, resource timing per release SHA; alert on regressions.

## 7. Visual acceptance protocol
- Before/after screenshots for each priority screen at all breakpoints; store per SHA in evidence folder/PR, not only narrative claims.
- Review consistency: sidebar, typography, spacing, buttons, cards, tables, dates, error handling, focus, report layout.
- Real interaction UAT: open → filter → view → edit → save → return → export without modal traps, layout jumps or dead ends.
- Accessibility review + baseline measurements; new visual design must not regress PH01/02 permissions or PH04 report correctness.
