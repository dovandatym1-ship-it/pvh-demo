# INTEGRATED FUNCTIONAL COVERAGE MATRIX — M00–M11
**Document:** IFCM-v1.0 · **Priority:** P1 · **Status:** SOURCE INVENTORY COMPLETE / CODE VERIFICATION PENDING
**Đầu vào:** main/docs/business/FUNCTION_MAP_PVH_v0.1.md, REVIEW_FUNCTION_MAP_PVH_v0.1, Phase 01–06 receipts, bộ spec M00–M11, nguồn code trên các branch. Không coi danh sách OP đã xác nhận thẩm quyền pháp lý.

## 1. Kết quả inventory thực
**Đã trích đủ 128 OP riêng biệt** từ Function Map theo mã OP-M00..M10; mỗi hàng đã có tên nghiệp vụ, mẫu, BL, REQ/WF/DEM, mức nhạy cảm, mức demo, trạng thái nguồn và Screen Map tham chiếu. Xem OP_FUNCTION_SCREEN_CODE_DB_CROSSWALK.csv (128 OP + 5 feature draft M11 = 133 dòng). Cột runtime/api/db/permission/test/evidence còn trống hoặc UNVERIFIED, không được tự sinh bằng suy đoán.

| Module | OP nguồn | Nguồn code ứng viên / kiến trúc | Menu theo spec mới | Status tích hợp hiện tại |
|---|---:|---|---|---|
| M00 | 12 | P1 latest + P6v2 | 6: tổ chức, vai trò, người dùng, nhật ký, tích hợp, tham số | PARTIAL CODE, ACCOUNT CONSOLE GAP |
| M01 | 15 | P2 latest + P6v2 + main + DASH | 5: công việc, hồ sơ, kế hoạch, nhắc việc, tra cứu | PARTIAL CODE, CONFLICT |
| M02 | 18 | P6v2 | 6: cán bộ, vị trí việc làm, thi đua, NCC, lao động, QHLĐ | MOST OP UNVERIFIED |
| M03 | 12 | P6v2 | 7: trường, nhóm trẻ, phổ cập, học sinh, đội ngũ, hoạt động, thống kê | MOST OP UNVERIFIED |
| M04 | 21 | P3 + main | 7: thiết chế, danh hiệu, văn nghệ, thể thao, du lịch, thông tin, gia đình | DEMO SLICE PARTIAL |
| M05 | 11 | P3 | 7: nhiệm vụ, sáng kiến, hạ tầng, tổ CNS, CĐS, tập huấn, chỉ tiêu | DEMO SLICE PARTIAL |
| M06 | 12 | P6v2 + main | 10: y tế, dịch bệnh, ATTP, chỉ tiêu, bảo trợ, hỗ trợ, hộ nghèo, an sinh | SENSITIVE, MOST OP UNVERIFIED |
| M07 | 6 | P6v2 + main | 9: dân tộc, người uy tín, chính sách, hoạt động, tín ngưỡng/tôn giáo | SENSITIVE, MOST OP UNVERIFIED |
| M08 | 6 | P3 | 7: kế hoạch, đối tượng, đợt, biên bản, kết quả, kiến nghị, theo dõi | DEMO SLICE PARTIAL |
| M09 | 9 | P4 | 8: mẫu, chỉ tiêu, kỳ, lập, nhập, đối soát, xuất, tra cứu | LOCAL CODE/TEST, HOSTED NOT VERIFIED |
| M10 | 6 | P4 | 4: nhập, xuất, lịch sử, cấu hình nguồn (MVP) | CSV SLICE PARTIAL |
| M11 | 0 nguồn độc lập; 5 spec draft | SPEC ONLY | 5: nhóm, giá trị, phân cấp, tra cứu/xuất, lịch sử | SPEC ONLY / NOT VERIFIED |

**Lưu ý:** Số menu và số OP không cần 1:1. Nhiều nghiệp vụ có thể dùng chung controller/form nhưng phải có điểm vào, bộ lọc, actor, input/output và permission riêng.

