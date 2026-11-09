# KẾ HOẠCH TRIỂN KHAI M08 — Kiểm tra và Giám sát
**Trạng thái:** PLAN, chưa sửa code. **Nhánh nhận triển khai:** `feat/pvh-ph03-domain-verticals`. **Nguồn:** Function Map gốc + `docs/pvh-full-module-spec-20261109/M08.md`; chưa xác minh tất cả biến thể OP, không coi field gợi ý là đã duyệt.

## 1. Mục tiêu và ranh giới
- Đối chiếu 100% OP nguồn thuộc M08 (M11 là module bổ sung, không có OP độc lập trong 128 OP gốc) và các biến thể bị gộp; không đổi mã OP.
- Hoàn thiện function/subfunction, field dictionary, rule register, workflow, screen, API/RPC, schema/RLS, tests; nhãn tiếng Việt dễ hiểu.
- Đầu ra tại nhánh nhận: `docs/specs/modules/M08/01_SCOPE_OP_CROSSWALK.md`, `02_FEATURE_BREAKDOWN.md`, `03_DATA_DICTIONARY.csv`, `04_BUSINESS_RULES.md`, `05_WORKFLOW_AND_PERMISSIONS.md`, `06_UI_SCREEN_SPEC.md`, `07_DB_SCHEMA_AND_MIGRATION.md`, `08_TEST_CASES_AND_EVIDENCE.md`, `09_GAP_CLOSURE_RECEIPT.md`.

## 2. WBS theo từng chức năng
Mỗi dòng dưới đây là một work package; bắt buộc phân rã thêm thao tác con theo nghiệp vụ thực (không ép CRUD cho nhật ký, báo cáo, tra cứu).

| Feature | Tên chức năng | Việc phải hoàn thành | Minh chứng nghiệm thu |
|---|---|---|---|
| M08-F01 | Kế hoạch kiểm tra | Xác định OP/variant, actor, màn hình, trường list/form/detail/filter/export, rules, states, quyền, DB, API | Crosswalk + field dictionary + rule IDs + tests + review |
| M08-F02 | Đối tượng kiểm tra | Xác định OP/variant, actor, màn hình, trường list/form/detail/filter/export, rules, states, quyền, DB, API | Crosswalk + field dictionary + rule IDs + tests + review |
| M08-F03 | Đợt kiểm tra | Xác định OP/variant, actor, màn hình, trường list/form/detail/filter/export, rules, states, quyền, DB, API | Crosswalk + field dictionary + rule IDs + tests + review |
| M08-F04 | Biên bản kiểm tra | Xác định OP/variant, actor, màn hình, trường list/form/detail/filter/export, rules, states, quyền, DB, API | Crosswalk + field dictionary + rule IDs + tests + review |
| M08-F05 | Kết quả kiểm tra | Xác định OP/variant, actor, màn hình, trường list/form/detail/filter/export, rules, states, quyền, DB, API | Crosswalk + field dictionary + rule IDs + tests + review |
| M08-F06 | Kiến nghị và khắc phục | Xác định OP/variant, actor, màn hình, trường list/form/detail/filter/export, rules, states, quyền, DB, API | Crosswalk + field dictionary + rule IDs + tests + review |
| M08-F07 | Theo dõi, tổng hợp | Xác định OP/variant, actor, màn hình, trường list/form/detail/filter/export, rules, states, quyền, DB, API | Crosswalk + field dictionary + rule IDs + tests + review |

