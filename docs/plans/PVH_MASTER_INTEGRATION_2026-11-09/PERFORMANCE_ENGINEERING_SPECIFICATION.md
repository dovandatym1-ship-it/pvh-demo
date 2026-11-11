# PERFORMANCE ENGINEERING SPECIFICATION — PVH
**Document:** PERF-v1.0 · **Status:** TARGET / NOT BENCHMARKED · **Priority:** P0
Stack observed: Next.js 15.2.3, React 19, Supabase SSR, PostgreSQL, Tailwind. Không đánh dấu PASS vì chưa chạy profile ngoài browser và cloud.

## 1. Baseline evidence & root causes cần sửa
- PH06/src/features/m01-core-work/server/queries.ts: getWorkItemsPage có pageSize giới hạn 100, mặc định 20; getWorkItems lấy tối đa 100 bản ghi, dùng cho caller cũ.
- Dashboard branch dashboard/page.tsx gọi getWorkItems(ctx) và getCompletionEvents(ctx) rồi buildDashboardModel; vì vậy KPI “toàn bộ” có thể sai khi >100 rows dù UI đẹp.
- getCompletionEvents() giới hạn 5.000 events, nếu chạm giới hạn cần trạng thái “history truncated”; không hiển thị tổng hoàn thành chắc chắn.
- main WorkItemManager lọc/search toàn bộ initialItems ở client, không phù hợp tăng số lượng.
- PH06 page công việc dùng getWorkItemsPage với select('*') và count exact; cần đo khi dữ liệu lớn, rút trường hot path.
- Dashboard có CSS/theme riêng; thêm client state và charts có thể tăng hydration; cần đo bundle sau tích hợp.
- Có chức năng xuất/nhập lớn trong PH04; phải phân tách job tiến trình dài, không làm nghẽn page request.

## 2. Invariants — đúng trước nhanh
1. Không được lấy KPI từ list phân trang/limit100; tổng phải tính trên tập đã được scope đúng ở DB hoặc verified server aggregate.
2. Không cache dữ liệu giữa người dùng/xã; key có userId+tenantId+scopeVersion+filter và hủy cache phù hợp khi role/assignment thay đổi.
3. Không chạy query qua service-role để “nhanh hơn”, không bypass RLS cho dashboard.
4. Không gửi PII hoặc toàn bộ bản ghi sang browser khi UI chỉ dùng tổng số.
5. Không dùng optimistic success cho hành động quản trị, thanh toán hay chốt hồ sơ chưa xác minh.

## 3. Data access contracts
| Route / module | Data shape | Query strategy | Response |
|---|---|---|---|
| /dashboard | DashboardSummary + authorized PriorityQueuePage | Server-side aggregate theo role/scope; queue LIMIT 10–20; completion trend từ event ledger hoặc unavailability | summary: counts + period + source/version + integrity flags |
| /cong-viec | WorkItemsPage | server pagination 20 mặc định, sort + search + tenant scoped | rows, total, hasNextPage, currentPage, filterEcho |
| /cong-viec/[id] | WorkItemDetail | by id, tenant/record permissions, timeline lazy/paginated | detail + events + assigned + attachments (authorized) |
| /ban-lam-viec | InboxPage | overdue/review/assigned counts bằng query riêng; rows paginated | totals exact or qualified |
| /bao-cao | ReportIndex/Snapshot | period filters; fetch list minimal columns, drill-down lineage later | paginated summaries |
| /nhap-chi-tieu | ImportPreview/Job | stream/file upload safe, inspect rows on server | count, validation errors, receipt |
| M02–M08 | DomainListPage | per-domain SQL column projection & cursor/page | no full-record hydration |

### DashboardSummary suggested contract (pseudotype)
    type DashboardSummary = {
      scope: {tenantId: string; actorId: string; role: string; localityIds: string[]};
      asOf: string; period: {from:string; to:string; timezone:"Asia/Ho_Chi_Minh"};
      totals: {open:number; overdue:number; underReview:number; dueSoon:number};
      statusCounts: Array<{code:string; count:number}>;
      trend: Array<{week:string; created:number; completed:number|null}>;
      quality: {complete:boolean; sourceVersion?:string; warnings:string[]};
      demo:boolean;
    };
Mọi số chỉ đúng khi quyền và phạm vi hợp lệ; nếu count incomplete phải trả metadata, không thay bằng 0.

## 4. Query/indexing plan
- Work items: tenant + assigned_to/status/due_date/created_at; index có thứ tự theo SELECT thật, EXPLAIN ANALYZE trước khi quyết định final.
- Reports: tenant + period + status + created_at, snapshot lineage theo report_id, template version.
- Event trend: tenant + work_item_id + to_status + created_at; giới hạn phạm vi thời gian; tránh double-count state transitions nếu nghiệp vụ yêu cầu unique completion.
- Search: case-insensitive ILIKE với escaping input; nếu dataset lớn mới cân nhắc trigram index, full text; không index mọi cột.
- Count exact trên bảng lớn có thể nặng; nếu dùng summary materialization phải có watermark/refresh, chính sách stale và tenant isolation.
- Không N+1 trên assignee/attachment. Prefetch batched chỉ những gì bảng hiển thị.
- Database read load set target on representative 10k work items / 500 reports / 3 roles / two distinct synthetic tenants for negative tests; đây là dữ liệu kiểm thử, không ngụ ý triển khai 2 xã cloud chung ngay.
- Supabase private Storage signed downloads đúng parent record; không cache link nhạy cảm công khai.

