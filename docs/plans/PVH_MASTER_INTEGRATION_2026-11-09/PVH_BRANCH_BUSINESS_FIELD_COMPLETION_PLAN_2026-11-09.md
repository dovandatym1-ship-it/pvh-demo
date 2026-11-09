# PVH — KẾ HOẠCH BỔ SUNG NGHIỆP VỤ VÀ TRƯỜNG DỮ LIỆU THEO TỪNG NHÁNH
**Mã:** PVH-BFCP-2026-11-09 · **Trạng thái:** PLAN / CHƯA TRIỂN KHAI · **Owner duyệt:** chủ dự án (một người)  
**Repo:** `dovandatym1-ship-it/pvh-demo` · **Nhánh lưu plan:** `plan/pvh-master-integration-ux-first-20261109`  
**Nguyên tắc:** Giữ nguyên Phase và nhánh hiện có; chỉ bổ sung có kiểm soát. Không tự merge main, không tự triển khai migration production, không tự xác nhận thẩm quyền pháp lý.

## 0. Kết luận baseline và phạm vi
- Nguồn ưu tiên: `main/docs/business/FUNCTION_MAP_PVH_v0.1.md`, tài liệu nghiệp vụ ban đầu, REVIEW Function Map, Screen Map, REQ/BL/WF/DEM, các quyết định xác nhận; kế đến đặc tả M00–M11 trên nhánh `docs/pvh-full-module-spec-20261109`, code và DB thực.
- Inventory hiện có: **128 OP gốc** M00–M10; **5 feature M11 dự thảo**. Inventory ≠ đã đủ biến thể nghiệp vụ ≠ code hoạt động.
- Bộ spec mới còn `TBD` ở trường chuyên ngành; tất cả field liệt kê trong plan này là **ứng viên để phân tích**, không phải danh mục pháp lý đã chốt.
- Không gộp M11 vào M00 trước khi quyết định ownership. Không bỏ master records cá nhân/hộ/tổ chức/cơ sở của M01 vì spec mới thu hẹp.
- 19 gap đang OPEN; chưa có kết quả audit cloud Supabase, nên mọi phát biểu DB deployed phải kèm bằng chứng.

## 1. Phương pháp và hồ sơ đầu ra bắt buộc cho mỗi module
**Bước 1 — Baseline:** Đóng băng commit SHA tài liệu gốc; trích OP/REQ/BL/WF/SCR/biểu mẫu và tách từng biến thể (trường hợp khác actor, input, state, output, thẩm quyền được coi là biến thể riêng). Ghi missing, duplicate, conflict, out-of-scope.
**Bước 2 — Feature decomposition:** `Mxx-Fnn → Mxx-Fnn-Snn → OP-... → Screen → Role → Entity`. Đếm số chức năng/chức năng con bằng danh sách thực, không ước lượng.
**Bước 3 — Field-level:** Mỗi entity/form/list/detail/filter/export có từng field, nhãn tiếng Việt chuẩn, tên DB snake_case, type/length, nullable/required/default, validation, enum/catalog, nguồn, quyền xem/sửa/xuất, PII, FK, unique/index, lịch sử/retention, ví dụ và điều kiện hiển thị.
**Bước 4 — Rules/workflow:** Rule ID, căn cứ/nguồn và hiệu lực, actor, điều kiện trước/sau, trạng thái/chuyển, ngoại lệ, cảnh báo, kiểm trùng, quá hạn, lịch sử và hậu quả sửa/xóa.
**Bước 5 — Reconcile:** So sánh schema SQL/migrations + RLS/Storage/RPC/API + màn hình thực ở branch; ghi `EXISTS/MISSING/CONFLICT/UNVERIFIED`, không tự suy ra DB production.
**Bước 6 — Implement branch:** Bổ sung spec, migrations có rollback, API/RPC, UI tiếng Việt, role-based menu, tests; chỉ mở màn hình khi backend thực và quyền đã kiểm tra.
**Bước 7 — Review:** CI, DB readback staging, RLS negative, UAT role, mobile, báo cáo, reviewer sign-off; PR Draft để chủ dự án duyệt.

