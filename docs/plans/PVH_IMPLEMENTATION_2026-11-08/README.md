# PVH Workbench — Kế hoạch triển khai theo phase, v1.0

**Ngày lập:** 08/11/2026  
**Repo:** `dovandatym1-ship-it/pvh-demo`  
**Baseline audit:** `main@8fc0fdbfe28dc3e2b73309313c312a1fd69c6bec`  
**Head tại thời điểm chuẩn bị lưu plan:** `main@6d9b9b7b54c0c75556e7d97f38cf0736e9eacb37` (thêm 2 commit kể từ baseline audit)  
**Cloud tham chiếu:** Supabase project `Demo-pvh`, ID `zynzpifmccbcvgddmxic`, PostgreSQL 17  
**Trạng thái tài liệu:** `PROPOSED — AWAITING OWNER APPROVAL`  
**Người phê duyệt duy nhất:** chủ sở hữu dự án (Đỗ Văn Đạt). Agent, reviewer, automated test **không** tự thay trạng thái phê duyệt.

> Đây là **implementation plan**, không phải chứng nhận sẵn sàng production, không phải văn bản xác nhận thẩm quyền pháp lý của một xã. Các hành động làm thay đổi schema cloud, tài khoản thật, dữ liệu có thật hoặc triển khai production nằm ở các task triển khai sau, phải đi qua gate và approval cụ thể. Bộ plan này không tự thực thi chúng.

## 1. Kết luận điều hành

Mục tiêu không phải tăng thêm số màn hình. Mục tiêu là biến source prototype thành **PVH Management Platform / PVH Workbench**: một codebase dùng chung để cấu hình và triển khai cho nhiều Phòng Văn hóa – Xã hội cấp xã; mỗi hồ sơ/công việc có chủ thể chịu trách nhiệm, workflow, nguồn dữ liệu, quyền, lịch sử và số liệu báo cáo truy vết được.

### Phạm vi MVP ưu tiên

1. **M00 — Platform/Auth:** xác thực thật, đơn vị/cơ cấu/phân công/role/permission/scope và audit.
2. **M01 — Core Work:** giao việc, tiếp nhận, thực hiện, phối hợp, trình rà soát, trả lại, hoàn thành; quản lý trạng thái, SLA, minh chứng, lịch sử.
3. **M04 — Vertical slice văn hóa:** bình xét danh hiệu văn hóa từ đơn vị/thôn cung cấp dữ liệu tới PVH rà soát, trình cấp có thẩm quyền, ghi nhận kết quả nguồn và báo cáo. Rule demo không tự trở thành quy tắc pháp lý.
4. **M05 + M01 — Vertical slice kế hoạch/CĐS:** lập kế hoạch, giao nhiệm vụ, thu thập chỉ tiêu, xác nhận kết quả, chốt kỳ; ưu tiên tái dùng core thay vì làm một phần mềm kế hoạch độc lập.
5. **M08 — Mini-flow:** cuộc kiểm tra, checklist, kiến nghị, khắc phục và theo dõi đóng việc; tách thẩm quyền xử phạt/quyết định hành chính ra khỏi hoàn thành task.
6. **M09 — Reporting:** 5 báo cáo demo có nguồn, kỳ, bộ lọc, drill-down, snapshot bất biến và tệp PDF/XLSX hợp lệ.
7. **M10 — Integration boundary:** một import CSV/Excel có preview/validation/commit/receipt và một adapter mô phỏng minh bạch; không dựng sẵn các kết nối bên ngoài chưa có quyền/contract.

**Ngoài MVP:** không xây cổng dịch vụ công thay hệ thống chính thức; không vận hành trường học, bệnh viện, thanh toán trợ cấp; không tự nhận quyền ký/ban hành/công nhận; không triển khai IOC toàn xã; không xây module AI/RAG phục vụ cán bộ trước khi có nhu cầu, nguồn dữ liệu và chính sách riêng.

## 2. Chiến lược nhiều xã — quyết định kiến trúc hai tầng