## 3. Danh sách nhóm dữ liệu ứng viên để kiểm kê chi tiết
1. **inspection_plan:** mã, phạm vi, kỳ, người phụ trách. Xác nhận source-of-truth, bắt buộc theo trạng thái, FK, uniqueness, thời gian hiệu lực, quyền xem/sửa/xuất và label tiếng Việt.
2. **inspection_subject:** đối tượng, loại, địa bàn. Xác nhận source-of-truth, bắt buộc theo trạng thái, FK, uniqueness, thời gian hiệu lực, quyền xem/sửa/xuất và label tiếng Việt.
3. **inspection_round:** kế hoạch, thời gian, đoàn, trạng thái. Xác nhận source-of-truth, bắt buộc theo trạng thái, FK, uniqueness, thời gian hiệu lực, quyền xem/sửa/xuất và label tiếng Việt.
4. **minutes:** đợt, biên bản, phiên bản, thời gian. Xác nhận source-of-truth, bắt buộc theo trạng thái, FK, uniqueness, thời gian hiệu lực, quyền xem/sửa/xuất và label tiếng Việt.
5. **inspection_result:** kết luận, minh chứng, trạng thái. Xác nhận source-of-truth, bắt buộc theo trạng thái, FK, uniqueness, thời gian hiệu lực, quyền xem/sửa/xuất và label tiếng Việt.
6. **remediation:** kiến nghị, người phụ trách, hạn, kết quả. Xác nhận source-of-truth, bắt buộc theo trạng thái, FK, uniqueness, thời gian hiệu lực, quyền xem/sửa/xuất và label tiếng Việt.
7. **inspection_summary:** kỳ, số liệu, nguồn. Xác nhận source-of-truth, bắt buộc theo trạng thái, FK, uniqueness, thời gian hiệu lực, quyền xem/sửa/xuất và label tiếng Việt.

**Schema của mỗi field:** `field_db | label_vi | meaning | type | length | required_if | nullable | default | validation | catalog | example | source | sensitivity | mask | read_roles | edit_roles | export_roles | FK | unique_scope | index | UI | OP | rule | test | status`. Đối với field thiếu căn cứ: `BLOCKED_SOURCE`/`BLOCKED_LEGAL`, không tự điền giá trị tùy tiện.

## 4. Quy tắc đặc thù và câu hỏi bắt buộc đóng
Không tự phát sinh quyết định xử phạt; biên bản có phiên bản, kiến nghị có theo dõi.

- Ai là actor và đơn vị sở hữu dữ liệu? Hành động nào chỉ được ghi nhận/theo dõi, hành động nào có thẩm quyền quyết định?
- Điều kiện tạo, sửa, hủy, lưu trữ, tra cứu, xuất, phân quyền cấp xã và cross-tenant là gì? Có biến thể theo kỳ, đối tượng, loại hồ sơ không?
- Trường nào lấy từ danh mục M11 hoặc canonical records M01? Trường nào nhạy cảm, cần mask, có thời hạn lưu trữ?
- Có biểu mẫu/quy định pháp lý và ngày hiệu lực chưa? Nếu không, đánh dấu blocker và chặn hành vi hậu quả pháp lý.

## 5. Các task triển khai có thứ tự
| Task | Ưu tiên | Công việc | Phụ thuộc | Exit evidence |
|---|---|---|---|---|
| M08-T01 | P0 | Freeze SHA tài liệu nguồn, trích OP và biến thể; đối chiếu feature | Baseline gốc | Không OP mồ côi |
| M08-T02 | P0 | Phân rã feature→subfeature→screen→actor→operation | T01 | Danh mục chức năng con được review |
| M08-T03 | P0 | Field dictionary từng entity/form/list/filter/export, label tiếng Việt | T02 + ADR ownership | Không TBD trong scope duyệt |
| M08-T04 | P0 | Business rules, thẩm quyền, workflow, exceptions, legal register | T02 | Rule IDs + nguồn + blocker |
| M08-T05 | P0 | ERD/FK/unique/index/RLS/Storage/migration và rollback | T03/T04 | DB contract và migration test |
| M08-T06 | P1 | API/RPC + validation server-side + audit/idempotency | T05 | API contract tests |
| M08-T07 | P1 | UI tiếng Việt, list/detail/form/filter, empty/error/mobile | T03/T06 | UX + accessibility checks |
| M08-T08 | P0 | Security/negative/E2E/UAT, export/import nếu áp dụng | T06/T07 | CI + staging DB readback |
| M08-T09 | P0 | PR Draft, evidence ledger, review một người, quyết định merge | T08 | OWNER_ACCEPTED hoặc BLOCKED |

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
