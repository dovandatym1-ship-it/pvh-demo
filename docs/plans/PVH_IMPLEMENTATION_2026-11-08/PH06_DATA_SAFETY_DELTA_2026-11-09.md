# PH06 — Chặn dữ liệu giả và rò rỉ thông tin nhạy cảm (09/11/2026)

**Nhánh:** `fix/pvh-ph06-data-safety-20261109`. **Trạng thái:** Chưa đạt G6; cần đối chiếu pháp lý, database và nguồn nghiệp vụ.

## Các lỗi đã xử lý
- M02, M03, M06: khi DB trả rỗng hoặc lỗi, không sinh hồ sơ giả trên màn hình như hồ sơ thật; lỗi được phát hiện rõ, không giả thành thành công.
- M07: lỗi DB không còn bị coi là danh sách trống; yêu cầu permission đọc và lọc địa bàn được cấp khi có `ctx.scopes.hamletIds`.
- M02/M06: chỉ permission chuyên biệt mới cho xem trường CCCD, chẩn đoán và khoản hỗ trợ chưa che; bỏ đặc quyền suy diễn từ tên role. Dữ liệu nhạy cảm được chuyển thành chuỗi hiển thị **trên server** trước khi truyền cho React client; không gửi CCCD, số tiền và bệnh lý gốc cho client thiếu quyền.
- M03: CCCD chủ cơ sở ngoài công lập không được gửi xuống bảng client khi màn hình không dùng trường đó.
- M06: nút tác vụ dùng tên `Ghi nhận đối soát` thay vì hành vi chi tiền; trả kết quả/thất bại cho người dùng và làm mới sau thành công.
- Bổ sung unit/static safety regression và workflow CI riêng cho PR này.

## Chưa xác minh
- Không có migration mới hoặc thay đổi Supabase cloud. CSDL thật các bảng M02/M03/M06/M07 có thể chưa tồn tại hoặc không khớp schema, và các RPC có thể chưa được triển khai; các trang sẽ hiện lỗi truy vấn thay vì hiển thị fake data.
- Chưa có RPC tạo M06/M07 bảo đảm atomic audit, giới hạn quyền ở DB, đa xã/hamlet scope và kiểm thử có tài khoản thật; P06-01..12 còn thiếu quy trình nghiệp vụ được chủ trì xác nhận.
- Cần kiểm tra thêm những dữ liệu cá nhân được phép hiển thị (họ tên, dân tộc, người đại diện), điều kiện purpose/retention, và xuất báo cáo; không coi test tĩnh là bằng chứng tuân thủ.

**Gate G6: BLOCKED** cho đến khi G5 được owner duyệt cùng E2E RLS/Storage/DB readback.
