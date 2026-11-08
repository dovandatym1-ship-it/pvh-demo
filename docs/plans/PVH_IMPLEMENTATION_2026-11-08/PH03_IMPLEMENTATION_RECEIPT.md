# PH03 Implementation Receipt — 08/11/2026

**Task group:** P03-01→P03-21 (increment 1, partial implementation)  
**Branch:** `feat/pvh-ph03-domain-verticals`  
**Base branch:** `feat/pvh-ph02-core-workflow` @ `faf9975e3e363ed978cf77af27ec7c4d70a7c864`  
**Owner:** Đỗ Văn Đạt — `owner_approval: PENDING`  
**Verdict:** `IMPLEMENTED_PARTIAL / G3 BLOCKED`; không tự đánh `VERIFIED` hoặc `OWNER_ACCEPTED`.

## 1. Phạm vi đã mã hóa

| Nhóm task | Source/behavior đã thêm | Trạng thái |
|---|---|---|
| P03-01–04 | M04 type phân biệt gia đình/thôn/xã; pack/version/jurisdiction/status; campaign, submissions, events; RLS/permission | PARTIAL — chưa có luật verified, chưa chạy DB |
| P03-05–08 | Mở đợt minh họa, nộp hồ sơ có source_ref, chống trùng, hamlet scope; rà soát có reason/OCC/SoD | IMPLEMENTED_IN_SOURCE — chưa DB E2E, chưa upload evidence M04 |
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
| `node --test tests/ph03-contract-static.test.mjs` | **5/5 PASS** | Local scratch 08/11/2026; chỉ STATIC_CONTRACT |
| TypeScript typecheck/lint/build toàn repo | NOT_RUN tại thời điểm tạo receipt | CI cần chạy sau commit |
| `supabase db reset` / migration smoke | NOT_RUN | Không có Supabase CLI/DB local ở môi trường thực thi |
| SQL pgTAP / RLS 3 persona / Storage | NOT_RUN | Chưa áp migration lên staging |
| Browser E2E CULT-*, PLAN-*, INSP-* và DB readback | NOT_RUN | Chưa có staging dữ liệu/tài khoản kiểm thử |
| Legal rule/authority review | BLOCKED | LEG-M04-01→05 chưa verified |

## 4. Migration/security impact

- **Tạo trong source, chưa apply:** `supabase/migrations/20261108070000_ph03_domain_verticals.sql`. Tên file được đặt thủ công vì máy thực thi không có Supabase CLI; phải xác nhận migration CLI/order khi G1/G2 được chấp thuận.
- Tables M04/M05/M08 mới có RLS+FORCE RLS, chỉ GRANT SELECT scoped cho authenticated; mutations qua RPC kiểm tra `auth.uid`, membership đang hiệu lực, quyền chính xác, địa bàn và audit atomic.
- **Không** cấp quyền nghiệp vụ cho SYSTEM_ADMIN mặc định; không seed PII thật; không tạo user; không sửa cloud/live.
- Không tự coi rule demo hay nguồn thẩm quyền không xác minh là quyết định hợp lệ.
- M04 evidence kiểm tra phải gắn với `submissions.work_item_id` M01 tương ứng; vì chưa có RPC liên kết work item có kiểm toán, `DAT` **đang bị khóa** kể cả khi pack VERIFIED. Cần hoàn thiện liên kết trước G3.

## 5. Rủi ro / việc bắt buộc trước Gate G3

1. Chạy CI green tại đúng commit: typecheck, lint, build, test static và regression PH01/02.
2. Khóa G1/G2: xác minh Auth/RLS/Storage, M01 RPC, `db reset`, concurrency và browser E2E.
3. Xác minh luật về thẩm quyền/tiêu chí/bộ biểu mẫu; có nguồn/hiệu lực và chủ dự án duyệt. Không tự chuyển status VERIFIED.
4. Hoàn thiện file evidence gắn theo dossier, import receipt, public result reference, plan chốt kỳ và KPI drill-down; checklist M08 thật.
5. DB staging test: anonymous, wrong tenant, wrong hamlet, author=self reviewer, expired membership, duplicate key/payload, OCC two clients, zero/null, unfinished M01, audit rollback.
6. Chạy hai E2E và một mini-flow browser + SQL readback, minh chứng ảnh đã khử PII; owner audit. Chưa có thì G3 = BLOCKED.

## 6. Rollback

- Vì chưa apply DB/cloud, rollback hiện tại là không merge/không deploy nhánh PH03; không đụng data thật.
- Khi migration đã được apply và có data, **không** rollback bằng DROP bảng/dữ liệu. Cần backup staging, migration forward-compatible và kế hoạch chuyển tiếp được owner duyệt.

**Không merge vào main, không áp cloud Supabase, không deploy Vercel.**
