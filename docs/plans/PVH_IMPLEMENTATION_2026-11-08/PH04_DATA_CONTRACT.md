# PH04 — Data Contract (M09 Reporting / M10 Integration)

Trạng thái: IMPLEMENTED IN BRANCH / chờ owner audit. Mọi nhãn "đạt" M04 là kết quả rule pack minh họa, không phải quyết định công nhận danh hiệu có giá trị pháp lý.

## Danh mục 5 báo cáo — formulaVersion = 1

| Mã | Nguồn | Bộ lọc | KPI / công thức | Đơn vị |
|---|---|---|---|---|
| `RPT-WORK` | `work_items` | `created_at` trong kỳ | `tasksTotal` COUNT, `tasksCompleted` COUNT(status=COMPLETED), `tasksOverdue` COUNT(due_date < min(now,end) và chưa kết thúc) | Công việc |
| `RPT-CULTURE` | `submissions` | `created_at` trong kỳ | `cultureSubmissions` COUNT, `cultureEligible` COUNT(status=DAT) | Hồ sơ |
| `RPT-DIGITAL` | `digital_plans`, `digital_indicators`, `imported_indicator_values` | Kế hoạch tạo trong kỳ; chỉ tiêu trùng `evaluation_period`; import trùng `period` | COUNT kế hoạch, confirmed, confirmed_zero, not_reported, not_applicable và import | Theo chỉ tiêu |
| `RPT-INSPECTION` | `inspection_records`, `inspection_recommendations` | Ngày kiểm tra trong kỳ theo múi giờ Việt Nam | COUNT cuộc kiểm tra, kiến nghị, kiến nghị `RESOLVED_CLOSED` | Cuộc / kiến nghị |
| `RPT-SUMMARY` | Các nguồn trên | Bộ lọc tương ứng | Bộ KPI riêng từng đơn vị, không cộng đơn vị khác nhau | Theo KPI |

Kỳ báo cáo: `Q1/YYYY`–`Q4/YYYY` hoặc `YYYY-MM`, nửa mở [start, end) theo `Asia/Ho_Chi_Minh`. Chỉ tiêu trạng thái phản ánh **thời điểm chụp**, không tự dựng lại trạng thái lịch sử cuối kỳ nếu nguồn chưa có event replay. Số 0 hợp lệ; `NOT_REPORTED`, `NOT_APPLICABLE` và `NULL` không đồng nghĩa. `cdsIndex` hiện không có công thức đã duyệt nên lưu giá trị null/NOT_REPORTED, không còn 82,5 demo.

## Snapshot và tính toàn vẹn

- RPC `app.create_report_snapshot` ghi metric, payload, toàn bộ contributor, hash và audit **trong một transaction**. Không còn giới hạn 3 dòng.
- SHA-256 của bytes UTF-8 từ PostgreSQL `payload::text`, tên thuật toán `PG_JSONB_TEXT_V1`; JavaScript verify trực tiếp `canonical_text` do DB lưu. Không tự nhận đạt RFC 8785.
- Trạng thái `DRAFT → SUBMITTED → UNDER_REVIEW → FINALIZED` có permission riêng, expectedVersion chống cập nhật đồng thời. Bản FINALIZED không sửa/xóa. Điều chỉnh bằng revision với `previous_snapshot_id`.
- Lineage lưu bảng/ID/phiên bản/nhóm/đóng góp. RLS cần quyền xem báo cáo **và** quyền xem nguồn; tổng contributor có thể lớn hơn số được phép thấy ID.
- XLSX/PDF thật, có watermark, kỳ, hash, dữ liệu số dạng số; font DejaVu đã kèm license. Không xuất PII theo lineage vào PDF/XLSX.

## M10 — CSV template v1

Nguồn hỗ trợ duy nhất: `SIMULATED_INDICATOR_CSV`.

| Trường | Kiểu và quy tắc |
|---|---|
| `source_record_id` | Chuỗi 1–120, không bắt đầu bằng công thức |
| `source_version` | Số nguyên dương, khóa cùng source + ID + version |
| `indicator_code` | A-Z/0-9/_/-, 2–40 ký tự |
| `period` | Qn/YYYY hoặc YYYY-MM |
| `status` | CONFIRMED / CONFIRMED_ZERO / NOT_REPORTED / NOT_APPLICABLE |
| `numeric_value` | CONFIRMED: số khác 0; CONFIRMED_ZERO: 0; hai loại còn lại: rỗng |
| `unit` | Chuỗi 1–50, không chứa công thức |
| `source_ref` | Prefix SIM- (chỉ nguồn mô phỏng) |

Parser kiểm BOM, quoted CSV, header, số cột, UTF-8, formula injection, tối đa 2 MiB và 5.000 dòng. Server parse lại khi commit. `REJECT_ALL` có lỗi → không ghi record; `ACCEPT_VALID` chỉ nhận dòng hợp lệ, receipt ghi lỗi. Replay cùng file hash/source/policy trả cùng batch; cùng source ID/version nhưng đổi nội dung bị từ chối transaction.

## Tích hợp và công việc nền

- Adapter `SIMULATED_ECHO_V1` chỉ trả các trạng thái mô phỏng SUCCESS / TIMEOUT / SCHEMA_ERROR, có ledger/audit; không gọi hệ thống nhà nước. Chỉ TIMEOUT cho retry (tối đa 3 attempt); tham số `expectedAttempts` khóa cập nhật cạnh tranh. API `POST /api/integrations/simulated` với `action: "RETRY"` dùng lại `externalId`.
- Worker chỉ nhận `REPORT_EXPORT_ASYNC`, upload file vào private bucket `pvh-report-exports` rồi mới ghi SUCCEEDED có path/hash/byte. Job khác FAIL/retry, không trả receipt SUCCESS giả.
- API cron yêu cầu `CRON_SECRET` dài tối thiểu 16, không fallback. Worker dùng service role server-only. Chủ job được tạo signed URL 60 giây.
- Chưa bật scheduler trên cloud; cần cấu hình CRON_SECRET/Storage/schedule, quét mã độc theo hạ tầng và kiểm chứng staging trước G4.

## Quyết định còn chờ

1. Owner duyệt mẫu 5 báo cáo, công thức, nguồn, tên/đơn vị.
2. Cloud Demo-pvh mới có hai migration PH01, PH02/PH03/PH04 chưa áp; reconcile baseline trước khi migration lên môi trường được duyệt.
3. Local PGlite smoke không thay thế browser→API→Supabase read-back, Storage URL thực và job scheduling.
4. Không nhập PII thật từ CSV demo; yêu cầu kiểm tra mã độc phù hợp trước production.
