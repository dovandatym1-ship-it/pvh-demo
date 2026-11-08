# Biên nhận cấu hình DB PVH một xã — 08/11/2026

## Kết quả triển khai

Đã cấu hình trực tiếp Supabase cloud `Demo-pvh` (`zynzpifmccbcvgddmxic`, PostgreSQL 17), theo yêu cầu người dùng chỉ một xã và quyền theo tài khoản thật. Không sửa file migration, seed hoặc controller mà worker đang thi công.

- Migration `20261108054202_pvh_single_commune_account_foundation`: SUCCESS.
- Migration `20261108054701_pvh_single_commune_scope_context`: SUCCESS.
- 14 bảng public: tenants, org_units, profiles, roles, permissions, role_permissions, memberships, membership_roles, module_entitlements, work_items, work_item_events, audit_log, evidence_files, system_jobs.
- Mọi bảng public bật ENABLE/FORCE RLS. Không cấp quyền ghi trực tiếp cho authenticated/anon; ghi nghiệp vụ qua RPC đã kiểm tra tài khoản/quyền.
- Một dòng đơn vị `TN-DEMO-A`, tên tạm `Xã cấu hình demo`. Constraint singleton chặn dòng xã thứ hai. tenant_id giữ để tương thích contract source; không cung cấp chức năng chuyển xã.
- 5 vai trò cấu hình trong DB: SYSTEM_ADMIN, WORK_MANAGER, WORK_OFFICER, WORK_VIEWER, AUDITOR; 10 quyền. Không tự cấp quyền đọc nghiệp vụ/PII cho quản trị.
- Nguồn quyền: tài khoản Auth → membership còn hiệu lực → membership_roles → role_permissions. Projection roles/permissions do trigger DB cập nhật; không tin persona/client/user_metadata.
- RPC create_work_item: actor từ auth.uid(), đơn vị từ singleton; kiểm tra quyền/phạm vi/người nhận; chống trùng theo actor+key; cùng key khác payload bị từ chối; ghi work/event/audit nguyên tử.
- app.get_account_context trả context tài khoản có phân công; hết hiệu lực/không được phân công trả FORBIDDEN.
- Bucket evidence private; metadata gắn công việc và quyền theo bản ghi, không cấp đọc theo xã một cách tổng quát. Độ dài signed URL <=60s phải đặt ở server app khi gọi Storage.
- Khung jobs chỉ dựng bảng và quyền, chưa có worker xử lý jobs.

## Kiểm chứng

46/46 kiểm tra hành vi SQL đạt; kết quả và danh sách case tại verification-results.json. Đã thực thi dưới role anon/authenticated với JWT context thử, không chỉ tìm chuỗi source. Có kiểm tra deny, read-back, audit actor, idempotency, scope địa bàn, thu hồi quyền cùng JWT, hết hạn, module tắt, singleton, private evidence.

Toàn bộ fixture chạy trong BEGIN/ROLLBACK: sau kiểm tra có 0 Auth account, 0 membership, 0 công việc, 0 event, 0 audit thử. Không seed mật khẩu mặc định.

Security Advisor: không có finding. Performance Advisor: đã bổ sung đủ index cho các FK; chỉ còn thông tin unused_index do DB mới, chưa có workload. Không loại index dự phòng chỉ để xóa thông báo.

Chưa kiểm chứng đăng nhập qua UI, upload/download thực hoặc concurrency giữa hai connection. Không tuyên bố browser E2E hay Gate G1 của worker đạt.

## Tích hợp với repo đang code

Source đích: `/Users/dovandat/teamwork_projects/pvh_demo`.

Đã thêm `supabase/README.md`, hai SQL snapshot đúng migration cloud và verify_single_commune.sql trong `supabase/deployed/`, cùng `.env.cloud.example` chỉ chứa publishable key, không chứa service-role key. Không thay `.env.local` của worker đang dùng endpoint khác cloud.

Worker vẫn có migration/seed cũ hai xã đang soạn. Các file đó KHÔNG phải baseline cloud đã áp dụng; cần reconcile lịch sử/mapping trước khi db push/reset. Không áp migration cũ đè helpers/RLS mới. Bàn giao rõ permission namespace m01:work:*, scopes.org_unit_ids, metadata evidence và app.get_account_context trong supabase/README.md.

Các file ở deployed là snapshot lưu vết, không tự chạy cùng thư mục migrations. Chưa tự move/xóa file worker hoặc repair migration history.

## Đầu vào còn chờ

- Email quản trị và tên hiển thị để tạo/invite Auth account thật rồi gán phân công/role; mẫu operator ở 05_provision_account.sql chưa thực thi.
- Tên xã thực chưa được cung cấp nên giữ tên trung tính.
- Nghiệp vụ chuyên ngành/Sprint 2/3 cần schema và policy riêng theo đặc tả READY, chưa tự dựng các quy tắc pháp lý chưa chốt.

Không có thay đổi dữ liệu cá nhân thật, reset database, hoặc tự đóng gate/issue của nhóm khác. Recall hook PARTIAL/DECISION_BUDGET_EXCEEDED; cấu hình dựa vào ADR, source và yêu cầu trực tiếp hiện tại, không suy authority từ recall.

## Kiểm tra API từ máy local

Hai request dùng publishable key tới REST work_items và RPC get_account_context timeout ở tầng mạng (10 giây/request). Do đó chưa xác nhận kết nối REST từ máy local; không suy ra lỗi schema hoặc kết luận app đã nối cloud. Truy vấn PostgreSQL và advisor qua connector vẫn thành công.
