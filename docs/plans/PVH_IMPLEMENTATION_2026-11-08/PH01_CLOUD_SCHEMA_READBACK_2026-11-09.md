# PH01 — KIỂM TRA THỰC TẾ SUPABASE CLOUD (READ-ONLY)
**Ngày:** 09/11/2026 · **Project:** Demo-pvh / `zynzpifmccbcvgddmxic` · **Nhánh:** `feat/pvh-ph01-platform-auth` · **Trạng thái:** BLOCKED / NOT ACCEPTED.

## 1. Kết quả truy vấn thực tế
- `pg_class` với `nspname='app'` và `relkind='r'`: **0 bảng**.
- `information_schema.tables`: **14 bảng nghiệp vụ thuộc public**, gồm `audit_log`, `evidence_files`, `membership_roles`, `memberships`, `module_entitlements`, `org_units`, `permissions`, `profiles`, `role_permissions`, `roles`, `system_jobs`, `tenants`, `work_item_events`, `work_items`.
- `supabase_migrations`: chỉ **20261108054202 pvh_single_commune_account_foundation**, **20261108054701 pvh_single_commune_scope_context**.
- Security Advisor: `auth_leaked_password_protection` WARN (bật theo phê duyệt operator): https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection .
- **Không có cloud mutation.** Chưa thử đăng nhập người thật, invitation, upload/read Storage, RPC thực thi, browser E2E.

## 2. Mâu thuẫn nghiêm trọng cần điều tra
Code PH01 `src/features/m00-platform/server/accounts.ts` gọi `supabase.schema('app').rpc('provision_membership'|'set_membership_role'|'revoke_membership')`, trong khi dữ liệu bảng thực tế nằm trong `public` và chưa có bảng app. Cần kiểm tra schema của RPC, các hàm hiện có, PostgREST exposed schemas và migration chính thức. **Không tự đổi `app` thành `public`**, vì có thể phá hợp đồng migration dự kiến và RLS. Không được coi CI isolated DB là cloud E2E.

## 3. Kế hoạch khắc phục có kiểm soát
1. Read-only introspection `pg_proc` và `pg_namespace`: RPC `provision_membership`, `set_membership_role`, `revoke_membership`, `get_request_context`, workflow functions; ghi schema, signature, security definer/invoker, execute grants.
2. So sánh 2 migration cloud với SQL migration đang active trong branch; phân loại `APPLIED/MISSING/CONFLICT`, kiểm tra bảng public và app, không drop/move bảng đang có.
3. Xác minh `app` có được expose trên Supabase Data API; RLS/GRANT không đồng nghĩa Data API exposure. Theo thay đổi Supabase 2026, không giả định bảng mới tự expose.
4. Dựng môi trường staging/isolated, replay migrations, test RPC thật với tenant/role/auth, expired/revoked, last-admin, cross-tenant, invite partial failure và audit atomic.
5. Nếu quyết định schema `public`, cập nhật code + SQL + tests cùng commit; nếu `app`, cần migration/backfill/compatibility + exposure rõ ràng. Chỉ operator duyệt áp cloud.
6. Browser Auth/Storage E2E với tài khoản test hợp lệ; không dùng fixed password/demo production. Review leaked-password protection và secret management.
7. Chỉ đóng G1 sau khi evidence CI + staging + cloud contract + owner sign-off, không chỉ sau khi commit docs.

## 4. Ma trận hiện trạng
| Gate | Trạng thái | Bằng chứng |
|---|---|---|
| 12 OP M00 có implementation pack | DOCUMENTED | `M00_ORIGINAL_OP_GAP_IMPLEMENTATION_PACK.md` |
| App CI/isolated pgTAP từ receipt trước | REPORTED_PASS (historical) | `PH01_IMPLEMENTATION_RECEIPT.md` |
| Cloud schema contract | BLOCKED | `public` 14 tables, `app` 0 tables |
| Cloud migration PH01 | NOT_APPLIED | 2 versions only |
| Browser Auth/invite/revoke E2E | NOT_VERIFIED | No test executed |
| Storage signed URL / RLS E2E | NOT_VERIFIED | No test executed |
| Owner acceptance G1 | NOT_ACCEPTED | Awaiting gates |

**Kết luận:** Phase 1 chưa hoàn thành. Tuyệt đối không merge main hoặc báo 100% trước khi giải quyết schema contract và test thật.

## 5. Bổ sung kiểm tra pg_proc (09/11/2026)
- Schema `app` **có tồn tại các hàm** `get_account_context()` (SECURITY DEFINER) và `has_permission(uuid,text)` (SECURITY INVOKER), dù không có bảng thuộc `app`.
- **Không tìm thấy** `app.provision_membership`, `app.set_membership_role`, `app.revoke_membership` hoặc hàm trùng tên trong `public` theo truy vấn pg_proc. Vì vậy ba server action M00 hiện có hợp đồng RPC chưa tồn tại trên cloud.
- Đây là sự khác biệt giữa **schema không có bảng** và **schema hoàn toàn không tồn tại**: kết luận trước đó chỉ nói 0 bảng `app`, không được suy ra schema không tồn tại.
- Gate P0: áp dụng và kiểm chứng migration tương thích trên staging trước khi thử gửi lời mời thực; hành động gửi invite hiện có thể tạo Auth user nhưng thất bại khi cấp membership.