- **MVP:** một xã cho một deployment/database (phù hợp cloud singleton hiện tại), một source code + cùng artifact, cấu hình xã tách khỏi code. Không cung cấp nút tự chuyển xã trong deployment này.
- **Đích dài hạn:** cho phép nhiều xã dùng chung hạ tầng **hoặc** triển khai độc lập bằng cùng source/artifact. Việc chọn pooled multi-tenant phụ thuộc yêu cầu vận hành, ngân sách, thẩm quyền chia sẻ dữ liệu và phép thử cách ly; không tự đổi mô hình trong phase MVP.
- `tenant_id` vẫn tồn tại trong contract để hỗ trợ khả năng di trú; không sử dụng nó như bằng chứng rằng hệ thống đã hỗ trợ nhiều tenant runtime.
- **Clone = cấu hình và provision instance mới**, không tạo fork code hoặc branch vĩnh viễn cho mỗi xã.

**Decision cần chủ dự án duyệt ở Gate G0:** `D-001` phạm vi một xã/instance ở MVP, `D-002` hai E2E + một mini-flow, `D-003` dữ liệu minh họa không có giá trị pháp lý, `D-004` mọi quyền/thẩm quyền phải đối chiếu nguồn và phân công thực tế, `D-005` chỉ một người duyệt. Nếu một quyết định thay đổi, phải lập change request có ảnh hưởng phase/gate, không sửa lén baseline.

## 3. Baseline đã kiểm chứng / chưa kiểm chứng

| Nội dung | Evidence 08/11/2026 | Ý nghĩa |
|---|---|---|
| Repo GitHub | `main@8fc0fdbf`, 344 file trong tree | Baseline để đối chiếu diff, không mặc nhiên là build xanh |
| Supabase cloud | 14 bảng public, 2 migrations `20261108054202`, `20261108054701` | Chỉ có foundation một xã; 9 migration tại `supabase/migrations/` chưa đồng nhất cloud |
| Quyền cloud | 5 roles và 10 permissions, tập trung M00/M01 | Chưa hỗ trợ quyền M02–M09 như UI/code yêu cầu |
| Dữ liệu cloud | Có 1 Auth user nhưng 0 membership/work_items/audit tại thời điểm kiểm tra | Chưa có luồng đăng nhập/tác nghiệp thật được xác minh |
| Source demo | `src/app/(legacy)`, `src/lib/tenancy/demo-context.tsx`, `localStorage` | Phải gắn nhãn/khóa môi trường, không dùng dữ liệu thật |
| Test | Tài liệu công bố 322 PASS; nhiều Tier 4 chỉ kiểm tra source string | Không được gọi là browser E2E hoặc UAT nghiệm thu |
| Báo cáo | Xuất XLSX/PDF là text representation; KPI có fallback giả | Chưa đạt data lineage và tệp hợp lệ |
| Deployment | Chưa quan sát đủ browser→API→DB→read-back tại Vercel staging | Cần kiểm chứng độc lập trong phase cuối |

**Lưu ý thay đổi sau audit:** Hai commit mới nhất có tiêu đề `Refactor UI: Clean up demo badges, module codes, and standardize official administrative naming` và `Support dedicated admin account with SYSTEM_ADMIN authorization`. Diff GitHub cho thấy thay đổi tại trang đăng nhập, navigation, layout, các màn hình module và một số query/component. Vì chưa chạy lại toàn bộ kiểm thử của 2 commit này, các phát hiện audit ở SHA `8fc0fdbf` là **baseline cần xác minh lại tại P00-02/P00-05**, không phải kết luận rằng mọi lỗi vẫn còn ở SHA mới. Đặc biệt phải thử quyền `SYSTEM_ADMIN` trên API/RLS và kiểm tra tách biệt quyền quản trị hệ thống với quyền đọc hồ sơ nhạy cảm.