**File đầu ra mỗi module** (đặt dưới `docs/specs/modules/Mxx/` trong nhánh tương ứng): `01_SCOPE_OP_CROSSWALK.md`, `02_FEATURE_BREAKDOWN.md`, `03_DATA_DICTIONARY.csv`, `04_BUSINESS_RULES.md`, `05_WORKFLOW_AND_PERMISSIONS.md`, `06_UI_SCREEN_SPEC.md`, `07_DB_SCHEMA_AND_MIGRATION.md`, `08_TEST_CASES_AND_EVIDENCE.md`, `09_GAP_CLOSURE_RECEIPT.md`. Chỉ tạo file sau khi có nội dung thực, không tạo placeholder rồi đánh dấu DONE.

### 1.1 Hợp đồng trường dữ liệu bắt buộc
`module_id, feature_id, subfeature_id, entity, field_db, label_vi, description_vi, type, max_length, required_condition, nullable, default, validation_regex_or_range, enum_catalog, example, source_of_truth, create_role, read_role, edit_role, export_role, privacy_class, masking_rule, fk_reference, unique_scope, index, retention, ui_component, list_visible, filterable, sortable, exportable, rule_ids, op_ids, migration_ref, test_id, verification_status`.

- **Không để** `TBD`, `trường chuyên ngành cần chốt` trong scope được duyệt; nếu chưa đủ căn cứ, ghi `BLOCKED_LEGAL` hoặc `BLOCKED_SOURCE` kèm owner và quyết định cần xin.
- UI chỉ dùng tiếng Việt nhất quán: `Họ và tên`, `Đơn vị quản lý`, `Ngày bắt đầu`, `Trạng thái`, `Lịch sử xử lý`; giữ English trong code/DB/API, không đưa `tenant`, `status`, `owner`, `workflow`, `UUID` lên nhãn người dùng.
- Cấm thu thập thêm thông tin nhạy cảm chỉ vì ví dụ trong plan; xác nhận mục đích, căn cứ, phạm vi, tối thiểu hóa trước khi bổ sung DB.

## 2. Kế hoạch theo module / nhánh

### M00 — Quản trị hệ thống
- **Nhánh thực hiện:** `feat/pvh-ph01-platform-auth`; **OP gốc:** 12.
- **Phạm vi cần bóc tách:** Cơ cấu tổ chức; vai trò/quyền; người dùng; nhật ký; tích hợp cấu hình; tham số.
- **Trường/entity ứng viên cần phân tích:** org_unit(parent_id,code,name,level,effective_from/to,status); user(full_name,work_email,phone,org_unit,account_status); membership(tenant,user,role,valid_from/to); audit(actor,action,entity,entity_id,at,result,ip_masked); setting(key,value_type,scope,version).
- **Business rules và ngoại lệ trọng tâm:** Chống vòng lặp cây; tài khoản khóa không được đăng nhập; quyền tối thiểu; thay đổi vai trò ghi audit; không cho xóa nhật ký; phân biệt M11 danh mục và cấu hình tích hợp M10.
- **Checklist triển khai:** (1) ánh xạ 100% OP gốc + biến thể → chức năng con; (2) lập form/list/detail/filter/export fields; (3) chốt FK, owner, tenant scope; (4) lập rule/permission matrix; (5) bổ sung code/UI/DB trong nhánh; (6) test create/read/update/archive, forbidden, cross-tenant, lỗi dữ liệu, xuất/nhập nếu có; (7) receipt từng OP với commit/test/DB evidence.
- **Điều kiện đóng:** Không còn trường chuyên ngành TBD trong scope được duyệt; không có OP nguồn mất dấu; tất cả màn hình/endpoint thuộc scope có role và test; mọi nội dung chưa xác nhận được khóa và ghi lý do.

### M01 — Quản lý công việc, hồ sơ và dữ liệu chủ
- **Nhánh thực hiện:** `feat/pvh-ph02-core-workflow`; **OP gốc:** 15.
- **Phạm vi cần bóc tách:** Công việc; hồ sơ; kế hoạch; nhắc việc; tra cứu; khôi phục phạm vi cá nhân/hộ/tổ chức/cơ sở từ baseline.
- **Trường/entity ứng viên cần phân tích:** person(name,identifier_type,identifier_masked,birth_date,contact,source); household(code,head_person,location,valid_from/to); organization(code,name,type,address); facility(code,name,organization_id,location); case(code,type,owner,status,deadline); task(case_id,assignee,priority,due_at,state,version); assignment(task_id,actor,valid_from/to); attachment(storage_key,classification,version).
- **Business rules và ngoại lệ trọng tâm:** ADR ownership master data trước migration; một hồ sơ liên kết nhiều đối tượng có quyền phù hợp; workflow guards/OCC/idempotency; nhắc hạn có nguồn event; không hard-delete hồ sơ có liên kết.
- **Checklist triển khai:** (1) ánh xạ 100% OP gốc + biến thể → chức năng con; (2) lập form/list/detail/filter/export fields; (3) chốt FK, owner, tenant scope; (4) lập rule/permission matrix; (5) bổ sung code/UI/DB trong nhánh; (6) test create/read/update/archive, forbidden, cross-tenant, lỗi dữ liệu, xuất/nhập nếu có; (7) receipt từng OP với commit/test/DB evidence.
- **Điều kiện đóng:** Không còn trường chuyên ngành TBD trong scope được duyệt; không có OP nguồn mất dấu; tất cả màn hình/endpoint thuộc scope có role và test; mọi nội dung chưa xác nhận được khóa và ghi lý do.

