# PH04 — M09 Báo cáo thật và M10 Import/Integration boundary

**Gate:** G4 `DATA/REPORTING` · **Phụ thuộc:** G3 PASS · **Ước lượng:** 7–12 ngày

## 1. Nguyên tắc

Báo cáo là **kết quả kiểm chứng được** từ công việc/hồ sơ/chỉ tiêu, không phải các con số hardcode. PVH là nguồn chính đối với dữ liệu tác nghiệp nội bộ do PVH tạo; với nguồn ngoài hệ thống, phải quản lý nguồn, lần nhập, người xác nhận, quyền sử dụng và provenance. Chốt báo cáo không đồng nghĩa ký số hay phát hành văn bản chính thức.

## 2. M09 Backlog

| ID | Task cụ thể | AC / evidence |
|---|---|---|
| P04-01 | Khóa `REPORT_CATALOG` 5 báo cáo demo: tiến độ công việc; danh hiệu văn hóa; tiến độ kế hoạch/chỉ tiêu; kiểm tra/khắc phục; tổng hợp VH-XH theo kỳ | Mỗi báo cáo có code, đối tượng, bộ lọc, formula, đơn vị, nguồn, owner, kỳ và status; người dùng duyệt mẫu |
| P04-02 | Chuẩn hóa `metric_definition`: formula version, numerator/denominator, filter, time window, timezone, inclusion/exclusion, data quality | `0`, `NULL`, `NOT_REPORTED`, `N/A` hiển thị đúng; không có `tasksCount || 6` |
| P04-03 | Viết query/aggregator server cho từng chỉ tiêu, có RLS và source type; kết quả tổng theo role không tiết lộ PII | SQL tổng hợp và drill-down nhất quán; test fixture biên, không lộ trường bị mask |
| P04-04 | Báo cáo theo kỳ có lifecycle: DRAFT → SUBMITTED/UNDER_REVIEW → FINALIZED → AMENDED; lock kỳ và điều chỉnh | Đã chốt không update-in-place; điều chỉnh tạo revision liên kết snapshot trước |
| P04-05 | Schema `report_snapshots`, `report_snapshot_lineage`, `report_periods`, `report_values` nếu cần; FK và index đúng baseline | Recreate DB, insert/finalize/read/rollback trong transaction an toàn, không duplicate snapshot cùng key |
| P04-06 | Canonical hash: thống nhất thuật toán ở JS và DB; không tự nhận RFC 8785 nếu chưa đạt đầy đủ (number/string normalization) | Test vectors đa kiểu, unicode, nested array/object; hash ổn định khi thứ tự key khác nhau, khác khi nội dung đổi |
| P04-07 | Lineage đóng băng danh sách contributor đúng phiên bản (không chỉ `limit(3)`), source record/metric/filter/cutoff | Click một KPI truy ra đúng record contributor hoặc metadata được phép; thay nguồn sau chốt không làm lệch snapshot |
| P04-08 | Chốt snapshot + lineage trong cùng transaction hoặc workflow bù trừ có trạng thái lỗi minh bạch; audit bắt buộc | Lỗi ghi lineage không được trả FINALIZED thành công; retry idempotent không ghi nhân đôi |
| P04-09 | File XLSX thật với worksheet, định dạng cột/ngày/số; PDF thật với header/footer/đơn vị/bảng/chú thích | File signature hợp lệ, mở được Excel/LibreOffice/PDF reader, so sánh số liệu bằng test parser; không CSV đội đuôi `.xlsx` |
| P04-10 | Watermark `MÔ PHỎNG DEMO — KHÔNG CÓ GIÁ TRỊ PHÁP LÝ` cho bản mô phỏng; nhãn DRAFT và provenance của nguồn | Không hiển thị “đã ký số” trừ khi có chữ ký số/verification thật; metadata không chứa PII không được phép |
| P04-11 | UI Report Manager: chọn loại/kỳ/đơn vị, trạng thái, xem số liệu, snapshot history, export, drill-down, diff revision | Điều hướng không lạc scope; loading/error/empty rõ; số liệu không dùng localStorage |
| P04-12 | Job framework cho báo cáo nặng: bảng/fields/RPC/worker đồng nhất, auth cron secret, retry/backoff, receipt & error state | Job chỉ `COMPLETED` sau thực thi xuất file thực; worker không tự ghi receipt SUCCESS placeholder; dead-letter/manual retry có audit |

