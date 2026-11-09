# PH02 — Implementation Receipt (DRAFT, not a Gate PASS)

**Branch:** `feat/pvh-ph02-core-workflow`  
**Base:** `feat/pvh-ph01-platform-auth` (đối chiếu PR #2 tại `7817399e62b15479a515588a14712322ad0f5270`)  
**Owner duyệt:** Đỗ Văn Đạt, chưa duyệt / chưa merge.

## Code đã thực hiện

- Migration PH02 cho assignment history, transition rules v1, atomic `assign_work_item`/`transition_work_item`, optimistic concurrency, idempotency hash/replay, audit, status minh chứng và xác nhận Storage.
- Bắt buộc client giữ key cùng intent khi retry; bổ sung Zod strict cho create/transition/assign.
- Form tạo việc, lọc danh sách có paging/tìm kiếm, chi tiết/timeline/giao lại/trả lại/hoàn thành, tải minh chứng private.
- Bàn làm việc đếm số theo DB và hạn thật; loại bỏ fallback seed trong M01 queries; inbox nội bộ ghi trong cùng transaction khi giao, trình, trả lại, hoàn thành, hủy.
- Quy trình OP-M01, pure policy regression tests và pgTAP structural contract (chưa chạy trên DB).

## Lượt hardening bổ sung — 08/11/2026

- `P1`: Xác thực người nhận việc theo **quyền read/update + scope org_unit_ids** tại trigger dùng chung cho tạo/giao; RPC liệt kê ứng viên lọc theo công việc, kèm địa bàn được phép; UI thêm địa bàn và loại ứng viên không hợp lệ.
- `P1`: Không tiết lộ version/state trước kiểm tra quyền đọc trong `SECURITY DEFINER`; tìm người rà soát thực sự hợp lệ trước khi cho trình và chỉ gửi inbox cho người đủ quyền.
- `P1`: Backfill file PH01 có Storage object thật sang `UPLOADED`, không mặc định khóa mọi minh chứng cũ.
- `P02-10`: Thêm `app.update_work_item_details` đổi hạn/địa bàn có reason/OCC/idempotency/event/audit/inbox; UI thao tác quản lý.
- `P02-11`: Thêm Storage RLS chỉ cho chủ file đọc/xóa bản PENDING, RPC cleanup chỉ xóa metadata sau khi object không tồn tại; retry finalize cùng receipt, không tự tạo metadata mới khi xác nhận lỗi.
- `P02-07`: Thêm `source_ref` cấu trúc, RPC tạo v2 giữ transaction và đối chiếu giá trị nguồn khi replay idempotent.
- `P02-14`: Giữ notification append-only, thêm receipts riêng có RLS và RPC idempotent đánh dấu đã đọc; bàn làm việc có thao tác xác nhận đọc.
- `P02-08/15`: Danh sách bổ sung lọc theo thôn/xóm và sắp xếp mới/cũ/hạn gần nhất (mọi truy vấn vẫn chịu RLS), hiển thị loading/error riêng cho công việc và bàn làm việc, không fallback seed khi database lỗi.
- `P02-07/10`: Bổ sung danh sách người phối hợp đọc-only theo scope; người điều phối thay đổi tối đa 20 người với OCC/idempotency/lý do/event/audit/inbox; RLS không cấp thêm quyền cập nhật/phê duyệt cho người phối hợp.
- `P02-16`: pgTAP structural contract tăng từ 13 lên 38 assertion; Node tests tăng từ 5 lên 15, CI chạy `tests/m01-*.test.mjs`. **Đây là kiểm thử ở mức source/contract, chưa phải DB E2E.**

**Trạng thái:** `CODED_CI_PASS_AWAITING_STAGING`. Chưa có bằng chứng Gate G2 PASS; không áp migration trên Supabase thật.

### CI sau hardening

- [GitHub Actions #42478821475](https://github.com/dovandatym1-ship-it/pvh-demo/actions/runs/42478821475) tại commit `fca1c7298a8a0c13b16fcf7d3cd67a2833acbb6a`: **PASS** TypeScript, lint, architectural fitness, Next build, security regressions và 15 Node tests.
- Test pgTAP đã mở rộng thành **38 assertions** nhưng **chưa thực thi trên Postgres**; CI xanh không nâng trạng thái G2.
- Bộ thao tác/SQL đọc lại để người duyệt kiểm tra: [PH02_GATE_G2_VERIFICATION.md](./PH02_GATE_G2_VERIFICATION.md).

## Chưa nghiệm thu / phụ thuộc

### CI code validation (đã thực hiện)

- GitHub Actions [CI run #42473764754](https://github.com/dovandatym1-ship-it/pvh-demo/actions/runs/42473764754) trên commit `0a87d9e01bbeb4a9e1bc347901542704ee270b97`: **PASS** (7/7 PH01 security regressions, 5/5 PH02 rule tests, TypeScript typecheck, lint, architectural fitness, Next build).
- Kiểm tra read-only project Supabase `Demo-pvh` ngày 08/11/2026: chưa có RPC `app.transition_work_item`, `assign_work_item`, `finalize_evidence`, `list_work_assignees`; migration PH02 chưa được áp cloud, nên UI mới chưa chạy E2E trên DB thật.
- Supabase Security Advisor còn cảnh báo `auth_leaked_password_protection` (cấu hình Auth thuộc PH01/đơn vị quản trị), không chỉnh trực tiếp trong PH02.
- Chưa có Supabase CLI/test DB trong phiên này: **chưa chạy** `supabase db reset`, pgTAP, browser E2E, live Storage, concurrent DB readback. CI xanh không có nghĩa Gate G2 PASS.

| ID | Tình trạng | Việc còn làm trước G2 |
|---|---|---|
| G1 | `BLOCKED` | Phase 1 cần live Auth/RLS/Storage/db reset/atomic audit và E2E độc lập |
| P02-01 | `IMPLEMENTED_DRAFT` | Xác nhận OP/SLA/actor với owner |
| P02-02–06 | `CODED_NOT_DB_VERIFIED` | Apply migration vào DB test độc lập; pgTAP + concurrent/replay SQL readback |
| P02-07–09, P02-12–13, P02-15 | `CODED_NOT_BROWSER_VERIFIED` | Build, UI browser E2E với 3 personas và 375px |
| P02-10 | `PARTIAL` | Đổi hạn/địa bàn/người phối hợp đã code, chưa kiểm thử DB; delegation history chưa hoàn thành |
| P02-11 | `PARTIAL` | Có xử lý cleanup/retry trong phiên, còn cron cleanup stale PENDING, verified hash, version file, preview |
| P02-14 | `CODED_NOT_DB_VERIFIED` | Inbox append-only + read receipt đã code, cần test replay/scope/tính đúng người nhận |
| P02-16 | `PARTIAL` | Pure/source tests đã thêm; DB/browser tests chưa chạy |

**Chưa làm:** Không áp Supabase cloud, không thay đổi tài khoản/dữ liệu, không deploy Vercel, không tự merge `main` hoặc Phase 1.

## Kế hoạch xác minh

1. Sau commit mới hoặc merge Phase 1, chạy lại CI (`npm ci`, typecheck, lint, fitness, build, node tests), không dùng kết quả trên commit cũ để tuyên bố PASS.
2. Tạo DB test độc lập từ migration PH01 + PH02; chạy `supabase db reset`, kiểm chứng grants/RLS/PgTAP; seed 3 Auth user hợp lệ trong test env (không dùng persona giả).
3. Chạy WORK-01–WORK-10, DB-003–DB-010, SEC-007–SEC-013; lưu SQL readback và 2 browser concurrency receipts.
4. Fix lỗi và tự audit; chỉ trình owner duyệt khi không còn P0/P1 và G1 PASS.