## 2. Traceability model — bắt buộc cho mỗi OP
| Trường | Quy tắc |
|---|---|
| record_id | OP-Mxx-nnn hoặc M11-Fxx; không đổi mã nguồn |
| source_status | Giữ chính xác DISCOVERED/SPECIFYING của Function Map |
| requirement_and_flow | BL, REQ, WF, DEM-ADD, nguồn pháp lý (sẽ bổ sung) |
| screen_reference | SCR-* nguồn, có thể ánh xạ nhiều route; không tự ghi route từ mã SCR |
| candidate_code_branch | Nhánh tìm code, chỉ là ứng viên |
| runtime_route | URL thực đã xác nhận tồn tại và kiểm quyền |
| api_or_rpc | Tên action/query/RPC thực + link file/commit |
| db_entity | Schema.table, FK, RLS, data owner thật |
| permission | Quyền create/read/update/delete/submit/approve/export + object scope |
| message_code | Mã chung của message registry; không phát minh mã không tồn tại |
| test_id | Unit, contract, RLS, E2E, visual, performance |
| evidence_url | CI/trace/screenshot/DB readback từ SHA cụ thể |
| merge_decision | KEEP/BACKPORT/REWRITE/DEFER/SUPERSEDE |
| runtime_verified | UNVERIFIED/STATIC_CHECKED/INTEGRATED_TESTED/OWNER_ACCEPTED |
| reviewer | Người duyệt duy nhất hoặc người được ủy quyền kiểm thử |

## 3. Phân rã chức năng theo đợt và cam kết MVP
| Slice | Chức năng phải dùng được | Kiểm thử bắt buộc | Có thể trì hoãn |
|---|---|---|---|
| MVP-A: nền | login/logout, context quyền, menu, M00 tài khoản read/role safe | Auth/RLS negative, menu empty, route deny | Quản lý tổ chức phức tạp, nhiều nguồn tích hợp |
| MVP-B: M01 | Tạo, tìm, giao, xem, sửa, chuyển trạng thái công việc, danh sách có phân trang, timeline, file nếu đã an toàn | WORK-01..07, OCC, idempotency, direct-API deny | Tất cả biến thể hồ sơ, kế hoạch phong phú |
| MVP-C: dashboard | KPI theo role, queue, trend, filter & drill-down | 101+ rows, 5k events, scope P1/P2/P4, UI mobile | Chart chuyên ngành chưa có nguồn |
| MVP-D: M09 | kỳ, snapshot, draft→review→finalize nếu authority, PDF/XLSX download | RPT-01..05, lineage, file/access check | DOCX chính thức chưa có template |
| MVP-E: M10 | import CSV preview, row errors, commit, receipt, export MVP | INT-01..03, partial/invalid, authorization | API adapter/scheduler nâng cao |
| MVP-F: M04 showcase | 1 luồng văn hóa có nhãn minh họa, hồ sơ, trả lại/kiểm tra khi legal unresolved | CULT-01, no invented recognition | Các OP M04 còn lại |
| After-preview | M02/M03/M05/M06/M07/M08/M11 | Per OP pháp lý + data classification + end-to-end | Có thể thư thả theo roadmap |

Không tạo menu bấm được cho slice chưa có backend thực; có thể dùng landing read-only đánh dấu "Đang hoàn thiện". Không hiển thị kết quả demo thành quyết định hành chính hợp pháp.

