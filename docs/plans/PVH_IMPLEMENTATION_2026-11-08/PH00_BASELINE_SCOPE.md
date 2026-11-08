# PH00 — Khóa scope, baseline và evidence

**Gate:** G0 `SCOPE/BASELINE` · **Phụ thuộc:** quyền đọc repo và cloud · **Ưu tiên:** P0 · **Ước lượng:** 3–5 ngày

## Mục tiêu và điểm ra

Một source of truth được kiểm chứng cho code, migration, tài liệu BA và scope MVP. Không sửa vội schema cloud. Không triển khai thêm module khi chưa chốt mô hình deployment và danh sách luồng được demo sâu.

| ID | Task / thao tác cụ thể | Đầu ra và ACCEPTANCE |
|---|---|---|
| P00-01 | Freeze `main` SHA, thông tin node/Next/Supabase versions, danh sách paths, commit/release hiện tại; lưu manifest; chỉ đọc, không reset | `BASELINE_MANIFEST.md` có SHA, tree, ngày giờ; mọi task sau trỏ đúng baseline hoặc changelog |
| P00-02 | So sánh `supabase/deployed/*`, `supabase/migrations/*`, `_legacy/*`, `seed.sql`, migrations cloud; lập bảng object/column/function/role/policy/grant | `DB_DRIFT_MATRIX.md`: có/thiếu/khác/conflict theo từng object; chưa chạy `db push` |
| P00-03 | Chốt single-commune per deployment cho MVP và chính sách chuyển qua multi-tenant pooled trong tương lai; phân biệt tenant identity, jurisdiction, org unit, role, record scope | `ADR-003_DEPLOYMENT_TENANCY.md` được owner duyệt; code không có 2 runtime modes mâu thuẫn |
| P00-04 | Kiểm kê 128 OP, 76 REQ, 8 DEM-ADD, 11 WF; đếm tình trạng `DISCOVERED`/`SPECIFYING`; ánh xạ 2 E2E + 1 mini-flow và 5 báo cáo | `MVP_SCOPE_MATRIX.csv`: mỗi OP có disposition, phase, source, status, owner; không hứa đủ 128 OP trong MVP |
| P00-05 | Rà nguồn pháp lý và thẩm quyền theo phiên bản/ngày hiệu lực, phân biệt nhiệm vụ tham mưu và quyền ra quyết định; lập mục cần xác minh | `LEGAL_AUTHORITY_REGISTER.md`: mỗi rule có nguồn, hiệu lực, phạm vi, trạng thái `VERIFIED/UNVERIFIED`; không tự duyệt nghiệp vụ |
| P00-06 | Đối chiếu menu/route/Function Map, danh mục 59 screen đề xuất với 11 route mới và legacy hiện có; loại link chết và màn không phù hợp persona | `SCREEN_ROUTE_GAP.md`, route manifest có owner module, readiness, persona; không xem menu có sẵn là nghiệp vụ xong |
| P00-07 | Kiểm tra các tuyên bố 322 PASS, 46/46 SQL checks, Gate G0–G3 trong receipt; phân loại STATIC / UNIT / INTEGRATION / BROWSER / CLOUD DB / MANUAL | `TEST_EVIDENCE_CLASSIFICATION.md`; các PASS không có run-id/evidence chuyển về `NOT_VERIFIED` |
| P00-08 | Lập register bug theo severity, repro, impact, evidence: RPC schema, false-success, audit silent, fake exports, permission mismatch, job drift, KPI | `ISSUE_REGISTER.md`: P0/P1/P2, task ID, acceptance test, blocker; không ghi đóng khi mới sửa text |
| P00-09 | Kiểm tra source-of-record từng nhóm dữ liệu: PVH sở hữu việc nội bộ, các dữ liệu dân cư/TTHC/y tế/người có công có nguồn chính thức riêng | `DATA_OWNERSHIP_MATRIX.md`: master/reference/snapshot/cache, retention, import permission và PII |
| P00-10 | Kiểm kê môi trường, config, feature flags, secrets names (không đọc/ghi giá trị bí mật), Vercel project/staging, Supabase project/storage | `ENVIRONMENT_MATRIX.md` dev/test/staging/prod, demo flag allowed matrix; không log secrets |
| P00-11 | Chốt vai trò sản phẩm và RACI nhẹ: owner duy nhất duyệt, agent implement/review/test không có quyền đóng quyết định thay owner | `DECISION_LOG.md` có D-001..D-005, người duyệt, timestamp, impact |
| P00-12 | Sửa README/delivery claims sai sau khi xác thực baseline: trạng thái cloud, test, scope và link docs ngoài repo | README ghi trạng thái thật, nguồn không có đánh dấu `MISSING_SOURCE`; không thay acceptance bằng văn xuôi |

## Cổng G0 — PASS khi

1. Không còn hai baseline DB được tuyên bố đều là source-of-truth. Có migration strategy được duyệt **trước** DDL.
2. Mỗi P0 bug có testcase và phase fix cụ thể; không có P0 không người nhận.
3. Ba flow MVP và 5 báo cáo có boundary đúng thẩm quyền. Luồng mang tính pháp lý chưa xác minh được gắn `ILLUSTRATIVE_ONLY`.
4. Đủ trace tối thiểu `source/BL/REQ → OP → WF → screen → API/data → AC` cho các OP trong MVP.
5. Chủ dự án ký `G0: OWNER_ACCEPTED`. Nếu không: `BLOCKED` và ngừng phát triển domain mới.

## Negative tests / tình huống bác bỏ

- Một markdown ghi migration đã áp dụng nhưng cloud không có → FAIL.
- Test đọc chữ `transition_work_item` rồi báo “E2E chuyển trạng thái PASS” → FAIL.
- Menu mới có route nhưng route chưa có handler hoặc không đúng permission → FAIL.
- Một task muốn tự triển khai quyền ra quyết định khi thẩm quyền `UNVERIFIED` → BLOCKED.

## Rủi ro / rollback

PH00 chỉ đọc và sửa tài liệu. Nếu repo thay HEAD trong lúc kiểm kê, đóng snapshot cũ, so sánh diff, đánh dấu baseline mới; không ghi đè code. Nếu tài liệu gốc đang ngoài repo không truy cập được, tạo evidence gap thay vì điền giả.
