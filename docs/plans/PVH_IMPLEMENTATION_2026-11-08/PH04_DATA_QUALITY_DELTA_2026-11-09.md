# PH04 — Bản vá chất lượng số liệu, đối chiếu và nhập CSV (09/11/2026)

**Nhánh:** fix/pvh-ph04-data-quality-20261109; kế thừa feat/pvh-ph04-reporting-integrations.\
**Người duyệt:** Đỗ Văn Đạt. **Gate G4:** chưa nghiệm thu hosted staging.

## Những lỗi đã sửa

1. **So sánh bản báo cáo:** Trước đây chỉ tiêu thiếu ở kỳ trước bị mặc định thành 0 qua toán tử nullish. Nay chỉ tính chênh lệch khi cả hai bên là số hữu hạn; thiếu dữ liệu hiển thị “Chưa có số liệu / Không đủ dữ liệu để so sánh”, không tạo tăng trưởng giả.
2. **Hiển thị:** Chuẩn hóa tên chỉ tiêu, trạng thái báo cáo và trạng thái chất lượng số liệu sang tiếng Việt. Phân biệt số 0 thực với NULL/chưa nộp; không hiển thị mã NOT_REPORTED thô trên thẻ số liệu.
3. **Nhập CSV:** Cho phép giá trị âm dạng số thập phân hợp lệ (ví dụ -12.5) nhưng tiếp tục chặn công thức bảng tính (=, +, @ hoặc biểu thức bắt đầu bằng -). Có kiểm thử chống formula injection và bản ghi âm.
4. **Provenance:** Bỏ mặc định “Đơn vị báo cáo demo” khi chọn file CSV, yêu cầu người thao tác nhập đơn vị nguồn. Biên nhận hiển thị nhãn Việt dễ hiểu.

## Kiểm thử

- Unit: metric 0 khác NULL/missing; không tính delta khi thiếu hoặc NaN; nhãn nghiệp vụ.
- Import contract: số âm hợp lệ, công thức độc hại bị chặn; regression cũ giữ nguyên.
- Typecheck, lint, production build và test PH04 qua GitHub Actions của nhánh.

## Chưa đạt G4 / việc kế tiếp

- Chưa hợp nhất với các nhánh PH01–PH03, chưa dựng Supabase staging cho browser→API→DB→Storage, worker schedule và antivirus.
- Danh mục 5 báo cáo, công thức, phân quyền chốt số và data contract nguồn ngoài cần chủ dự án xác nhận.
- Sửa/xóa dữ liệu gốc không thuộc quyền của module Báo cáo; snapshot đã chốt phải bất biến, điều chỉnh bằng revision, không xóa cứng.
- Không chạy migration, không áp dữ liệu cloud, không merge production.

**Trạng thái:** code hardening / chờ CI và UAT; không được đánh dấu hoàn tất 100%.