### M02 — Nội vụ và Lao động
- **Nhánh thực hiện:** `feat/pvh-ph06-domain-expansion-v2`; **OP gốc:** 18.
- **Phạm vi cần bóc tách:** Cán bộ công chức; vị trí việc làm; thi đua khen thưởng; người có công; lao động việc làm; quan hệ lao động; bóc tách biến thể OP.
- **Trường/entity ứng viên cần phân tích:** staff(person_id,org_unit,position,start/end,status); position(code,title,grade,effective_dates); commendation(subject,form,decision_ref,date,status); beneficiary(person_id,category,eligibility_period,evidence); labor_record(subject,employment_status,period,source); dispute(parties,received_at,type,status,outcome).
- **Business rules và ngoại lệ trọng tâm:** Phân biệt quản lý/theo dõi với thẩm quyền quyết định; hiệu lực hồ sơ và lịch sử; kiểm trùng; tài liệu chứng minh; dữ liệu chính sách hạn chế; cấm tạo quyết định giả.
- **Checklist triển khai:** (1) ánh xạ 100% OP gốc + biến thể → chức năng con; (2) lập form/list/detail/filter/export fields; (3) chốt FK, owner, tenant scope; (4) lập rule/permission matrix; (5) bổ sung code/UI/DB trong nhánh; (6) test create/read/update/archive, forbidden, cross-tenant, lỗi dữ liệu, xuất/nhập nếu có; (7) receipt từng OP với commit/test/DB evidence.
- **Điều kiện đóng:** Không còn trường chuyên ngành TBD trong scope được duyệt; không có OP nguồn mất dấu; tất cả màn hình/endpoint thuộc scope có role và test; mọi nội dung chưa xác nhận được khóa và ghi lý do.

### M03 — Giáo dục và Đào tạo
- **Nhánh thực hiện:** `feat/pvh-ph06-domain-expansion-v2`; **OP gốc:** 12.
- **Phạm vi cần bóc tách:** Cơ sở giáo dục; nhóm trẻ; phổ cập; học sinh; đội ngũ; hoạt động; thống kê; biến thể miễn giảm hỗ trợ.
- **Trường/entity ứng viên cần phân tích:** school(code,name,level,address,managing_unit,status); class_group(school,school_year,grade); learner(person_id,school,school_year,education_status); staff_assignment(person_id,school,role,period); education_support(learner,policy_type,period,document_ref,status); indicator(period,area,metric,source,value).
- **Business rules và ngoại lệ trọng tâm:** Không thu thập dư thông tin trẻ em; quyền theo trường/địa bàn; kỳ năm học; tránh ghi đè dữ liệu nguồn; chính sách miễn giảm phải xác minh căn cứ.
- **Checklist triển khai:** (1) ánh xạ 100% OP gốc + biến thể → chức năng con; (2) lập form/list/detail/filter/export fields; (3) chốt FK, owner, tenant scope; (4) lập rule/permission matrix; (5) bổ sung code/UI/DB trong nhánh; (6) test create/read/update/archive, forbidden, cross-tenant, lỗi dữ liệu, xuất/nhập nếu có; (7) receipt từng OP với commit/test/DB evidence.
- **Điều kiện đóng:** Không còn trường chuyên ngành TBD trong scope được duyệt; không có OP nguồn mất dấu; tất cả màn hình/endpoint thuộc scope có role và test; mọi nội dung chưa xác nhận được khóa và ghi lý do.

