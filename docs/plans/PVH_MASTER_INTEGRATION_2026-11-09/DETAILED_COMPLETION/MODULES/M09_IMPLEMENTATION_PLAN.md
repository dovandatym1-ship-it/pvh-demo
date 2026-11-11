# KẾ HOẠCH TRIỂN KHAI M09 — Báo cáo và Thống kê
**Trạng thái:** PLAN, chưa sửa code. **Nhánh nhận triển khai:** `feat/pvh-ph04-reporting-integrations`. **Nguồn:** Function Map gốc + `docs/pvh-full-module-spec-20261109/M09.md`; chưa xác minh tất cả biến thể OP, không coi field gợi ý là đã duyệt.

## 1. Mục tiêu và ranh giới
- Đối chiếu 100% OP nguồn thuộc M09 (M11 là module bổ sung, không có OP độc lập trong 128 OP gốc) và các biến thể bị gộp; không đổi mã OP.
- Hoàn thiện function/subfunction, field dictionary, rule register, workflow, screen, API/RPC, schema/RLS, tests; nhãn tiếng Việt dễ hiểu.
- Đầu ra tại nhánh nhận: `docs/specs/modules/M09/01_SCOPE_OP_CROSSWALK.md`, `02_FEATURE_BREAKDOWN.md`, `03_DATA_DICTIONARY.csv`, `04_BUSINESS_RULES.md`, `05_WORKFLOW_AND_PERMISSIONS.md`, `06_UI_SCREEN_SPEC.md`, `07_DB_SCHEMA_AND_MIGRATION.md`, `08_TEST_CASES_AND_EVIDENCE.md`, `09_GAP_CLOSURE_RECEIPT.md`.

## 2. WBS theo từng chức năng
Mỗi dòng dưới đây là một work package; bắt buộc phân rã thêm thao tác con theo nghiệp vụ thực (không ép CRUD cho nhật ký, báo cáo, tra cứu).

| Feature | Tên chức năng | Việc phải hoàn thành | Minh chứng nghiệm thu |
|---|---|---|---|
| M09-F01 | Mẫu báo cáo | Xác định OP/variant, actor, màn hình, trường list/form/detail/filter/export, rules, states, quyền, DB, API | Crosswalk + field dictionary + rule IDs + tests + review |
| M09-F02 | Chỉ tiêu báo cáo | Xác định OP/variant, actor, màn hình, trường list/form/detail/filter/export, rules, states, quyền, DB, API | Crosswalk + field dictionary + rule IDs + tests + review |
| M09-F03 | Kỳ báo cáo | Xác định OP/variant, actor, màn hình, trường list/form/detail/filter/export, rules, states, quyền, DB, API | Crosswalk + field dictionary + rule IDs + tests + review |
| M09-F04 | Lập báo cáo | Xác định OP/variant, actor, màn hình, trường list/form/detail/filter/export, rules, states, quyền, DB, API | Crosswalk + field dictionary + rule IDs + tests + review |
| M09-F05 | Nhập số liệu bổ sung | Xác định OP/variant, actor, màn hình, trường list/form/detail/filter/export, rules, states, quyền, DB, API | Crosswalk + field dictionary + rule IDs + tests + review |
| M09-F06 | Tổng hợp và đối soát | Xác định OP/variant, actor, màn hình, trường list/form/detail/filter/export, rules, states, quyền, DB, API | Crosswalk + field dictionary + rule IDs + tests + review |
| M09-F07 | Xuất báo cáo | Xác định OP/variant, actor, màn hình, trường list/form/detail/filter/export, rules, states, quyền, DB, API | Crosswalk + field dictionary + rule IDs + tests + review |
| M09-F08 | Tra cứu báo cáo | Xác định OP/variant, actor, màn hình, trường list/form/detail/filter/export, rules, states, quyền, DB, API | Crosswalk + field dictionary + rule IDs + tests + review |

## 3. Danh sách nhóm dữ liệu ứng viên để kiểm kê chi tiết
1. **report_template:** mã mẫu, phiên bản, hiệu lực, định dạng. Xác nhận source-of-truth, bắt buộc theo trạng thái, FK, uniqueness, thời gian hiệu lực, quyền xem/sửa/xuất và label tiếng Việt.
2. **metric:** mã, nhãn, công thức, đơn vị, nguồn. Xác nhận source-of-truth, bắt buộc theo trạng thái, FK, uniqueness, thời gian hiệu lực, quyền xem/sửa/xuất và label tiếng Việt.
3. **period:** loại kỳ, bắt đầu/kết thúc, khóa kỳ. Xác nhận source-of-truth, bắt buộc theo trạng thái, FK, uniqueness, thời gian hiệu lực, quyền xem/sửa/xuất và label tiếng Việt.
4. **report_run:** mẫu, kỳ, đơn vị, trạng thái, phiên bản. Xác nhận source-of-truth, bắt buộc theo trạng thái, FK, uniqueness, thời gian hiệu lực, quyền xem/sửa/xuất và label tiếng Việt.
5. **manual_value:** chỉ tiêu, giá trị, lý do, người nhập. Xác nhận source-of-truth, bắt buộc theo trạng thái, FK, uniqueness, thời gian hiệu lực, quyền xem/sửa/xuất và label tiếng Việt.
6. **reconciliation:** nguồn, chênh lệch, giải trình. Xác nhận source-of-truth, bắt buộc theo trạng thái, FK, uniqueness, thời gian hiệu lực, quyền xem/sửa/xuất và label tiếng Việt.
7. **export:** định dạng, bản chụp, người tải, kiểm tra quyền. Xác nhận source-of-truth, bắt buộc theo trạng thái, FK, uniqueness, thời gian hiệu lực, quyền xem/sửa/xuất và label tiếng Việt.
8. **report_search:** kỳ, mẫu, đơn vị, trạng thái. Xác nhận source-of-truth, bắt buộc theo trạng thái, FK, uniqueness, thời gian hiệu lực, quyền xem/sửa/xuất và label tiếng Việt.

