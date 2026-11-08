# PH02 — M01 Core Work: một vòng đời công việc chạy thật

**Gate:** G2 `CORE_WORK` · **Phụ thuộc:** G1 PASS · **Ưu tiên:** P0 · **Ước lượng:** 8–12 ngày

## 1. Mục tiêu vận hành

Trong một xã, lãnh đạo/đầu mối tạo nhiệm vụ và giao cho công chức; người nhận xem việc của mình, tiếp nhận, cập nhật tiến độ/minh chứng, trình rà soát; người được giao quyền rà soát trả lại có lý do hoặc xác nhận hoàn thành; tất cả sự kiện ghi vào DB và báo cáo được số việc đúng.

### State machine tham chiếu (cần xác nhận trong OP)

`DRAFT/NEW → ASSIGNED → IN_PROGRESS → UNDER_REVIEW → COMPLETED` với nhánh `RETURNED → IN_PROGRESS`, `CANCELLED` (có lý do/quyền), `PAUSED` nếu nghiệp vụ có căn cứ. **OVERDUE** là cờ tính từ due date và trạng thái, không nên là trạng thái độc lập mặc định. `Task completed` không đồng nghĩa quyết định hành chính đã ký/phê duyệt.

## 2. Backlog thực thi

| ID | Task cụ thể | Đầu ra / điều kiện chấp nhận |
|---|---|---|
| P02-01 | Viết `OP-M01` slice specification: tác nhân, trigger, owner, input, form, state, output, exception, thời hạn, phân công, source_ref | `M01_WORKFLOW_SPEC.md` + transition matrix; mỗi hành động có actor và rule, không tự gộp thẩm quyền |
| P02-02 | Chốt entity `work_items`, `work_item_events`, `work_item_assignments`, `work_item_links`, `evidence_files`, `audit_log`; kiểm tra FK và dữ liệu lịch sử | Migration canonical, ERD, constraint tests; không có task vô chủ khi workflow yêu cầu người chịu trách nhiệm |
| P02-03 | Sửa `createWorkItem` từ UI → action → service → repository → RPC đúng schema; actor/tenant từ RequestContext | Browser tạo 1 việc → DB có 1 row, event/audit cùng actor; RLS chặn người không có quyền; refresh còn dữ liệu |
| P02-04 | Tạo idempotency key bền qua retry cùng intent; body hash; cùng key/cùng payload replay ra cùng result, cùng key/khác payload bị từ chối | Two-click/retry 100 lần không sinh duplicate; lỗi conflict có mã rõ |
| P02-05 | Đồng bộ transition state machine ở service/DB, một nguồn rule có version; thẩm quyền theo `transition`, `record scope`, current state | 11 transition hợp lệ chạy đúng, transition cấm trả 403/422, không chỉ disable button UI |
| P02-06 | Bổ sung optimistic concurrency `expectedVersion`, lock row, event/outbox nếu cần; transaction nguyên tử | Hai actor dùng cùng version: đúng 1 update thành công, actor còn lại 409 và không ghi event sai |
| P02-07 | Màn tạo việc/giao việc: title, loại, nguồn, lý do, mức ưu tiên, hạn, người chủ trì, người phối hợp, địa bàn; Zod+server validation | Form lỗi có message từng trường, không gửi role/tenant từ client, tạo việc thành công có readback |
| P02-08 | Danh sách công việc theo vai trò: của tôi, do tôi giao, cần rà soát, nhóm, toàn đơn vị nếu được phép; tìm kiếm/sort/paging | Không lẫn việc người khác; URL/filter tồn tại sau refresh; query phân trang ở server cho tập lớn |
| P02-09 | Trang chi tiết công việc, tab lịch sử/nguồn/minh chứng/phân công, action theo quyền và state | Deep link, Back/Refresh đúng; timeline đúng actor/time/event; không lộ file nhạy cảm |
| P02-10 | Giao lại/chuyển người/hủy/đổi hạn/đổi scope có reason/permission, lưu assignment history, kiểm soát ủy quyền hết hạn | Đầu mối không bị xóa lịch sử, người nhận cũ mất quyền khi hết nhiệm vụ trừ quyền lưu trữ được xác định |
| P02-11 | Xử lý minh chứng qua private Storage: upload/download/preview, file metadata, checksum/version, MIME/size cap, orphan cleanup | File gắn công việc đúng; người ngoài scope 403; stale URL hết hạn; không vào `public/` |
| P02-12 | Deadline/SLA service: overdue = dueDate < now AND not terminal; due soon theo ngưỡng có cấu hình; timezone Asia/Ho_Chi_Minh để hiển thị | Test ranh giới trước/đúng/sau hạn, đổi hạn có event; không đếm URGENT là overdue |
| P02-13 | Bàn làm việc: `myTasks` lọc `assigned_to = ctx.userId`/assignment hợp lệ, `reviewQueue`, overdue, KPIs nguồn rõ | Số thẻ bằng truy vấn source; không dùng seed fallback khi DB rỗng/lỗi; lỗi DB hiện trạng thái ERROR riêng |
| P02-14 | Notification/inbox trong ứng dụng (MVP): người được giao/nhận trả lại thấy việc; không gửi thông báo ngoài nếu chưa có consent/connector | Inbox/audit theo event, không lặp thông báo idempotent; không gắn job giả |
| P02-15 | Tối ưu trải nghiệm desktop/mobile: responsive, focus, keyboard, loading/error/empty, row actions; đồng bộ theme | Thao tác chính usable ở 375px và desktop, không thể vô tình bấm hành động cấm |
| P02-16 | Viết test DB/server/browser M01 và tài liệu hướng dẫn 3 vai trò; tích hợp vào CI | Không còn test chỉ check chữ tên hàm để đóng G2; có video/screenshot không chứa PII và SQL read-back |

