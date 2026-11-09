# PVH — MASTER INTEGRATION PLAN: UI-FIRST & PERFORMANCE-FIRST
**Vai trò review:** Chief Software Architect + Principal BA + UX/Performance Lead  
**Ngày:** 09/11/2026 · **Trạng thái:** PROPOSED / PLAN ONLY  
**Repo:** `dovandatym1-ship-it/pvh-demo` · **Nhánh lưu plan:** `plan/pvh-master-integration-ux-first-20261109`  
**Phê duyệt merge:** một owner, quyết định cuối cùng do chủ dự án. **Chưa merge, chưa deploy, chưa migrate cloud.**

## A. Executive decision
**Mục tiêu phiên bản tích hợp đầu tiên:** Một ứng dụng PVH đẹp, mượt, nhất quán, thao tác trơn tru và có luồng M01/M09 thực chạy; các module chuyên sâu có thể triển khai tăng dần, nhưng chức năng chưa thật phải có nhãn trạng thái rõ ràng. **UI-FIRST ≠ bỏ bảo mật hay dữ liệu.**

Chọn **`main` làm điểm xuất phát** để giữ bộ giao diện đã được cập nhật trên 16 file, sau đó tích hợp **nền code tích lũy `feat/pvh-ph06-domain-expansion-v2`**, truy hồi **thay đổi Phase 1/2 ở các tip bị phân kỳ**, tích hợp chọn lọc **`feat/pvh-dashboard`**, cuối cùng hợp nhất **nhánh đặc tả**. Không merge thẳng từng branch vào `main`.

## B. Tỷ trọng ưu tiên (định hướng phân bổ công việc, KHÔNG là điểm chất lượng đã đo)
| Trục | Tỷ trọng mục tiêu | Điều kiện |
|---|---:|---|
| UX/UI, nhất quán giao diện, responsive | 40% | Design System, route chính, danh sách/form/modal, dashboard |
| Performance, cảm nhận phản hồi, độ ổn định tương tác | 30% | Bảng phân trang, chỉ số dashboard chính xác, truy vấn và bundle |
| Luồng nghiệp vụ trọng tâm | 20% | M00 nền, M01 CRUD/workflow, M09 báo cáo, M10 import/export tối thiểu |
| Nâng cao ngoài MVP | 10% | M02–M08 OP mở rộng, M11 triển khai thực tế, tích hợp nguồn ngoài |

**Hard stops bất kể tỷ trọng:** lộ dữ liệu khác xã/ngoài quyền; ghi sai/ghi trùng; trả thành công giả; thao tác quyết định/thanh toán vượt thẩm quyền; phá migration hiện hữu; điều hướng đến chức năng giả mạo đã hoàn thành.

## C. Baseline theo GitHub tại thời điểm review
- 10 branches: `main`, `feat/pvh-ph01-platform-auth`, `feat/pvh-ph02-core-workflow`, `feat/pvh-ph03-domain-verticals`, `feat/pvh-ph04-reporting-integrations`, `feat/pvh-ph05-release-clone`, `feat/pvh-ph06-domain-expansion` (baseline cũ), `feat/pvh-ph06-domain-expansion-v2`, `feat/pvh-dashboard`, `docs/pvh-full-module-spec-20261109`.
- Phase 4 kế thừa Phase 3; Phase 5 kế thừa Phase 4; Phase 6 v2 kế thừa Phase 5. **Nhưng các nhánh tip Phase 1 và 2 có commit chưa được kế thừa**, nên Phase 6 v2 không chứa đủ mọi thay đổi cuối cùng.
- `main` có 1 commit ngoài lịch sử Phase 6 v2, chạm **16 file chủ yếu về UI/M01/M04/M06/M07/navigation**.
- Nhánh Dashboard tách từ `main`; nhánh Specs tách từ `main`. Không coi chúng là lớp tự động đi trên Phase 6.
- `PH05_EXECUTION_RECEIPT`: G5 BLOCKED; `PH06_IMPLEMENTATION_RECEIPT`: G6 BLOCKED. Không có chứng cứ nghiệm thu cloud/browser tổng thể.

## D. Các gói tài liệu
1. `ARCHITECTURE_REVIEW_AND_RISK_REGISTER.md` — review từng phase, các lỗ hổng kiến trúc, risk register.
2. `BRANCH_RECONCILIATION_AND_CONFLICT_MATRIX.md` — file/feature ownership, nhánh nguồn và luật chọn.
3. `MERGE_EXECUTION_RUNBOOK.md` — thứ tự tích hợp, lệnh mẫu, kiểm tra, rollback, PR.
4. `UX_PERFORMANCE_DESIGN_BLUEPRINT.md` — hình thái giao diện, component, KPI, ngân sách hiệu năng.
5. `DELIVERY_BACKLOG_AND_ACCEPTANCE_GATES.md` — công việc theo wave, phụ thuộc, kiểm thử, tiêu chí nghiệm thu.

## E. Scope MVP chủ động giới hạn
**Bắt buộc đẹp và dùng được:** Login/khung ứng dụng, Sidebar/header, Dashboard theo vai trò, Bàn làm việc, Danh sách + chi tiết công việc, tạo/giao/chuyển trạng thái, một luồng văn hóa đại diện, một luồng chỉ tiêu/báo cáo, nhập/xuất file đã có, thông báo và trạng thái rỗng/lỗi.

**Có thể thư thả:** 128 OP đầy đủ, đồng bộ nguồn ngoài, workflow pháp lý chưa được duyệt, báo cáo toàn ngành, DOCX nếu chưa có yêu cầu mẫu chính thức, M11 nâng cao, dark mode nếu chưa đạt nhất quán toàn ứng dụng.

**Không được làm giả:** dữ liệu chính thức, thẩm quyền phê duyệt, thanh toán, ghi/đọc DB thành công, trạng thái báo cáo đã kiểm định.

## F. Release theo 2 tầng
- **Visual & Functional Preview:** Có thể trình diễn bằng dữ liệu synthetic công khai nhãn; trải nghiệm đẹp/mượt; các thao tác thật phải fail-safe. Không gọi là production-ready.
- **Operational Pilot:** Sau khi hoàn tất Auth/RLS/RPC, migration staging, E2E, xuất báo cáo, vận hành và owner acceptance.
Các OP chưa sẵn sàng vẫn theo backlog, không chặn preview của các màn/luồng đã an toàn.

## G. Định nghĩa hoàn thành
Không dùng "% 100" làm bằng chứng. Hoàn thành khi tất cả gate UI/performance/chức năng lõi được đo và có bằng chứng trên commit SHA bất biến, chủ dự án duyệt PR. Trước đó ghi `IN_PROGRESS`, `PARTIAL` hoặc `BLOCKED`.