**Source evidence quan trọng:** `README.md`, `DB_DEPLOYMENT_RECEIPT.md`, `supabase/README.md`, `docs/business/FUNCTION_MAP_PVH_v0.1.md`, `docs/business/REVIEW_FUNCTION_MAP_PVH_v0.1.md`, `tests/e2e/tier4_commune_scenarios/test_commune_scenarios.py`, `src/lib/auth/request-context.ts`, `src/features/m01-core-work/server/repository.ts`, `src/features/m06-health-social/server/actions.ts`, `src/features/m09-reporting/server/export-service.ts`.

## 4. Thứ tự phase và cổng kiểm soát

| Phase | Mục tiêu | Ước lượng làm việc tập trung* | Gate |
|---|---|---:|---|
| PH00 | Chốt scope, source-of-truth, baseline và phân loại PASS thật/giả | 3–5 ngày | G0 SCOPE/BASELINE |
| PH01 | CSDL reproducible, Auth, M00, RLS, audit, storage | 6–10 ngày | G1 PLATFORM |
| PH02 | M01 Core Work E2E, SLA, phân công, trạng thái, concurrency | 8–12 ngày | G2 CORE WORK |
| PH03 | M04 bình xét văn hóa + M05 kế hoạch/CĐS + M08 mini-flow | 12–20 ngày | G3 DOMAIN VERTICALS |
| PH04 | M09 báo cáo thật + M10 import/adapter tối thiểu | 7–12 ngày | G4 DATA/REPORTING |
| PH05 | UAT, security, CI, Vercel staging, backup/restore, clone xã mới | 8–14 ngày | G5 RELEASE CANDIDATE |
| PH06 | Mở rộng M02/M03/M06/M07 và phần còn lại theo backlog đã duyệt | Theo từng OP pack | G6 DOMAIN RELEASE |

*Ước lượng **không phải cam kết**; dùng cho một luồng triển khai chính với hỗ trợ AI, chưa gồm thời gian chờ quyết định nghiệp vụ/pháp lý, nguồn dữ liệu và cơ quan phối hợp. Không chạy phase kế tiếp khi gate trước chưa PASS. Có thể làm nghiên cứu/thiết kế song song nhưng không merge tính năng làm lệch DB baseline.

### Đường đi tối thiểu đến MVP có ích

`PH00 → PH01 → PH02 → (PH03: M04 + M05 + M08) → PH04 → PH05`.

PH06 là backlog mở rộng sau khi đã có MVP thực sự; không để các module khác kéo chậm luồng lõi. Nếu thiếu căn cứ nghiệp vụ M04, vẫn có thể tiếp tục xây core và dữ liệu demo minh họa nhưng **không** tự xác nhận rule hoặc vượt qua gate có điều kiện pháp lý.

## 5. Tiêu chuẩn task và receipt

Mỗi task trong các tệp `PHxx_*.md` phải ghi:

1. `ID`, mục tiêu, phạm vi đúng module, điểm vào `OP/REQ/WF`, mã source code hoặc DB liên quan.
2. **Input evidence:** baseline SHA, quyết định/assumption, dữ liệu thử, phụ thuộc và quyền thao tác.
3. **Implementation steps:** sửa tối thiểu theo dependency, không tự mở rộng phạm vi.
4. **Test matrix:** happy path, invalid, forbidden, concurrency/idempotency, dữ liệu nhạy cảm nếu có; kiểm chứng read-back DB.
5. **Evidence:** diff files, test command/result, DB query kiểm chứng đã khử PII, ảnh/kịch bản browser khi cần, migration ID và rollback strategy.
6. **Exit criteria:** PASS/FAIL cụ thể, owner signoff. Kết quả `PARTIAL`, `NOT_RUN`, `BLOCKED` không được coi là PASS.

### Trạng thái duy nhất được phép

`TODO → READY → IN_PROGRESS → IMPLEMENTED → VERIFIED → OWNER_ACCEPTED`. Nhánh `BLOCKED`/`REWORK` có lý do. `IMPLEMENTED` ≠ `VERIFIED`, `VERIFIED` ≠ `OWNER_ACCEPTED`.

### Quy tắc chống PASS giả

