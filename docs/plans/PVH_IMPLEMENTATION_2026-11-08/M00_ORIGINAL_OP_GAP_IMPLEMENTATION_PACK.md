# M00 — GÓI TRIỂN KHAI 12 OP GỐC TRÊN NHÁNH PHASE 1
**Branch:** `feat/pvh-ph01-platform-auth` · **Nguồn:** `main/docs/business/FUNCTION_MAP_PVH_v0.1.md` blob `5a904d4f810c66cb5460b2beb6c42b025094481b` · **Trạng thái:** SPECIFIED / CODE GAP NOT VERIFIED.

## 1. Ma trận nhiệm vụ OP cụ thể
| OP | Nghiệp vụ bắt buộc | Nhóm trường/quan hệ cần chốt | Business rule/negative case | Màn hình |
|---|---|---|---|---|
| OP-M00-001 | Cơ cấu tổ chức theo thời gian | org_unit, parent_id, effective_from/to, tenant_id | tra cứu cấu trúc tại thời điểm, chống vòng lặp, lịch sử chuyển địa bàn | SCR-QT-01 |
| OP-M00-002 | Phân công theo lĩnh vực/địa bàn/nhóm hồ sơ | membership, assignment_scope, unassigned_work_queue | đổi người nhận không làm mất việc, thu hồi hiệu lực ngay | SCR-QT-02 |
| OP-M00-003 | Ủy quyền có căn cứ, phạm vi và thời hạn | delegation_id, grantor, grantee, scope, authority_ref, valid_from/to, revoked_at | hết hạn tự từ chối API, không cho ủy quyền vượt quyền, audit | SCR-QT-02 |
| OP-M00-004 | Loại nghiệp vụ và cấu hình hồ sơ | operation_type, owner_unit, checklist_version, state_machine_version, effective_at | khóa version trên hồ sơ đã mở, không cập nhật hồi tố | SCR-QT-03 |
| OP-M00-005 | Vòng đời gói quy tắc | rule_pack, version, state, reviewer, published_at, retired_at | draft→review→published→retired, không chỉnh version đã phát hành | SCR-QT-03 |
| OP-M00-006 | Danh mục dùng chung | catalog, catalog_value, parent, effective dates | chốt ADR chuyển owner M11, giữ tham chiếu cũ | SCR-QT-04 |
| OP-M00-007 | Mẫu/checklist có phiên bản | form_template, field_schema, version, effective_at | hồ sơ cũ giữ mẫu gốc, kiểm validate theo version | SCR-QT-03 |
| OP-M00-008 | Nhật ký thao tác nhạy cảm | audit_event, actor, action, target, tenant, at, result | append-only, ghi xem/export nhạy cảm, che dữ liệu không cần thiết | SCR-QT-05 |
| OP-M00-009 | Khởi tạo xã từ mẫu | tenant_template, module_flags, seed_version, tenant_config | không cross-tenant, tắt module vẫn xem lịch sử | SCR-QT-06 |
| OP-M00-010 | Chính sách thông báo | event_type, recipient_rule, channel, dedupe_key, read_at | tránh gửi trùng, quyền xem deep-link, không lộ payload | SCR-QT-07 |
| OP-M00-011 | Đăng nhập/đa phiên | session, membership, tenant_selection, role_selection, expiry | không fallback demo trong production, recheck hiệu lực | SCR-QT-02 |
| OP-M00-012 | Seed/reset demo theo xã | seed_job, scope, dry_run, reset_receipt, actor | chỉ dev/demo, bảo toàn audit, không reset production | SCR-QT-06 |

## 2. Thiết kế data contract và subfeatures
### M00-S01 — OP-M00-001: Cơ cấu tổ chức theo thời gian
- **Entities/fields ứng viên:** org_unit, parent_id, effective_from/to, tenant_id. Mỗi field phải xác nhận type, nullable, default, unique scope, FK, role, sensitivity, label_vi, nguồn, thời gian hiệu lực và retention.
- **Rules:** tra cứu cấu trúc tại thời điểm, chống vòng lặp, lịch sử chuyển địa bàn.
- **UI:** SCR-QT-01; danh sách/chi tiết/form/bộ lọc theo tính chất; không ép CRUD cho audit/SSO/reset.
- **API/DB:** rà soát RPC hiện có trước khi tạo bảng hoặc endpoint; mọi mutation có audit cùng transaction; RLS theo tenant và quyền.
- **Tests:** positive, forbidden, expired, cross-tenant, duplicate, concurrency, rollback; ghi test ID `M00-001-Txx` và commit SHA.
- **Status:** NOT_VERIFIED — cần đối chiếu code thực và DB.

