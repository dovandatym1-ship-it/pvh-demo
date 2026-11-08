# OP-M08 — Ghi nhận kiểm tra, kiến nghị và hậu kiểm

**Trạng thái:** IMPLEMENTED_PARTIAL; chưa được xác minh quyền thanh tra/xử phạt.

## Hành trình nội bộ

1. Người có `m08:inspection:write` ghi nhận đối tượng, xóm, loại kiểm tra, ngày, đoàn/đầu mối, version checklist và nguồn thẩm quyền (nếu có). Đây chỉ là bản ghi tác nghiệp.
2. Người có quyền M08 và `m01:work:create`/quyền giao phù hợp tạo kiến nghị. Một RPC gọi `app.create_work_item` rồi liên kết `inspection_recommendations.work_item_id` trong cùng DB transaction, sử dụng idempotency M01.
3. Người được giao tiếp nhận, thực hiện và cung cấp minh chứng qua workflow M01; M08 **không sao chép trạng thái tiến độ** thành một hệ thống việc khác.
4. Người có `m08:inspection:review` ghi nhận `FEEDBACK_UNVERIFIED` hoặc hậu kiểm `RESOLVED_CLOSED` với lý do và version. Chỉ đóng nếu M01 đã `COMPLETED`; người tạo kiến nghị không tự xác nhận đóng.
5. Hệ thống ghi append-only event và audit trong transaction. Không có thao tác lập biên bản xử phạt, cưỡng chế hay ban hành kết luận pháp lý.

## Checklist và ngoại lệ

- Checklist hiện lưu **version reference**, chưa có checklist items/file/ảnh thực tế; không sử dụng bản minh họa làm căn cứ pháp lý.
- Không có dữ liệu giả về cơ sở ATTP/PCCC, tránh ngụ ý thẩm quyền PVH đối với từng lĩnh vực.
- Tài khoản ngoài địa bàn không đọc được bản ghi theo RLS; tài khoản thiếu M01 không tự giao nhiệm vụ.
- Version conflict/duplicate/DB error trả lỗi, không viết fallback từ phía client.
- Hạn xử lý lấy từ `due_date` M01/kiến nghị, không gắn nhãn quá hạn theo trạng thái tĩnh.

**Còn thiếu:** authority matrix theo loại kiểm tra, checklist templates/version và file/ảnh, trách nhiệm hậu kiểm theo quyết định, kịch bản mạng yếu/mobile thực tế, readback audit với 3 persona và E2E-INSPECTION-001 trên staging.