## 4. Detailed capability gate — mỗi nhóm thao tác
| CAP | Nội dung cần đối chiếu | Mặc định nếu chưa làm |
|---|---|---|
| CAP-01 | Create: form, actor, field, unique, audit, idempotency | DRAFT |
| CAP-02 | Read: list/detail, scoped paging, search, sort, permission | DRAFT |
| CAP-03 | Update: editable fields, optimistic version, conflict | DRAFT |
| CAP-04 | Delete/archive: reference constraint, confirm, history | DRAFT |
| CAP-05 | Workflow: transitions, guards, delegation, reason, status | DRAFT |
| CAP-06 | Notification: event source, recipient, message code, persistence | DRAFT |
| CAP-07 | Report/export: template, source/period, authorization, versions | DRAFT |
| CAP-08 | Import: file constraints, row-level errors, receipt | DRAFT |
| CAP-09 | Audit: source actor, immutable event, sensitive masking | DRAFT |
| CAP-10 | UI: role-specific route/menu + loading/empty/error/mobile | DRAFT |
| CAP-11 | DB: schema, FK/RLS/Storage, seed/migration | DRAFT |
| CAP-12 | Test: happy/invalid/forbidden/concurrency/retry/readback | DRAFT |

Mỗi OP chỉ yêu cầu CAP áp dụng; với chức năng chỉ tra cứu không ép Create/Delete. Báo cáo phải giữ snapshot khi chốt, audit không có CRUD xóa.

## 5. Năm xung đột chức năng cần đóng sớm
1. **M00/M11 catalogs:** OP-M00-006 hiện mô tả danh mục dùng chung, còn M11 mới tách riêng. Quyết định ownership: M11 là owner logic danh mục; M00 quản trị quyền, không làm hai nơi CRUD. Cần ADR và migration/route mapping, không tự sửa OP gốc.
2. **M01 master data:** Function Map M01 bao gồm cá nhân/hộ/tổ chức/cơ sở; spec M01 mới bỏ nội dung này. Chưa được phép loại khỏi scope; phải lập entity ownership với domain.
3. **M09 vs M10 import/export:** M09 sở hữu báo cáo xuất chính thức, M10 sở hữu pipeline nhập/xuất dữ liệu; shared job/service, tránh duplicate.
4. **M00 notifications vs shared UI:** OP-M00-010 là chính sách nhắc hạn, shared Toast chỉ là presentation. Cần phân biệt persistent inbox, recipient policy, transport.
5. **M06/M07 privacy:** quyền quản trị nền không tự cấp quyền xem thông tin y tế, đối tượng trợ cấp, tôn giáo. RLS + mask + export test là hard gate.

## 6. Workflow for filling 133 rows
1. Freeze Function Map SHA, map mỗi OP qua menuId/screenId/route.
2. Scan code branch theo owner + test + SQL; link source at commit SHA, ghi trạng thái có chứng cứ.
3. Vẽ phụ thuộc OP → module/cross-cutting service, loại duplicate chức năng.
4. Xác định feature nào đang demo/no-code, xếp DEFER rõ; không biến DRAFT thành DONE để đạt KPI.
5. Đối chiếu 128 OP với 76 REQ + 8 DEM-ADD và các biến thể OP còn gộp (đặc biệt M02/M03).
6. Sign off từng slice MVP; chỉ sau đó bật menu/route và đẩy vào staging.

## 7. Quality metric không làm đẹp số
- Source inventory coverage: **128/128** mã OP nguồn đã vào CSV, cộng **5 M11 draft** (khác namespace).
- Code verified coverage: **chưa đo**; không suy ra từ số lượng page, route, test hoặc tài liệu.
- End-to-end verified coverage: **chưa đo** trên branch tích hợp.
- Traceability completion = số OP áp dụng có đầy đủ route+API+DB+permission+test evidence / số OP thuộc slice được duyệt. Không tính DEFER vào numerator nhưng báo riêng.
- Release gate: 0 P0 missing trong MVP; 0 unauthorized action; 0 false success; UI/Perf acceptance, owner approval.

## 8. Output and approval
CSV là master tracking sheet; tài liệu này là policy/cấu trúc. Khi integration branch hình thành, bổ sung cột commitSHA thực, test URL, acceptance date. Reviewer không chấp nhận "verified" nếu chỉ có screenshot hoặc static test.
