# PVH Dashboard V2 — Đặc tả BA & UX theo vai trò

**Trạng thái:** Implemented in `feat/pvh-dashboard`, chưa merge.  
**Nguồn đối chiếu:** `preview.html` (bản mẫu người dùng), `src/features/dashboard/*` và `work_items` M01 hiện tại.  
**Ranh giới:** Đây là **tổng quan công việc** thuộc phạm vi người dùng, KHÔNG phải trung tâm điều hành mọi dữ liệu M02–M09.

## 1. Nguyên tắc đổi tên và bố cục

- Sidebar: **Tổng quan** (thay vì Dashboard điều hành).
- P1: **Tổng quan điều hành**. P2: **Công việc được giao**. P4: **Theo dõi công việc địa bàn**.
- Header 1 dòng bối cảnh vai trò/phạm vi + thời điểm thống kê và nút xem nguồn. Nội dung “trung tâm điều hành” dài không xuất hiện ở tiêu đề trang.
- 4 thẻ KPI theo vai trò → danh sách ưu tiên rộng khoảng 2/3 trang → chỉ số liên quan theo lĩnh vực/trạng thái bên cạnh → 2 khối phân tích dưới cùng.
- Không hiển thị nút chuyển vai trò thật trên client. Phiên đăng nhập server quyết định tenant, quyền và địa bàn.
- Thiết kế responsive: desktop bảng việc đủ độ rộng; tablet/mobile xếp cột và cho phép cuộn ngang phần bảng thay vì cắt cột.

## 2. Bản đồ câu hỏi nghiệp vụ theo vai trò

| Vai trò | Câu hỏi cần trả lời trước | Chỉ số cấp 1 | Việc người dùng làm tiếp |
| --- | --- | --- | --- |
| P1 Lãnh đạo | Có bao nhiêu việc quá hạn, chưa phân công hoặc mắc bước rà soát? | Quá hạn; chưa phân công; chờ rà soát; tổng chưa đóng | Chọn chỉ số → bảng công việc → xem hồ sơ M01 để giao/đôn đốc bằng chức năng hiện có |
| P2 Công chức | Việc **tôi được giao** nào quá hạn, cận hạn, bị trả lại? | Quá hạn của tôi; sắp đến hạn của tôi; việc được giao bị trả lại; việc của tôi chưa đóng | Lọc, tìm kiếm, xem công việc và xử lý trong M01 nếu được phân quyền |
| P4 Trưởng thôn | Công việc nào liên quan đến thôn của tôi cần theo dõi/phối hợp? | Việc mở tại thôn; quá hạn tại thôn; bị trả lại tại thôn; sắp đến hạn tại thôn | Phối hợp thu thập thông tin, theo dõi tiến độ; chỉ mở hồ sơ khi có quyền |

**Giải thích quan trọng:** `assigned_to` là người được giao công việc, chưa phải `next_actor_id`. Vì thế “chờ rà soát” không được chuyển tên thành “chờ tôi duyệt” khi chưa có workflow actor/permission rõ ràng. P4 có thể xem công việc thuộc địa bàn nhưng không được mặc định có quyền sửa/duyệt.

## 3. Định nghĩa từng KPI và nguồn

Tất cả KPI tính trên `work_items` sau khi Supabase RLS, tenant filter và `scopeWorkItems` đã thực thi trên server. `OPEN = status NOT IN (COMPLETED, CANCELLED)`, dùng ngày dân sự `Asia/Ho_Chi_Minh`.

| KPI | Đơn vị | Công thức | Vai trò | Click / Drilldown | Giới hạn |
| --- | --- | --- | --- | --- | --- |
| Việc đã quá hạn | việc | COUNT(OPEN WHERE due_date < today) | P1 toàn xã, P2 assigned_to=user, P4 hamlet_id trong scope | Lọc `overdue` | Không phải SLA pháp lý |
| Việc chưa phân công | việc | COUNT(OPEN WHERE assigned_to IS NULL) | P1 | Lọc `unassigned` | “Chưa giao” là dữ liệu M01, không kết luận người khác không đang phối hợp |
| Chờ rà soát | việc | COUNT(OPEN WHERE status=UNDER_REVIEW) | P1 | Lọc `review` | Không đồng nghĩa “P1 phải duyệt” |
| Việc của tôi / việc mở | việc | COUNT(OPEN) trên tập theo vai trò | P1/P2/P4 | Lọc `all` | P2 luôn lấy công việc giao trực tiếp, P4 là toàn bộ địa bàn |
| Đến hạn trong 7 ngày | việc | COUNT(OPEN WHERE 0 ≤ due_date - today ≤ 7) | P2/P4 | Lọc `soon` | Bao gồm hôm nay và ngày thứ 7, chưa có lịch nghỉ |
| Việc được giao bị trả lại | việc | COUNT(OPEN WHERE status=RETURNED) | P2/P4 | Lọc `returned` | Cần xem lý do, chưa mặc định người hiện tại là bước tiếp theo |

