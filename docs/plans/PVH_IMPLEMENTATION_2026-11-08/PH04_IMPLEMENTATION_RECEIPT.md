# PH04 Delivery Receipt — M09 / M10

**Ngày:** 2026-11-08 · **Nhánh:** `feat/pvh-ph04-reporting-integrations`

## Phạm vi triển khai

| Backlog | Kết quả ở mức code | Bằng chứng |
|---|---|---|
| P04-01–03 | 5 report catalog, formulaVersion 1, thống kê bằng SQL nguồn PVH, quality NULL/0/NOT_REPORTED | `20261108080000_ph04_reporting.sql`, `PH04_DATA_CONTRACT.md` |
| P04-04–08 | Period; draft, submit, review, finalize; revision; hash canonical PostgreSQL; full contributor lineage; audit transaction | SQL smoke RPT-001/002/003/004 |
| P04-09–11 | PDF/XLSX thật có watermark, trang quản lý snapshot, lịch sử, chuyển trạng thái, diff, drill-down theo quyền | RPT-005 parser, `/bao-cao` |
| P04-12 | Queue xuất file private Storage, retry/backoff, thuê worker theo mã invocation, receipt thật; không đụng job module khác | SQL job/lease tests, `/api/jobs/worker` |
| P04-13–15 | CSV contract v1, preview lỗi từng dòng, duplicate, policy REJECT_ALL/ACCEPT_VALID, provenance và idempotency | INT-001/unit tests, `/nhap-chi-tieu` |
| P04-16–17 | SIMULATED_ECHO_V1 có timeout/schema error/replay ledger; không kết nối nguồn ngoài thật | SQL smoke + UI/API |
| P04-18 | Giới hạn 2 MiB/5.000 dòng, UTF-8 strict, chặn CSV formula, permission checks, export private URL | Unit, SQL role/RLS; **malware scanning vẫn chờ hạ tầng** |

## Test evidence

| Hạng mục | Trạng thái | Ranh giới |
|---|---|---|
| `npm run typecheck` | **PASS** | TypeScript |
| `npm run lint` | **PASS với 3 warning có sẵn** | React Hooks trang legacy `du-lieu-dung-chung` |
| `npm run test:ph04` | **PASS** | Node unit + PostgreSQL 17 tương thích PGlite, 7 migrations local |
| `npm run build` | **PASS** | Next.js 15 production build |
| SQL snapshot/RLS/tenant/roles/lease tests | **PASS tại local** | Không thay thế kiểm thử Supabase hosted |
| GitHub Actions `ph04-ci.yml` | **PENDING remote CI** | Chỉ xác nhận sau khi workflow chạy trên nhánh |
| Browser → API → hosted Supabase → Storage | **BLOCKED** | Cloud hiện chỉ có 2 migration PH01; thiếu PH02/03/04 |
| Worker schedule, ký/scan file/antivirus | **BLOCKED** | Cần cấu hình scheduler/CRON_SECRET/service role và quét mã độc staging |
| G3 prerequisite và G4 owner acceptance | **PENDING** | Không thay người dùng xác nhận |

## Điều kiện triển khai và nghiệm thu G4

1. Audit, merge PH01/PH02/PH03 theo quy trình của chủ dự án; chạy migration reconcile trên **staging được phê duyệt**. Không áp dụng trực tiếp vào Demo-pvh cloud khi chưa khớp baseline.
2. Cấu hình Supabase service role **server-only**, private Storage, cron secret tối thiểu 16 ký tự, scheduler của worker; triển khai cơ chế malware scanning cho nguồn file thật.
3. Kiểm thử người dùng thực: quyền cán bộ/manager/auditor, RPT-001–005, INT-001–002, JOB-001; xác nhận checksum và số liệu bằng read-back cloud; lưu evidence URL/ảnh/log không chứa dữ liệu nhạy cảm.
4. Duyệt danh mục và công thức 5 báo cáo, phạm vi thống kê (toàn xã so với phân quyền xóm), người có thẩm quyền chốt số liệu, biểu mẫu PDF/XLSX, hợp đồng dữ liệu ngoài.
5. Ghi `G4: OWNER_ACCEPTED` **chỉ sau khi** toàn bộ bằng chứng ở trên đạt; tiếp tục PH05 sau G4.

**Verdict:** PH04 code-level implementation and local regression complete; **G4 not accepted / hosted staging not verified**. Không merge vào `main` hoặc gán nhãn 100% khi thiếu nghiệm thu.

## Rollback

- App: revert commit Phase 4 trên nhánh triển khai, không can thiệp dữ liệu/nhánh PH01–PH03.
- Schema: backup/staging restore; các migration PH04 là forward-only. Không xóa hoặc sửa lịch sử migration đã chạy trên hosted Supabase.
