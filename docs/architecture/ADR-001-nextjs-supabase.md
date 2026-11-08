# ADR-001 — Next.js App Router và Supabase

**Ngày:** 07/11/2026  
**Trạng thái:** Người dùng đồng ý kiến trúc; chưa triển khai ứng dụng.  
**Phạm vi:** Source ứng dụng tại `Working/demo-pvh/`.

## Bối cảnh

PVH cần demo nhiều xã trên cùng codebase, các phân hệ chuyên ngành có không gian tác nghiệp riêng và có kiểm soát hồ sơ nhạy cảm. Người dùng đề xuất một ứng dụng Next.js App Router tích hợp Supabase và đồng ý cấu trúc đã trao đổi.

## Quyết định

- Dùng Next.js App Router + TypeScript cho giao diện và xử lý server; Supabase cho PostgreSQL, Auth và private Storage.
- Tách M00–M10 bằng feature; Action/Handler mỏng, dùng chung service/policy/workflow/repository.
- Dùng transaction/RPC cho thay đổi nguyên tử; kiểm tra quyền phía server và RLS. Client đặc quyền không phải đường truy cập mặc định của nghiệp vụ.
- Tạo thư mục `src/`, `supabase/`, `demo/`, `docs/` và `.github/workflows/` theo README.
- Khóa phiên bản, thư viện form/UI, phương án jobs và môi trường deploy tại W00. Chưa mặc định chọn Vercel hoặc tạo Supabase cloud project.

## Thay thế quyết định kỹ thuật cũ

Phần Fastify + Vite/React, monorepo `apps/api` + `apps/web` + `packages/contracts`, phiên đăng nhập tự xây và local file volume trong plan v1.1 không còn là kiến trúc mục tiêu. Thay bằng Next.js server boundary, Supabase Auth/Storage và contract theo feature. Các nguyên tắc nghiệp vụ, đa xã, LEGO, snapshot, version/idempotency và cổng READY/DONE tiếp tục áp dụng.

Các đường dẫn kỹ thuật cũ trong W00–W11 phải ánh xạ sang README khi lập task; không thực thi nguyên văn scaffold cũ. Việc đổi stack không tự đóng finding hoặc thay đổi 76 REQ/8 delta.

## Hệ quả và việc tiếp theo

- Khung cũ chỉ có thư mục rỗng đã được thay thế; không có mã ứng dụng được di chuyển hoặc xóa.
- Phải hiện thực auth/session, membership, RLS, storage và quyền trước khi chứng minh cách ly tenant.
- Route Handlers/Server Actions không thay thế xử lý job dài; phải chọn worker/queue theo khối lượng demo.
- README là hướng dẫn cấu trúc hiện tại; cập nhật lệnh chạy và bằng chứng khi thực sự triển khai. Chưa có kết quả kiểm thử trong ADR này.
