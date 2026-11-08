# PVH Dashboard điều hành V1 — Thiết kế, dữ liệu và nghiệm thu

## 1. Mục tiêu

Tái sử dụng tinh thần bố cục từ `preview.html` (4 KPI, biểu đồ tiến độ, hàng đợi ưu tiên, chỉ số theo lĩnh vực, phân bổ công việc) trong **ứng dụng Next.js hiện hữu**. Không sao chép 48 bản ghi tĩnh, không cho chuyển vai trò trên client, không hiển thị chỉ số chuyên ngành được tự dựng mà thiếu nguồn.

Nhánh triển khai: `feat/pvh-dashboard`, tách độc lập từ `main` để audit trước khi merge.

## 2. Ranh giới nguồn số liệu

| Chỉ số | Nguồn | Định nghĩa | Giới hạn |
| --- | --- | --- | --- |
| Quá hạn | `work_items` | `due_date` trước ngày hiện tại tại Việt Nam, trạng thái chưa đóng | **Hạn công việc**, chưa phải SLA chuyên ngành |
| Sắp đến hạn | `work_items` | Hạn từ hôm nay đến hết 7 ngày tiếp theo, trạng thái chưa đóng | Không áp dụng lịch ngày làm việc |
| Chờ rà soát | `work_items` | `UNDER_REVIEW` trong tập dữ liệu có quyền xem | Không tự suy ra người hiện tại có quyền duyệt |
| Việc cần theo dõi | `work_items` | P1: tổng chưa đóng; P2: chưa đóng được giao; P4: chưa đóng thuộc xóm được phân quyền | Phụ thuộc ngữ cảnh vai trò |
| Xu hướng tạo mới | `work_items.created_at` | Số công việc có ngày tạo trong từng tuần Việt Nam | 6 tuần tính từ thứ Hai |
| Xu hướng hoàn thành | `work_item_events` | Chuyển trạng thái đến `COMPLETED` trong tuần, chỉ tính công việc có thể xem | Ẩn nếu sổ sự kiện lỗi hoặc kết quả bị cắt trang |
| Vòng đời | `work_items.status` | Đủ cả 7 trạng thái, tổng đúng bằng số công việc hiển thị | Bao gồm cả trạng thái đóng |
| Lĩnh vực | `work_items.category` | Số việc chưa đóng theo nhóm M02, M03, M04, M05, M06 | **Không** là số hồ sơ chuyên ngành |
| Tải người phụ trách | `work_items.assigned_to` | Số việc chưa đóng theo cán bộ/chưa giao | Không quy đổi độ phức tạp |

## 3. Luồng dữ liệu

1. `getRequestContext()` xác thực người dùng, lấy tenant, vai trò, quyền và địa bàn từ server.
2. `getWorkItems(ctx)` chỉ truy vấn dữ liệu tenant hiện tại; Supabase RLS tiếp tục thực thi chính sách nguồn.
3. `getCompletionEvents(ctx)` tải sổ sự kiện hoàn thành có giới hạn bản ghi; trả cờ độ tin cậy của lịch sử.
4. `scopeWorkItems()` thu hẹp tập dữ liệu theo vai trò và `hamletIds` trên **server** trước khi serialize xuống client.
5. `buildDashboardModel()` là hàm thuần, tính tất cả KPI từ cùng tập dữ liệu đã lọc.
6. Dashboard chỉ lọc/tìm kiếm các hàng đã được phép xem; không thể chuyển quyền hoặc đổi tenant trong component.

## 4. Quy tắc trải nghiệm

- Mặc định ưu tiên: **quá hạn → trả lại → chờ rà soát → sắp đến hạn**.
- KPI tương tác phải áp dụng bộ lọc có thể thấy và bỏ qua.
- Bộ lọc `Việc tôi` dành cho công chức; không làm sai nghĩa KPI của lãnh đạo/trưởng thôn.
- Tìm kiếm theo tiêu đề, mã và lĩnh vực; `Xem thêm` có phân trang theo lô 7 dòng.
- Liên kết đến `/cong-viec?focus=<id>` chỉ hiển thị nếu người dùng có quyền vào trang M01. Modal chỉ mở khi item nằm trong dữ liệu trả về bởi server.
- Bản demo phải hiện nhãn **Dữ liệu minh họa**. Thiếu lịch sử thì không vẽ số liệu hoàn thành giả.
- Tại tablet, hàng đợi ưu tiên lên trên biểu đồ; tại mobile, không mất điều hướng.
- Không hiển thị tên, số điện thoại, căn cước hoặc chẩn đoán của đối tượng an sinh trên dashboard.

## 5. Tiêu chí nghiệm thu (binary gates)

| Gate | Điều kiện đạt |
| --- | --- |
| DATA-01 | KPI, bảng và trạng thái đều bắt nguồn từ cùng tập `work_items` sau phân quyền |
| DATA-02 | Tổng 7 trạng thái = tổng công việc; đóng/hủy không bị báo quá hạn |
| DATA-03 | So sánh ngày đúng múi giờ Asia/Ho_Chi_Minh, gồm mốc hôm nay và đúng 7 ngày |
| SEC-01 | Tenant B không xuất hiện trong dashboard tenant A |
| SEC-02 | P4 không thấy dữ liệu ngoài `hamletIds`; scope rỗng phải fail-closed |
| SEC-03 | Không có role switch giả lập trên client; thao tác vào hồ sơ vẫn qua route guard |
| HISTORY-01 | Hoàn thành theo event thật; nếu history thiếu/cắt trang, thể hiện sự thiếu hụt |
| UX-01 | Bộ lọc, ô tìm kiếm, KPI, Xem thêm, nút Nguồn và đổi theme có hành vi thực |
| UX-02 | Menu có thể sử dụng trên mobile; không có sidebar phủ màn hình mặc định |
| UX-03 | Nhãn nguồn và phạm vi giải thích được đơn vị đo và giới hạn |
| QUALITY-01 | Node unit tests, Next typecheck, lint, architectural fitness, Next build đều pass |
| QUALITY-02 | Visual regression và keyboard UAT tại 390/768/1024/1440px được kiểm tra thủ công hoặc tự động |

## 6. Cần kiểm chứng tại môi trường tích hợp

Các tiêu chí dưới đây **không được tự tuyên bố 100%** nếu chưa có bằng chứng:

1. Truy vấn thực trên Supabase với account P1/P2/P4, RLS, scopes và ít nhất hai tenant.
2. Chính xác của luật SLA khi xây engine nghiệp vụ (ngày nghỉ, tạm dừng, gia hạn, escalation).
3. KPI chuyên ngành M02–M09: mỗi nguồn phải có metadata, kỳ số liệu và quy tắc pháp lý theo địa phương.
4. Đo hiệu năng thực tế: TTFB, LCP, thời gian truy vấn và dung lượng với số lượng hồ sơ lớn.
5. UAT tác nghiệp từ KPI → hàng đợi → hồ sơ → xử lý → dashboard cập nhật.

## 7. Lưu ý tích hợp các nhánh Phase 1–3

Nhánh dashboard xuất phát từ `main`, không gộp trước các nhánh `feat/pvh-ph01-platform-auth`, `feat/pvh-ph02-core-workflow`, `feat/pvh-ph03-domain-verticals`. Khi audit/merge cần kiểm tra lại xung đột tại `src/config/navigation.ts`, `(app)/layout.tsx`, `(app)/cong-viec/page.tsx` và `WorkItemManager`.