### M04 — Văn hóa, Thể thao, Du lịch, Thông tin và Gia đình
- **Nhánh thực hiện:** `feat/pvh-ph03-domain-verticals`; **OP gốc:** 21.
- **Phạm vi cần bóc tách:** Thiết chế văn hóa; danh hiệu; văn nghệ; thể thao; du lịch; thông tin; gia đình; các OP còn thiếu của Phase 6.
- **Trường/entity ứng viên cần phân tích:** cultural_facility(code,name,type,address,operator,capacity,status); recognition(subject,year,criteria_set,decision_ref,status); event(name,type,place,start/end,organizer,participants); sport_activity(type,location,period); tourism_site(name,type,location,status); communication_activity(channel,topic,date); family_case(category,received_at,confidentiality,status).
- **Business rules và ngoại lệ trọng tâm:** Danh hiệu theo kỳ/năm và minh chứng; không suy diễn quyết định công nhận; sự kiện có lịch và người phụ trách; hồ sơ gia đình có phân quyền nhạy cảm.
- **Checklist triển khai:** (1) ánh xạ 100% OP gốc + biến thể → chức năng con; (2) lập form/list/detail/filter/export fields; (3) chốt FK, owner, tenant scope; (4) lập rule/permission matrix; (5) bổ sung code/UI/DB trong nhánh; (6) test create/read/update/archive, forbidden, cross-tenant, lỗi dữ liệu, xuất/nhập nếu có; (7) receipt từng OP với commit/test/DB evidence.
- **Điều kiện đóng:** Không còn trường chuyên ngành TBD trong scope được duyệt; không có OP nguồn mất dấu; tất cả màn hình/endpoint thuộc scope có role và test; mọi nội dung chưa xác nhận được khóa và ghi lý do.

### M05 — Khoa học, Công nghệ và Chuyển đổi số
- **Nhánh thực hiện:** `feat/pvh-ph03-domain-verticals`; **OP gốc:** 11.
- **Phạm vi cần bóc tách:** Nhiệm vụ; sáng kiến; hạ tầng số; tổ công nghệ số; chuyển đổi số; tập huấn; chỉ tiêu.
- **Trường/entity ứng viên cần phân tích:** digital_task(code,title,owner,deadline,status); initiative(name,submitter,stage,evidence); infrastructure(asset_type,location,operator,status); community_team(area,leader,members,period); training(topic,date,attendee_count,proof); metric(period,formula,source,value,version).
- **Business rules và ngoại lệ trọng tâm:** Chỉ tiêu có nguồn và công thức; phân biệt dữ liệu báo cáo với hoạt động thực tế; tránh KPI tự tạo; không công bố số liệu mock như thật.
- **Checklist triển khai:** (1) ánh xạ 100% OP gốc + biến thể → chức năng con; (2) lập form/list/detail/filter/export fields; (3) chốt FK, owner, tenant scope; (4) lập rule/permission matrix; (5) bổ sung code/UI/DB trong nhánh; (6) test create/read/update/archive, forbidden, cross-tenant, lỗi dữ liệu, xuất/nhập nếu có; (7) receipt từng OP với commit/test/DB evidence.
- **Điều kiện đóng:** Không còn trường chuyên ngành TBD trong scope được duyệt; không có OP nguồn mất dấu; tất cả màn hình/endpoint thuộc scope có role và test; mọi nội dung chưa xác nhận được khóa và ghi lý do.

### M06 — Y tế và An sinh xã hội
- **Nhánh thực hiện:** `feat/pvh-ph06-domain-expansion-v2`; **OP gốc:** 12.
- **Phạm vi cần bóc tách:** Cơ sở y tế; y tế cộng đồng; theo dõi dịch; ATTP; chỉ tiêu; đối tượng bảo trợ; hồ sơ chính sách; trợ cấp; hộ nghèo; hoạt động an sinh.
- **Trường/entity ứng viên cần phân tích:** health_facility(code,name,type,address,status); public_health_activity(type,date,area,source); disease_signal(category,period,area,source,status); food_safety_record(facility,inspection_date,result); social_subject(person_id,category,eligibility_from/to,proof); social_case(subject,policy,status); assistance_batch(period,policy,source,approval_ref); poverty_household(household_id,assessment_period,category,source).
- **Business rules và ngoại lệ trọng tâm:** Chỉ giám sát/tổng hợp đúng thẩm quyền; không lưu bệnh án; hạn chế thông tin sức khỏe, hỗ trợ và hộ nghèo; cấm thao tác chi trả giả; RLS theo đối tượng và trường.
- **Checklist triển khai:** (1) ánh xạ 100% OP gốc + biến thể → chức năng con; (2) lập form/list/detail/filter/export fields; (3) chốt FK, owner, tenant scope; (4) lập rule/permission matrix; (5) bổ sung code/UI/DB trong nhánh; (6) test create/read/update/archive, forbidden, cross-tenant, lỗi dữ liệu, xuất/nhập nếu có; (7) receipt từng OP với commit/test/DB evidence.
- **Điều kiện đóng:** Không còn trường chuyên ngành TBD trong scope được duyệt; không có OP nguồn mất dấu; tất cả màn hình/endpoint thuộc scope có role và test; mọi nội dung chưa xác nhận được khóa và ghi lý do.

