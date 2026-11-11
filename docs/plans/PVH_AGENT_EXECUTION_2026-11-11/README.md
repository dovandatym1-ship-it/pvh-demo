# PVH — BỘ KẾ HOẠCH TRIỂN KHAI M00–M11 CHO TEAM AGENT

**Ngày:** 11/11/2026 · **Nguồn:** `dovandatym1-ship-it/pvh-demo` PR #12 @ `fa214999` · **Trạng thái:** DRAFT / OWNER REVIEW REQUIRED.

Bộ này chuyển Function Map 128 operation nguồn + 5 feature M11 thành 12 file giao việc, mỗi module 01 file độc lập. Gồm **846 work package**, tách BA/DB/BE/FE/QA/INT và Security cho module nhạy cảm; mỗi operation có luồng xử lý, bảng trường snake_case/kiểu PostgreSQL, nguồn CODE/DESIGN, ngoại lệ, task ID, phụ thuộc, DoD và acceptance scenarios.

> Đây là **kế hoạch triển khai**, không phải xác nhận 846 task đã thực hiện. Tình trạng code vẫn nằm ở PR #12 Draft/NO-GO; Supabase Demo-pvh và main không được thay đổi.

## 1. Danh mục 12 file

| Module | Nghiệp vụ / feature | Task tách nhỏ | Tài liệu |
|---|---:|---:|---|
| M00 — Quản trị hệ thống | 12 | 72 | [M00.md](M00.md) |
| M01 — Quản lý công việc và hồ sơ | 15 | 90 | [M01.md](M01.md) |
| M02 — Nội vụ, lao động và người có công | 18 | 126 | [M02.md](M02.md) |
| M03 — Giáo dục và đào tạo | 12 | 84 | [M03.md](M03.md) |
| M04 — Văn hóa, gia đình, thể thao, du lịch và thông tin | 21 | 126 | [M04.md](M04.md) |
| M05 — Khoa học, công nghệ và chuyển đổi số | 11 | 66 | [M05.md](M05.md) |
| M06 — Y tế và an sinh xã hội | 12 | 84 | [M06.md](M06.md) |
| M07 — Dân tộc, tín ngưỡng và tôn giáo | 6 | 42 | [M07.md](M07.md) |
| M08 — Kiểm tra, giám sát và khắc phục | 6 | 36 | [M08.md](M08.md) |
| M09 — Báo cáo, thống kê và điều hành | 9 | 54 | [M09.md](M09.md) |
| M10 — Nhập dữ liệu và tích hợp MVP | 6 | 36 | [M10.md](M10.md) |
| M11 — Danh mục dùng chung | 5 | 30 | [M11.md](M11.md) |
| **Tổng** | **133** | **846** | **12 file module** |

## 2. Hướng dẫn giao task cho nhiều agent

1. **BA lead:** nhận các `*-BA01` trước; xác nhận căn cứ pháp lý, đúng thẩm quyền cấp xã, actor, field dictionary, owner và biến thể. Các OP BA có thể chạy song song, nhưng quyết định chốt do Đỗ Văn Đạt duyệt.
2. **DB lead:** nhận `*-DB01` sau BA approval; cùng một module chỉ một người tích hợp migration để không trùng SQL timestamp/FK. Dùng staging/local riêng, cấm `db push/reset` dự án Demo-pvh.
3. **Backend agents:** nhận `*-BE01`, sửa theo domain module; khoanh vùng files và API contract, test quyền/idempotency/version.
4. **Frontend agents:** nhận `*-FE01`, tách component form/list/detail; 01 page owner tích hợp route, không cùng sửa một file; màn hình tiếng Việt, responsive, CRUD theo tính chất.
5. **Security + QA:** nhận `*-SEC01` nếu là module nhạy cảm, `*-QA01` cho tất cả; thử tenant/role, direct API, masking/export/retention, browser→API→DB readback.
6. **Integration agent:** `*-INT01` sau QA, đóng traceability, kiểm thông báo/dashboards/report không dùng mock, mở PR Draft.
7. **Đỗ Văn Đạt:** duyệt quyết định phạm vi, biểu mẫu, thẩm quyền, migration và merge. Không tự động merge, deploy hay chuyển trạng thái DONE khi thiếu chứng cứ.

**Luồng phụ thuộc:** `BA01 → DB01 → BE01 → FE01 → QA01 → INT01`; `SEC01` chạy sau BE01 và bắt buộc hoàn tất trước INT01 ở M02/M03/M06/M07. Agent có thể chuẩn bị fixture/docs song song nhưng không được thay đổi hợp đồng chưa duyệt.

## 3. Baseline và nguyên tắc kỹ thuật

