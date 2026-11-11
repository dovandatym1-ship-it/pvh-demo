# M10 — Tích hợp và Đồng bộ dữ liệu MVP
**Trạng thái:** PLAN / NOT IMPLEMENTED · **Nhánh chủ trì:** `feat/pvh-ph04-reporting-integrations` · **Baseline:** Function Map gốc, 128 OP và 5 M11 draft; spec M00–M11 ngày 09/11/2026. Không coi ví dụ trường là yêu cầu đã xác nhận.

## 1. Work breakdown theo đầu việc
### T01 — M10-F01 Nhập Excel/CSV
- **Input:** tài liệu gốc + mã OP/REQ/BL/WF/SCR + code/migration của nhánh liên quan.
- **Phân tích:** liệt kê actor, chức năng con, trường dữ liệu, rule ID, quyền, lỗi và phụ thuộc; ghi chênh lệch baseline/current.
- **Implement:** cập nhật tài liệu chuyên đề và code ở nhánh chủ sở hữu sau review, không sửa main.
- **Verify:** liên kết commit SHA, test ID, CI/staging evidence, người duyệt và trạng thái `VERIFIED/BLOCKED/DEFERRED`.
- **Exit:** không còn gap P0 liên quan đến hạng mục trong scope đã duyệt.

### T02 — M10-F02 Xuất Excel/CSV
- **Input:** tài liệu gốc + mã OP/REQ/BL/WF/SCR + code/migration của nhánh liên quan.
- **Phân tích:** liệt kê actor, chức năng con, trường dữ liệu, rule ID, quyền, lỗi và phụ thuộc; ghi chênh lệch baseline/current.
- **Implement:** cập nhật tài liệu chuyên đề và code ở nhánh chủ sở hữu sau review, không sửa main.
- **Verify:** liên kết commit SHA, test ID, CI/staging evidence, người duyệt và trạng thái `VERIFIED/BLOCKED/DEFERRED`.
- **Exit:** không còn gap P0 liên quan đến hạng mục trong scope đã duyệt.

### T03 — M10-F03 Lịch sử nhập/xuất
- **Input:** tài liệu gốc + mã OP/REQ/BL/WF/SCR + code/migration của nhánh liên quan.
- **Phân tích:** liệt kê actor, chức năng con, trường dữ liệu, rule ID, quyền, lỗi và phụ thuộc; ghi chênh lệch baseline/current.
- **Implement:** cập nhật tài liệu chuyên đề và code ở nhánh chủ sở hữu sau review, không sửa main.
- **Verify:** liên kết commit SHA, test ID, CI/staging evidence, người duyệt và trạng thái `VERIFIED/BLOCKED/DEFERRED`.
- **Exit:** không còn gap P0 liên quan đến hạng mục trong scope đã duyệt.

### T04 — M10-F04 Cấu hình nguồn dữ liệu
- **Input:** tài liệu gốc + mã OP/REQ/BL/WF/SCR + code/migration của nhánh liên quan.
- **Phân tích:** liệt kê actor, chức năng con, trường dữ liệu, rule ID, quyền, lỗi và phụ thuộc; ghi chênh lệch baseline/current.
- **Implement:** cập nhật tài liệu chuyên đề và code ở nhánh chủ sở hữu sau review, không sửa main.
- **Verify:** liên kết commit SHA, test ID, CI/staging evidence, người duyệt và trạng thái `VERIFIED/BLOCKED/DEFERRED`.
- **Exit:** không còn gap P0 liên quan đến hạng mục trong scope đã duyệt.

## 2. Trường dữ liệu và cấu trúc hồ sơ cần chốt
1. import_job: nguồn, tên tệp, checksum, định dạng, người tải, số dòng, lỗi, trạng thái. **Bắt buộc khai báo:** field_db, label_vi, type, required_if, validation, source, role, privacy, FK, test_id.
2. mapping: cột nguồn, cột đích, kiểu chuyển đổi, phiên bản, mặc định. **Bắt buộc khai báo:** field_db, label_vi, type, required_if, validation, source, role, privacy, FK, test_id.
3. import_error: dòng, cột, giá trị lỗi đã mask, nguyên nhân, cách sửa. **Bắt buộc khai báo:** field_db, label_vi, type, required_if, validation, source, role, privacy, FK, test_id.
4. export_job: tập dữ liệu, bộ lọc, định dạng, người yêu cầu, kết quả. **Bắt buộc khai báo:** field_db, label_vi, type, required_if, validation, source, role, privacy, FK, test_id.
5. source_config: mã nguồn, chủ sở hữu, trạng thái, phiên bản. **Bắt buộc khai báo:** field_db, label_vi, type, required_if, validation, source, role, privacy, FK, test_id.

## 3. Rủi ro, ràng buộc và ngoại lệ
Giữ M10 MVP; không trùng M09 báo cáo chính thức; dry-run, chống trùng, lỗi từng dòng, quyền xuất, rollback partial commit.
- Không suy diễn thẩm quyền, nguồn dữ liệu, quyết định hành chính hoặc tình trạng migration trên Supabase.
- Phân biệt `DOCUMENTED`, `IMPLEMENTED`, `STAGING_VERIFIED`, `OWNER_ACCEPTED`; không cộng dồn thành một tỷ lệ 100% cảm tính.
- Tất cả UI nhãn tiếng Việt; field code tiếng Anh snake_case, quyền theo tenant/object/field.

## 4. Dependency và thứ tự triển khai
1. Đóng băng baseline và lập mapping đến OP, feature, screen, rule.
2. Chốt ADR ownership/permission/schema, legal blockers và mẫu báo cáo nếu có.
3. Hoàn thiện Data Dictionary và workflow; đối chiếu code, SQL, RLS thực.
4. Thực hiện PR Draft trên nhánh owner; additive migration và rollback.
5. Chạy unit/contract/RLS negative/E2E/visual/mobile; lưu evidence theo SHA.
6. Một người duyệt; chỉ merge sau integration gate.

## 5. Checklist nghiệm thu
- [ ] Tất cả OP/feature/variants thuộc scope có traceability, không orphan/duplicate chưa xử lý.
- [ ] Trường dữ liệu có nhãn tiếng Việt, kiểu, bắt buộc có điều kiện, validation, nguồn, bảo mật, FK, UI, test.
- [ ] Rule/authority có nguồn và trạng thái duyệt; không còn TBD trong scope nghiệm thu.
- [ ] API/DB/UI/permission liên kết bằng commit SHA và test evidence; cross-tenant deny.
- [ ] Responsive, loading/empty/error, audit, report/import/export áp dụng đã kiểm thử.
- [ ] Không còn P0 blocker; owner sign-off; có kế hoạch rollback.

## 6. Deliverables
`SCOPE_AND_OP_CROSSWALK.md`, `FIELD_DICTIONARY.csv`, `RULE_AND_AUTHORITY_REGISTER.md`, `ARCHITECTURE_AND_PERMISSION.md`, `IMPLEMENTATION_TASKS.md`, `TEST_EVIDENCE.md`, `ACCEPTANCE_RECEIPT.md`. Đây là yêu cầu tạo ra trong quá trình triển khai, không phải các file đã hoàn thành.
