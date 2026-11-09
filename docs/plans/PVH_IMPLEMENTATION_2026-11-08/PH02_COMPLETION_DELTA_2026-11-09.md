# PH02 — Lượt hoàn thiện giao diện và kiểm thử (09/11/2026)

**Nhánh:** fix/pvh-ph02-completion-20261109 (tách từ feat/pvh-ph02-core-workflow, không chỉnh nhánh Phase 2 đã đóng băng).  
**Baseline:** PH02 18280d1e3eadefe073b678a903f6e11ae8ddba9e.  
**Người phê duyệt/merge:** Đỗ Văn Đạt. **Gate:** G2 chưa PASS.

## Phần đã chỉnh trong mã nguồn

- Thống nhất nhãn trạng thái, mức ưu tiên, sự kiện và inbox bằng tiếng Việt trên Bàn làm việc, Danh sách, Chi tiết. Mã trạng thái trong DB/API giữ nguyên để tương thích các Phase.
- Đồng nhất nhập hạn xử lý theo giờ Việt Nam (UTC+07) cho cả tạo mới và điều chỉnh, không phụ thuộc múi giờ thiết bị; chặn ngày/giờ không hợp lệ.
- Bảng công việc phụ trợ sửa quyền m01:work:review và chỉ hiển thị hành động có callback, có kiểm tra actor/người xử lý để tránh gợi ý thao tác không hợp lệ. Phân quyền cuối cùng vẫn tại PostgreSQL.
- Bổ sung kiểm thử hồi quy nhãn và thời gian; CI chạy trên nhánh hoàn thiện.

## Còn thiếu để khẳng định hoàn tất PH02

- G1/Phase 1 chưa có nghiệm thu Auth/RLS/Storage qua user thật.
- Chưa có Supabase staging độc lập: Demo-pvh đang có 2 migration PH01, **không có development branch**, PH02 migration chưa áp; không dùng DB này để chạy migration/thử xóa dữ liệu.
- Chưa chạy 38 assertions pgTAP ở PostgreSQL, kiểm thử đồng thời hai phiên, upload/download private Storage, browser E2E 375px–desktop và backup/restore.
- Cần chủ dự án xác nhận chính sách lưu/xóa PENDING, quyền auditor, hợp đồng work_item_links/ủy quyền/SLA. Không tự giả định.
- Tên đầy đủ trong lịch sử cho cán bộ không có quyền đọc danh bạ vẫn thiếu; hiện giữ mã nhận diện ngắn thay vì nâng quyền xem hồ sơ.
- Cần hợp nhất chiến lược inbox PH02 với module Thông báo cá nhân ở nhánh riêng trước khi tích hợp.

**Không merge vào main, không apply SQL cloud, không triển khai production.** CI PASS chỉ xác nhận mã nguồn/build, không phải Gate G2.
