# OP-M01 — Quy trình điều hành công việc nội bộ

**Bản:** 0.2 (triển khai trên nhánh PH02, cần Đỗ Văn Đạt duyệt)  
**Phạm vi:** một xã/triển khai, tài khoản Supabase Auth thật, workflow công việc nội bộ.  
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

- `work_items`: tiêu đề 3–500 ký tự ở giao diện, lĩnh vực, **nguồn tham chiếu `source_ref` riêng (tối đa 500 ký tự)**, ưu tiên, hạn tùy chọn, người phụ trách tùy chọn, xã, version, khóa idempotency. RPC tạo v2 lưu `source_ref` nguyên tử và so sánh nội dung trên replay.
- `work_item_assignments`: lịch sử phân công, người cũ/mới, actor, lý do, version. Ứng viên phải có membership còn hiệu lực, quyền `read` + `update`, và nằm trong scope `org_unit_ids` nếu được giới hạn địa bàn; kiểm tra ở trigger DB cả khi tạo và giao lại.
- `work_item_events`: mỗi transition một event gồm trước/sau, người thực hiện, lý do, version.
- `audit_log`: audit hành động; nếu lỗi ghi audit hoặc event thì toàn bộ transaction phải rollback.
- `evidence_files`: chỉ tính minh chứng đã qua bước xác nhận `UPLOADED` sau khi Storage có object riêng tư. SHA-256 do trình duyệt công bố, chưa phải chứng thực server-side. Upload thất bại được thử dọn cả Storage và metadata `PENDING`; nếu xác nhận thất bại có thể thử lại mà không đăng ký bản ghi mới.
- `work_item_mutation_requests`: idempotency theo `(tenant, actor, key)` + hash của intent. Cùng intent trả kết quả cũ; khác intent trả xung đột.
- `work_item_inbox` + `work_item_inbox_reads`: bản ghi thông báo là append-only; trạng thái đã đọc được ghi riêng theo người nhận bằng RPC idempotent, không sửa/xóa sự kiện nguồn.

## Các bước xử lý

1. Đầu mối tạo việc: nhập tiêu đề, nguồn nghiệp vụ trong mô tả, hạn, ưu tiên; nếu giao ngay phải chọn công chức có membership còn hiệu lực.
2. Đầu mối giao việc (`NEW → ASSIGNED`) hoặc điều chỉnh người phụ trách: ghi lịch sử trước/sau và lý do giao lại. Chọn người phụ trách ngay khi tạo chỉ là **dự kiến**; cần xác nhận giao mới phát thông báo. Danh sách ứng viên khi giao lại được lọc theo scope của công việc.
3. Công chức được giao tiếp nhận (`ASSIGNED → IN_PROGRESS`). Không cho người khác nhận thay.
4. Công chức bổ sung minh chứng private; chỉ khi upload và xác nhận metadata thành công mới đủ điều kiện trình rà soát.
5. Công chức trình (`IN_PROGRESS → UNDER_REVIEW`).
6. Người có quyền rà soát chọn trả lại (`→ RETURNED`, bắt buộc lý do) hoặc xác nhận hoàn thành (`→ COMPLETED`). Không cho tự duyệt công việc đang giao cho mình. Khi trình, DB xác định người rà soát thực sự có quyền `review` + `read` và là người tạo việc hoặc có `read_all`; không có ai đủ quyền thì từ chối trình để tránh việc bị kẹt. Hàng đợi thông báo gửi đúng những người đủ điều kiện.
7. Khi bị trả lại, công chức hoàn thiện (`RETURNED → IN_PROGRESS`) và gửi lại.
8. Người điều phối có quyền hủy ở trạng thái chưa kết thúc; bắt buộc nêu lý do.
9. Người điều phối được đổi hạn/địa bàn có lý do, chống ghi đè phiên bản và ghi event/audit trong cùng transaction. Không thể đổi sang địa bàn mà người phụ trách hiện tại không có quyền xử lý.
10. Mỗi thay đổi ghi phiên bản nguyên tử; hai client dùng một `expectedVersion` chỉ một client thành công; client còn lại nhận 409.

**Quy tắc hạn:** `overdue = due_date < now()` và trạng thái khác `COMPLETED`, `CANCELLED`. Không đồng nhất `URGENT` với `OVERDUE`. Hiển thị giờ `Asia/Ho_Chi_Minh`.

**Nguồn luật:** đây là luồng điều hành *nội bộ* và là đề xuất thiết kế, không tuyên bố thẩm quyền phê duyệt quyết định chuyên ngành. OP thực tế từng xã và SLA cần chủ dự án xác nhận.

## Vấn đề còn mở

- `SOURCE_REF`: trường nguồn công việc hiện ở mô tả, chưa có danh mục liên kết chuẩn/version nguồn.
- Dọn upload lỗi trong phiên đã có RPC kiểm tra sự tồn tại của object; **chưa có cron dọn các PENDING quá hạn sau khi tab đóng**, chưa đối soát checksum server-side, preview và version file.
- Đổi hạn/địa bàn có reason và OCC đã code; `source_ref` đã thành trường riêng và inbox đã có đánh dấu đọc. Danh sách có lọc theo thôn/xóm/sắp xếp, nhưng vẫn bị giới hạn bởi RLS (không mặc định cho nhân viên xem toàn bộ việc của nhóm). Chưa có `work_item_links` chuẩn hóa tới loại hồ sơ và phiên bản nguồn, người phối hợp, ủy quyền theo thời hạn, lọc tổ chuyên môn riêng.
- Persona demo cookie không thể thay thế ba tài khoản Supabase Auth thật để nghiệm thu; cấu hình G1 còn phụ thuộc chủ dự án.
- Chưa có browser E2E/DB staging user thật, pgTAP concurrency, RLS, `supabase db reset`.

## Acceptance

Chỉ ghi G2 `PASS` sau khi chạy `E2E-WORK-001` trong `PH02_CORE_WORK.md` với persona thật, DB readback, replay, concurrency, audit và Storage, có evidence và quyết định duyệt của Đỗ Văn Đạt.