**Schema của mỗi field:** `field_db | label_vi | meaning | type | length | required_if | nullable | default | validation | catalog | example | source | sensitivity | mask | read_roles | edit_roles | export_roles | FK | unique_scope | index | UI | OP | rule | test | status`. Đối với field thiếu căn cứ: `BLOCKED_SOURCE`/`BLOCKED_LEGAL`, không tự điền giá trị tùy tiện.

## 4. Quy tắc đặc thù và câu hỏi bắt buộc đóng
Snapshot bất biến, lineage, kỳ khóa, mẫu XLSX/PDF/DOCX/CSV golden, quyền xuất.

- Ai là actor và đơn vị sở hữu dữ liệu? Hành động nào chỉ được ghi nhận/theo dõi, hành động nào có thẩm quyền quyết định?
- Điều kiện tạo, sửa, hủy, lưu trữ, tra cứu, xuất, phân quyền cấp xã và cross-tenant là gì? Có biến thể theo kỳ, đối tượng, loại hồ sơ không?
- Trường nào lấy từ danh mục M11 hoặc canonical records M01? Trường nào nhạy cảm, cần mask, có thời hạn lưu trữ?
- Có biểu mẫu/quy định pháp lý và ngày hiệu lực chưa? Nếu không, đánh dấu blocker và chặn hành vi hậu quả pháp lý.

## 5. Các task triển khai có thứ tự
| Task | Ưu tiên | Công việc | Phụ thuộc | Exit evidence |
|---|---|---|---|---|
| M09-T01 | P0 | Freeze SHA tài liệu nguồn, trích OP và biến thể; đối chiếu feature | Baseline gốc | Không OP mồ côi |
| M09-T02 | P0 | Phân rã feature→subfeature→screen→actor→operation | T01 | Danh mục chức năng con được review |
| M09-T03 | P0 | Field dictionary từng entity/form/list/filter/export, label tiếng Việt | T02 + ADR ownership | Không TBD trong scope duyệt |
| M09-T04 | P0 | Business rules, thẩm quyền, workflow, exceptions, legal register | T02 | Rule IDs + nguồn + blocker |
| M09-T05 | P0 | ERD/FK/unique/index/RLS/Storage/migration và rollback | T03/T04 | DB contract và migration test |
| M09-T06 | P1 | API/RPC + validation server-side + audit/idempotency | T05 | API contract tests |
| M09-T07 | P1 | UI tiếng Việt, list/detail/form/filter, empty/error/mobile | T03/T06 | UX + accessibility checks |
| M09-T08 | P0 | Security/negative/E2E/UAT, export/import nếu áp dụng | T06/T07 | CI + staging DB readback |
| M09-T09 | P0 | PR Draft, evidence ledger, review một người, quyết định merge | T08 | OWNER_ACCEPTED hoặc BLOCKED |

## 6. Test matrix áp dụng theo tính chất chức năng
- Create: required/conditional fields, trùng mã, sai kiểu, quyền sai, rollback transaction.
- Read: tìm kiếm/lọc/sắp xếp/phân trang, empty/loading/error, scope theo xã, mask dữ liệu.
- Update: thay đổi hợp lệ, conflict hai người sửa, version và audit; Delete/archive: ràng buộc FK, soft-delete, phục hồi nếu hợp pháp.
- Workflow: transitions, guard, timeout, delegation, retry, idempotency; Notification: event, người nhận, deep link và trạng thái đọc.
- Export/import: định dạng, tên file tiếng Việt, giới hạn kích thước, dòng lỗi, quyền tải, snapshot và version.
- Security: direct API deny, cross-tenant, revoked role, storage private URL, field-level leak, audit bất biến.

## 7. Điều kiện hoàn tất
- [ ] Tất cả feature trên có subfeatures và OP mapping, biến thể được kiểm kê; không có orphan.
- [ ] Field dictionary đầy đủ theo từng màn hình và entity, không có `TBD` trong scope đã duyệt.
- [ ] Không có business rule tự suy diễn thẩm quyền; legal blockers được xử lý hoặc tách DEFER rõ.
- [ ] Migrations và RLS kiểm chứng trên staging; UI tiếng Việt chuẩn, mobile; CI + UAT + reviewer sign-off.
- [ ] Không sửa main/production và không đánh dấu hoàn thành nếu chỉ mới viết tài liệu.
