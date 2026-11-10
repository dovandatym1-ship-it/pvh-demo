# PVH — Kế hoạch Supabase staging, Vercel Preview và nghiệm thu độc lập

**Ngày:** 10/11/2026 · **Nguồn:** PR #12 `integrate/pvh-backbone-review-20261110` · **Trạng thái:** PLAN ONLY / NO-GO PRODUCTION.

> Tài liệu này KHÔNG phải biên bản triển khai cloud. Chỉ tạo/chỉnh sửa môi trường cloud sau khi chủ dự án duyệt cấu hình, phạm vi, quyền truy cập và chi phí. Không push migration vào `Demo-pvh`, không merge `main`, không dùng dữ liệu cá nhân thật trong thử nghiệm.

## 1. Ranh giới

- Mục tiêu: nghiệm thu 1 đơn vị xã trên 1 triển khai độc lập, sau đó thử clone sang đơn vị thứ hai có tenant, tài khoản và cấu hình khác; không giả vờ rằng hai xã cùng sử dụng chung một database có thể thay thế kiểm thử clone.
- Source code từ PR #12 chỉ là **candidate**. Build/CI và replay migration trong runner khác với Auth/RLS/Storage thật + E2E browser.
- Supabase cloud được kết nối hiện mang tên `Demo-pvh`. Cloud readback trước đó: 2 migration foundation đã áp dụng, 14 bảng `public` ở baseline. Branch PR có thêm migration; không mặc định đã có schema cloud.
- Chỉ xem `Demo-pvh` ở trạng thái READ-ONLY cho tới khi có phê duyệt.

## 2. Supabase staging (cần phê duyệt chi phí và tạo môi trường)

1. Chốt account, organization, vùng, hạn mức, quota và ngân sách. Nếu cần project/branch mới, lấy báo giá công khai theo organization rồi yêu cầu chủ dự án chấp thuận **mức giá cụ thể** trước khi tạo.
2. Thiết lập database trống, lấy snapshot migration history, kiểm tra checksum và quyết định replay toàn bộ canonical migrations. Không import các SQL trong `supabase/_legacy`.
3. Kiểm tra role/grant/Data API schema exposure. Mọi bảng `public` có RLS và kiểm thử policy **âm/dương** cho admin, chuyên viên, cán bộ thôn và người chưa được phân công.
4. Mã hóa, che CCCD/y tế/mức trợ cấp, bảo vệ file Storage riêng tư. Test tenant và hamlet isolation với HTTP client (không chỉ inspect SQL).
5. Tạo tài khoản kiểm thử giả lập qua Auth; không seed người thật. Đối soát quyền sống theo `memberships`, `membership_roles`, `org_unit_ids`; thay đổi quyền phải ảnh hưởng ngay đến request mới.
6. Kiểm thử version/OCC, idempotency key, event+audit transaction, undo/rollback, file upload/revoke, xuất báo cáo.
7. Bật Supabase Auth leaked password protection, quy tắc mật khẩu, MFA nếu áp dụng và SMTP/cấu hình email được duyệt.
8. Cấu hình **Redirect URLs** của Supabase Auth cho `https://<approved-preview-domain>/dat-lai-mat-khau` và domain triển khai thật sau khi đã chốt. Không dùng wildcard tùy ý.
9. Thử gửi email khôi phục → mở liên kết trong cùng trình duyệt PKCE → đổi mật khẩu → đăng nhập lại; mã đã dùng/hết hạn phải bị từ chối. Kiểm thử nhập sai và chống tiết lộ tài khoản qua phản hồi form.
10. Kiểm tra backup/restore thực sự: khả năng tạo bản sao và phục hồi dữ liệu/thủ tục; ghi RTO/RPO và owner.

**Bằng chứng tối thiểu:** số migrations applied, checksum, security advisor, test Auth 3+ role, negative tenant/hamlet, Storage private, giao dịch/audit, ảnh E2E, log lỗi và báo cáo restore.

## 3. Vercel Preview (chưa tạo project/deploy)