### M00-S02 — OP-M00-002: Phân công theo lĩnh vực/địa bàn/nhóm hồ sơ
- **Entities/fields ứng viên:** membership, assignment_scope, unassigned_work_queue. Mỗi field phải xác nhận type, nullable, default, unique scope, FK, role, sensitivity, label_vi, nguồn, thời gian hiệu lực và retention.
- **Rules:** đổi người nhận không làm mất việc, thu hồi hiệu lực ngay.
- **UI:** SCR-QT-02; danh sách/chi tiết/form/bộ lọc theo tính chất; không ép CRUD cho audit/SSO/reset.
- **API/DB:** rà soát RPC hiện có trước khi tạo bảng hoặc endpoint; mọi mutation có audit cùng transaction; RLS theo tenant và quyền.
- **Tests:** positive, forbidden, expired, cross-tenant, duplicate, concurrency, rollback; ghi test ID `M00-002-Txx` và commit SHA.
- **Status:** NOT_VERIFIED — cần đối chiếu code thực và DB.

### M00-S03 — OP-M00-003: Ủy quyền có căn cứ, phạm vi và thời hạn
- **Entities/fields ứng viên:** delegation_id, grantor, grantee, scope, authority_ref, valid_from/to, revoked_at. Mỗi field phải xác nhận type, nullable, default, unique scope, FK, role, sensitivity, label_vi, nguồn, thời gian hiệu lực và retention.
- **Rules:** hết hạn tự từ chối API, không cho ủy quyền vượt quyền, audit.
- **UI:** SCR-QT-02; danh sách/chi tiết/form/bộ lọc theo tính chất; không ép CRUD cho audit/SSO/reset.
- **API/DB:** rà soát RPC hiện có trước khi tạo bảng hoặc endpoint; mọi mutation có audit cùng transaction; RLS theo tenant và quyền.
- **Tests:** positive, forbidden, expired, cross-tenant, duplicate, concurrency, rollback; ghi test ID `M00-003-Txx` và commit SHA.
- **Status:** NOT_VERIFIED — cần đối chiếu code thực và DB.

### M00-S04 — OP-M00-004: Loại nghiệp vụ và cấu hình hồ sơ
- **Entities/fields ứng viên:** operation_type, owner_unit, checklist_version, state_machine_version, effective_at. Mỗi field phải xác nhận type, nullable, default, unique scope, FK, role, sensitivity, label_vi, nguồn, thời gian hiệu lực và retention.
- **Rules:** khóa version trên hồ sơ đã mở, không cập nhật hồi tố.
- **UI:** SCR-QT-03; danh sách/chi tiết/form/bộ lọc theo tính chất; không ép CRUD cho audit/SSO/reset.
- **API/DB:** rà soát RPC hiện có trước khi tạo bảng hoặc endpoint; mọi mutation có audit cùng transaction; RLS theo tenant và quyền.
- **Tests:** positive, forbidden, expired, cross-tenant, duplicate, concurrency, rollback; ghi test ID `M00-004-Txx` và commit SHA.
- **Status:** NOT_VERIFIED — cần đối chiếu code thực và DB.

### M00-S05 — OP-M00-005: Vòng đời gói quy tắc
- **Entities/fields ứng viên:** rule_pack, version, state, reviewer, published_at, retired_at. Mỗi field phải xác nhận type, nullable, default, unique scope, FK, role, sensitivity, label_vi, nguồn, thời gian hiệu lực và retention.
- **Rules:** draft→review→published→retired, không chỉnh version đã phát hành.
- **UI:** SCR-QT-03; danh sách/chi tiết/form/bộ lọc theo tính chất; không ép CRUD cho audit/SSO/reset.
- **API/DB:** rà soát RPC hiện có trước khi tạo bảng hoặc endpoint; mọi mutation có audit cùng transaction; RLS theo tenant và quyền.
- **Tests:** positive, forbidden, expired, cross-tenant, duplicate, concurrency, rollback; ghi test ID `M00-005-Txx` và commit SHA.
- **Status:** NOT_VERIFIED — cần đối chiếu code thực và DB.

