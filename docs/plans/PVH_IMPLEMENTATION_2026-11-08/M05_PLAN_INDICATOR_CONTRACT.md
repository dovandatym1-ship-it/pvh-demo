# OP-M05 — Kế hoạch VH-XH/CĐS và số liệu có nguồn

**Trạng thái:** IMPLEMENTED_PARTIAL; chưa đủ quy trình chốt kỳ và M09 reporting.

## Dữ liệu chuẩn

| Thực thể | Ý nghĩa và khóa |
|---|---|
| `digital_plans` | Kế hoạch có id/tenant/period/source_ref/status, bắt đầu DRAFT |
| `digital_plan_tasks` | Liên kết tới đúng work_item M01; mỗi việc chỉ thuộc một kế hoạch, không sao chép trạng thái |
| `digital_indicators` | Định nghĩa: code/name/unit/period; kết quả: numeric_value/status/source_ref/na_reason/version |
| `digital_indicator_events` | Lịch sử người ghi, kỳ, phiên bản, giá trị, nguồn |

Không dùng chỉ tiêu địa phương chưa được xác nhận làm mặc định. UI không hiển thị con số seed 60%, 82.5% hoặc dữ liệu tổng hợp giả khi bảng trống.

## Semantics bắt buộc

- `NOT_REPORTED`: chưa nộp; `numeric_value IS NULL`.
- `UNVERIFIED`: có thể có số tạm, chưa được đối soát.
- `CONFIRMED_ZERO`: giá trị số phải **bằng 0** và có `source_ref`, không suy từ chuỗi chứa ký tự 0.
- `CONFIRMED`: giá trị số khác NULL, có nguồn.
- `NOT_APPLICABLE`: giá trị NULL, có lý do.
- `denominator` nếu có phải dương; không tự suy tỷ lệ khi mẫu số chưa có.
- Ghi số theo OCC `expectedVersion` và audit atomic. Xác nhận yêu cầu `m05:digital:review` và người rà soát khác người cập nhật.

## Quan hệ M01 và giới hạn

Mỗi plan có thể có nhiều work item M01 thông qua `digital_plan_tasks`; tham chiếu tenant và quyền đọc công việc được xác minh ở DB. Không dựng engine nhiệm vụ thứ hai.

**Còn thiếu:** giao việc 3 nhiệm vụ tự động có idempotency cho một kế hoạch, workflow trình/duyệt/chốt kỳ, kế hoạch có phiên bản, công thức cấu hình hóa, snapshot chỉ tiêu bất biến, dashboard contributor/drill-down M09 và E2E-PLAN-001 đa tài khoản. Không gọi G3 PASS.
