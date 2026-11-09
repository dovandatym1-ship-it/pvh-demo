# PVH — MỤC LỤC BỘ KẾ HOẠCH BỔ SUNG NGHIỆP VỤ
**Ngày:** 09/11/2026 · **Trạng thái:** Đã lập kế hoạch, chưa triển khai code/DB · **Số file nội dung:** 19 (1 master + 12 module + 5 xuyên module + 1 tích hợp); file này là mục lục.

## Master
- [Master Plan](../PVH_BRANCH_BUSINESS_FIELD_COMPLETION_PLAN_2026-11-09.md)

## 12 module — đọc và triển khai trên nhánh chủ sở hữu
- [M00 — kế hoạch chi tiết](MODULES/M00_IMPLEMENTATION_PLAN.md)
- [M01 — kế hoạch chi tiết](MODULES/M01_IMPLEMENTATION_PLAN.md)
- [M02 — kế hoạch chi tiết](MODULES/M02_IMPLEMENTATION_PLAN.md)
- [M03 — kế hoạch chi tiết](MODULES/M03_IMPLEMENTATION_PLAN.md)
- [M04 — kế hoạch chi tiết](MODULES/M04_IMPLEMENTATION_PLAN.md)
- [M05 — kế hoạch chi tiết](MODULES/M05_IMPLEMENTATION_PLAN.md)
- [M06 — kế hoạch chi tiết](MODULES/M06_IMPLEMENTATION_PLAN.md)
- [M07 — kế hoạch chi tiết](MODULES/M07_IMPLEMENTATION_PLAN.md)
- [M08 — kế hoạch chi tiết](MODULES/M08_IMPLEMENTATION_PLAN.md)
- [M09 — kế hoạch chi tiết](MODULES/M09_IMPLEMENTATION_PLAN.md)
- [M10 — kế hoạch chi tiết](MODULES/M10_IMPLEMENTATION_PLAN.md)
- [M11 — kế hoạch chi tiết](MODULES/M11_IMPLEMENTATION_PLAN.md)

## 5 kế hoạch xuyên module
- [X01 — BASELINE_TRACEABILITY](CROSS/X01_BASELINE_TRACEABILITY_PLAN.md)
- [X02 — ENTITY_SECURITY](CROSS/X02_ENTITY_SECURITY_PLAN.md)
- [X03 — VIETNAMESE_UX](CROSS/X03_VIETNAMESE_UX_PLAN.md)
- [X04 — DASHBOARD_PROFILE_NOTIFICATION](CROSS/X04_DASHBOARD_PROFILE_NOTIFICATION_PLAN.md)
- [X05 — REPORT_INTEGRATION_CLONE](CROSS/X05_REPORT_INTEGRATION_CLONE_PLAN.md)

## Tích hợp
- [Integration & Acceptance](INTEGRATION_ACCEPTANCE_PLAN.md)

## Cách thực hiện
1. Chốt OP gốc/biến thể và các quyết định ownership trước khi sửa schema.
2. Tạo tài liệu chi tiết và code trong từng nhánh owner theo module plan; không merge main tự động.
3. Kèm migration, RLS, tests, CI/staging evidence và PR Draft để một người duyệt.
4. Đối chiếu lại toàn bộ 128 OP gốc, field-level, rule, UI tiếng Việt, DB và UAT trước nghiệm thu.

**Lưu ý:** Danh sách trường trong các kế hoạch là ứng viên phân tích, chưa phải data dictionary hoàn chỉnh đã xác nhận. Không coi các file plan là bằng chứng hoàn thành nghiệp vụ.
