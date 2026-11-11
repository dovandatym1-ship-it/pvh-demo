# PVH M01 staging acceptance checklist

**Source:** PR #2 head `18280d1e3eadefe073b678a903f6e11ae8ddba9e`, original artifact `docs/plans/PVH_IMPLEMENTATION_2026-11-08/PH02_GATE_G2_VERIFICATION.md`.
**Target candidate:** `codex/pvh-completion-candidate`.
**Status:** `NOT_EXECUTED_ON_STAGING`.

This checklist preserves the detailed M01 acceptance cases for the current staging gate. Before execution, map each case to the schema and RPCs at the release candidate SHA. The source document's open-issue section is historical evidence from PR #2. Recheck each issue against current code and record its resolution or continued applicability in the receipt.

**Người duyệt cuối:** Đỗ Văn Đạt.

## 1. Điều kiện trước khi chạy

1. G1/Phase 1 đã nghiệm thu Auth, membership, RLS, private Storage và audit. Không dùng cookie demo thay cho tài khoản Supabase Auth thật.
2. Có **staging riêng**, không dùng production để seed/kiểm thử xóa sửa dữ liệu; đã lưu backup/snapshot và biết cách khôi phục.
3. Replay toàn bộ 14 migration canonical của candidate trên staging mới theo thứ tự và checksum đã chốt; kiểm schema, RPC grants và pgTAP liên quan M01. Không chạy lại migration chưa idempotent nếu chưa có đường phục hồi.
4. Có ít nhất 4 tài khoản thử nghiệm với tên giả: manager M (WORK_MANAGER), officer A (WORK_OFFICER), officer B (WORK_OFFICER giới hạn địa bàn), viewer V (WORK_VIEWER). Tài khoản auditor Q chỉ có `m00:audit:read` để test quyền riêng. Cấp membership thật còn hiệu lực; không chia sẻ mật khẩu vào receipt.
5. Có hai đơn vị thôn/xóm còn hiệu lực H1/H2, một tài khoản ngoài phạm vi H1 hoặc hết hạn phân công, bucket `evidence` phải **private**.
6. Ghi lại mã commit, schema migration list, môi trường, giờ VN, IDs đã ẩn danh, tester và kết quả từng case.

> Không đẩy dữ liệu cá nhân thật, file thật hoặc URL ký Storage vào ảnh chụp/biên bản. SQL phía dưới là câu truy vấn mẫu, **không tự chạy trên dữ liệu production**.

## 2. Ma trận kiểm thử (phải có bằng chứng readback)

| Case | Actor / thao tác | Kết quả bắt buộc | Bằng chứng |
|---|---|---|---|
| G2-01 | M tạo việc có `source_ref`, hạn, H1, assignee A | 1 row NEW; `source_ref` lưu riêng; 1 event/audit; chưa coi là đã giao | Browser + SQL work/event/audit |
| G2-02 | Gửi lại cùng idempotency key/payload; rồi đổi riêng `source_ref` | Replay cùng ID, không duplicate; khác payload bị từ chối | SQL count + lỗi conflict |
| G2-03 | M chuyển NEW→ASSIGNED; A tiếp nhận | Chỉ A được cập nhật theo quyền, có lịch sử phân công và inbox | SQL state/version/assign/inbox |
| G2-04 | Giao cho user thiếu update/read, hết membership, hoặc ngoài H1 | **Từ chối** trước mutation, không có event/audit giao sai | Direct RPC negative test |
| G2-05 | M giao lại A→B, yêu cầu reason, H1/H2 khác scope | Chỉ thành công nếu B đủ quyền/scope; người cũ mất quyền theo RLS khi không còn quan hệ | SQL + direct URL/Storage 403/404 |
| G2-06 | M thêm viewer V làm người phối hợp, rồi xóa khỏi danh sách | V đọc được nếu scope hợp lệ, không được update/review; sau xóa mất quyền đọc dựa vào cộng tác | RLS read/update + event payload |
| G2-07 | A thêm file minh chứng PDF hợp lệ (private) | Storage object thật; metadata `UPLOADED`; file ngoài scope không tải được; link ký hết hạn | Storage policy + audit + browser |
| G2-08 | Giả lập upload đứt mạng / finalize bị lỗi | Không tính PENDING là minh chứng; retry finalize không tạo metadata trùng; hủy chỉ xóa nếu object đã được dọn | SQL PENDING + audit cleanup |
| G2-09 | A trình khi chưa có evidence | Không được chuyển UNDER_REVIEW; không có event giả | SQL trước/sau |
| G2-10 | A trình sau khi có evidence | Chỉ reviewer hợp lệ nhận inbox; thiếu reviewer thì từ chối, không kẹt trong UNDER_REVIEW | SQL inbox recipient + vai trò |
| G2-11 | M trả lại với reason; A sửa/trình lại; M duyệt | Đúng state machine, không tự duyệt, audit và event có actor/thời gian/version | Timeline + SQL |
| G2-12 | Hai trình duyệt thao tác cùng expectedVersion | Đúng một RPC thành công, RPC kia conflict; không duplicate event/inbox | 2 client + SQL |
| G2-13 | M đổi hạn, địa bàn, người phối hợp | Bắt buộc reason, OCC, idempotency; không chuyển H1→H2 nếu assignee không hợp lệ | Event DETAILS_UPDATED/COLLABORATORS_UPDATED |
| G2-14 | M/A/V xem danh sách với filter, sort, search, paging | Không lộ task ngoài RLS; số lượng đúng; URL giữ filter khi refresh | Browser + count SQL |
| G2-15 | Người nhận đánh dấu inbox đã đọc 2 lần | Một receipt, lần hai replay, nguồn notification vẫn immutable | SQL inbox/read/audit |
| G2-16 | Hạn đúng thời điểm / vừa qua / future / đã kết thúc | Quá hạn chỉ khi `due_date < now`, không dựa vào ưu tiên URGENT | Kiểm thử ranh giới giờ VN |
| G2-17 | Q/auditor thử truy cập hồ sơ M01 | Không có quyền mặc định đọc work_items; chỉ đọc audit theo `m00:audit:read` | Direct URL/API + chính sách |
| G2-18 | Migrate database chứa file PH01 đã upload và file thiếu object | File có object hợp lệ vẫn đọc được; file không có object PENDING và bị chặn | Migration staging snapshot |
| G2-19 | 375px/mobile và desktop | Không tràn/lỗi form, focus và thông báo lỗi rõ ràng | Screenshot đã ẩn dữ liệu |
| G2-20 | Restore bản backup staging | Có thể phục hồi dữ liệu và cấu trúc trước migration theo runbook | Backup/restore receipt |

