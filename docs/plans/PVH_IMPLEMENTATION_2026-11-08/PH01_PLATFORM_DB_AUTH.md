# PH01 — Database reproducible, Auth và M00 Platform

**Gate:** G1 `PLATFORM` · **Phụ thuộc:** G0 PASS · **Ưu tiên:** P0 · **Ước lượng:** 6–10 ngày

## Mục tiêu

Làm cho một xã có thể đăng nhập với tài khoản thật, phân công, sử dụng quyền có phạm vi, lưu/đọc dữ liệu qua một schema reproducible. Phân tách demo mode hoàn toàn. Nền này phải đủ chắc để mọi module dùng lại, không xây OAuth tùy biến hoặc database song song.

| ID | Task / thao tác cụ thể | AC và evidence |
|---|---|---|
| P01-01 | Chốt canonical migration từ cloud đang áp; giữ lại dữ liệu/config hiện hữu, phân biệt old/superseded/new. Không sửa migration cloud đã chạy | Reset DB test sạch reproduces toàn bộ schema, `migration list` khớp expected, có preflight/rollback và diff zero ngoài ý định |
| P01-02 | Hợp nhất contract `tenant_id`, org_unit, profile, memberships, membership_roles, roles/permissions, module_entitlements; quyết định singleton DB MVP | Column/type/constraint/FK match types trong app; script seed 1 xã không tạo xã thứ 2; FK sai tenant bị DB từ chối |
| P01-03 | Chuẩn hóa namespace permission M00/M01/M04/M05/M08/M09 theo `module:resource:action`; quyền quản trị hệ thống không tự cấp quyền PII | `PERMISSION_MATRIX.md`, seed phân quyền có version; DB/action/UI cùng nhận một mã, không tồn tại alias ngầm |
| P01-04 | Supabase Auth: login/logout/session-refresh, getUser server, mapping membership có ngày hiệu lực và trạng thái active; không đọc role từ client/user_metadata | Browser test: login đúng, sai, expired, no membership, revoked, multi-tab logout; không có quyền từ persona cookie |
| P01-05 | Bắt buộc RequestContext lấy từ DB/account context an toàn, xác định đúng actor, org/scope/module; `React.cache()` chỉ cache trong request | API/Action không tin `tenant_id`, `role`, `actor_id` do client gửi; update quyền và dùng lại JWT cũ vẫn chặn thao tác nhạy cảm |
| P01-06 | Khóa `NEXT_PUBLIC_DEMO_MODE`: demo session chỉ test/dev cho phép; production/staging thật fail-fast nếu bật nhầm; xóa fallback persona P1 và bypass | Chạy production build với flag nguy hiểm → startup/deploy gate FAIL; anonymous không thể gọi demo login để lấy quyền |
| P01-07 | RPC contract: quyết định schema expose + `.schema('app').rpc()` hay public facade hẹp; kiểm tra USAGE/EXECUTE, `SECURITY DEFINER` search_path và actor | 401/403 từ DB đúng; RPC đúng schema thực thi được với auth thật; không expose toàn bộ privileged routine |
| P01-08 | RLS toàn bộ bảng exposed, `USING`/`WITH CHECK`, query phạm vi hồ sơ/org, module entitlement, ủy quyền hết hạn, deny-by-default | pgTAP/SQL thử owner, officer, unauthorized, revoked, cross-scope, after-update; 0 P0/P1 security findings chưa được xử lý |
| P01-09 | Audit append-only: actor thật, action, before/after, entity, timestamp, correlation id, permission context; không swallow error insert | Mutations tạo audit trong cùng transaction; nếu audit bắt buộc lỗi, mutation rollback/FAIL; đọc audit theo quyền, xóa/sửa bị DB chặn |
| P01-10 | Storage private: đối tượng cha, metadata, MIME/size, file version, signed URL <=60s, expired link, PII access/deny | Download file A khi được giao PASS; file B cùng xã nhưng ngoài quyền 403; bucket public denied; không ghi file vào `/public` |
| P01-11 | Quản trị đơn vị/cán bộ: invite/provision tài khoản qua luồng được duyệt, phân công chính/phối hợp, ủy quyền có hiệu lực; không seed mật khẩu mặc định | Admin không mặc nhiên xem PII; thu hồi role sau 1 request; chuyển cán bộ không mất lịch sử và không tự chuyển quyền ký |
| P01-12 | Error envelope chuẩn `Result<T>`/HTTP mapping, idempotency, transaction; loại các fallback RPC→direct update khi lỗi | 400/401/403/404/409/422/500 có envelope đúng; `affected_rows=0` không thể trả `ok:true` |
| P01-13 | Migrations/seed/local reset/staging deploy runbook; pin toolchain; không phụ thuộc state trên máy author | Một môi trường mới chạy đầy đủ từ repo + secret config; seed fake; cloud migration chỉ sau approval |
| P01-14 | CI: lint/typecheck/build + SQL static parse/pgTAP test trên ephemeral DB; kiểm soát version & dependency | CI đỏ nếu RPC contract drift, missing RLS, wrong migration order, leaked service-role; có log/run id |
| P01-15 | Đối soát Security Advisor, password protection, index, storage policy, project settings trước gate | Advisor receipt có tên finding/level/remediation; mọi P0/P1 có quyết định sửa hoặc chấp nhận rủi ro bằng owner |

## Test matrix tối thiểu

| Persona | Hành động | Kỳ vọng |
|---|---|---|
| User không membership | Mở `/ban-lam-viec`, query công việc | FORBIDDEN, không lộ dữ liệu |
| Officer có role hợp lệ | Xem bản ghi được giao/phạm vi | 200 + data đúng; chỉ trường được phép |
| Officer hết phân công | Dùng JWT cũ gọi action | 403; không có event mutation |
| System admin không có quyền PII | Truy vấn hồ sơ nhạy cảm | Bị mask/deny theo policy, không bypass bằng `m00:admin` |
| Anonymous hoặc persona cookie giả | Gọi RPC, Server Action, file API | 401/403, không ghi DB |
| Role khác cùng xã | Truy vấn hồ sơ ngoài assigned scope | 0 row / 403 đúng contract; không suy quyền toàn xã |

## Cổng G1 — PASS khi

- Tài khoản thực đăng nhập, truy vấn RequestContext, nhận đúng membership và chỉ thấy tài nguyên được phân công.
- Một DB trống được dựng reproducibly từ canonical migration, có RLS và quyền thực; không đụng project production.
- Việc tạo bản ghi thử, audit, read-back trong DB đều có evidence; lỗi bị từ chối đúng và không có success giả.
- Demo flag không thể làm bypass production. Không có credentials trong Git, logs, receipt.
- `G1: OWNER_ACCEPTED` được chủ dự án xác nhận; không chốt chỉ vì typecheck/build xanh.

## Đường dẫn tác động chính

`supabase/deployed/*`, `supabase/migrations/*`, `supabase/README.md`, `src/lib/auth/*`, `src/lib/authorization/*`, `src/lib/audit/*`, `src/lib/supabase/*`, `src/config/navigation.ts`, `src/app/(auth)/login/*`, `src/app/(app)/layout.tsx`, `src/lib/storage/*`, `.github/workflows/ci.yml`.

**Rollback:** Migration được thiết kế forward-safe; có bản backup staging và script khôi phục/đối soát. Không xóa schema cũ hoặc dữ liệu thử còn thuộc task khác khi chưa map đủ. Quyền sai phải khôi phục grants/policies có evidence, không tắt RLS để khắc phục triệu chứng.