### M00-S06 — OP-M00-006: Danh mục dùng chung
- **Entities/fields ứng viên:** catalog, catalog_value, parent, effective dates. Mỗi field phải xác nhận type, nullable, default, unique scope, FK, role, sensitivity, label_vi, nguồn, thời gian hiệu lực và retention.
- **Rules:** chốt ADR chuyển owner M11, giữ tham chiếu cũ.
- **UI:** SCR-QT-04; danh sách/chi tiết/form/bộ lọc theo tính chất; không ép CRUD cho audit/SSO/reset.
- **API/DB:** rà soát RPC hiện có trước khi tạo bảng hoặc endpoint; mọi mutation có audit cùng transaction; RLS theo tenant và quyền.
- **Tests:** positive, forbidden, expired, cross-tenant, duplicate, concurrency, rollback; ghi test ID `M00-006-Txx` và commit SHA.
- **Status:** NOT_VERIFIED — cần đối chiếu code thực và DB.

### M00-S07 — OP-M00-007: Mẫu/checklist có phiên bản
- **Entities/fields ứng viên:** form_template, field_schema, version, effective_at. Mỗi field phải xác nhận type, nullable, default, unique scope, FK, role, sensitivity, label_vi, nguồn, thời gian hiệu lực và retention.
- **Rules:** hồ sơ cũ giữ mẫu gốc, kiểm validate theo version.
- **UI:** SCR-QT-03; danh sách/chi tiết/form/bộ lọc theo tính chất; không ép CRUD cho audit/SSO/reset.
- **API/DB:** rà soát RPC hiện có trước khi tạo bảng hoặc endpoint; mọi mutation có audit cùng transaction; RLS theo tenant và quyền.
- **Tests:** positive, forbidden, expired, cross-tenant, duplicate, concurrency, rollback; ghi test ID `M00-007-Txx` và commit SHA.
- **Status:** NOT_VERIFIED — cần đối chiếu code thực và DB.

### M00-S08 — OP-M00-008: Nhật ký thao tác nhạy cảm
- **Entities/fields ứng viên:** audit_event, actor, action, target, tenant, at, result. Mỗi field phải xác nhận type, nullable, default, unique scope, FK, role, sensitivity, label_vi, nguồn, thời gian hiệu lực và retention.
- **Rules:** append-only, ghi xem/export nhạy cảm, che dữ liệu không cần thiết.
- **UI:** SCR-QT-05; danh sách/chi tiết/form/bộ lọc theo tính chất; không ép CRUD cho audit/SSO/reset.
- **API/DB:** rà soát RPC hiện có trước khi tạo bảng hoặc endpoint; mọi mutation có audit cùng transaction; RLS theo tenant và quyền.
- **Tests:** positive, forbidden, expired, cross-tenant, duplicate, concurrency, rollback; ghi test ID `M00-008-Txx` và commit SHA.
- **Status:** NOT_VERIFIED — cần đối chiếu code thực và DB.

### M00-S09 — OP-M00-009: Khởi tạo xã từ mẫu
- **Entities/fields ứng viên:** tenant_template, module_flags, seed_version, tenant_config. Mỗi field phải xác nhận type, nullable, default, unique scope, FK, role, sensitivity, label_vi, nguồn, thời gian hiệu lực và retention.
- **Rules:** không cross-tenant, tắt module vẫn xem lịch sử.
- **UI:** SCR-QT-06; danh sách/chi tiết/form/bộ lọc theo tính chất; không ép CRUD cho audit/SSO/reset.
- **API/DB:** rà soát RPC hiện có trước khi tạo bảng hoặc endpoint; mọi mutation có audit cùng transaction; RLS theo tenant và quyền.
- **Tests:** positive, forbidden, expired, cross-tenant, duplicate, concurrency, rollback; ghi test ID `M00-009-Txx` và commit SHA.
- **Status:** NOT_VERIFIED — cần đối chiếu code thực và DB.

### M00-S10 — OP-M00-010: Chính sách thông báo
- **Entities/fields ứng viên:** event_type, recipient_rule, channel, dedupe_key, read_at. Mỗi field phải xác nhận type, nullable, default, unique scope, FK, role, sensitivity, label_vi, nguồn, thời gian hiệu lực và retention.
- **Rules:** tránh gửi trùng, quyền xem deep-link, không lộ payload.
- **UI:** SCR-QT-07; danh sách/chi tiết/form/bộ lọc theo tính chất; không ép CRUD cho audit/SSO/reset.
- **API/DB:** rà soát RPC hiện có trước khi tạo bảng hoặc endpoint; mọi mutation có audit cùng transaction; RLS theo tenant và quyền.
- **Tests:** positive, forbidden, expired, cross-tenant, duplicate, concurrency, rollback; ghi test ID `M00-010-Txx` và commit SHA.
- **Status:** NOT_VERIFIED — cần đối chiếu code thực và DB.

