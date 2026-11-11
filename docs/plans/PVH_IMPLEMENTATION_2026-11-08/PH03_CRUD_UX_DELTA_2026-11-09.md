# PH03 — Hoàn thiện CRUD và trải nghiệm hiển thị (09/11/2026)

**Nhánh:** fix/pvh-ph03-crud-ux-20261109; phát sinh từ feat/pvh-ph03-domain-verticals tại 5876113884ca9eb0325002d0ea352d5ad622668c.\
**Người duyệt:** Đỗ Văn Đạt. **Trạng thái:** CODE_READY_AWAITING_GATE (không tự xác nhận G3 PASS).

## Đã triển khai trong lượt này

- M04: nhãn trạng thái đợt, bộ tiêu chí và hồ sơ bằng tiếng Việt; nhãn DAT/KHONG_DAT vẫn thể hiện rõ là đánh giá **nội bộ**, không phải quyết định công nhận.
- M05: biểu mẫu tạo chỉ tiêu có **kỳ ghi nhận riêng** (không phụ thuộc trường kỳ của kế hoạch); nhập và đọc lại **ý nghĩa chỉ tiêu** từ cột meaning có sẵn. Chọn chỉ tiêu khác sẽ xóa các giá trị còn sót trong biểu mẫu cập nhật. Danh sách kế hoạch hiển thị nguồn, tình trạng và số công việc liên kết.
- M08: mặc định ngày theo Asia/Ho_Chi_Minh kể cả khi thiết bị ở múi giờ khác; đổi nhãn bảng kiểm/trạng thái kiến nghị, reset dữ liệu tạo hồ sơ sau khi DB xác nhận lưu thành công.
- Bổ sung bộ nhãn nghiệp vụ PH03 dùng chung, test kiểm tra toàn bộ mã trạng thái và dữ liệu kỳ/ý nghĩa của chỉ tiêu; thêm bước CI.

## Mức phủ CRUD thật sau lượt này

| Module | Thêm | Xem | Sửa/Cập nhật | Xóa/Khôi phục | Trạng thái |
|---|---|---|---|---|---|
| M04 Văn hóa | Có RPC đợt và hồ sơ | Danh sách theo RLS | Rà soát nội bộ, có version | Chưa có contract hủy/xóa mềm và lưu vết | PARTIAL |
| M05 Kế hoạch/CĐS | Có RPC kế hoạch, chỉ tiêu, liên kết M01 | Danh sách, nguồn, ý nghĩa, số liệu | Có cập nhật số liệu + OCC | Chưa có sửa định nghĩa/kế hoạch, hủy/khôi phục | PARTIAL |
| M08 Kiểm tra | Có RPC cuộc kiểm tra/kiến nghị | Danh sách và liên kết M01 | Hậu kiểm trạng thái | Chưa có sửa biên bản, hủy/khôi phục | PARTIAL |

Không tự thêm DELETE trực tiếp vì các hồ sơ cần bảo toàn lịch sử, thẩm quyền và retention. Cần định nghĩa xóa mềm/hủy theo trạng thái, actor, lý do, thời hạn lưu, phiên bản và kiểm thử RLS. Đây là nghiệp vụ còn thiếu thực sự, không được đánh dấu “đã hoàn thành CRUD”.

## Các điều kiện tiếp tục

1. Hoàn thiện Data Dictionary M04/M05/M08, business rules cho sửa/hủy/khôi phục; đối chiếu với tài liệu gốc và TechSpec 09/11.
2. Bổ sung migration version mới + RPC cập nhật/hủy mềm trong nhánh kế tiếp sau khi contract được chốt; không thay migration cloud đang có.
3. Test SQL RLS, actor khác nhau, OCC, replay, readback, 3-persona browser/staging. Pháp lý danh hiệu văn hóa tiếp tục khóa ở chế độ minh họa.
4. Đối chiếu M01 mới và các nhánh khác trước tích hợp; main và Supabase Demo-pvh không bị thay đổi.

**Không merge, không deploy, không áp SQL production.** CI xanh chỉ chứng thực mã và build, không chứng thực nghiệp vụ G3.
