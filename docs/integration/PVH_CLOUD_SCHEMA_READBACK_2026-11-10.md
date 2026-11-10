# PVH — Cloud schema readback / release blockers (10/11/2026)

> **READ-ONLY audit. NO-GO for production migration, merge, or pilot.**
> Source: Supabase project `Demo-pvh` (region `ap-southeast-1`) queried via connected project tools on 10/11/2026; GitHub integration HEAD before the new DB-test commits was `c6a7ce5f`.
> Do not put service keys, real personal data, or SQL credentials into this repository.

## Cloud baseline observed

- Project status: `ACTIVE_HEALTHY`. This is infrastructure health, **not** application acceptance.
- Applied migration history (2): `20261108054202` (`pvh_single_commune_account_foundation`), `20261108054701` (`pvh_single_commune_scope_context`).
- Public schema (14 tables): `tenants`, `org_units`, `profiles`, `roles`, `permissions`, `role_permissions`, `memberships`, `membership_roles`, `module_entitlements`, `work_items`, `work_item_events`, `audit_log`, `evidence_files`, `system_jobs`.
- All 14 returned public tables have RLS enabled in the readback. **RLS enabled alone is not proof of correct policies.**
- Existing data includes one tenant, one org unit and zero users with memberships. No live workflow acceptance is possible from this readback.
- Security advisor returned **Leaked Password Protection Disabled** (`WARN`). Review [Supabase password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) before production.
- Nothing was created, migrated, written, or changed in `Demo-pvh` by this audit.

## Code đã tiến triển so với ảnh chụp cloud ban đầu

1. Trên nhánh tích hợp hiện có **14 migration canonical** (gồm 2 migration cloud baseline). Các migration bổ sung cho M11, M07, M06, M03, M02 nằm trong mã nguồn, **chưa được áp dụng cloud**.
2. [Local DB Replay PASS](https://github.com/dovandatym1-ship-it/pvh-demo/actions/runs/42750990737) cho đủ 14 migration và pgTAP M01/M02/M03/M04/M05/M06/M07/M08/M11, thông báo và quyền recipient. Đây là Postgres/Supabase cục bộ độc lập, không chứng minh cloud đã khớp.
3. M06 nay dùng RPC `app.create_social_beneficiary` và `app.request_social_aid_reconciliation` có kiểm soát, không còn gọi INSERT nhạy cảm + audit rời rạc trong Server Action. Cần chạy E2E với phân quyền và xác nhận pháp lý trước khi coi quy trình hoàn thành.
4. M11 đã có source cho danh mục, giá trị, phân cấp, lịch sử và migration. Năm chức năng M11 **vẫn là phạm vi bổ sung dạng DRAFT**, không suy diễn đã duyệt.
5. Login, dashboard phân hệ, thông báo, phân công đơn vị và lớp khóa server của `(legacy)` có code trên nhánh. Không đồng nghĩa mọi OP/field/rule trong 128 OP đã được nghiệm thu.

## Vì sao chưa được phép triển khai production

- Môi trường `Demo-pvh` đang ghi nhận **2 migration**, còn nguồn tích hợp có **14**. Phải xét checksum, dependency, rollback và kiểm tra trên staging biệt lập trước khi quyết định đồng bộ.
- Cổng source/lint/build và local pgTAP không thay thế E2E có Auth thật, RLS qua HTTP/Storage, điều kiện thẩm quyền và kiểm thử hai xã clone độc lập.
- Trạng thái mã nguồn là `CODE_CHECKED` hoặc `PARTIAL` theo từng OP; chưa có bằng chứng 128/128 OP đủ UI/action/schema/quyền/test.
## Mandatory release decisions

| Gate | Required proof | Status |
|---|---|---|
| G-DB | 14-file local replay PASS; cần staging độc lập, migration/applied history reconciled, negative RLS và rollback rehearsal | LOCAL_PASS / STAGING_BLOCKED |
| G-SEC | Auth real users, RLS positive/negative with at least 3 roles and out-of-scope hamlet, Storage private access, password leak protection decision | NOT VERIFIED |
| G-FLOW | Browser → API → database readback, at-least-once retries, OCC conflict, audit and report export | NOT VERIFIED |
| G-COVERAGE | OP → UI/Action → schema/RPC → permission → test for every in-scope OP (128 source OP, 5 M11 drafts separate) | NOT VERIFIED |
| G-CLONE | Two separate xã instances with different configs, accounts and data isolation, backup/restore | NOT VERIFIED |
| G-OWNER | Owner approves explicit MVP-vs-Full scope, audit evidence, costs and merge | PENDING |

## Security and implementation actions

- **P0**: Never activate M02/M03/M06/M07 write functionality solely because a menu or a React form exists. Mã nguồn đã bổ sung migration/RPC; phải xác nhận đầy đủ field, RLS, idempotency, audit và E2E với vai trò hợp lệ trước khi cho ghi dữ liệu thực.
- **P0**: Đường ghi M06 đã chuyển sang RPC trong source. Còn cần kiểm chứng negative test, thẩm quyền, workflow và độ chính xác dữ liệu đầu-cuối trên staging.
- **P1**: Reconcile permission names for all modules with actual grants and forced RLS, then rerun negative tests from authenticated sessions and from direct PostgREST endpoints.
- **P1**: Restore missing update/archive/restore and history behavior according to each business rule, never universally hard-delete public-service records.
- **P1**: Verify mobile/keyboard UI, full Vietnamese labeling and role-focused dashboard against real scoped counts.
- **P1**: Configure and test independent staging/preview and two-commune deployment without mixing production and demo data.
- **P2**: Revisit any deferred integrations or legal-decision actions only after the authorized domain owner confirms applicable sources and workflow.

## Scope of this receipt

This file is a verifiable baseline, **not** a declaration that any environment or module is complete. Future updates must include tested commit SHA, CI link, SQL readback, role and timestamp. No new staging project/branch or billable cloud asset was created.
