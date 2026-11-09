# Quy chuẩn ngôn ngữ giao diện PVH

Trạng thái: ĐANG TRIỂN KHAI — chưa nghiệm thu toàn bộ nhánh.

## Nguyên tắc
- Toàn bộ nội dung hiển thị cho cán bộ dùng tiếng Việt rõ nghĩa, nhất quán, không hiển thị tên biến, mã trạng thái, mã lỗi kỹ thuật.
- Phân biệt nghiệp vụ: Gửi hồ sơ, Trình phê duyệt, Phê duyệt, Công nhận, Ban hành là các hành động khác nhau; không đổi tên khi chưa xác nhận thẩm quyền.
- Không tự nhận hồ sơ đã được phê duyệt nếu mới lưu hoặc tiếp nhận nội bộ.
- Không hard-code tên tỉnh, huyện, xã vào UI nền tảng dùng chung; lấy từ cấu hình đơn vị.
- Không thay đổi API, database, enum, permission key, tên biến chỉ vì thay nhãn hiển thị.

## Từ điển giao diện
| Thuật ngữ | Nhãn hiển thị |
|---|---|
| Dashboard | Tổng quan |
| Profile | Thông tin cá nhân |
| Role | Vai trò |
| Permission | Quyền truy cập |
| Workflow | Quy trình xử lý |
| No data | Chưa có dữ liệu |
| Export | Xuất báo cáo |
| Import | Nhập dữ liệu |
| Loading | Đang tải dữ liệu… |
| Reset password | Đặt lại mật khẩu |
| Snapshot | Phiên bản số liệu (tùy ngữ cảnh) |

## Phạm vi cần tiếp tục đối soát
- main; feat/ph01–ph06; fix/ph02–ph06; dashboard; login split-screen; thông tin cá nhân/thông báo; tài liệu và nhánh tích hợp.
- Kiểm tra từng route, nhãn biểu mẫu, bảng, bộ lọc, thông báo lỗi, loading/empty/success, xuất báo cáo và thông báo từ máy chủ.
- Đối chiếu thuật ngữ với M00–M11 và tài liệu nghiệp vụ trước khi sửa.
- Chạy lint, typecheck, kiểm thử, kiểm tra responsive và nghiệm thu theo từng nhánh sau khi tích hợp.

## Thay đổi đã thực hiện trên nhánh này
- Chuẩn hóa tên nhóm điều hướng trong navigation registry và sidebar mặc định.
- Bỏ địa danh cố định khỏi sidebar mặc định và trang đăng nhập.
- Chuẩn hóa nhãn và thông báo trạng thái trang đăng nhập.

**Lưu ý:** Nhánh này được tạo từ main, không chứa toàn bộ tính năng trên các nhánh chưa merge. Không coi các thay đổi ở đây là đã sửa hết mọi nhánh.
