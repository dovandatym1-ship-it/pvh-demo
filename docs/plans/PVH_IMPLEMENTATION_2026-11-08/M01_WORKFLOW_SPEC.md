# OP-M01 — Quy trình điều hành công việc nội bộ

**Bản:** 0.2 (triển khai trên nhánh PH02, cần Đỗ Văn Đạt duyệt)\
**Phạm vi:** một xã/triển khai, tài khoản Supabase Auth thật, workflow công việc nội bộ.\
**Loại trừ:** quyết định hành chính, ký số, nghiệp vụ chuyên ngành, thông báo ra bên ngoài.

## Tác nhân

| Tác nhân | Quyền tối thiểu từ DB | Phạm vi |
|---|---|---|
| Đầu mối điều phối | `m01:work:create`, `assign`, `read`, `read_all` (nếu phụ trách toàn xã) | Công việc đúng đơn vị và scope địa bàn |
| Công chức phụ trách | `m01:work:read`, `m01:work:update` | Việc đã giao cho mình hoặc tự tạo, theo scope |
| Người rà soát | `m01:work:review`, `m01:work:read` | Việc do mình tạo hoặc được cấp `read_all`; không tự rà soát việc mình được giao |
| Người xem | `m01:work:read` (và `read_all` nếu được ủy quyền) | Không sửa bản ghi |

Không dùng nhãn chức danh hoặc `SYSTEM_ADMIN` để vượt permission chính xác. Quyền thực thi được kiểm lại trong PostgreSQL tại thời điểm mutation.

## Dữ liệu và điều kiện

- `work_items`: tiêu đề 3–500 ký tự ở giao diện, lĩnh vực, ưu tiên, hạn tùy chọn, người phụ trách tùy chọn, xã, version, khóa idempotency.
- `work_item_assignments`: lịch sử phân công, người cũ/mới, actor, lý do, version.
- `work_item_events`: mỗi transition một event gồm trước/sau, người thực hiện, lý do, version.
- `audit_log`: audit hành động; nếu lỗi ghi audit hoặc event thì toàn bộ transaction phải rollback.
- `evidence_files`: chỉ tính minh chứng đã qua bước xác nhận `UPLOADED` sau khi Storage có object riêng tư. SHA-256 do trình duyệt công bố, chưa phải chứng thực server-side.
- `work_item_mutation_requests`: idempotency theo `(tenant, actor, key)` + hash của intent. Cùng intent trả kết quả cũ; khác intent trả xung đột.

## Các bước xử lý

1. Đầu mối tạo việc: nhập tiêu đề, nguồn nghiệp vụ trong mô tả, hạn, ưu tiên; nếu giao ngay phải chọn công chức có membership còn hiệu lực.
2. Đầu mối giao việc (`NEW → ASSIGNED`) hoặc điều chỉnh người phụ trách: ghi lịch sử trước/sau và lý do giao lại.
3. Công chức được giao tiếp nhận (`ASSIGNED → IN_PROGRESS`). Không cho người khác nhận thay.
4. Công chức bổ sung minh chứng private; chỉ khi upload và xác nhận metadata thành công mới đủ điều kiện trình rà soát.
5. Công chức trình (`IN_PROGRESS → UNDER_REVIEW`).
6. Người có quyền rà soát chọn trả lại (`→ RETURNED`, bắt buộc lý do) hoặc xác nhận hoàn thành (`→ COMPLETED`). Không cho tự duyệt công việc đang giao cho mình.
7. Khi bị trả lại, công chức hoàn thiện (`RETURNED → IN_PROGRESS`) và gửi lại.
8. Người điều phối có quyền hủy ở trạng thái chưa kết thúc; bắt buộc nêu lý do.
9. Mỗi thay đổi ghi phiên bản nguyên tử; hai client dùng một `expectedVersion` chỉ một client thành công; client còn lại nhận 409.

**Quy tắc hạn:** `overdue = due_date < now()` và trạng thái khác `COMPLETED`, `CANCELLED`. Không đồng nhất `URGENT` với `OVERDUE`. Hiển thị giờ `Asia/Ho_Chi_Minh`.

**Nguồn luật:** đây là luồng điều hành *nội bộ* và là đề xuất thiết kế, không tuyên bố thẩm quyền phê duyệt quyết định chuyên ngành. OP thực tế từng xã và SLA cần chủ dự án xác nhận.

## Vấn đề còn mở

- `SOURCE_REF`: trường nguồn công việc hiện ở mô tả, chưa có danh mục liên kết chuẩn/version nguồn.
- File cleanup khi upload lỗi, đối soát checksum server-side, preview và version file chưa khép.
- Đổi hạn, đổi scope, người phối hợp, notification inbox, bộ lọc nhóm/lọc theo tổ chưa khép.
- Chưa có browser E2E/DB staging user thật, pgTAP concurrency, RLS, `supabase db reset`.

## Acceptance

Chỉ ghi G2 `PASS` sau khi chạy `E2E-WORK-001` trong `PH02_CORE_WORK.md` với persona thật, DB readback, replay, concurrency, audit và Storage, có evidence và quyết định duyệt của Đỗ Văn Đạt.
