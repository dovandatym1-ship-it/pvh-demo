# PH05 — Security, UAT, deploy Vercel và nhân bản sang xã khác

**Gate:** G5 `RELEASE CANDIDATE` · **Phụ thuộc:** G4 PASS · **Ước lượng:** 8–14 ngày

## 1. Mục tiêu

Chứng minh **cùng một source/artifact** chạy an toàn và tái lập được ở môi trường demo/staging, hai xã độc lập không lẫn dữ liệu/cấu hình; có quy trình release, backup, rollback và UAT. Phase này không tự cho phép đưa dữ liệu người dân hoặc tài khoản cơ quan thật lên cloud.

| ID | Task / thao tác | AC và evidence |
|---|---|---|
| P05-01 | Tách `local/dev/test/staging/production`, project mapping Vercel ↔ Supabase, `.env.example`, secrets provider, flags | Không có `service_role` ở client; demo flag chỉ dev/test; không trộn endpoint local/cloud |
| P05-02 | GitHub CI: typecheck, lint, build, architectural fitness, dependency scan, SQL/pgTAP, integration, browser E2E, artifact reports; phân nhãn loại test | CI FAIL khi có test đỏ; 322 static checks không thay cho browser UAT; run SHA/DB version lưu receipt |
| P05-03 | Chốt Git PR/review policy một owner: protected main, checks bắt buộc, commit SHA chính xác, thay đổi nhỏ per task | Không auto-merge code chưa qua gate; reviewer/agent đưa recommendation, owner ra quyết định duy nhất |
| P05-04 | Vercel preview theo PR, test đúng project/commit/environment, không leak secrets; staging dùng project/data giả | Mỗi PR có preview URL và smoke result; không dùng production DB để kiểm thử phá hoại |
| P05-05 | Chạy full browser E2E từ người dùng tới API/DB, test 2 E2E + mini-flow, error paths, 3+ roles; test file/exports | URL, commit, account fixture, result evidence; không có chức năng chỉ PASS vì JSX tồn tại |
| P05-06 | Security: RLS/ABAC, access control theo hồ sơ, PII masking, IDOR, direct API bypass, CSRF/cookie, rate limit login, session revocation, Storage | 0 critical/high chưa xử lý; quyền bị thu hồi có hiệu lực; real PII không xuất hiện trong logs/browser artifacts |
| P05-07 | Reliability/performance: query indexes, pagination, N+1, cache theo actor/tenant, p95 theo NFR được owner duyệt, error budget và recovery | Load fixture đại diện, profile trước/sau, chứng minh không cross-user cache; không tự đặt SLA cam kết |
| P05-08 | Observability: request/correlation ID, structured logs không PII, DB error, route latency, job queue, audit gap, alert threshold | Thử lỗi kết nối DB/worker/Storage → có error signal; receipt không in secrets |
| P05-09 | Backup/restore DB và Storage; xác định RPO/RTO theo yêu cầu, encrypted backup, retention, dry-run restore | Restore vào môi trường tách biệt, kiểm row/event/file checksum; có biên bản, không coi backup tồn tại là đã kiểm restore |
| P05-10 | Security/legal/data-governance review trước dùng thật: khu vực dữ liệu, access roles, PII purpose/retention, tài liệu vận hành, bản chất demo | `GO_LIVE_LIMITATIONS.md`; bất cứ triển khai chính quyền có dữ liệu thật phải qua authority, hạ tầng và pháp lý riêng |
| P05-11 | UAT với vai trò lãnh đạo PVH, công chức, người rà soát, đầu mối thôn/xóm; lập test script từng nhiệm vụ, screen recording không PII | Signoff theo test ID/expected/actual; bug triage và retest, không dùng phỏng đoán agent thay UAT |
| P05-12 | Cấu hình deployment xã A: tenant/org/roles/permissions/pack/theme xanh lá chè; hoàn thiện seed/reset demo có nút gated | Tài khoản mỗi role được provision đúng; seed/reset không xuất hiện prod; dữ liệu tồn tại sau logout/redeploy |
| P05-13 | Clone xã B từ cùng source artifact: provision Supabase DB riêng + Vercel deployment/config + theme/tenant metadata; không fork repository | Same commit SHA, cùng migration checksum, khác environment config; dữ liệu/file/audit không cross-read; không sửa business code |
| P05-14 | Runbook roll-forward/rollback: backup, DB migration preflight, release immutable build, post-deploy verification, incident steps | Có diễn tập rollback web build và quy trình restore DB tương thích; không “rollback schema” bằng xóa bảng/dữ liệu |
| P05-15 | Chốt deploy release candidate: Git integration + deployment checks, hoặc stage production build trước rồi test và promote đúng build | Không đánh dấu production trước khi checks PASS; deploy metadata SHA/URL/environment lưu receipt |
| P05-16 | Bàn giao tài liệu quản trị/sử dụng: user guide, access policy, setup/upgrade, support, license inventory/SBOM, known limitations | Người thứ hai có thể setup demo theo runbook từ source; không cần máy author hoặc credentials chia sẻ thủ công |

