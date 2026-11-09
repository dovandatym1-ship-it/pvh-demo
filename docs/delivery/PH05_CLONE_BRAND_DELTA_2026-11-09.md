# PH05 — Bổ sung cấu hình nhân bản giao diện và chặn menu vượt quyền (09/11/2026)

**Nhánh:** `fix/pvh-ph05-clone-brand-20261109` từ PH05 gốc. **Gate G5: BLOCKED**; không triển khai cloud, không thay đổi schema.

## Đã thực hiện
1. Thay nhãn xã/huyện hard-code tại màn đăng nhập, khung ứng dụng, thanh bên và SEO bằng hai biến môi trường `NEXT_PUBLIC_ORGANIZATION_NAME` và `NEXT_PUBLIC_REGION_LABEL`. Có nhãn mặc định trung tính, tiếng Việt, kiểm tra ký tự không hợp lệ.
2. Giữ danh tính xã, phân quyền và RLS độc lập với nhãn giao diện. Cấu hình nhãn **không phải** bằng chứng người dùng thuộc xã đó.
3. Sửa điều kiện Sidebar: khi máy chủ cung cấp `groups=[]` (không có menu được cấp quyền) thì không tự hiện lại toàn bộ menu demo.
4. Thêm kiểm thử ngăn tái xuất hiện chuỗi tên địa phương cố định và regression quyền menu; chạy trong PH05 CI.

## Cấu hình khi nhân bản
- Xã A: `NEXT_PUBLIC_ORGANIZATION_NAME=UBND xã A`, `NEXT_PUBLIC_REGION_LABEL=Tỉnh mẫu A`.
- Xã B: `NEXT_PUBLIC_ORGANIZATION_NAME=UBND xã B`, `NEXT_PUBLIC_REGION_LABEL=Tỉnh mẫu B`.
- Giữ nguyên source SHA. Supabase Auth membership/RLS và Vercel→Supabase mapping phải kiểm chứng độc lập trên môi trường riêng.

## Chưa hoàn tất
- Việc tạo project Supabase/Vercel, kiểm tra clone 2 xã, migration checksum, RLS/Storage/E2E, backup/restore, UAT, kiểm thử tải vẫn **NOT_RUN**.
- Header đang hiển thị nhãn cấu hình của deployment, chưa chứng thực tên hiển thị đối chiếu bảng tổ chức theo `ctx.tenantId`; đây là backlog của module M00.
- Điều kiện phát hành PH05 tiếp tục bị chặn bởi G4 và phê duyệt của chủ hệ thống.
