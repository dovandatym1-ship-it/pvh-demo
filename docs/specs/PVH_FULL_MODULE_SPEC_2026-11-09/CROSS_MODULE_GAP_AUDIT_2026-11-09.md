# PVH cross-module gap audit — vòng rà soát bổ sung

Ngày 2026-11-09. Status: REVIEW / gaps OPEN. Scope: đối chiếu README, package.json, REVIEW_FUNCTION_MAP_PVH_v0.1, PH06_DOMAIN_EXPANSION và gói đặc tả M00–M11. Không chạy build, migration, test, không kiểm toàn bộ source code; không kết luận lỗi code khi chưa có bằng chứng.

## A. Findings ưu tiên
| ID | Priority | Finding / evidence | Action | Done evidence |
|---|---|---|---|---|
| GAP-01 | P0 | README M01 sở hữu dữ liệu cá nhân/hộ/tổ chức/cơ sở, nhưng đặc tả mới M01 tập trung công việc/hồ sơ/kế hoạch | Chốt bounded contexts và ownership; tách master records khỏi danh mục M11; lập canonical entity register | Entity ownership matrix + ERD + approved mapping |
| GAP-02 | P0 | README và route map chỉ M00–M10; gói mới có M11 | Chốt M11 module registry/menu/role/route và data ownership, tránh trùng M00 | Registry + navigation/permission tests |
| GAP-03 | P0 | Review Function Map ghi 128 OP và các variant còn gộp; gói mới chưa map OP → feature | Crosswalk OP/REQ/BL/WF/SCREEN/ROUTE ↔ Mxx-Fxx; giữ ID cũ, không đổi mã tùy tiện | RTM 100%, orphan/duplicate report |
| GAP-04 | P0 | README nêu demo dùng mock/localStorage, DB cloud chưa có bảng nghiệp vụ/migration áp dụng | Phân biệt mock/demo/production; xác minh migration, RLS, seed, environment và readback trước claim READY | DB verification + migration receipts |
| GAP-05 | P0 | Chưa có Data Dictionary chuyên ngành hoàn chỉnh trong gói mới | Điền field-level cho từng entity, cardinality, indexes, enum, effective date, retention, validation | Zero TBD for released OP |
| GAP-06 | P0 | Thẩm quyền/biểu mẫu nhiều lĩnh vực đang chờ xác minh; PH06 yêu cầu OP_SPEC và authority | Legal source register: điều khoản, hiệu lực, cấp thẩm quyền, owner xác nhận, case exceptions | Approved rule pack per OP |
| GAP-07 | P0 | M09 xuất báo cáo được chốt nhưng chưa có test ma trận định dạng/biểu mẫu | Spec XLSX/DOCX/PDF/CSV, font, bảng, tên file, template version, snapshot, signed access, audit | Golden files + automated comparison |
| GAP-08 | P0 | Shared notification spec mới chưa liên kết đến OP/action và component code | Message-to-operation mapping, provider registry, UI token, error envelope, tests; không xây duplicate toast | 100% applicable OP mapped and tested |
| GAP-09 | P0 | Tenant/RBAC/ABAC/RLS trong README là quy tắc, chưa được kiểm nghiệm trong audit này | Threat model, RLS tests, impersonation, scope, revoked role, storage signed URL, audit | Cross-tenant negative test evidence |
| GAP-10 | P1 | Screen Map/menu/route chưa được nối đến navigation registry; review nêu menu dead links | Map menuId→screenId→route→operationId→filter, breadcrumb, entitlement | Route smoke tests and user navigation UAT |
| GAP-11 | P1 | Các CRUD template chưa mô tả bulk edit, archive/restore, attachment version, concurrency đủ sâu | Operation variant matrix, cascade policy, optimistic lock, file lifecycle, idempotency | CRUD edge-case test suite |
| GAP-12 | P1 | Chưa có design tokens/interaction specification thống nhất ngoài message | Form controls, tables, search/filter, dialogs, navigation, skeleton, responsive, keyboard, accessibility | Component storybook-equivalent + UX acceptance |
| GAP-13 | P1 | Nguồn báo cáo và chỉ tiêu cần provenance/version; nhiều lĩnh vực trùng khái niệm kỳ báo cáo | Metric dictionary, formula lineage, period lock, correction, missing source policy | Reconciliation tests |
| GAP-14 | P1 | M10 MVP đã chốt nhưng PH06 còn backlog adapter nâng cao | Tách M10-MVP vs deferred; tránh kéo sync/API vào release đầu | Scope baseline + defer register |
| GAP-15 | P1 | Chưa có chuẩn import file chung | Excel/CSV encoding, headers, date parsing, dedupe, dry-run, partial commit, max size, error export | Import test matrix |
| GAP-16 | P1 | Chưa có operational readiness: backup/restore, telemetry, incident, SLO, retention | NFR pack, runbooks, DR exercise, accessibility, performance, security | Ops acceptance receipts |
| GAP-17 | P1 | Chưa có rollout multi-xã đủ chi tiết | Tenant provisioning, config version, migration rollout, module entitlement, branding, seed, rollback | Clone-to-new-commune dry run |
| GAP-18 | P1 | Chưa có test data và UAT xuyên module | Golden journeys: create entity → assign work → review → report → export; denial and recovery | E2E evidence and stakeholder signoff |
| GAP-19 | P2 | Chưa có release governance và kiểm soát thay đổi scope | ADR/change request, spec version, reviewer, approval, traceability, branch protection | Review ledger + release checklist |

## B. Cần tạo tài liệu chuyên đề
1. ENTITY_OWNERSHIP_AND_ERD.md — canonical records, catalogs, tenant ownership, cross-module references.
2. OP_FUNCTION_SCREEN_CROSSWALK.csv — 128 OP và mọi variant, mapping M00–M11.
3. PERMISSION_AND_DATA_CLASSIFICATION.md — persona, action, row/field scope, PII, RLS.
4. BUSINESS_RULE_LEGAL_REGISTER.md — nguồn pháp lý, hiệu lực, authority, exceptions, unresolved.
5. DESIGN_SYSTEM_AND_SCREEN_PATTERNS.md — form/table/navigation/message conventions.
6. REPORT_EXPORT_CONTRACT.md — formats, templates, snapshots, provenance, test fixtures.
7. NFR_AND_OPERATIONAL_READINESS.md — availability, recovery, logging, privacy, backup, deployment.
8. TENANT_PROVISIONING_AND_CLONE_PLAYBOOK.md — config, tenant isolation, migrations, rollback.
9. UAT_E2E_TRACEABILITY.md — scenario coverage, test evidence, owner sign-off.

## C. Exit gate
Không gán % hoàn thành theo số file. VERIFIED chỉ khi có OP↔spec↔code↔test↔reviewer evidence; không có P0 blocker. Các GAP vẫn OPEN cho đến khi có bằng chứng cụ thể. M10 vẫn MVP. Chưa tự động merge main.
