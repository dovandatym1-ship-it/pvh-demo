# Chief Architect Review & Risk Register — PVH
Status: CODE/DOCUMENT REVIEW (partial). Evidence: branch compare, selected source files, phase receipts. **Chưa chạy app, E2E, Lighthouse, Supabase hosted hoặc render UI bằng browser.**

## 1. Review theo phase
| Nhánh | Giá trị cần giữ | Điểm thiếu/đang tranh chấp | Quyết định |
|---|---|---|---|
| PH01 Auth/Platform | Quyền explicit, membership effective dates, fail-closed, account console, pgTAP | Tip PH01 có 7 commit ngoài lịch sử PH06 v2; account console + migration security chưa có tại PH06 v2 | Backport kiểm chứng, ưu tiên P0 |
| PH02 M01 Workflow | RPC atomic, OCC/idempotency, list paging, assignment, evidence, inbox | Tip PH02 cũng có 7 commit ngoài PH06; form update, collaborator, tests bổ sung chưa hiện diện | Đối chiếu toàn bộ delta, backport chọn lọc P0 |
| PH03 M04/M05/M08 | Domain pack + RLS + fake-success hardening + local DB tests | G3 blocked/thiếu browser UAT và law/authority | Giữ core an toàn, UI nâng cấp P1; không tự công nhận |
| PH04 M09/M10 | Reporting snapshots, SQL lineage, PDF/XLSX, import CSV, worker jobs | Hosted staging chưa nghiệm thu, antivirus/worker config còn mở | Giữ implementation, cân nhắc lazy UI, không mở feature nguy hiểm |
| PH05 Release | Gate, CI và runbook clone | G5 BLOCKED; chỉ có code/static/plan, chưa có rollout verified | Giữ runbook/gate, không tuyên bố release |
| PH06 v1 | Execution baseline 1 file | Không chứa business implementation, fork cũ | Chuyển tài liệu hữu ích vào plan; đánh dấu SUPERSEDED |
| PH06 v2 | Hardening M02/M03/M06, nền code kế thừa PH05 | 12 OP pack chủ yếu TODO; G6 BLOCKED | Dùng làm cumulative code baseline, không release |
| Dashboard | Role-aware KPI, data-source labels, accessible UI, visualization | `getWorkItems` capped 100 ⇒ KPI incomplete; có thay đổi trang M01; UI riêng CSS/theme | Merge theo thành phần, thay nguồn data |
| Specs M00–M11 | Message catalog, DB governance, module baseline, gap register | Spec chưa map đủ 128 OP hay chạy code; M11 chưa có module runtime | Merge docs và link tới backlog, không tăng scope triển khai |

## 2. Verified source observations, not hypothetical
- `feat/pvh-ph06-domain-expansion-v2/src/features/m01-core-work/server/queries.ts`: `getWorkItemsPage` có paging, `getWorkItems` vẫn `limit(100)`.
- `feat/pvh-dashboard/src/app/(app)/dashboard/page.tsx`: dashboard dùng `getWorkItems(ctx)` rồi tính KPI trên dữ liệu trả về; cần aggregation scoped ở server/DB, không giả total.
- `feat/pvh-dashboard/src/app/(app)/cong-viec/page.tsx`: dùng `WorkItemManager` client thay route M01 phân trang ở PH06; phải khôi phục paging hoặc lai ghép UX.
- `main/src/features/m01-core-work/components/work-item-manager.tsx`: có toast local dùng `setTimeout`, chưa là shared notification provider.
- `main` và PH06 `src/components/layout/sidebar.tsx`: default navigation khi `groups=[]`, cần fail-closed menu; server policy vẫn quyết định truy cập.
- `feat/pvh-ph06-domain-expansion-v2/src/app/(app)/layout.tsx`: tên đơn vị hardcode, role fallback “Chủ tịch UBND xã”; cần lấy từ session context, xử lý trạng thái lỗi/unknown.
- PH06 thiếu `src/features/m00-platform/components/accounts-console.tsx`, `src/app/(app)/quan-tri/tai-khoan/page.tsx`, `supabase/migrations/20261108104745_ph01_security_contract.sql` trong khi tip PH01 có.
- PH06 thiếu `src/features/m01-core-work/components/update-work-item-details-form.tsx` trong khi tip PH02 có.
- `PH05_EXECUTION_RECEIPT` và `PH06_IMPLEMENTATION_RECEIPT` không xác nhận owner acceptance.

## 3. Risk register
| Risk | Mức | Xác suất | Ảnh hưởng | Cách giảm thiểu | Gate |
|---|---|---|---|---|---|
| ARC-01 mất late security changes PH01 | CRITICAL | High | quyền/account/RLS lệch | delta audit + migration replay & hostile RLS tests | M1 |
| ARC-02 mất late workflow changes PH02 | HIGH | High | thiếu UX/logic cập nhật/cộng tác | delta audit + OP tests | M1 |
| ARC-03 main UI bị ghi đè bởi PH06 | HIGH | High | giao diện xấu đi, mất route/modal | 16-file preservation checklist + visual diff | M1 |
| ARC-04 dashboard KPI lấy 100 dòng | HIGH | Certain in design, impact depends volume | tổng số sai, dễ chậm | SQL aggregate scoped + list pagination | M2 |
| ARC-05 sidebar defaults when filtered=[] | HIGH | Code-level confirmed | menu lộ chức năng không có quyền / UX sai | empty list remains empty, route guard, tests | M1 |
| ARC-06 hardcoded xã/role | MEDIUM | Code-level confirmed | clone sang xã khác sai nhãn | dynamic tenant / no role fallback | M2 |
| ARC-07 inconsistent visual system | HIGH | High | cảm giác chắp vá qua module | shared tokens, components, 4-size screenshot review | M2 |
| ARC-08 report/image/data volume and client hydration | HIGH | Medium | tải chậm, giật | defer client, lazy chart, server pagination, budget CI | M2 |
| ARC-09 DB phase migrations out of sync | CRITICAL | High | fail auth/workflow/data | isolated DB reset + verified migration ledger | M1 |
| ARC-10 incorrect legal authority/fake success | CRITICAL | Medium | tác động nghiệp vụ thật | fail-safe, simulated badge, no unverified approval | M1 |
| ARC-11 standalone spec drift | MEDIUM | High | spec/code không khớp | OP-to-code matrix, change log, ADR | M3 |
| ARC-12 clone model contradiction | HIGH | High | tenant design phình, sai việc hiện tại | single-commune-per-deployment MVP; future shared multi-tenant ADR | M1 |

## 4. Clone architecture decision
`supabase/README.md` của code hiện tại nói **single commune** cho baseline DB; `PH05_RELEASE_RUNBOOK` mô tả clone xã B bằng deployment/Supabase riêng. Trong khi docs định hướng multi-tenant shared code. Đề xuất **MVP: một codebase, một deployment có thể cấu hình cho một xã**; mỗi bản clone dùng environment/DB/Storage tách biệt, không hardcode tên xã. Giữ tenant_id + RLS như lớp phòng vệ. **Shared database nhiều xã là ADR riêng, không kéo vào UI-first MVP.** Cần owner xác nhận trước khi triển khai thay đổi schema.

## 5. Limitations
- Branch compare reports do not show merge conflict resolution results; 16 common files are **potential** conflict/hotspots, not 16 proven textual conflicts.
- A file absent on PH06 branch is not proof its behavior entirely absent elsewhere.
- Visual quality and speed are design goals, **not measured outcomes**.
- No actual branch/commit merge was run as part of this review.
