# PVH – Full Module Specification Work Breakdown

Ngày lập: 2026-11-09 · Nhánh: `docs/pvh-full-module-spec-20261109` · Trạng thái: **BASELINE / WORK IN PROGRESS**, không phải SRS đã nghiệm thu.

## Phạm vi và quy tắc
- M00–M11: 12 module, M10 chỉ MVP. M00 giữ đúng 6 menu; M11 là module riêng.
- Cán bộ xã là tác nhân CRUD chính; các tác vụ cấu hình hệ thống do vai trò được cấp quyền thực hiện.
- Không tự suy diễn thẩm quyền phê duyệt, xử phạt, chi trả, thu thập dữ liệu nhạy cảm.
- Multi-tenant: xác định tenant_id/xã, ranh giới dữ liệu, dữ liệu danh mục dùng chung và chính sách clone/cấu hình.
- Chỉ ghi **100%** sau khi bằng chứng, đối chiếu pháp lý, review và acceptance test đạt; không dùng số % cảm tính.

## Cổng nghiệm thu 100% (đếm được)
| Gate | Điều kiện pass | Minh chứng |
|---|---|---|
| G01 Scope | 100% menu/chức năng có ID, owner, priority, trạng thái | Function Map |
| G02 Operations | 100% CRUD có precondition, input, output, quyền, error, audit | Operation Spec |
| G03 Fields | 100% field có type, required, default, validation, source, privacy, example | Data Dictionary |
| G04 Rules | 100% rule có ID, căn cứ hoặc trạng thái cần xác nhận | Rule Register |
| G05 Relations | 100% FK/cardinality/unique/delete policy được mô tả | ERD + schema |
| G06 UI | 100% màn có list/filter/sort/form/detail/empty/loading/error/accessibility | Screen Spec |
| G07 Security | 100% API/action kiểm tenant, role, object scope; audit | Permission Matrix + tests |
| G08 Workflow | 100% trạng thái/chuyển trạng thái có guard và xử lý ngoại lệ | State Diagram |
| G09 Export | 100% chức năng xuất có định dạng, mẫu, quyền, version, kiểm thử | Export Test Matrix |
| G10 Verification | 100% yêu cầu liên kết test; 0 blocker mở; các giả định chưa xác nhận không được đánh dấu pass | RTM + Test Evidence |

**Trạng thái cho từng item:** NOT_STARTED / DRAFT / NEEDS_LEGAL_CONFIRMATION / REVIEWED / VERIFIED / BLOCKED. Không gộp 'đã viết' với 'đã kiểm chứng'.

## Thứ tự triển khai
P0: M00 → M11 → M01 → M02–M07 → M09. P1: M08. P2: M10 MVP. Các module có thể đặc tả song song sau khi khóa entity/permission conventions.

## Danh mục gói
- [M00 – Quản trị hệ thống](./M00.md)
- [M01 – Quản lý công việc và hồ sơ](./M01.md)
- [M02 – Nội vụ và Lao động](./M02.md)
- [M03 – Giáo dục và Đào tạo](./M03.md)
- [M04 – Văn hóa, Thể thao, Du lịch, Thông tin và Gia đình](./M04.md)
- [M05 – Khoa học, Công nghệ và Chuyển đổi số](./M05.md)
- [M06 – Y tế và An sinh xã hội](./M06.md)
- [M07 – Dân tộc, Tín ngưỡng và Tôn giáo](./M07.md)
- [M08 – Kiểm tra và Giám sát](./M08.md)
- [M09 – Báo cáo và Thống kê](./M09.md)
- [M10 – Tích hợp và Đồng bộ dữ liệu (MVP)](./M10.md)
- [M11 – Quản lý danh mục dùng chung](./M11.md)

## Phụ thuộc cần xác minh
1. Nhiệm vụ, thẩm quyền PVH xã theo pháp luật hiện hành và văn bản địa phương.
2. Biểu mẫu chính thức, danh mục dữ liệu chuẩn, nguồn dữ liệu gốc, kỳ/hạn báo cáo.
3. Khả năng kỹ thuật, schema và chức năng thực có trong repo: chưa audit ở gói tài liệu này.
4. Quy tắc bảo vệ dữ liệu cá nhân, lưu trữ, phân quyền theo địa bàn và quyền xuất.
