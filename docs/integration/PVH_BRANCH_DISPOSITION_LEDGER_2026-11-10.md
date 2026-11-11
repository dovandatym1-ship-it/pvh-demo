# PVH — Branch tip & disposition ledger (updated 11/11/2026)

**Phạm vi:** read-only ref snapshot sau `git fetch origin --prune` ngày 11/11/2026; tree audit PR #1–#11 được tính lại trên candidate source commit `46d3953`. Đây là ledger đối soát để duyệt PR #12, **không phải lệnh merge** và không chứng minh runtime/owner acceptance. Nhánh main và các Phase giữ nguyên.

| Nhánh | Tip SHA (12 ký tự đầu) | Quyết định source | Điều kiện / giải thích |
|---|---|---|---|
| `main` | `e08fa3587bed` | BASE | Giữ nguyên làm base; 16 thay đổi UI/M01 cần đối chiếu manual |
| `docs/pvh-full-module-spec-20261109` | `77c4e066b0fe` | DOC_INVENTORY | 22 module specs đã nhập; spec không chứng minh runtime |
| `feat/pvh-dashboard` | `90c479fedb2f` | SELECTIVE_PORT | Giao diện dashboard đã nối count chính xác và lọc quyền; visual/perf chờ |
| `feat/pvh-government-login-split-screen` | `91b37883b426` | SELECTIVE_PORT | Login Split Screen đã nhập; browser/auth pending |
| `feat/pvh-personal-profile-notifications-20261109` | `282aa8d941b6` | SELECTIVE_PORT | Trang cá nhân, notifications, UI và SQL đã nhập; Storage/RLS pending |
| `feat/pvh-ph01-platform-auth` | `48d98e9b6dd8` | SELECTIVE_BACKPORT | M00 action và security contract vào candidate; live RPC/RLS chưa kiểm |
| `feat/pvh-ph02-core-workflow` | `18280d1e3ead` | SELECTIVE_BACKPORT | M01 workflow + forms + SQL vào candidate; cần DB/E2E |
| `feat/pvh-ph03-domain-verticals` | `5876113884ca` | INHERITED | Nằm trong PH06 v2 cumulative, không cần merge đè |
| `feat/pvh-ph04-reporting-integrations` | `223baa3473ca` | INHERITED | Nằm trong PH06 v2; M09/M10 cần staging |
| `feat/pvh-ph05-release-clone` | `8eb29aa90ea1` | INHERITED | Nằm trong PH06 v2; CI PH05 đã có gate |
| `feat/pvh-ph06-domain-expansion` | `a488cd5f1e1d` | SUPERSEDED_DOC | Bản kế hoạch cũ; code lấy PH06 v2 |
| `feat/pvh-ph06-domain-expansion-v2` | `c4fc1011ac15` | CUMULATIVE_SOURCE | Nguồn nền PH03–PH06 của nhánh tích hợp |
| `fix/pvh-ph02-completion-20261109` | `521e6fe75fe7` | BACKPORTED | Cập nhật form/M01 query và luật thao tác cho nhánh tích hợp |
| `fix/pvh-ph03-crud-ux-20261109` | `4304097d9a56` | INHERITED_PATCH | Đã đối soát delta an toàn PH03 với cây PH06 |
| `fix/pvh-ph04-data-quality-20261109` | `b76423e8897c` | INHERITED_PATCH | Đã đối soát delta an toàn PH04 với cây PH06 |
| `fix/pvh-ph05-clone-brand-20261109` | `36fa5c3feb4b` | INHERITED_PATCH | Đã đối soát delta an toàn PH05 với cây PH06 |
| `fix/pvh-ph06-data-safety-20261109` | `0506748c01f8` | CUMULATIVE_SOURCE | Nguồn v2 PH06 an toàn cho PII và territorial scope |
| `fix/pvh-vietnamese-language-standardization-20261109` | `144272f730c3` | SELECTIVE_PORT | Bộ quét nhãn và các màn ưu tiên đã đưa vào; UAT ngữ nghĩa pending |
| `integrate/pvh-backbone-review-20261110` | `46d3953` | CANDIDATE / no application-code path remains unchanged from base; four remaining paths are CI workflow/docs deltas, with workflow replacements present | Tree audit không chứng minh semantic acceptance. CI, field coverage, business/owner acceptance và staging G-DB/G-SEC/G-FLOW/G-UX/G-PERF chưa đóng |
| `plan/pvh-master-integration-ux-first-20261109` | `b491c7375a47` | PLAN_INVENTORY | 37 master plan docs; bản mới tip có thể còn chưa đưa vào manifest |

