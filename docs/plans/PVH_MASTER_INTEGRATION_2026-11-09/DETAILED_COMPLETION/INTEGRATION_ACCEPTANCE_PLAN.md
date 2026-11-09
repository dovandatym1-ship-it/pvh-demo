# Integration — phụ thuộc, PR, nghiệm thu và merge
**Trạng thái:** PLAN / NOT IMPLEMENTED · **Nhánh chủ trì:** `plan/pvh-master-integration-ux-first-20261109` · **Baseline:** Function Map gốc, 128 OP và 5 M11 draft; spec M00–M11 ngày 09/11/2026. Không coi ví dụ trường là yêu cầu đã xác nhận.

## 1. Work breakdown theo đầu việc
### T01 — Xác minh ancestry PH01–PH06 và dashboard/profile
- **Input:** tài liệu gốc + mã OP/REQ/BL/WF/SCR + code/migration của nhánh liên quan.
- **Phân tích:** liệt kê actor, chức năng con, trường dữ liệu, rule ID, quyền, lỗi và phụ thuộc; ghi chênh lệch baseline/current.
- **Implement:** cập nhật tài liệu chuyên đề và code ở nhánh chủ sở hữu sau review, không sửa main.
- **Verify:** liên kết commit SHA, test ID, CI/staging evidence, người duyệt và trạng thái `VERIFIED/BLOCKED/DEFERRED`.
- **Exit:** không còn gap P0 liên quan đến hạng mục trong scope đã duyệt.

### T02 — Review diff theo OP và schema ownership
- **Input:** tài liệu gốc + mã OP/REQ/BL/WF/SCR + code/migration của nhánh liên quan.
- **Phân tích:** liệt kê actor, chức năng con, trường dữ liệu, rule ID, quyền, lỗi và phụ thuộc; ghi chênh lệch baseline/current.
- **Implement:** cập nhật tài liệu chuyên đề và code ở nhánh chủ sở hữu sau review, không sửa main.
- **Verify:** liên kết commit SHA, test ID, CI/staging evidence, người duyệt và trạng thái `VERIFIED/BLOCKED/DEFERRED`.
- **Exit:** không còn gap P0 liên quan đến hạng mục trong scope đã duyệt.

### T03 — Cherry-pick/backport thay vì merge chồng nhánh
- **Input:** tài liệu gốc + mã OP/REQ/BL/WF/SCR + code/migration của nhánh liên quan.
- **Phân tích:** liệt kê actor, chức năng con, trường dữ liệu, rule ID, quyền, lỗi và phụ thuộc; ghi chênh lệch baseline/current.
- **Implement:** cập nhật tài liệu chuyên đề và code ở nhánh chủ sở hữu sau review, không sửa main.
- **Verify:** liên kết commit SHA, test ID, CI/staging evidence, người duyệt và trạng thái `VERIFIED/BLOCKED/DEFERRED`.
- **Exit:** không còn gap P0 liên quan đến hạng mục trong scope đã duyệt.

### T04 — CI+staging migration+RLS+E2E+UAT
- **Input:** tài liệu gốc + mã OP/REQ/BL/WF/SCR + code/migration của nhánh liên quan.
- **Phân tích:** liệt kê actor, chức năng con, trường dữ liệu, rule ID, quyền, lỗi và phụ thuộc; ghi chênh lệch baseline/current.
- **Implement:** cập nhật tài liệu chuyên đề và code ở nhánh chủ sở hữu sau review, không sửa main.
- **Verify:** liên kết commit SHA, test ID, CI/staging evidence, người duyệt và trạng thái `VERIFIED/BLOCKED/DEFERRED`.
- **Exit:** không còn gap P0 liên quan đến hạng mục trong scope đã duyệt.

### T05 — Owner approval, rollback và release checklist
- **Input:** tài liệu gốc + mã OP/REQ/BL/WF/SCR + code/migration của nhánh liên quan.
- **Phân tích:** liệt kê actor, chức năng con, trường dữ liệu, rule ID, quyền, lỗi và phụ thuộc; ghi chênh lệch baseline/current.
- **Implement:** cập nhật tài liệu chuyên đề và code ở nhánh chủ sở hữu sau review, không sửa main.
- **Verify:** liên kết commit SHA, test ID, CI/staging evidence, người duyệt và trạng thái `VERIFIED/BLOCKED/DEFERRED`.
- **Exit:** không còn gap P0 liên quan đến hạng mục trong scope đã duyệt.

## 2. Trường dữ liệu và cấu trúc hồ sơ cần chốt
1. evidence: op_id, feature_id, field_spec_version, branch, commit_sha, ci_url, db_receipt, uat_case, reviewer, accepted_at. **Bắt buộc khai báo:** field_db, label_vi, type, required_if, validation, source, role, privacy, FK, test_id.
2. release: version, scope, deferred, open_p0, migration_order, rollback_plan, owner_decision. **Bắt buộc khai báo:** field_db, label_vi, type, required_if, validation, source, role, privacy, FK, test_id.

## 3. Rủi ro, ràng buộc và ngoại lệ
Không merge main khi còn P0, chưa kiểm DB staging, chưa chứng minh scope/field/rule và chưa có chủ dự án duyệt.
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
