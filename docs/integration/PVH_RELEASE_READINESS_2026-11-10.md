# PVH — Sổ nghiệm thu nhánh tích hợp W0–W5 (10/11/2026)

> **Quyết định hiện tại: NO-GO để merge/deploy/pilot.**
> Nhánh `integrate/pvh-backbone-review-20261110`; PR nháp [#12](https://github.com/dovandatym1-ship-it/pvh-demo/pull/12). Reviewer duy nhất: **Đỗ Văn Đạt**.
> Tài liệu này ghi **bằng chứng thực tế**, không suy diễn tài liệu hoặc build thành nghiệp vụ đã nghiệm thu. `main`, các nhánh Phase và dữ liệu Supabase cloud chưa bị thay đổi.

## 1. Phân loại trạng thái

- **CODE_CHECKED**: đã tích hợp/kiểm qua mã nguồn và kiểm thử tĩnh hoặc CI, nhưng **chưa đạt** nghiệm thu có dữ liệu thật.
- **PARTIAL**: cấu phần tồn tại nhưng thiếu parity, nguồn nghiệp vụ, thiết kế, đo đạc hoặc kiểm thử.
- **BLOCKED_ENV**: thiếu Supabase staging biệt lập/preview URL/phiên đăng nhập và dữ liệu để kiểm chứng đầy đủ.
- **BLOCKED_OWNER**: cần người duyệt xác nhận scope, giao diện, thẩm quyền nghiệp vụ hoặc phê duyệt.
- **CI_PASS**: bộ GitHub Actions tại SHA được chỉ rõ đã thành công. **Không tương đương** G-DB/G-SEC/G-FLOW.

## 2. Backlog acceptance — công khai cả phần chưa đạt

| Mã | Trạng thái | Bằng chứng đã có | Chứng cứ/chốt còn thiếu |
|---|---|---|---|
| INT-001 | PARTIAL | Receipt branch tips và nhóm xung đột | Sổ 10 tip SHA đầy đủ được owner khóa |
| INT-002 | PARTIAL | PH01/PH02 cherry-pick theo file, kiểm tra migration | Mỗi commit độc lập cần trạng thái/owner xác nhận |
| INT-003 | BLOCKED_ENV | Chưa có ảnh baseline | 375/768/1024/1440 và 3 vai trò trước-sau; perf baseline |
| INT-004 | BLOCKED_OWNER | ADR một xã/mỗi deployment trong các tài liệu | Owner ký chốt MVP và chính sách dữ liệu tổng hợp |
| INT-005 | PARTIAL | Receipt và conflict matrix | Owner chốt các file có UI legacy chưa thay thế |
| INT-101 | CODE_CHECKED | PH06 + PH03/04/05 safety + main-only được đối chiếu | E2E và parity 16 tệp main ở các tuyến thật |
| INT-102 | BLOCKED_ENV | M00 console, action/RPC, SQL PH01 đã tích hợp | Auth/RLS âm và DB readback trên staging |
| INT-103 | BLOCKED_ENV | M01 create/assign/transition, OCC/guardrail và trang phân trang | Giao/sửa/minh chứng/hộp thư bằng 3 tài khoản thật |
| INT-104 | CODE_CHECKED | Nav fail-closed, route match cụ thể, test PH05 | Browser keyboard và direct-route denial |
| INT-105 | BLOCKED_ENV | 9 migration canonical, 9 legacy archived SHA trùng, ledger CI | **Clean replay**, applied history/checksum, negative RLS/Storage |
| INT-106 | PARTIAL | M04 workflow safe-disable; M01/M06/M09 fail-safe paths | RPC lỗi thực, audit và transaction readback |
| UI-201 | BLOCKED_ENV | Responsive AppShell, Escape/focus mobile | 4 kích thước, zoom và keyboard/focus |
| UI-202 | PARTIAL | Một số style/tokens được dùng chung | Kiểm kê 100% màn ưu tiên, contrast WCAG |
| UI-203 | PARTIAL | M01 list và form; các module có cấu kiện CRUD khác nhau | Chuẩn Table/Filter/Form/Modal, trang và hành động không dead |
| UI-204 | PARTIAL | Alert/error ở các tuyến lõi | Đồng nhất toast/confirm và hồi phục lỗi từng module |
| UI-205 | BLOCKED_ENV | Trang M01 create-list-detail-edit; manager legacy không được mount | End-to-end và visually reconcile modal main; không đưa manager role-bypass trở lại |
| UI-206 | BLOCKED_ENV | M04 an toàn demo, M09 xuất PDF/XLSX tiếng Việt | Mở bản xuất thật, kiểm nguồn và authority |
| UI-207 | BLOCKED_OWNER | Chưa có ảnh chuẩn 4 kích thước | Chủ dự án duyệt before/after + accessibility |
| PERF-301 | BLOCKED_ENV | Dashboard role semantics, KPI drilldown, không dùng mock | Dữ liệu theo 3 role và giao diện thật |
| PERF-302 | CODE_CHECKED | Count `exact/head`, test mô hình 125 bản ghi | Seed 101+ thật và soát RLS với tổng nguồn |
| PERF-303 | CODE_CHECKED | `getWorkItemsPage` với range, exact count, filter/sort | E2E paging, nhiều người dùng và tải thật |
| PERF-304 | BLOCKED_ENV | Chưa đo LCP/INP/CLS | Lighthouse/trace trên profile seed thực tế |
| PERF-305 | PARTIAL | Build CI và các thành phần async | Baseline/target bundle, lazy/error/focus UAT |
| PERF-306 | BLOCKED_ENV | KPI→list route có lọc | 3 role: số liệu→chi tiết→thao tác→số liệu cập nhật |
| CORE-401 | BLOCKED_ENV | Split Screen login, nav fail-closed, request context | Login/logout/forbidden/Storage âm bằng Auth thật |
| CORE-402 | BLOCKED_ENV | OCC/idempotency source, M01 migration guardrails | DB readback và retry/concurrency 3 role |
| CORE-403 | BLOCKED_ENV | Xuất M09 PDF/XLSX/JSON, hash và watermark bản thử | Snapshot nguồn thật, phân quyền, mở file, soát số |
| CORE-404 | BLOCKED_ENV | M10 CSV preview/import MVP theo PH04 | Row errors, receipt và audit khi commit thật |
| CORE-405 | BLOCKED_OWNER | M04 một luồng giới hạn demo, không công nhận pháp lý giả | Căn cứ/quy tắc/actor/phê duyệt nghiệm thu nghiệp vụ |
| CORE-406 | PARTIAL | 37 master plan docs, 22 module specs, 128 OP + 5 M11 draft | Từng OP có route/API/DB/quyền/test/nguồn; chưa đủ để tuyên bố 100% |
| REL-501 | CI_PASS | Integration CI, CI chung, PH05 tại SHA đính kèm mục 3 | HEAD mới phải liên tục xanh trước review |
| REL-502 | BLOCKED_ENV | Chưa có signed-in staging E2E | E2E các tuyến lõi và browser screenshots |
| REL-503 | BLOCKED_ENV | SQL guardrail tĩnh, không đụng cloud | Fresh replay, âm tenant/hamlet/role, Storage, file |
| REL-504 | BLOCKED_ENV | Chưa có UX/perf measurements | Scorecard có đo, ảnh và baseline |
| REL-505 | BLOCKED_OWNER | PR #12 là **draft**, main giữ nguyên | Chủ dự án duyệt quyết định cuối và merge thủ công |
| REL-506 | PARTIAL | Branch history, receipt xung đột, rollback dự kiến | Sổ từng nhánh INTEGRATED/SUPERSEDED/DEFERRED và hành động khôi phục kiểm chứng |

> **Không có hạng mục nào đổi trạng thái thành nghiệm thu hoàn chỉnh chỉ do CI xanh.** Các mục `CODE_CHECKED` / `CI_PASS` là bằng chứng lớp mã nguồn.

## 3. Evidence index

| Mốc mã | Kết quả | Link |
|---|---|---|
| `e90e7929be18f417ad0c8f3b0234df408a4782d6` | CI chung PASS | [run 42675803694](https://github.com/dovandatym1-ship-it/pvh-demo/actions/runs/42675803694) |
| `e90e7929be18f417ad0c8f3b0234df408a4782d6` | Integration candidate gate PASS | [run 42675805528](https://github.com/dovandatym1-ship-it/pvh-demo/actions/runs/42675805528) |
| `e90e7929be18f417ad0c8f3b0234df408a4782d6` | PH05 release candidate PASS | [run 42675803518](https://github.com/dovandatym1-ship-it/pvh-demo/actions/runs/42675803518) |
| `223411b43216029128f542117bf9d351a38545eb` | M01 hamlet scope fix, **3 CI PASS** | [CI](https://github.com/dovandatym1-ship-it/pvh-demo/actions/runs/42676418268) · [Integration](https://github.com/dovandatym1-ship-it/pvh-demo/actions/runs/42676418336) · [PH05](https://github.com/dovandatym1-ship-it/pvh-demo/actions/runs/42676418360) |
| `78c1750b575a16ac88ae7765ca3c6f71d1c25a44` | Auth scope normalization committed; CI not yet certified | [commit](https://github.com/dovandatym1-ship-it/pvh-demo/commit/78c1750b575a16ac88ae7765ca3c6f71d1c25a44) |

Mốc `223411b4` sửa `getActiveHamlets` dùng `ctx.scopes.hamletIds` (không phải `org_unit_ids`), trả rỗng khi quyền địa bàn bị giới hạn thành danh sách rỗng, truy vấn bằng `in(id)`, và chặn lọc tới thôn/xóm ngoài scope. `tests/m01-hamlet-scope.test.mjs` chạy trong Integration CI. Mốc `78c1750b` phát hiện hợp đồng SQL RLS sử dụng `org_unit_ids` còn RequestContext đọc `hamletIds`: thêm adapter auth **không mở rộng quyền**, giao nhau nếu cả hai key có mặt, và test các trường hợp `undefined`/rỗng/sai kiểu. Cần chứng minh lại bằng RLS thật trên staging.

## 4. W6 / 128 OP — không giấu nghiệp vụ còn thiếu

- 128 OP trong `OP_FUNCTION_SCREEN_CODE_DB_CROSSWALK.csv` là danh mục **đã kiểm kê**, không phải 128 chức năng hoạt động. M11 có 5 feature draft không cộng lẫn số OP gốc.
- M02/M03/M05/M06/M07/M08/M11 và các nhánh chi tiết của M04 vẫn nhiều field, rule, workflow, CRUD, nguồn pháp lý chưa được xác nhận. Không bật action ra quyết định hành chính khi thiếu thẩm quyền.
- M01 cần thống nhất danh mục lĩnh vực qua owner M11; biểu mẫu hiện nhận mã lĩnh vực tự do. Giữ contract để không tự áp đặt taxonomy.
- `work-item-manager.tsx` là code **legacy chưa gắn vào trang M01**: lọc cục bộ có nguy cơ chặn 100 bản ghi, quyền dựa role strings và transition thiếu idempotency key. **Không phục hồi component này** khi merge; nếu cần modal từ main, rewrite trên dữ liệu phân trang/action rõ quyền và test lại.
- M06 đối tượng hưởng trợ cấp, M07 tôn giáo và file evidence là nhóm kiểm thử âm quyền/bảo mật bắt buộc, kể cả khi đã che dữ liệu ở DTO.

## 5. Runbook để đóng G-DB/G-SEC/G-UX/G-PERF/G-FLOW

1. **Cho phép một môi trường staging tách biệt** với `Demo-pvh`, không dùng dữ liệu thật. Lưu applied migration ledger hiện tại chỉ để đối chiếu, tuyệt đối không `db push` vào cloud production.
2. Tạo Postgres/Supabase staging sạch; chạy **9 migration canonical** từ `supabase/migrations/` đúng thứ tự và kiểm extension/RLS/RPC/Storage. Kiểm checksum/tương thích trước khi lập phương án update cloud.
3. Seed dữ liệu giả: tối thiểu **101 công việc** (để bắt KPI cap), nhiều trạng thái/hạn, hai tenant giả định hoặc dữ liệu phân biệt để test cross-scope; ít nhất 3 tài khoản đã phân quyền (lãnh đạo, công chức, trưởng thôn); bản ghi y tế nhạy cảm và file. Không đặt thông tin cá nhân thật.
4. Với từng role: login→dashboard→lọc công việc→chi tiết→tạo/giao/chuyển→readback; test forbidden direct route/API/RPC, tenant/hamlet khác, tệp riêng tư, retry trùng khóa, OCC 409, snapshot báo cáo, CSV invalid, audit.
5. Kiểm tra UX trên 375/768/1024/1440 và keyboard/zoom; đo Web Vitals, query count và bundle, đối chiếu KPI với SQL `count` cùng phạm vi.
6. Phân loại lỗi P0/P1/P2, sửa trực tiếp nhánh integration, rerun 3 CI gates và E2E đến khi không còn P0. Chốt scope còn DEFER theo mỗi OP; chủ dự án duyệt PR một lần sau khi xem receipts.

**Bắt buộc xác nhận riêng** trước (a) tạo môi trường staging/tạo tài khoản/ghi DB từ xa, (b) triển khai Vercel preview, (c) sửa cloud Demo-pvh, và (d) merge `main`. Quyền hiện tại chỉ cho phép code, tài liệu, CI nhánh tích hợp; không suy rộng thành các hành động này.

## 6. Release decision

- **Đã làm được trong phạm vi nhánh:** reconciled code từ các Phase, các tuyến cốt lõi, sửa nhãn tiếng Việt, dashboard count, login, thông báo, guardrail migration và source CI.
- **Chưa đạt definition of done W0–W5:** staging & RLS/Storage, xác thực Auth thật, browser UAT, measured performance, owner approval; không có quyền đánh dấu PASS.
- **Quyết định:** giữ PR #12 ở dạng **DRAFT / NO-GO**. Không merge `main`, không deploy và không tự thay đổi Supabase cloud.

## 7. Bổ sung bằng chứng thực hiện — 10/11/2026 (sau W0–W5 baseline)

> **Không đổi release verdict:** NO-GO. Bằng chứng dưới đây chỉ đóng các kiểm thử *cục bộ*. G-DB/G-SEC trên staging và G-COVERAGE 128 OP vẫn chưa đạt.

| Mã | Kết quả mới | Bằng chứng / giới hạn |
|---|---|---|
| DB-LOCAL-01 | **PASS** | [Workflow local replay + pgTAP](https://github.com/dovandatym1-ship-it/pvh-demo/actions/runs/42741880487): 9 active migration sạch, M01, M04/M05/M08, thông báo và avatar. Không sử dụng Supabase cloud. |
| SEC-LOCAL-02 | **PASS** | [RLS negative hai người nhận](https://github.com/dovandatym1-ship-it/pvh-demo/actions/runs/42742938865): Auth A/B giả lập, chỉ được đọc/cập nhật thông báo của chính mình; anon bị từ chối. Không thay thế E2E Auth ngoài cloud. |
| APP-AUTH-03 | **CODE_CHECKED** | Layout `src/app/(app)/layout.tsx` chặn toàn bộ children khi `getRequestContext` thất bại; `tests/app-layout-auth-guard.test.mjs` vào CI. Các trang con/action vẫn phải kiểm quyền độc lập. |
| M06-ATOMIC-04 | **BLOCKED_BY_DESIGN** | `createBeneficiaryAction` được fail-closed thay cho insert trực tiếp + audit request rời rạc; mở lại sau khi có approved atomic RPC, RLS, schema và pháp lý. Không tuyên bố M06 CRUD hoàn thành. |
| CLOUD-READ-05 | **READ-ONLY** | `Demo-pvh`: đúng 2 applied migrations, 14 bảng nền tảng có RLS, không có bảng M02/M03/M06/M07. [Receipt chi tiết](PVH_CLOUD_SCHEMA_READBACK_2026-11-10.md). Supabase advisor cảnh báo leaked-password protection đang tắt. |
| DEPLOY-06 | **NOT_READY** | Trên tài khoản Vercel kết nối chưa tìm thấy dự án PVH; chưa có preview URL, environment hoặc staging độc lập để nghiệm thu browser. |

**Hành động còn bắt buộc:** môi trường Supabase staging riêng và Vercel preview; kiểm tra quyền và Storage qua API/Browser thực, source→KPI readback, kiểm thử hai xã độc lập, khắc phục thiếu schema/CRUD/field/rule của 128 OP, UAT, backup/restore, chốt chi phí và owner quyết định merge. Mọi tính năng hành chính chưa có thẩm quyền đã kiểm chứng tiếp tục ở chế độ minh họa/chưa mở tác vụ chính thức.