### M07 — Dân tộc, Tín ngưỡng và Tôn giáo
- **Nhánh thực hiện:** `feat/pvh-ph06-domain-expansion-v2`; **OP gốc:** 6.
- **Phạm vi cần bóc tách:** Đối tượng dân tộc; người uy tín; chính sách; hoạt động; cơ sở tín ngưỡng; tổ chức tôn giáo; bóc tách biến thể OP.
- **Trường/entity ứng viên cần phân tích:** community_record(area,period,aggregate_source); reputable_person(person_id,recognition_ref,valid_from/to); policy_case(subject,policy,period,status); activity(type,organizer,place,date); belief_facility(code,name,location,status); religious_organization(code,name,area,status).
- **Business rules và ngoại lệ trọng tâm:** Dữ liệu tín ngưỡng/tôn giáo nhạy cảm; ưu tiên tổng hợp; hạn chế truy cập trường cá nhân; không biến ghi nhận thành quyết định hành chính.
- **Checklist triển khai:** (1) ánh xạ 100% OP gốc + biến thể → chức năng con; (2) lập form/list/detail/filter/export fields; (3) chốt FK, owner, tenant scope; (4) lập rule/permission matrix; (5) bổ sung code/UI/DB trong nhánh; (6) test create/read/update/archive, forbidden, cross-tenant, lỗi dữ liệu, xuất/nhập nếu có; (7) receipt từng OP với commit/test/DB evidence.
- **Điều kiện đóng:** Không còn trường chuyên ngành TBD trong scope được duyệt; không có OP nguồn mất dấu; tất cả màn hình/endpoint thuộc scope có role và test; mọi nội dung chưa xác nhận được khóa và ghi lý do.

### M08 — Kiểm tra và Giám sát
- **Nhánh thực hiện:** `feat/pvh-ph03-domain-verticals`; **OP gốc:** 6.
- **Phạm vi cần bóc tách:** Kế hoạch; đối tượng; đợt; biên bản; kết quả; kiến nghị; theo dõi khắc phục.
- **Trường/entity ứng viên cần phân tích:** inspection_plan(code,scope,period,owner); inspection_round(plan,scheduled_at,team); inspection_subject(entity_ref,category); minutes(round,document_ref,created_at); finding(round,classification,evidence); recommendation(finding,assignee,due_at,status).
- **Business rules và ngoại lệ trọng tâm:** Kiểm tra theo phạm vi được giao; không tự sinh xử phạt; khóa biên bản khi chốt; lưu phiên bản tài liệu; theo dõi quá hạn.
- **Checklist triển khai:** (1) ánh xạ 100% OP gốc + biến thể → chức năng con; (2) lập form/list/detail/filter/export fields; (3) chốt FK, owner, tenant scope; (4) lập rule/permission matrix; (5) bổ sung code/UI/DB trong nhánh; (6) test create/read/update/archive, forbidden, cross-tenant, lỗi dữ liệu, xuất/nhập nếu có; (7) receipt từng OP với commit/test/DB evidence.
- **Điều kiện đóng:** Không còn trường chuyên ngành TBD trong scope được duyệt; không có OP nguồn mất dấu; tất cả màn hình/endpoint thuộc scope có role và test; mọi nội dung chưa xác nhận được khóa và ghi lý do.