## 2. Matrix env và điều kiện chặn

| Environment | Dữ liệu | Demo persona | Auto-migration | Quyền thay đổi |
|---|---|---|---|---|
| local | Seed giả | Cho phép có nhãn | Chỉ DB local sau confirmation | Developer |
| CI/test | Ephemeral seed giả | Cho phép | Có thể recreate ephemeral DB | CI review code |
| staging | Seed giả và test account rõ scope | Không bypass Auth thật | Approval cho migration | Owner-approved deploy |
| production | Chỉ khi cơ quan/chủ sở hữu dữ liệu và hạ tầng chấp thuận | CẤM | CẤM auto push theo mỗi commit | Owner + quy trình triển khai hợp lệ |

## 3. Quy trình release an toàn

1. PR code và migration chuẩn, CI PASS, owner review diff + DB contract.
2. Tạo preview, chạy smoke và E2E DB staging; kiểm tra không có P0/P1.
3. Với migration: preflight backup, schema drift, grant/RLS, transaction safety và rollback plan; thực hiện theo environment approval; kiểm migration version/readback.
4. Tạo bản build phát hành có commit cố định; với CI tùy chọn Vercel staged production (`--skip-domain`) rồi kiểm tra E2E trước khi promote; không promote preview thành prod nếu làm thay đổi build/env làm mất tính bất biến.
5. Post-deploy smoke, logs, source data sanity, storage signed URL, jobs; nếu fail, ngừng promote hoặc rollback theo runbook có tính đến DB compatibility.

## 4. Clone xã mới — kịch bản bắt buộc

1. Chọn tên/code tỉnh/xã giả định và cấu trúc phòng/đơn vị từ `tenant-config` (không sửa source logic).
2. Tạo Supabase project/DB mới hoặc schema instance độc lập theo phương án approved; chạy canonical migrations từ đầu.
3. Tạo Storage private, roles/permissions, 5–6 test accounts giả và module entitlements.
4. Gắn Vercel env với project mới, deploy **cùng commit SHA/artifact**.
5. Import config và test seed; chạy login, Work E2E nhỏ, cultural submission, báo cáo.
6. Thử xã B không đọc được dữ liệu xã A, kể cả direct API và file URL.
7. Chụp deployment receipt với checksums, config version, migration list, owner signoff.

**Không được yêu cầu fork code để đổi tên xã, tiêu chí, theme hoặc menu.** Nếu có sự khác biệt pháp lý địa phương chưa xác nhận, giữ config pack `PENDING_APPROVAL` và chặn action tương ứng.

## 5. Gate G5 — PASS khi

- 2 E2E + mini-flow + 5 reports + import chạy được trên staging, dùng account thật, DB readback, browser/mobile.
- Sự cố DB/Storage/auth không tạo success giả; có audit và monitoring.
- Build/PR checks và test receipts trỏ đúng SHA, môi trường và migration versions.
- Clone xã B không sửa source và không làm rò dữ liệu; rollback/restore đã diễn tập.
- Tài liệu giới hạn demo và pháp lý được chấp thuận; `G5: OWNER_ACCEPTED`.

**Chú ý:** G5 đồng nghĩa *MVP demo có nền vận hành và triển khai tái lập*, **không** tự động đồng nghĩa đủ điều kiện sử dụng hệ thống xử lý dữ liệu nhà nước thực tế.