- Test chỉ kiểm tra tên tệp/hàm/chuỗi được gắn nhãn `STATIC_CONTRACT`; không được cộng vào tỷ lệ browser E2E.
- `PASS` của một action yêu cầu xác thực, thực thi, kiểm tra lỗi, read-back được bản ghi mới với actor/scope đúng; audit/transaction phải khớp.
- `0`, `NULL`, lỗi RPC, lỗi mạng và thiếu quyền không được chuyển thành số liệu seed hoặc `ok` giả.
- DB cloud không tự migrate trong CI `push`; chỉ chạy trên môi trường được duyệt và có preflight/backup/rollback.
- Các tài liệu Delivery/README phải ghi chính xác `tested_on`, commit SHA, DB migration version và giới hạn đã kiểm chứng.

## 6. Danh mục tài liệu trong gói

- `PH00_BASELINE_SCOPE.md`: scope reset, decision log, coverage, nguồn hợp đồng/pháp lý.
- `PH01_PLATFORM_DB_AUTH.md`: schema, migrations, tenant, Auth, RBAC/ABAC, audit, Storage.
- `PH02_CORE_WORK.md`: công việc/case engine, transition, dashboard, race/idempotency.
- `PH03_DOMAIN_VERTICALS.md`: M04 văn hóa, M05 kế hoạch/CĐS, M08 kiểm tra.
- `PH04_REPORTING_INTEGRATIONS.md`: báo cáo M09 và nhập/tích hợp M10.
- `PH05_RELEASE_CLONE.md`: CI/E2E, UAT, Vercel staging, vận hành, clone xã.
- `PH06_DOMAIN_EXPANSION.md`: mở rộng các chuyên ngành còn lại không vượt scope.
- `ACCEPTANCE_MATRIX.md`: bộ gate test độc lập, kiểm tra quyền, dữ liệu và hành trình.
- `EXECUTION_PROTOCOL.md`: cách giao task cho Claude Code/Gemini, receipt, phản biện và duyệt một người.

## 7. Nguồn không được phép dùng như sự thật mặc định

- Các số liệu demo trong `localStorage` và `demo/fixtures`.
- Các tiêu chí, ngưỡng điểm, thuật ngữ `APPROVED`/`PAID`/`SIGNED` trong code mà chưa có bằng chứng thẩm quyền và dữ liệu nguồn.
- Tuyên bố `322/322` E2E PASS nếu test thực tế chỉ là static assertion.
- Tài liệu cũ dẫn đường dẫn ngoài repo không thể tái hiện; cần import hoặc dẫn nguồn có version/commit và provenance trước khi READY.
- Các schema/migration có tên mới trong source nhưng không hiện diện ở cloud.

## 8. Lưu ý thay đổi kỹ thuật

- Chỉ mở PR docs/code thuộc task và không overwrite các sửa đổi chưa commit của người dùng.
- Khi phải thay schema, tạo migration có version qua Supabase CLI đang cài và xem `--help` trước; không sửa lại migration đã áp cloud, không sửa migration history để che chênh lệch. Kiểm tra advisors, RLS, grants, storage policy, rollback.
- RPC trong schema `app` cần một API contract cụ thể: schema được expose và gọi có chỉ định `.schema('app')` **hoặc** facade an toàn ở schema expose; không mở rộng quyền toàn bộ schema chỉ để hết lỗi.
- Vercel chỉ chạy web/server/API; Supabase giữ dữ liệu/Auth/Storage. Chỉ cấu hình secrets trên server; không đưa service role vào biến `NEXT_PUBLIC_*`.
- Cấm dùng PII thật trong bản demo, seed, screenshot, log, test report, Git và artifact.

## 9. Điều kiện kết thúc toàn bộ MVP

MVP chỉ có thể đề xuất `OWNER_ACCEPTED` khi G0–G5 PASS; 2 E2E và 1 mini-flow thực sự chạy ở staging với tài khoản và DB; có báo cáo drill-down đọc được và xuất đúng định dạng; dữ liệu tồn tại sau reload; đồng thời chứng minh nhân bản được xã B từ cùng source/artifact mà không fork code. PH06 không phải điều kiện MVP, trừ khi chủ dự án sửa scope.