Quy tắc tổng hợp: khi hai KPI giao nhau (ví dụ việc bị trả lại đồng thời quá hạn), không cộng các KPI với nhau để nói “tổng việc cần xử lý”. `totalFocusOpen` phải được tính bằng tập `OPEN` duy nhất.

## 4. Phân tích dữ liệu hiển thị trong bảng ưu tiên

| Trường UI | Trường nguồn | Kiểu | Quy tắc hiển thị | Vai trò |
| --- | --- | --- | --- | --- |
| Tên công việc | `work_items.title` | Text | 1–2 dòng; click vào chi tiết nếu được phép | P1/P2/P4 |
| Mã công việc | `work_items.id` | UUID/text | Hiển thị một đoạn ngắn để đối chiếu, không coi như số hồ sơ hành chính | P1/P2/P4 |
| Lĩnh vực | `work_items.category` | Enum | Hiển thị tên/nhóm; trường `CHUNG` có thể không thuộc nhóm chuyên ngành | P1/P2/P4 |
| Trạng thái | `work_items.status` | Enum | NEW, ASSIGNED, IN_PROGRESS, UNDER_REVIEW, RETURNED, COMPLETED, CANCELLED; màu chỉ hỗ trợ đọc | P1/P2/P4 |
| Hạn công việc | `work_items.due_date` | Date | Quá N ngày / hạn hôm nay / còn N ngày / ngày tháng / chưa có hạn; đóng/hủy không tính quá hạn | P1/P2/P4 |
| Người được giao | `work_items.assigned_to` | ID | Chỉ hiển thị mã rút gọn nếu chưa có hồ sơ nhân sự; không giả tên cán bộ | P1/P2/P4 nếu được xem |
| Địa bàn (lấy làm scope) | `work_items.hamlet_id` | ID | Dùng để giới hạn P4 và thống kê P1; cần join danh mục thôn để hiển thị tên chuẩn | P1/P4 |
| Hành động mở hồ sơ | `work_items.id` + route permission | Link | Mở `/cong-viec?focus=id` khi có quyền vào M01; route guard thực thi lại phía server | P1/P2/P4 có quyền |

**Không hiển thị** CCCD, số điện thoại, thông tin trợ cấp cá nhân, nội dung hồ sơ y tế, hay thông tin người dân trên dashboard liên phân hệ.

## 5. Ý nghĩa các biểu đồ

| Biểu đồ | Người xem | Trục/đơn vị | Dữ liệu & mẫu số | Câu hỏi quyết định | Giới hạn |
| --- | --- | --- | --- | --- | --- |
| **Cơ cấu hạn việc đang mở** | Cả ba vai trò, theo scope tương ứng | Y: 6 nhóm hạn; X: số việc | Các nhóm: quá hạn, hôm nay, 1–3, 4–7, >7, chưa có hạn. Tổng nhóm = `totalFocusOpen` | Việc dồn vào mốc nào? | Không là SLA pháp lý |
| **Xu hướng tạo mới/hoàn thành 6 tuần** | Chỉ P1 | X: thứ Hai từng tuần; Y: số việc/lượt hoàn thành | Tạo mới từ `work_items.created_at`. Hoàn thành từ `work_item_events`, duy nhất mỗi `work_item_id + week` | Dòng việc vào/ra có mất cân bằng? | Nếu lịch sử thiếu: ẩn cột hoàn thành. Không gọi `completed/created` là tỷ lệ hoàn thành |
| **Trạng thái công việc** | P2/P4 | Y: 7 trạng thái; X: số việc | `work_items.status` trên phạm vi được giao (P2) hoặc địa bàn (P4); tổng 7 nhóm = `totalFocus` | Tồn ở bước nào? | M01, không phải hồ sơ xử lý TTHC |
| **Việc tồn theo lĩnh vực** | P1/P2/P4 theo scope | Danh sách theo nhóm; đơn vị việc | `category` của công việc OPEN. `CHUNG` chưa gán nhóm không được đưa vào M02–M06 | Lĩnh vực nào có nhiều việc cần chú ý? | Không phải số hồ sơ chuyên ngành của M02–M09 |
| **Phân bổ việc chưa đóng** | Chỉ P1 | Y: cán bộ chưa đóng; X: số việc | `assigned_to` trên OPEN, có nhóm chưa giao | Cần phân bổ/đôn đốc ai? | Chưa đo giờ công, mức khó hoặc công bằng tải việc |

