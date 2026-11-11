# PH03 Implementation Receipt — 08/11/2026

**Task group:** P03-01→P03-21 (increment 1, partial implementation)\
**Branch:** `feat/pvh-ph03-domain-verticals`\
**Base branch:** `feat/pvh-ph02-core-workflow`; fork point `faf9975e3e363ed978cf77af27ec7c4d70a7c864`, PR đã theo dõi base tiến lên `f0ffe1db666cf39e39c4976c02052c1e4f8ba976`\
**Owner:** Đỗ Văn Đạt — `owner_approval: PENDING`\
**Verdict:** `IMPLEMENTED_PARTIAL / G3 BLOCKED`; không tự đánh `VERIFIED` hoặc `OWNER_ACCEPTED`.

## 1. Phạm vi đã mã hóa

| Nhóm task | Source/behavior đã thêm | Trạng thái |
|---|---|---|
| P03-01–04 | M04 type phân biệt gia đình/thôn/xã; pack/version/jurisdiction/status; campaign, submissions, events; RLS/permission | PARTIAL — DB migration đã qua; luật chưa VERIFIED |
| P03-05–08 | Mở đợt minh họa **atomic** có khóa version, nộp hồ sơ có source_ref, chống trùng và retry qua ngày đóng đợt, hamlet scope; rà soát có reason/OCC/SoD | PARTIAL — thiếu evidence M04 và UI công nhận hợp pháp |
| P03-09–11 | Khóa kết quả công nhận khi rule chưa verified; giao diện hai luồng; nhãn minh họa | PARTIAL — không có ghi nhận quyết định và browser E2E |
| P03-12–16 | Plan, link M01 task, indicator period/unit/status/source/version, không fallback số giả; UI ghi nhận | PARTIAL — thiếu chốt kỳ, công thức, drill-down |
| P03-17 | E2E-PLAN-001 | NOT_RUN |
| P03-18–20 | Inspection record + checklist version; recommendation liên kết M01 atomic; hậu kiểm đúng quyền/trạng thái; UI mobile responsive cơ bản | PARTIAL — chưa file/ảnh/checklist thật |
| P03-21 | E2E-INSPECTION-001 | NOT_RUN |

## 2. Sửa lỗi cụ thể từ source PH02

1. **M05/M08 false success**: khóa Server Actions cũ trả `ok` sau khi RPC lỗi và fallback update/audit riêng; thay bằng RPC PH03 chỉ trả thành công khi DB phản hồi hợp lệ.
2. **M04 rule 85 điểm hardcode**: route chính chuyển sang workspace minh họa với pack version; SQL chặn `DAT` nếu pack chưa VERIFIED hoặc evidence hợp lệ không tồn tại. Component cũ không còn được dùng trong route PH03.
3. **M04 hardcoded campaign/household**: không còn tạo với UUID mặc định và ID sinh từ giờ; kiểm tra campaign mở, unique đối tượng, idempotency key ổn định qua retry.
4. **M05 0 khác NULL**: numeric 0, NOT_REPORTED, UNVERIFIED, N/A có ràng buộc riêng, không nhận số giả khi DB empty/error.
5. **M08 đóng kiến nghị**: buộc M01 work COMPLETED, ghi audit/event, OCC, xác minh actor; không chốt theo click giao diện.
6. **Dữ liệu mẫu UI**: ba route PH03 lấy đọc trực tiếp DB và hiển thị empty/error thật, không trả các bảng mẫu cũ làm dữ liệu nguồn.

## 3. Kiểm thử thực tế

| Test | Result | Evidence |
|---|---|---|
| `node --test tests/ph03-contract-static.test.mjs` | **7/7 PASS** | Local scratch 08/11/2026; chỉ STATIC_CONTRACT; CI lặp lại trên branch |
| TypeScript typecheck/lint/build toàn repo | **PASS** ở các lượt CI đã hoàn tất | GitHub Actions CI; chưa có browser E2E |
| `supabase db start` / migration smoke | **PASS** trên PostgreSQL sạch | GitHub Actions `PH03 DB migration smoke (local only)` run `42478681309`, commit `e4e7da33` |
| SQL pgTAP PH03 structural/RLS/anonymous | **PASS** | `supabase/tests/04_ph03_domain_contracts.sql`, cùng run `42478681309` |
| SQL pgTAP PH03 multi-actor business workflow | **PASS** | `supabase/tests/05_ph03_actor_workflows.sql`; GitHub Actions run `42479292082` (cùng `04_*`), log xác nhận 2 suite `ok`, `All tests successful`, `Result: PASS`; bao gồm actor thứ ba không có quyền, M08 kiến nghị tạo việc M01 và từ chối đóng sớm |
| RLS 3 persona local DB | **PASS (synthetic)** | Actor A/B/C, scope thôn và quyền khác nhau trong `05_*`; rollback dữ liệu giả sau test |
| RLS 3 persona + Storage upload/download trên staging | NOT_RUN | Chưa có staging/tài khoản hoặc Storage E2E |
| Browser E2E CULT-*, PLAN-*, INSP-* và DB readback | NOT_RUN | Chưa có staging dữ liệu/tài khoản kiểm thử |
| Legal rule/authority review | BLOCKED | LEG-M04-01→05 chưa verified |