- `SOURCE`: thấy trong code/migration trên PR #12, chưa đồng nghĩa cloud đã áp; `DESIGN`: trường mới hoặc mapping cần duyệt; `LIVE`: phải có đọc thực tế/biên nhận checksum (tạm không tự đánh).
- Mỗi màn phải có danh sách, tìm kiếm, lọc, sắp xếp, phân trang, chi tiết; tạo/sửa/ngừng hiệu lực/xuất theo nghiệp vụ và thẩm quyền. Nhật ký bất biến, bản quyết định nguồn read-only không bị ép có nút xóa.
- `tenant_id` và scope lấy từ server, không cho client quyết; permission kiểm tại route, action, RPC, RLS và khi export. Dữ liệu nhạy cảm phải server-mask, riêng tư mặc định.
- M01 là workflow nền; M11 là owner danh mục; M09 sở hữu báo cáo chính thức; M10 sở hữu pipeline nhập/xuất dữ liệu. Không tạo hai nguồn dữ liệu chủ cho một đối tượng.
- Danh hiệu văn hóa M04 vẫn có nhãn minh họa khi chưa có bộ tiêu chí và căn cứ duyệt; M06 yêu cầu đối soát không đồng nghĩa đã chi trả; M07 chỉ tiếp nhận, không giả phê duyệt hành chính.
- Vẫn có blocker kiến trúc đa xã: schema `tenants.singleton`. Lập ADR cấu hình một codebase/N xã trước khi thay đổi mô hình tenant.

## 4. Thứ tự thi công đề xuất

- **Wave 0:** Freeze code SHA, giải quyết ADR source/owner, audit 128 OP + 5 M11, chốt quyền và mẫu.
- **Wave 1 (nền):** M00 → M11 → M01 (Auth, danh mục, hồ sơ/công việc).
- **Wave 2 (luồng demo ưu tiên):** M04 → M05 → M08 (danh hiệu, chỉ tiêu CĐS, kiểm tra–khắc phục).
- **Wave 3 (chuyên ngành sâu):** M02 → M03 → M06 → M07, trong đó phần nhạy cảm cần Gate Security riêng.
- **Wave 4 (dữ liệu điều hành):** M09 → M10; xuất báo cáo phải dựa trên nguồn nghiệp vụ đã có bằng chứng.
- **Wave 5:** E2E đa vai trò và tenant theo ADR, volume test, UAT người dùng, owner acceptance và release gate.

## 5. Công thức nhận task trên agent

```text
Chỉ triển khai task <TASK_ID> trong <MXX>.md từ baseline PR #12 @ fa214999.
Đọc workflow, danh sách trường, input/output, dependency và Definition of Done.
Xác nhận file ownership, phân loại SOURCE/DESIGN, căn cứ pháp lý và quyền trước code.
Không sửa main, không merge phase branch, không áp migration Supabase Demo-pvh.
Thực hiện code/test trong phạm vi task; ghi receipt SHA, route/API/DB/RLS/test.
Mở PR Draft, chờ agent tiếp theo hoặc Đỗ Văn Đạt phê duyệt.
```

## 6. Cổng nghiệm thu chung

| Gate | Điều kiện | Bằng chứng |
|---|---|---|
| G-BA | 133/133 OP/feature được ánh xạ flow/trường/actor/permission/exception; legal blocker có chủ xử lý | Rule Register + Data Dictionary + owner sign-off |
| G-DB | Migration/replay sạch, checksum, FK/index, tenant RLS, pgTAP negative và concurrency | Log Supabase staging + SQL test receipts |
| G-BE | Actions fail-closed, DTO, idempotency, source provenance, audit | Unit + contract + API deny tests |
| G-UI | CRUD đúng quyền, tiếng Việt, empty/error, accessibility, mobile | Screenshot + browser recordings + axe/keyboard |
| G-E2E | 3 luồng xuyên M01/M04/M05/M08/M09 + case nhạy cảm M06/M07 | Browser→API→DB/Storage traces |
| G-PERF | 101+ công việc, query count/index và số liệu báo cáo đúng | EXPLAIN, latency, RLS scoped counts |
| G-OWNER | 0 P0, không false success, tài liệu/code/test khớp, Đỗ Văn Đạt phê duyệt | PR review và gate receipt |

## 7. Tài liệu gốc cần đọc trước khi agent làm

- `docs/business/FUNCTION_MAP_PVH_v0.1.md`
- `docs/plans/PVH_MASTER_INTEGRATION_2026-11-09/OP_FUNCTION_SCREEN_CODE_DB_CROSSWALK.csv`
- `docs/specs/PVH_FULL_MODULE_SPEC_2026-11-09/Mxx.md`
- `docs/integration/PVH_INTEGRATION_CANDIDATE_RECEIPT_2026-11-10.md`
- Source `src/features/mxx-*` và `supabase/migrations/` tại PR #12.

**Ranh giới:** bộ plan tạo nhiệm vụ chi tiết, không triển khai code chức năng, không nâng tỷ lệ hoàn thành hay chấp nhận quyết định luật chưa thẩm tra.
