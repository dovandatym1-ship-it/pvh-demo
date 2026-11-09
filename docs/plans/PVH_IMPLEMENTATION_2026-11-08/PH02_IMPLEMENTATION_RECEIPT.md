# PH02 — Implementation Receipt (DRAFT, not a Gate PASS)

**Branch:** `feat/pvh-ph02-core-workflow`  
**Base:** `feat/pvh-ph01-platform-auth` (commit `88ce16db339b88d970bc8307d7713bd437e75f89`)  
**Owner duyệt:** Đỗ Văn Đạt, chưa duyệt / chưa merge.

## Code đã thực hiện

- Migration PH02 cho assignment history, transition rules v1, atomic `assign_work_item`/`transition_work_item`, optimistic concurrency, idempotency hash/replay, audit, status minh chứng và xác nhận Storage.
- Bắt buộc client giữ key cùng intent khi retry; bổ sung Zod strict cho create/transition/assign.
- Form tạo việc, lọc danh sách có paging/tìm kiếm, chi tiết/timeline/giao lại/trả lại/hoàn thành, tải minh chứng private.
- Bàn làm việc đếm số theo DB và hạn thật; loại bỏ fallback seed trong M01 queries; inbox nội bộ ghi trong cùng transaction khi giao, trình, trả lại, hoàn thành, hủy.
- Quy trình OP-M01 và pure policy regression tests.

## Chưa nghiệm thu / phụ thuộc

| ID | Tình trạng | Việc còn làm trước G2 |
|---|---|---|
| G1 | `BLOCKED` | Phase 1 cần live Auth/RLS/Storage/db reset/atomic audit và E2E độc lập |
| P02-01 | `IMPLEMENTED_DRAFT` | Xác nhận OP/SLA/actor với owner |
| P02-02–06 | `CODED_NOT_DB_VERIFIED` | Apply migration vào DB test độc lập; pgTAP + concurrent/replay SQL readback |
| P02-07–09, P02-12–13, P02-15 | `CODED_NOT_BROWSER_VERIFIED` | Build, UI browser E2E với 3 personas và 375px |
| P02-10 | `PARTIAL` | Chưa sửa hạn/scope, chưa làm người phối hợp và delegation history đầy đủ |
| P02-11 | `PARTIAL` | Orphan cleanup, verified hash, version file, preview |
| P02-14 | `CODED_NOT_DB_VERIFIED` | Inbox append-only, cần test replay/scope/tính đúng người nhận; chưa có đánh dấu đã đọc |
| P02-16 | `PARTIAL` | Pure unit tests đã thêm; DB/browser tests chưa chạy |

**Chưa làm:** Không áp Supabase cloud, không thay đổi tài khoản/dữ liệu, không deploy Vercel, không tự merge `main` hoặc Phase 1.

## Kế hoạch xác minh

1. Clone nhánh này và chạy `npm ci`, `npm run typecheck`, `npm run lint`, `npm run build`, `node --experimental-strip-types --test tests/m01-workflow-rules.test.mjs`.
2. Tạo DB test độc lập từ migration PH01 + PH02; chạy `supabase db reset`, kiểm chứng grants/RLS/PgTAP; seed 3 Auth user hợp lệ trong test env (không dùng persona giả).
3. Chạy WORK-01–WORK-10, DB-003–DB-010, SEC-007–SEC-013; lưu SQL readback và 2 browser concurrency receipts.
4. Fix lỗi và tự audit; chỉ trình owner duyệt khi không còn P0/P1 và G1 PASS.