### M00-S11 — OP-M00-011: Đăng nhập/đa phiên
- **Entities/fields ứng viên:** session, membership, tenant_selection, role_selection, expiry. Mỗi field phải xác nhận type, nullable, default, unique scope, FK, role, sensitivity, label_vi, nguồn, thời gian hiệu lực và retention.
- **Rules:** không fallback demo trong production, recheck hiệu lực.
- **UI:** SCR-QT-02; danh sách/chi tiết/form/bộ lọc theo tính chất; không ép CRUD cho audit/SSO/reset.
- **API/DB:** rà soát RPC hiện có trước khi tạo bảng hoặc endpoint; mọi mutation có audit cùng transaction; RLS theo tenant và quyền.
- **Tests:** positive, forbidden, expired, cross-tenant, duplicate, concurrency, rollback; ghi test ID `M00-011-Txx` và commit SHA.
- **Status:** NOT_VERIFIED — cần đối chiếu code thực và DB.

### M00-S12 — OP-M00-012: Seed/reset demo theo xã
- **Entities/fields ứng viên:** seed_job, scope, dry_run, reset_receipt, actor. Mỗi field phải xác nhận type, nullable, default, unique scope, FK, role, sensitivity, label_vi, nguồn, thời gian hiệu lực và retention.
- **Rules:** chỉ dev/demo, bảo toàn audit, không reset production.
- **UI:** SCR-QT-06; danh sách/chi tiết/form/bộ lọc theo tính chất; không ép CRUD cho audit/SSO/reset.
- **API/DB:** rà soát RPC hiện có trước khi tạo bảng hoặc endpoint; mọi mutation có audit cùng transaction; RLS theo tenant và quyền.
- **Tests:** positive, forbidden, expired, cross-tenant, duplicate, concurrency, rollback; ghi test ID `M00-012-Txx` và commit SHA.
- **Status:** NOT_VERIFIED — cần đối chiếu code thực và DB.


## 3. Dependency và giới hạn phạm vi
- M00-F02 quản lý role không tự bao hàm OP-M00-003 ủy quyền có thời hạn; tạo subfeature riêng.
- M00-F06 tham số không thay thế OP-M00-004/005/007 rule pack/versioned form; chốt ownership với M01.
- M11 chỉ nhận OP-M00-006 sau ADR được duyệt; tránh hai danh mục cùng chỉnh sửa.
- OP-M00-010 policy ở M00; inbox UI ở nhánh profile/notifications, không duplicate.
- OP-M00-009/012 gắn PH05 clone; production reset phải deny.

## 4. Thứ tự code trong nhánh Phase 1
1. **P0:** đối chiếu source code, SQL migrations, RPC, RLS, tests và lập `M00_CODE_DB_DIFF.csv` theo từng OP.
2. **P0:** chốt ADR M00/M11, M00/M01 workflow, thông báo; schema additive + migration rollback.
3. **P0:** bổ sung ủy quyền hiệu lực, scope checks, revocation, audit và test adversarial.
4. **P0:** bổ sung versioned operation types, rule packs và checklist; không rewrite hồ sơ cũ.
5. **P1:** bổ sung tenant provisioning, notification policy và demo reset safeguards theo dependency PH05.
6. **P0:** chạy CI, pgTAP, Auth/Storage staging E2E, permission negative; PR Draft, chủ dự án duyệt.

## 5. Exit gate
- [ ] 12/12 OP nguồn có feature/subfeature/route/field/rule/API/DB/test evidence hoặc quyết định hoãn được duyệt.
- [ ] Không có fallback quyền, admin mặc định, fake write success, leakage cross-tenant.
- [ ] RLS và hiệu lực ủy quyền kiểm thử trên staging; audit ghi nhận cả hành vi nhạy cảm.
- [ ] Không còn blocker G1 từ receipt PH01; không merge main trước owner approval.

**Lưu ý:** File này là đặc tả triển khai đã đặt trực tiếp trên nhánh PH01, chưa khẳng định đã sửa code hoặc chạy test.