### M09 — Báo cáo và Thống kê
- **Nhánh thực hiện:** `feat/pvh-ph04-reporting-integrations`; **OP gốc:** 9.
- **Phạm vi cần bóc tách:** Mẫu; chỉ tiêu; kỳ; lập; nhập; đối soát; xuất; tra cứu; nguồn số liệu cho dashboard.
- **Trường/entity ứng viên cần phân tích:** report_template(code,version,format,authority_ref); metric(code,unit,formula,source,version); period(type,start/end,lock_status); report_run(template,period,tenant,state,snapshot); report_value(run,metric,value,source_record); export_job(run,format,requested_by,checksum).
- **Business rules và ngoại lệ trọng tâm:** Phê duyệt theo thẩm quyền; snapshot bất biến sau chốt; version mẫu; lineage; golden file PDF/XLSX/DOCX/CSV theo yêu cầu được duyệt; phân quyền tải.
- **Checklist triển khai:** (1) ánh xạ 100% OP gốc + biến thể → chức năng con; (2) lập form/list/detail/filter/export fields; (3) chốt FK, owner, tenant scope; (4) lập rule/permission matrix; (5) bổ sung code/UI/DB trong nhánh; (6) test create/read/update/archive, forbidden, cross-tenant, lỗi dữ liệu, xuất/nhập nếu có; (7) receipt từng OP với commit/test/DB evidence.
- **Điều kiện đóng:** Không còn trường chuyên ngành TBD trong scope được duyệt; không có OP nguồn mất dấu; tất cả màn hình/endpoint thuộc scope có role và test; mọi nội dung chưa xác nhận được khóa và ghi lý do.

### M10 — Tích hợp và Đồng bộ dữ liệu (MVP)
- **Nhánh thực hiện:** `feat/pvh-ph04-reporting-integrations`; **OP gốc:** 6.
- **Phạm vi cần bóc tách:** Nhập CSV/Excel nếu được duyệt; xuất dữ liệu; lịch sử; cấu hình nguồn; mapping; lỗi dòng; adapter nâng cao defer.
- **Trường/entity ứng viên cần phân tích:** integration_source(code,owner,scope,format,active); import_job(source,file_hash,tenant,state,counts); import_row_error(job,row,column,reason); export_job(dataset,filters,format,scope,status); mapping(source_field,target_field,version).
- **Business rules và ngoại lệ trọng tâm:** Dry-run/preview; mã hóa/encoding; chống nhập trùng; lỗi theo dòng; quyền import/export; M09 sở hữu báo cáo chính thức; API sync ngoài MVP chỉ khi duyệt.
- **Checklist triển khai:** (1) ánh xạ 100% OP gốc + biến thể → chức năng con; (2) lập form/list/detail/filter/export fields; (3) chốt FK, owner, tenant scope; (4) lập rule/permission matrix; (5) bổ sung code/UI/DB trong nhánh; (6) test create/read/update/archive, forbidden, cross-tenant, lỗi dữ liệu, xuất/nhập nếu có; (7) receipt từng OP với commit/test/DB evidence.
- **Điều kiện đóng:** Không còn trường chuyên ngành TBD trong scope được duyệt; không có OP nguồn mất dấu; tất cả màn hình/endpoint thuộc scope có role và test; mọi nội dung chưa xác nhận được khóa và ghi lý do.

### M11 — Danh mục dùng chung
- **Nhánh thực hiện:** `feat/pvh-ph01-platform-auth (nhánh bổ sung riêng từ Phase 1 sau ADR)`; **OP gốc:** 0 OP độc lập; 5 chức năng dự thảo.
- **Phạm vi cần bóc tách:** Nhóm danh mục; giá trị; phân cấp; tra cứu/xuất; lịch sử phiên bản; chuyển quyền sở hữu từ M00.
- **Trường/entity ứng viên cần phân tích:** catalog(code,name,scope,owner,version); catalog_value(catalog,code,label_vi,parent_id,sort_order,valid_from/to,status); catalog_mapping(source,external_code,internal_value,version); catalog_change(actor,before,after,at).
- **Business rules và ngoại lệ trọng tâm:** Không trùng CRUD với M00; giá trị đã được tham chiếu chỉ ngừng hiệu lực; nhãn tiếng Việt; phân cấp không vòng lặp; version và effective dates.
- **Checklist triển khai:** (1) ánh xạ 100% OP gốc + biến thể → chức năng con; (2) lập form/list/detail/filter/export fields; (3) chốt FK, owner, tenant scope; (4) lập rule/permission matrix; (5) bổ sung code/UI/DB trong nhánh; (6) test create/read/update/archive, forbidden, cross-tenant, lỗi dữ liệu, xuất/nhập nếu có; (7) receipt từng OP với commit/test/DB evidence.
- **Điều kiện đóng:** Không còn trường chuyên ngành TBD trong scope được duyệt; không có OP nguồn mất dấu; tất cả màn hình/endpoint thuộc scope có role và test; mọi nội dung chưa xác nhận được khóa và ghi lý do.