## 3. Ma trận chuyển trạng thái bắt buộc

| Current | Action | Next | Actor/phạm vi | Exception |
|---|---|---|---|---|
| NEW | Giao việc | ASSIGNED | Work manager có quyền giao | Người nhận ngoài xã/không có membership → 403/422 |
| ASSIGNED | Tiếp nhận | IN_PROGRESS | Người được giao còn hiệu lực | Người khác nhận thay → 403 |
| IN_PROGRESS | Trình rà soát | UNDER_REVIEW | Người chủ trì | Thiếu minh chứng bắt buộc → 422 |
| UNDER_REVIEW | Yêu cầu bổ sung | RETURNED | Người rà soát có quyền | Thiếu lý do → 422 |
| RETURNED | Hoàn thiện lại | IN_PROGRESS | Người được giao | Version cũ → 409 |
| UNDER_REVIEW | Xác nhận hoàn thành | COMPLETED | Người có quyền rà soát | Actor không có quyền hoặc tự duyệt trái rule → 403 |
| NEW/ASSIGNED/IN_PROGRESS | Hủy | CANCELLED | Người được ủy quyền | Thiếu reason/đã kết thúc → 422 |

Trạng thái chỉ là bộ khung; OP cụ thể có thể bổ sung thay vì bắt mọi loại hồ sơ chuyên ngành dùng chính state machine M01. Không cho UI tự ghi status bằng update thẳng để bỏ qua business rule.

## 4. E2E bắt buộc: `E2E-WORK-001`

1. P1/manager đăng nhập thật, tạo công việc với idempotency key K, chọn P2/officer và hạn.
2. Đọc lại DB: work item, assignment, event, audit cùng tenant/actor/version.
3. P2 đăng nhập thật, chỉ nhìn thấy công việc được giao; tiếp nhận và cập nhật.
4. P2 thêm file minh chứng private, trình rà soát.
5. P1 trả lại có lý do; P2 nhận và sửa; P1 xác nhận hoàn thành.
6. Refresh/relogin không mất state; dashboard số việc/chờ duyệt/quá hạn khớp DB.
7. P6/auditor xem timeline theo quyền, không sửa; người ngoài scope truy cập direct URL → 403.
8. Hai client cùng sửa một version → một 200, một 409; spam retry K không tạo bản ghi/event trùng.

**Gate G2 PASS:** 100% các bước trên thành công với user thật, DB staging, browser thật; audit, RLS, idempotency, concurrency đều có evidence; 0 P0/P1 chưa được owner chấp nhận khắc phục. UI danh sách không được gắn nhãn “full lifecycle” nếu chỉ có read-only table.

## 5. Đường dẫn tác động / điểm đang lỗi

- `src/features/m01-core-work/server/{actions,service,repository,policy,workflow,queries}.ts`
- `src/features/m01-core-work/{components,schemas,types}/*`
- `src/app/(app)/{ban-lam-viec,cong-viec}/*`
- `src/app/api/work-items/[id]/transition/route.ts`
- `supabase/migrations/20261108000002_m01_core_work_full.sql` (tham chiếu **chưa** áp cloud)
- `src/lib/authorization/*`, `src/lib/storage/*`, `src/lib/audit/*`

**Không làm trong PH02:** biến nghiệp vụ M02–M08 thành CRUD hoàn chỉnh, ký số chính thức, gọi hệ thống văn bản chưa có contract, xây offline sync engine.