## 5. Rendering & bundle rules
- Ưu tiên Server Components cho page shell/data; Client Components là islands cho table interactions, modal, search, chart only.
- Dashboard KPI panel render sớm; charts/visuals tải theo ưu tiên/hydration khi phù hợp, không gây CLS.
- Lazy-load modal không mở, file import/export, heavy chart code; không lazy action cần xuất hiện ngay khi nhấn.
- Cache fonts được phép, image-size/layout cố định; tránh ảnh stock nặng (PVH chủ yếu thông tin).
- CSS tokens chung, tránh duy trì song song dashboard CSS theme với app theme; không render chart offscreen nếu chưa cần.
- Tránh duplicate request: URL filter changes debounced, abort/stale query guarded, skip re-fetch unchanged key.
- Navigation route prefetch có chọn lọc cho route phổ biến, không prefetch nội dung nhạy cảm ngoài quyền.

## 6. Performance budget (proposed; chưa đo)
| ID | Metric & percentile | Target | Measure method |
|---|---|---|---|
| PF-01 | LCP p75 mobile | <= 2.5s | Lighthouse lab + Web Vitals preview real data |
| PF-02 | INP p75 mobile | <= 200ms | RUM hoặc interaction profile sau warmup |
| PF-03 | CLS p75 | <= 0.10 | performance observer + screenshot trace |
| PF-04 | Feedback click → visible pending | <= 100ms | Playwright trace/high speed recording |
| PF-05 | Work list query p95 | <= 500ms on seeded test | server timing + EXPLAIN |
| PF-06 | Dashboard aggregate query p95 | <= 500ms on seeded test | server timing + DB stats |
| PF-07 | Warm navigation p75 | <= 1s perceived usable | browser trace (không dùng làm SLA pháp lý) |
| PF-08 | Client JS on hot routes | baseline + regression ceiling fixed after profile | next bundle analyzer/route JS size |
| PF-09 | Large CSV 5k rows | under defined job timeout; no blocking UI | queued job + progress |
| PF-10 | Zero data/empty shell | no blank white screen or fake value | UAT + snapshots |

Không đặt số client JS cố định khi chưa có baseline; khóa mức trần sau phép đo ban đầu. Thay đổi ngân sách phải có reason + owner approval, không âm thầm nới để “PASS”.

## 7. Benchmark methodology (reproducible)
- Môi trường preview production build; Node 22; schema/migration SHA; dataset synthetic deterministic; 375/390 mobile mid-range emulation, 768 tablet, 1440 desktop, regular+slower network, cold/warm cache.
- Cố định commit, DB snapshot, role context, date as-of, app environment, geography của test server. Ghi timing server và network, không chỉ score Lighthouse tổng.
- 3 vai trò tối thiểu: lãnh đạo, công chức, phụ trách xóm (scope rỗng và có scope).
- Run repeat 5 lần cold và 5 lần warm/route, report median/p75/p95 theo metric phù hợp; phân tách lab và real-user signals.
- Measure: FCP/LCP/CLS/INP where available; route fetch count, SQL count, TTFB, JS transferred, long tasks, interaction gap, error count.
- Synthetic dataset: 0/1/20/100/101/1k/10k work items; overdue boundaries đúng ngày VN; 5k+ completion events; 500 reports; 100+ export jobs; negative tenant A/B.
- Never use a fake P75 from Lighthouse single run; label lab-only vs RUM.
- Store evidence: perf/<sha>/<screen>/<profile>/trace.zip, screenshot.png, metrics.json (paths proposed; evidence files not yet created).

## 8. Regression and correctness tests
| ID | Scenario | Expected |
|---|---|---|
| PERF-101 | 101 records, page size 20 | page contains 20, total 101, dashboard KPI correct 101 when allowed |
| PERF-102 | 10k records | bounded memory, no client shipping 10k, server list pages |
| PERF-103 | 5k event limit hit | trend marked incomplete, not fabricated complete |
| PERF-104 | scope A vs B / P4 vs P1 | no unauthorized counts, rows, names |
| PERF-105 | long search slow response | stale result never overwrites latest |
| PERF-106 | double click submit | one mutation/idempotent receipt |
| PERF-107 | browser back restores filters/page | URL / scroll / focus correct |
| PERF-108 | slow export/worker | page responsive, real status and authorized final download |
| PERF-109 | parallel dashboard widgets | no duplicated identical fetching |
| PERF-110 | offline or 5xx | error UI with retry; no false success |
| PERF-111 | slow tablet/mobile | drawer/scroll/modal/keyboard no blocking long task |
| PERF-112 | cache after role revoke/tenant switch | no stale cross-scope display |
| PERF-113 | 0 rows | zero shown for verified empty, unavailable shown when read failed |
| PERF-114 | create/complete task | updated dashboard consistent after refresh and audit |

## 9. Implementation work packages
P01 add performance telemetry and baseline report (one SHA). P02 implement server scoped dashboard aggregation. P03 retain server paging on M01 but transplant main modal UX. P04 query projection and index analysis. P05 lazy charts/modals and shared shell. P06 navigation and transition feedback. P07 add CI regression threshold and replayable fixtures. P08 performance/QA signoff.
Every package = code diff + before/after measure + correctness check + rollback note.

## 10. DoD
No full-dashboard counts from limit-100 queries; no role/tenant data leak; p75 CWV targets supported by actual recorded evidence or approved documented exception; no slow UI after data count scales; no synthetic success; source/commit/environment/test profile attached to every result.