## 3. Các gói xuyên module và phân nhánh
| Gói | Nhánh chủ trì | Phối hợp | Công việc / đầu ra | Gate |
|---|---|---|---|---|
| X01 Baseline + 128 OP variants | `docs/pvh-full-module-spec-20261109` | Tất cả | RTM OP↔feature↔field↔rule↔screen, orphan/duplicate/conflict register | 128/128 mapped + variants audited |
| X02 Entity ownership/ERD | `feat/pvh-ph01-platform-auth` (ADR), sau đó branch owner | M01/M11/M06/M07 | ADR M00/M11, canonical person/household/org/facility, FK/RLS, migration order | ADR approved; no duplicate owners |
| X03 Vietnamese UI / design | `plan/pvh-master-integration-ux-first-20261109` (contract) + từng feature branch | Dashboard/profile | Dictionary nhãn, thông báo, validation, mobile, accessible forms | 0 nhãn pha Anh-Việt trên luồng UAT |
| X04 Hồ sơ cá nhân / thông báo | `feat/pvh-personal-profile-notifications-20261109` | M00/M01/M09 | Profile field permission, đổi mật khẩu, avatar riêng tư; event→recipient→inbox→read/unread→link→audit; tránh duplicate toast | RLS, deep link, mobile, negative tests |
| X05 Dashboard theo vai trò | `feat/pvh-dashboard` | M01–M09 | KPI dictionary, công thức, nguồn, phạm vi tenant/role, kỳ, drill-down, empty states; fake data chỉ ở demo | No fabricated production metrics |
| X06 Báo cáo & nhập xuất | `feat/pvh-ph04-reporting-integrations` | M02–M10 | Chốt mẫu báo cáo, quyền, format, provenance, snapshot, golden files; import mapping/row errors | Golden file + unauthorized export deny |
| X07 Multi-xã clone/operations | `feat/pvh-ph05-release-clone` | M00–M11 | Provisioning, config, seed, backup/restore, migration rollout, rollback, staging UAT | New-commune dry run |
| X08 Phase 6 remaining OP | `feat/pvh-ph06-domain-expansion-v2` | M02/M03/M04/M05/M06/M07/M08/M09/M10/M00 | 12 backlog packs từ PH06 receipt; mỗi pack có OP_SPEC + field-level + authority + tests | Không còn TODO trong phạm vi release |
| X09 Tích hợp và merge | `plan/pvh-master-integration-ux-first-20261109` (plan only) | tất cả | Dependency DAG, cherry-pick/backport decision, conflict resolution, UAT, CI, rollback, owner approval | Không merge khi gate blocker |

## 4. Thứ tự phụ thuộc và thực thi
1. **P0-A (khóa baseline):** xác nhận nguồn gốc, kiểm kê 128 OP và biến thể, freeze ID; phát hành RTM versioned. **Chặn mọi tuyên bố đủ nghiệp vụ nếu còn orphan.**
2. **P0-B (kiến trúc dữ liệu):** ADR M00/M11, M01 canonical records, M09/M10, notification ownership, M06/M07 privacy; chốt ERD và migrations. **Chặn triển khai DB domain nếu owner chưa rõ.**
3. **P0-C (spec field-level):** M00/M11/M01 trước; M02/M03/M06/M07 tiếp theo; M04/M05/M08 song song; M09/M10 theo hợp đồng dữ liệu nguồn. **Không merge tính năng có field TBD thuộc scope.**
4. **P1-D (code trên từng nhánh):** không phá API/schema hiện có; additive migrations, adapter compatibility, tests; từng PR Draft riêng; nếu nhánh đang phụ thuộc PH05/PH06 thì kiểm tra base commit trước khi cherry-pick.
5. **P1-E (cross-cutting):** profile/notifications, dashboard, báo cáo, chuẩn tiếng Việt, multi-tenant clone, export/security.
6. **P0-F (integration gate):** chạy tests trên nhánh tích hợp riêng sau khi các PR đã duyệt; review conflicts, migration order, staging E2E; chủ dự án quyết định merge main.