## 3. M10 Backlog tối thiểu

| ID | Task cụ thể | AC / evidence |
|---|---|---|
| P04-13 | Chọn một use-case import thật (ví dụ chỉ tiêu từ đơn vị/xóm); tạo schema template có version, download mẫu | Template có data dictionary, mandatory, type, mapping, owner và dữ liệu fake |
| P04-14 | Import parse → validate từng dòng → preview → detect duplicate → confirm commit → receipt → reconcile; RBAC theo nguồn | File lỗi không được commit âm thầm; partial import chỉ nếu policy cho phép; row errors có xuất danh sách |
| P04-15 | Idempotency theo `source_system + source_record_id + version` hoặc file hash/batch ID; provenance | Replay batch không tạo bản ghi trùng; source được đối chiếu tới record nội bộ |
| P04-16 | Một adapter SIMULATED có contract/timeout/retry và nhãn môi trường; không gọi hệ thống nhà nước chưa được phép | Tắt adapter thật khi chưa có contract; test lỗi mạng, timeout, duplicate webhook, schema mismatch |
| P04-17 | Integration ledger: inbound/outbound batch, chủ sở hữu nguồn, quyền chia sẻ, trạng thái, attempt, receipt, đối soát | Bất kỳ KPI từ import truy lại được batch/source/time/actor; không xem fixture là hệ thống kết nối production |
| P04-18 | Bảo vệ import/export dữ liệu nhạy cảm: size cap, malware scanning theo hạ tầng phù hợp, anti-formula injection, export authorization | CSV/XLSX giá trị bắt đầu `=,+,-,@` không bị thực thi công thức ngoài ý định, row-level permission test PASS |

## 4. Gate G4 — Bộ kiểm chứng bắt buộc

1. `RPT-001`: Tạo hai công việc, hoàn thành một → báo cáo ghi đúng tổng=2, hoàn thành=1, quá hạn tính đúng.
2. `RPT-002`: Tạo hai hồ sơ văn hóa có kết quả khác nhau → KPI và danh sách contributor khớp; rule pack version có trong lineage.
3. `RPT-003`: Chốt snapshot → sửa nguồn → snapshot cũ không đổi; revision mới có liên kết source.
4. `RPT-004`: Không có dữ liệu → 0/NOT_REPORTED đúng, không hiển thị 6/5/82.5 placeholder.
5. `RPT-005`: Export PDF/XLSX → mở/parsing được và so số lượng; nhãn demo không lẫn chữ ký thật.
6. `INT-001`: Import có 3 valid + 2 invalid → preview đúng, commit theo policy và receipt có lỗi từng dòng.
7. `INT-002`: Replay batch → idempotent; người không quyền import/export → 403.
8. `JOB-001`: Worker xử lý job thật và ghi receipt đúng; không dùng secret mặc định ở staging/prod.

**PASS:** không có KPI nguồn không rõ, không có báo cáo giả dạng tệp hợp lệ, kết quả snapshot/read-back từ cloud đúng; source imports có provenance; `G4: OWNER_ACCEPTED`.

**Đường dẫn chính:** `src/features/m09-reporting/{server,components}/*`, `src/features/m10-integrations/*`, `src/lib/jobs/*`, `src/app/api/{exports,imports,integrations,jobs}/*`, `supabase/migrations/*`. Có thể bổ sung thư viện xuất XLSX/PDF được kiểm tra license và test; không dựa vào đuôi tệp.
