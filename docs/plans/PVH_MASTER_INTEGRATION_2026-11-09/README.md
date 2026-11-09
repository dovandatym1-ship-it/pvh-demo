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


## H. Bộ 5 đặc tả bổ sung — ĐÃ SOẠN, CHƯA TRIỂN KHAI
Các tài liệu dưới đây chuyển từ "cần bổ sung" sang **DOCUMENTED / READY_FOR_IMPLEMENTATION_REVIEW**, không phải VERIFIED CODE:

| ID | Tài liệu | Nội dung chính | Ưu tiên |
|---|---|---|---|
| D-01 | [UI_UX_MASTER_SPECIFICATION.md](./UI_UX_MASTER_SPECIFICATION.md) | Semantic tokens, 16 UI components, 8 screen blueprints, mobile/keyboard/alert states | P0 |
| D-02 | [BRANCH_INTEGRATION_RESOLUTION_MATRIX.md](./BRANCH_INTEGRATION_RESOLUTION_MATRIX.md) | 10 branch SHA snapshot, 32 file-level decisions, tip PH01/PH02, preserving main UI | P0 |
| D-03 | [PERFORMANCE_ENGINEERING_SPECIFICATION.md](./PERFORMANCE_ENGINEERING_SPECIFICATION.md) | Dashboard scoped aggregate, server paging, budget, 14 regression cases, perf strategy | P0 |
| D-04 | [INTEGRATED_FUNCTIONAL_COVERAGE_MATRIX.md](./INTEGRATED_FUNCTIONAL_COVERAGE_MATRIX.md) | M00–M11 coverage, 128 OP source + 5 M11 draft, functional/test mapping | P1 |
| D-05 | [VISUAL_REGRESSION_AND_UAT_TEST_PLAN.md](./VISUAL_REGRESSION_AND_UAT_TEST_PLAN.md) | 15 screen families, 5 responsive widths, 38 UAT scenarios, CI/evidence rules | P1 |
| D-06 | [OP_FUNCTION_SCREEN_CODE_DB_CROSSWALK.csv](./OP_FUNCTION_SCREEN_CODE_DB_CROSSWALK.csv) | CSV truy vết 133 dòng: giữ nguyên nguồn BL/REQ/WF/Screen, không đoán runtime | P1 |

**Tài liệu nền dùng kèm:** [Architecture Review](./ARCHITECTURE_REVIEW_AND_RISK_REGISTER.md), [Branch Conflict Matrix](./BRANCH_RECONCILIATION_AND_CONFLICT_MATRIX.md), [Merge Runbook](./MERGE_EXECUTION_RUNBOOK.md), [UX & Performance Blueprint](./UX_PERFORMANCE_DESIGN_BLUEPRINT.md), [Delivery Gates](./DELIVERY_BACKLOG_AND_ACCEPTANCE_GATES.md).

## I. Cổng chất lượng của bộ tài liệu
- **DOC-01 SOURCE:** Mọi kết luận nguồn có branch/path/commit snapshot và giới hạn kiểm chứng.
- **DOC-02 COMPLETE:** 5 file D-01..D-05 tồn tại và không chỉ chứa template trống; D-06 có 128 OP nguồn duy nhất và 5 M11 ở namespace riêng.
- **DOC-03 CONSISTENT:** Demo/production, M00/M11 ownership, single-commune-per-deployment, KPI count, RLS và report export không tự mâu thuẫn.
- **DOC-04 EXECUTABLE:** Mỗi wave có công việc, gate, test và cách lấy evidence; action thiếu thẩm quyền phải fail safe.
- **DOC-05 REVIEW:** Owner có thể duyệt tài liệu để thực thi; chỉ code + staging + browser + DB test mới cho phép nghiệm thu hệ thống.

**Trạng thái tính đến lần cập nhật:** D-01..D-06 có nội dung trên GitHub; **G-MERGE/G-UX/G-PERF/G-FLOW/G-SEC/G-OWNER chưa chạy**, không coi hoàn tất chỉ vì file đã được tạo. Các cột runtime trong crosswalk cố ý để UNVERIFIED cho đến khi kiểm được code trên commit tích hợp.

## J. Bước khởi động thực thi
1. Freeze commit refs và tạo integration branch từ main.
2. Merge cumulative Phase 6 v2 có kiểm soát, bảo toàn 16 changed paths main.
3. Đối chiếu delta PH01/PH02, chạy SQL/RLS và workflow tests.
4. Hợp nhất giao diện Dashboard theo UI spec nhưng thay data aggregate, giữ server paging.
5. Tạo shared component + polish flagship screens, chạy visual/perf UAT.
6. PR vào main cho **chính bạn duyệt**, không tự merge.