## 3. Truy vấn đối soát (thay ID bằng UUID staging)

```sql
-- 1. Work item + owner + version + source
select id,tenant_id,title,source_ref,status,assigned_to,hamlet_id,due_date,version,
       created_by,created_at,updated_by,updated_at
from public.work_items where id = '<work_uuid>'::uuid;

-- 2. Lịch sử trạng thái, giao việc, cộng tác (append-only event là căn cứ)
select version,from_status,to_status,actor_id,reason,payload,created_at
from public.work_item_events where work_item_id='<work_uuid>'::uuid order by version;
select work_item_version,previous_assignee,assignee,actor_id,reason,created_at
from public.work_item_assignments where work_item_id='<work_uuid>'::uuid order by work_item_version;
select user_id,added_by,created_at from public.work_item_collaborators
where work_item_id='<work_uuid>'::uuid;

-- 3. Minh chứng và tính đúng người nhận notification
select id,object_path,status,content_type,size_bytes,uploaded_by,created_at
from public.evidence_files where work_item_id='<work_uuid>'::uuid;
select n.id,n.kind,n.recipient_id,n.event_version,r.read_at
from public.work_item_inbox n left join public.work_item_inbox_reads r on r.inbox_id=n.id
where n.work_item_id='<work_uuid>'::uuid order by n.created_at;

-- 4. Thống kê idempotency receipt (không xuất request hash hoặc định danh người thật ra công khai)
select actor_id,count(*) as receipt_count
from public.work_item_mutation_requests where tenant_id='<tenant_uuid>'::uuid
group by actor_id;
```

## 4. Lỗ hổng cần đóng / quyết định chủ dự án

- **Phụ thuộc G1:** Supabase Auth thật, membership và RLS/Storage staging; CI không chứng minh điều này.
- **Chưa chứng thực checksum độc lập tại server:** `claimed_sha256` từ browser, không được ghi thành “verified hash”. Phải bổ sung cơ chế kiểm chứng bằng dịch vụ tin cậy nếu là điều kiện pháp lý/nghiệp vụ.
- **PENDING bị bỏ lại khi trình duyệt đóng:** có cleanup trong phiên nhưng chưa có job đối soát/retention theo chính sách đơn vị; cần owner xác nhận thời hạn xóa.
- **Quyền auditor P6:** quy tắc hiện tại chỉ cho phép `m00:audit:read`, không có quyền đọc hồ sơ M01. Tài liệu backlog cũ ghi P6 xem timeline là mâu thuẫn; owner phải chọn quyền mới cụ thể hoặc đổi test thành xem `audit_log` riêng.
- **Phạm vi ủy quyền theo thời hạn, work_item_links và SLA due-soon:** chưa có business owner xác nhận contract. Không tự nâng quyền mặc định hoặc gắn nghĩa quyết định hành chính vào trạng thái `COMPLETED`.

## 5. Gate quyết định

**G2 PASS chỉ khi:** G1 PASS; migration/pgTAP trên staging PASS; G2-01→20 có receipt thực tế; mọi P0/P1 đã xử lý hoặc có quyết định chấp nhận rủi ro cụ thể; không có data leak/role bypass; Đỗ Văn Đạt phê duyệt. Mọi trạng thái khác là `DRAFT`/`BLOCKED`, dù GitHub Actions xanh.