## Đối soát tree PR #1–#11 với candidate

Sau `git fetch origin --prune`, lấy base `main@e08fa3587bede82be6ea77c45d7a83a76cf9be24` và candidate `46d3953`. Với mỗi `pr/N`, lập tập path có blob content khác base, rồi phân loại tree entry ở candidate: giống PR; giữ nguyên như base (delta chưa hiện diện ở path đó); hoặc khác cả hai (đã được viết lại/tiến hóa nhưng phải review). Phép tính tắt rename detection; đối chiếu tree entry (mode/type/blob), không khẳng định runtime hay nghiệp vụ.

| PR | Head SHA | Path khác base | Candidate giống PR | Candidate giữ blob base | Candidate khác cả hai |
|---:|---|---:|---:|---:|---:|
| #1 | `48d98e9b6dd8b0084f51c744d4f6208bf49b4802` | 78 | 44 | 1 | 33 |
| #2 | `18280d1e3eadefe073b678a903f6e11ae8ddba9e` | 84 | 56 | 1 | 27 |
| #3 | `5876113884ca9eb0325002d0ea352d5ad622668c` | 99 | 67 | 0 | 32 |
| #4 | `223baa3473ca1987f3105e9c28bc90aec7ae474c` | 145 | 97 | 0 | 48 |
| #5 | `282aa8d941b6d6b5f6435cf912223029c6f4e12c` | 24 | 16 | 1 | 7 |
| #6 | `91b37883b4266f292f5fed27a226fcd83582e87d` | 1 | 0 | 0 | 1 |
| #7 | `521e6fe75fe7a36b3e1bf9cdab3ca6fb3435a01c` | 87 | 61 | 2 | 24 |
| #8 | `4304097d9a56d05b326c6f59a6e71a925c2fcea1` | 102 | 74 | 0 | 28 |
| #9 | `b76423e8897cb30bd95522586732754521fb795b` | 148 | 103 | 0 | 45 |
| #10 | `36fa5c3feb4b6e824930c3a89317cb1934452de4` | 155 | 105 | 0 | 50 |
| #11 | `0506748c01f8f43293163b2f529a5c00675c92eb` | 170 | 104 | 0 | 66 |

**Kết luận:** trên source/code paths, không còn file nào candidate giữ nguyên blob của base trong khi PR nguồn thay đổi; mỗi delta hiện hoặc khớp chính xác, hoặc có một bản candidate khác cần semantic review. Các path còn giữ blob base là workflow/docs: PR #1 `db-ci.yml`, PR #5 workflow notification riêng, PR #2/#7 hai tài liệu PH02 cũ. Candidate có `pvh-db-replay.yml` và Integration Gate chạy notification test, còn docs PH02 cần đối chiếu phiên bản hiện hành. Tree comparison không kết luận PR #1–#11 được nghiệm thu nghiệp vụ/runtime.

**Đã port/kiểm tra trên candidate `46d3953`:** lấy hardening của `audit-logger.ts` từ PR #1 (không còn giả actor/tenant/receipt), thêm 3 source guard tests và xóa `work-item-manager` cùng hai modal không còn route sử dụng. Các test guard 14/14, M01 workflow rules 5/5, typecheck, lint và production build PASS cục bộ; lint còn 4 warning legacy. `db-ci.yml` không port nguyên file vì candidate có `pvh-db-replay.yml` chạy local replay 14 migration và bộ pgTAP chọn lọc; workflow Actions hiện vẫn bị chặn trước steps nên chưa có kết quả CI tại candidate mới.

## Nguyên tắc chuyển giao