Biểu đồ tuyệt đối **không được rút ra %** nếu thiếu mẫu số, kỳ thống kê, tính đầy đủ của dữ liệu hoặc định nghĩa pháp lý của chỉ số.

## 6. Chế độ phân quyền và dữ liệu demo

- P1 lãnh đạo: xem trên scope tenant theo chính sách đã cấp.
- P2 công chức: được truy cập dữ liệu theo `hamletIds` hoặc công việc trực tiếp giao; riêng KPI cá nhân chỉ lấy `assigned_to = ctx.userId`. Khi không có `hamletIds`, bộ lọc bổ sung **chỉ cho phép việc được giao**, không mở toàn tenant.
- P4: bắt buộc có `hamletIds`, rỗng thì fail-closed.
- Chỉ số theo vai trò được tính từ `roleView.focusItems` đã được phép xem.
- Demo phải ghi rõ “Dữ liệu minh họa”. Không tự tạo dashboard 48 việc giả khi máy chủ M01 có ít hoặc không có dữ liệu; mock site riêng không được xem là môi trường xác minh dữ liệu thật.

## 7. Ưu tiên kế tiếp để dashboard thực sự hoàn thiện

1. **P0 — Bảo mật:** Test RLS trực tiếp với hai tenant, 3 vai trò, trường hợp scope rỗng, truy cập trái phép qua URL.
2. **P0 — Dữ liệu:** Phân biệt rõ lỗi truy vấn và dữ liệu rỗng; toàn bộ M01 phân trang và hỗ trợ KPI không chỉ ở tập đầu tiên.
3. **P1 — Workflow:** Thêm `next_actor_id`, `awaiting_action_type`, lý do trả lại và history để xác định “ai cần làm tiếp”.
4. **P1 — Nguồn:** Join danh mục `hamlets` và hồ sơ cán bộ để hiển thị tên chính xác thay vì ID.
5. **P1 — SLA:** Chỉ gọi quá hạn SLA khi đã có policy version, loại ngày, calendar, tạm dừng/gia hạn và event ledger.
6. **P1 — Liên phân hệ:** Khi M02–M09 có nguồn dữ liệu chuyên biệt đã kiểm chứng, thêm `source_module`, `period`, `numerator`, `denominator`, `rule_version`, `updated_at` và quyền xem cho từng chỉ số.
7. **P1 — UX:** E2E test click KPI→lọc→mở hồ sơ→xử lý→refresh, visual regression 390/768/1024/1440px; kiểm tra keyboard và screen-reader.
8. **P2 — Hiệu năng:** Theo dõi TTFB, query count, hydration size, RLS query plan và performance trên ≥10.000 công việc.

## 8. Tham chiếu UI mã nguồn mở

- [Tremor OSS Dashboard](https://github.com/tremorlabs/template-dashboard-oss): cấu trúc visual analytics và biểu đồ dễ giải thích.
- [Tabler](https://github.com/tabler/tabler): data tables, trạng thái và responsive.
- [Next Shadcn Admin Dashboard](https://github.com/arhamkhnz/next-shadcn-admin-dashboard): cách phân tách layout/role-specific screen.

Chỉ tham chiếu ý tưởng bố cục, ngữ nghĩa và component. Không sao chép nguyên source hoặc dashboard số liệu thương mại vào nghiệp vụ PVH.

## 9. Nghiệm thu

**Có thể tự động hóa ngay:** test scope theo tenant/P1/P2/P4; tổng nhóm thời hạn = số OPEN theo vai trò; tổng trạng thái = tổng công việc đã phân quyền; kiểm tra 7 ngày; build/typecheck/lint/fitness.

**Chưa đủ điều kiện tuyên bố “100% production-ready”:** dữ liệu thật, chính sách SLA ngành, quyền bước workflow, KPI chuyên ngành, kiểm tra chất lượng UI trên thiết bị thực và UAT liên phân hệ.
