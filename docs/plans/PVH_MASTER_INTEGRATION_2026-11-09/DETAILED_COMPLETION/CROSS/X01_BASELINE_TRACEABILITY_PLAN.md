# X01 — Baseline, 128 OP và biến thể
**Trạng thái:** PLAN / NOT IMPLEMENTED · **Nhánh chủ trì:** `docs/pvh-full-module-spec-20261109` · **Baseline:** Function Map gốc, 128 OP và 5 M11 draft; spec M00–M11 ngày 09/11/2026. Không coi ví dụ trường là yêu cầu đã xác nhận.

## 1. Work breakdown theo đầu việc
### T01 — Freeze SHA Function Map/REQ/BL/WF/SCR
- **Input:** tài liệu gốc + mã OP/REQ/BL/WF/SCR + code/migration của nhánh liên quan.
- **Phân tích:** liệt kê actor, chức năng con, trường dữ liệu, rule ID, quyền, lỗi và phụ thuộc; ghi chênh lệch baseline/current.
- **Implement:** cập nhật tài liệu chuyên đề và code ở nhánh chủ sở hữu sau review, không sửa main.
- **Verify:** liên kết commit SHA, test ID, CI/staging evidence, người duyệt và trạng thái `VERIFIED/BLOCKED/DEFERRED`.
- **Exit:** không còn gap P0 liên quan đến hạng mục trong scope đã duyệt.

### T02 — Phân rã OP thành variants
- **Input:** tài liệu gốc + mã OP/REQ/BL/WF/SCR + code/migration của nhánh liên quan.
- **Phân tích:** liệt kê actor, chức năng con, trường dữ liệu, rule ID, quyền, lỗi và phụ thuộc; ghi chênh lệch baseline/current.
- **Implement:** cập nhật tài liệu chuyên đề và code ở nhánh chủ sở hữu sau review, không sửa main.
- **Verify:** liên kết commit SHA, test ID, CI/staging evidence, người duyệt và trạng thái `VERIFIED/BLOCKED/DEFERRED`.
- **Exit:** không còn gap P0 liên quan đến hạng mục trong scope đã duyệt.

### T03 — Lập RTM tới feature, screen, rule, field
- **Input:** tài liệu gốc + mã OP/REQ/BL/WF/SCR + code/migration của nhánh liên quan.
- **Phân tích:** liệt kê actor, chức năng con, trường dữ liệu, rule ID, quyền, lỗi và phụ thuộc; ghi chênh lệch baseline/current.
- **Implement:** cập nhật tài liệu chuyên đề và code ở nhánh chủ sở hữu sau review, không sửa main.
- **Verify:** liên kết commit SHA, test ID, CI/staging evidence, người duyệt và trạng thái `VERIFIED/BLOCKED/DEFERRED`.
- **Exit:** không còn gap P0 liên quan đến hạng mục trong scope đã duyệt.

### T04 — Tìm orphan/duplicate/conflict
- **Input:** tài liệu gốc + mã OP/REQ/BL/WF/SCR + code/migration của nhánh liên quan.
- **Phân tích:** liệt kê actor, chức năng con, trường dữ liệu, rule ID, quyền, lỗi và phụ thuộc; ghi chênh lệch baseline/current.
- **Implement:** cập nhật tài liệu chuyên đề và code ở nhánh chủ sở hữu sau review, không sửa main.
- **Verify:** liên kết commit SHA, test ID, CI/staging evidence, người duyệt và trạng thái `VERIFIED/BLOCKED/DEFERRED`.
- **Exit:** không còn gap P0 liên quan đến hạng mục trong scope đã duyệt.

### T05 — Review scope changes
- **Input:** tài liệu gốc + mã OP/REQ/BL/WF/SCR + code/migration của nhánh liên quan.
- **Phân tích:** liệt kê actor, chức năng con, trường dữ liệu, rule ID, quyền, lỗi và phụ thuộc; ghi chênh lệch baseline/current.
- **Implement:** cập nhật tài liệu chuyên đề và code ở nhánh chủ sở hữu sau review, không sửa main.
- **Verify:** liên kết commit SHA, test ID, CI/staging evidence, người duyệt và trạng thái `VERIFIED/BLOCKED/DEFERRED`.
- **Exit:** không còn gap P0 liên quan đến hạng mục trong scope đã duyệt.

## 2. Trường dữ liệu và cấu trúc hồ sơ cần chốt
1. rtm: op_id, variant_id, requirement_id, rule_id, screen_id, feature_id, branch, code_sha, db_table, test_id, evidence. **Bắt buộc khai báo:** field_db, label_vi, type, required_if, validation, source, role, privacy, FK, test_id.
2. gap: id, severity, source, expected, actual, owner, resolution, approval. **Bắt buộc khai báo:** field_db, label_vi, type, required_if, validation, source, role, privacy, FK, test_id.

## 3. Rủi ro, ràng buộc và ngoại lệ
128 OP gốc phải mapped; không dùng 5 M11 draft làm tăng mẫu số; mọi biến thể còn gộp phải có ID con và nguồn.
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