## 5. Ma trận kiểm thử/định nghĩa DONE
Mỗi OP/biến thể trong scope được duyệt chỉ là **VERIFIED** nếu:
- [ ] Có nguồn gốc và mapping OP/REQ/BL/WF/SCR → chức năng con, không mất nghiệp vụ.
- [ ] Có đầy đủ field-level dictionary; các trường nhạy cảm có căn cứ, masking, retention.
- [ ] Tên nhãn, nút, lỗi, trạng thái, bộ lọc, báo cáo đều tiếng Việt chuẩn; responsive/mobile và keyboard.
- [ ] Có business rules với ID, actor, source/authority; không tự phê duyệt/chi trả/xử phạt.
- [ ] API/RPC và schema thực có commit SHA; FK/unique/index/RLS/Storage chính xác; migration staging readback.
- [ ] CRUD/workflow/import/export áp dụng có happy/negative/boundary/concurrency/retry tests.
- [ ] RLS cross-tenant, revoke role, direct API bypass, signed URL, audit, field export đều kiểm thử.
- [ ] Thông báo/event và KPI/report lineage được kiểm chứng nếu áp dụng.
- [ ] PR có evidence CI/E2E, review ledger, owner sign-off; không còn P0 blocker.

**Số đo báo cáo:** `inventory_coverage` (128 OP nguồn), `variant_coverage`, `field_spec_coverage`, `rule_coverage`, `implementation_coverage`, `staging_e2e_coverage`, `legal_approval_coverage` báo **riêng**, không dùng một % 100 chung. `NOT_APPLICABLE` phải giải thích; `DEFERRED` không được tính VERIFIED.

## 6. Mẫu issue/task bắt buộc
`[Mxx][OP-ID][Feature-ID][P0/P1] Tiêu đề tiếng Việt`
- Baseline citation + SHA; Current branch/commit; expected vs actual; variants; UI fields; DB fields; business rules; role matrix; API/RPC; migration/backfill/rollback; negative tests; screenshot mobile; owner decision; acceptance evidence.
- Trạng thái: `DISCOVERED → SPECIFIED → REVIEWED → IMPLEMENTED → TESTED → OWNER_ACCEPTED`, hoặc `BLOCKED_SOURCE/BLOCKED_LEGAL/DEFERRED`.
- **Không đánh dấu DONE chỉ vì đã viết tài liệu.**

## 7. Quy tắc nhánh và bảo toàn main
- Không merge thẳng các nhánh cumulative PH01–PH06 theo tên; xác minh ancestry, base/head, diff và phụ thuộc trước khi tích hợp.
- Nếu `feat/pvh-ph06-domain-expansion-v2` đã chứa thay đổi từ các Phase trước, chỉ lấy delta nghiệp vụ cần thiết; tránh ghi đè code chuẩn main.
- Tất cả thay đổi schema có migration có thứ tự, RLS tests và rollback/forward-fix; production cần xác nhận riêng.
- Không sửa `main` hoặc deploy Vercel/Supabase production trong phạm vi plan này.
- Một người duyệt cuối; tài liệu pháp lý/biểu mẫu chưa được xác nhận thì chặn hành vi có hậu quả hành chính.

## 8. Những việc phải xác minh trước khi khóa phạm vi
1. Bản gốc Function Map/REQ/BL/WF/biểu mẫu và SHA chuẩn; danh sách biến thể ẩn trong 128 OP.
2. Thẩm quyền của Phòng Văn hóa – Xã hội cấp xã theo văn bản áp dụng; phân biệt theo dõi, tổng hợp, đề xuất, phê duyệt.
3. Schema Supabase thực, migration đã apply, quyền RLS, Storage, dữ liệu mẫu; không suy từ code.
4. Từng branch: code chạy, tests, routes, màn hình, nhãn tiếng Việt, các field đang có.
5. Chốt danh mục dữ liệu cá nhân tối thiểu, đặc biệt trẻ em, sức khỏe, bảo trợ và tôn giáo.

## 9. Kết quả mong đợi khi hoàn tất plan
**12 module có spec field-level riêng; 128 OP nguồn và toàn bộ biến thể có traceability; 0 field TBD trong phạm vi nghiệm thu; không bỏ sót nghiệp vụ gốc; không trùng ownership; UI tiếng Việt; code và DB được kiểm thử; mỗi nhánh có PR/receipt và chủ dự án tự audit trước merge.** Đây là **mục tiêu nghiệm thu**, không phải trạng thái hiện tại.