1. Chốt project/team/owner, Git integration source branch PR #12, region và tên miền Preview; kiểm tra quyền nguồn private repo.
2. Chỉ cấu hình publishable/URL ở client: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_APP_URL`. `NEXT_PUBLIC_APP_URL` bắt buộc là **HTTPS origin hợp lệ** trên preview/production, không chứa path/query, không được giữ `localhost`.
3. `PVH_ALLOW_DEMO_AUTH=false`, `NEXT_PUBLIC_DEMO_MODE=false` với mọi môi trường cloud. Bất kỳ secret/service-role key nào đều nằm ở server environment, không dùng biến `NEXT_PUBLIC_`.
4. Cấu hình Redirect URLs Auth khớp tên miền Preview; xác minh login, logout, quên mật khẩu, đổi mật khẩu, session refresh và khi hết phân công thì không có vòng lặp redirect.
5. Chạy API→DB readback cho dashboard/notifications/M00–M11; xác nhận KPI có nguồn, không giả 0 khi truy vấn lỗi.
6. UAT 375/768/1024/1440, keyboard navigation/escape/focus, tương phản, loading/error/empty states, thao tác CRUD.
7. Tạo test data 101+ bản ghi để kiểm tra phân trang, thống kê `count:exact`, hiệu năng LCP/INP/CLS và log runtime.
8. Cấu hình bảo vệ preview (đăng nhập, môi trường), deployment checks và required reviewers; không gộp preview vào production.

## 4. Ma trận nghiệm thu nghiệp vụ nguồn

Mỗi OP trong 128 OP baseline và 5 M11 draft phải có đủ:
`requirement_id → route → field_dictionary → validation → actor/permission → server_action → DB/RPC → RLS → audit → test_id → CI/evidence SHA → owner_decision`.

- **Không có schema cloud** ≠ **không có code**. Nhưng có code client mà thiếu schema/RPC hoặc căn cứ pháp lý thì vẫn là **NOT VERIFIED**.
- **Không có quyền** phải fail-closed ở UI, server action, SQL/RLS; kiểm thử role có cả màn hình và gọi trực tiếp API.
- Chỉ số dashboard chỉ được ghi là dữ liệu thực khi query đúng nguồn, đúng role/scope và kiểm thử lại được.
- Với hành vi hành chính có hiệu lực pháp lý (xác nhận chế độ, chi trả, phê duyệt, công bố), bắt buộc xác nhận thẩm quyền/căn cứ và chứng cứ nguồn trước khi bật trạng thái chính thức.

## 5. Release gate

| Gate | Điều kiện đạt | Người phê duyệt |
|---|---|---|
| G-SOURCE | Typecheck, build, lint, nguồn tính thống kê, tests và dependency audit PASS ở **cùng SHA** | Chủ repo |
| G-DB | Canonical migration replay ở staging, SQL/RLS/Storage negative PASS | Chủ repo |
| G-AUTH | Login/session/logout/password recovery với redirect URL HTTPS + code một lần, Auth security policies | Chủ repo |
| G-FLOW | E2E browser→action→DB readback và audit cho toàn bộ OP trong scope đã chốt | Chủ repo |
| G-UX | Responsive, bàn phím, nhãn Việt, lỗi và quyền của mọi màn hình | Chủ repo |
| G-CLONE | Hai xã clone độc lập có cấu hình khác nhau, không trộn dữ liệu | Chủ repo |
| G-ROLLBACK | Backup/restore, observability, runbook; thử quy trình khôi phục | Chủ repo |
| G-OWNER | Chủ dự án ký quyết định phạm vi Release và tự merge PR | Chủ dự án |

**Không tự động GO chỉ vì CI xanh.** PR #12 giữ DRAFT cho tới khi tất cả gate áp dụng có bằng chứng.

## 6. Điểm cấu hình còn phụ thuộc môi trường

- DNS/HTTPS origin cho từng xã/preview, Supabase Auth email template/SMTP, Redirect URLs, leaked password protection và hạn mức gửi email.
- Project/branch staging Supabase và Vercel team/project cần người có thẩm quyền chọn và phê duyệt chi phí.
- Sơ đồ quyền cán bộ, nguồn danh mục chính thức, lịch hiệu lực chính sách, mẫu biểu cần chốt khi làm UAT.

**Tuyệt đối không tự điền giá trị secret, không bật demo auth trên cloud và không dùng dữ liệu thật để minh họa.**