1. **`INHERITED`** nghĩa là tree Phase sau đã chứa phần mã nền của Phase trước; không tạo merge commit giả để đánh dấu hoàn tất.
2. **`SELECTIVE_BACKPORT`** và **`SELECTIVE_PORT`** chỉ nhận các file/semantics được kiểm; nhận một component không bảo đảm feature đủ CRUD/RLS/E2E.
3. **`INHERITED_PATCH`** đã soát blob/delta tương ứng theo receipt, vẫn phải test môi trường.
4. **`SUPERSEDED_DOC`** không xóa nhánh; giữ làm lịch sử. Trạng thái này không có nghĩa đã hoàn tất OP tương ứng.
5. Không mang lại `work-item-manager.tsx` dạng role fallback/client-list để thay trang phân trang hiện tại. UX modal chỉ phục hồi khi giữ permission guard và transaction của PH02/PH06.
6. **Rollback trước merge**: dừng PR nháp và không cập nhật `main`. Nếu chưa deploy/chạy migration thì rollback chỉ là chọn lại commit candidate đã xác nhận (qua PR/commit mới, không force-reset); mọi schema staging dùng môi trường riêng. **Rollback production không thể chuẩn hóa** khi chưa có snapshot/ledger/owner và sẽ không tự chạy.

## Sổ bằng chứng

- Base `main@e08fa3587bede82be6ea77c45d7a83a76cf9be24`.
- Receipt chi tiết: `docs/integration/PVH_INTEGRATION_CANDIDATE_RECEIPT_2026-11-10.md`.
- Nhận định từng gate: `docs/integration/PVH_RELEASE_READINESS_2026-11-10.md`.
- CI thành công `e90e7929`: [CI](https://github.com/dovandatym1-ship-it/pvh-demo/actions/runs/42675803694), [Integration](https://github.com/dovandatym1-ship-it/pvh-demo/actions/runs/42675805528), [PH05](https://github.com/dovandatym1-ship-it/pvh-demo/actions/runs/42675803518).
- CI thành công `223411b4`: [CI](https://github.com/dovandatym1-ship-it/pvh-demo/actions/runs/42676418268), [Integration](https://github.com/dovandatym1-ship-it/pvh-demo/actions/runs/42676418336), [PH05](https://github.com/dovandatym1-ship-it/pvh-demo/actions/runs/42676418360).
- `78c1750b` bổ sung chuẩn hóa `org_unit_ids` → `hamletIds` và test; link CI HEAD cập nhật sau khi chạy xong.
- PR #12 refreshed HEAD `a7e4fa67b106bb3920f649916093395aaa9b7cfa`: [CI Node 22](https://github.com/dovandatym1-ship-it/pvh-demo/actions/runs/42794311773), [Integration Candidate Gate](https://github.com/dovandatym1-ship-it/pvh-demo/actions/runs/42794311853), [PH05 Release Candidate Gate](https://github.com/dovandatym1-ship-it/pvh-demo/actions/runs/42794311837) all PASS. The 14-migration + pgTAP replay is separately evidenced at `0adec43e`; no migration file changed to `a7e4fa6`.
- D2 source-code checks passed locally at `7a3bc7c`; the documentation-only refresh is now at `2a13091ad4cd8cd3cd1a8bb23487dad5b9023403`. [CI](https://github.com/dovandatym1-ship-it/pvh-demo/actions/runs/42942188484), [Integration Candidate Gate](https://github.com/dovandatym1-ship-it/pvh-demo/actions/runs/42942188495), and [PH05](https://github.com/dovandatym1-ship-it/pvh-demo/actions/runs/42942188567) were blocked before job start. Check annotations cite failed recent account payments or a spending limit requiring an increase; no CI commands ran. The release owner must clear the GitHub billing/spending-limit block and rerun CI.

**Chốt:** PR vẫn **DRAFT / NO-GO**, dữ liệu Supabase cloud và Vercel không thay đổi, một reviewer Đỗ Văn Đạt quyết định sau khi có G-DB/G-SEC/G-FLOW/G-UX/G-PERF.
