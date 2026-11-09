# PVH — Branch tip & disposition ledger (10/11/2026)

**Phạm vi:** read-only snapshot GitHub 20 refs tại thời điểm kiểm kê. Đây là ledger đối soát để duyệt PR #12, **không phải lệnh merge** và không thay thế commit-by-commit audit. Nhánh main và các Phase giữ nguyên.

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
| `integrate/pvh-backbone-review-20261110` | `223411b43216` | CANDIDATE | PR #12 nháp; CI source static, chưa đủ nghiệm thu môi trường |
| `plan/pvh-master-integration-ux-first-20261109` | `b491c7375a47` | PLAN_INVENTORY | 37 master plan docs; bản mới tip có thể còn chưa đưa vào manifest |

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

**Chốt:** PR vẫn **DRAFT / NO-GO**, dữ liệu Supabase cloud và Vercel không thay đổi, một reviewer Đỗ Văn Đạt quyết định sau khi có G-DB/G-SEC/G-FLOW/G-UX/G-PERF.