## 4. Migration/security impact

- **Tạo trong source, chưa apply lên cloud:** `supabase/migrations/20261108070000_ph03_domain_verticals.sql`. Đã thực thi thành công trên PostgreSQL sạch dùng Supabase CLI v3 trong CI, chưa áp vào staging/prod.
- Tables M04/M05/M08 mới có RLS+FORCE RLS, chỉ GRANT SELECT scoped cho authenticated; mutations qua RPC kiểm tra `auth.uid`, membership đang hiệu lực, quyền chính xác, địa bàn và audit atomic.
- **Không** cấp quyền nghiệp vụ cho SYSTEM_ADMIN mặc định; không seed PII thật; không tạo user; không sửa cloud/live.
- Không tự coi rule demo hay nguồn thẩm quyền không xác minh là quyết định hợp lệ.
- Bản vá tương thích Supabase CLI v3: đổi `[inbucket]`→`[local_smtp]`; guard thu hồi quyền helper `rls_auto_enable` khi không tồn tại trong PH01; thêm composite unique `(tenant_id,id)` cho evidence để FK liên xã hợp lệ.
- Rà code RPC: version null không qua OCC, chặn NaN/Infinity, khóa reviewer là người được giao xử lý M01, số liệu `NOT_REPORTED` không giữ nguồn cũ, retry dossier nhận lại bản ghi đã duyệt ngay cả khi đợt đóng (vẫn kiểm tra quyền hiện hành).
- Hàm phạm vi PH03 đọc `org_unit_ids` từ membership, tương thích `hamletIds` demo; cấu trúc scope lỗi bị khóa, không trở thành toàn xã.
- M04 evidence kiểm tra phải gắn với `submissions.work_item_id` M01 tương ứng; vì chưa có RPC liên kết work item có kiểm toán, `DAT` **đang bị khóa** kể cả khi pack VERIFIED. Cần hoàn thiện liên kết trước G3.

## 5. Rủi ro / việc bắt buộc trước Gate G3

1. Xác nhận CI và **hai** bộ pgTAP đều xanh tại đúng **head commit** trước owner audit; không dùng kết quả xanh ở commit cũ để thay thế.
2. Khóa G1/G2: xác minh Auth/RLS/Storage, M01 RPC, `db reset`, concurrency và browser E2E.
3. Xác minh luật về thẩm quyền/tiêu chí/bộ biểu mẫu; có nguồn/hiệu lực và chủ dự án duyệt. Không tự chuyển status VERIFIED.
4. Hoàn thiện file evidence gắn theo dossier, import receipt, public result reference, plan chốt kỳ và KPI drill-down; checklist M08 thật.
5. DB staging test: anonymous, wrong tenant, wrong hamlet, author=self reviewer, expired membership, duplicate key/payload, OCC two clients, zero/null, unfinished M01, audit rollback.
6. Chạy hai E2E và một mini-flow browser + SQL readback, minh chứng ảnh đã khử PII; owner audit. Chưa có thì G3 = BLOCKED.
7. Hai test suite pgTAP kế thừa `01_rls_and_rpc_tests.sql` và `03_m04_and_m09_tests.sql` chứa fixture/schema của demo cũ, không dùng làm bằng chứng PH03. Workflow PH03 chỉ chạy `04_*` và `05_*`; cần một đợt hiện đại hóa riêng cho legacy suites trước khi bật kiểm thử toàn kho.

## 6. Rollback

- Vì chưa apply DB/cloud, rollback hiện tại là không merge/không deploy nhánh PH03; không đụng data thật.
- Khi migration đã được apply và có data, **không** rollback bằng DROP bảng/dữ liệu. Cần backup staging, migration forward-compatible và kế hoạch chuyển tiếp được owner duyệt.

**Không merge vào main, không áp cloud Supabase, không deploy Vercel.**
