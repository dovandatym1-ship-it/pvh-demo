# X01 — RECEIPT TRIỂN KHAI BƯỚC 1: TRÍCH XUẤT OP GỐC
**Ngày:** 09/11/2026 · **Trạng thái:** PARTIAL IMPLEMENTED — INVENTORY VERIFIED, FEATURE/FIELD/CODE NOT VERIFIED.
**Nguồn:** `main/docs/business/FUNCTION_MAP_PVH_v0.1.md`, blob SHA `5a904d4f810c66cb5460b2beb6c42b025094481b`. **Tổng OP trích xuất:** 128.

## 1. Kết quả kiểm kê
| Module | OP nguồn | Nhánh tiếp nhận |
|---|---:|---|
| M00 | 12 | `feat/pvh-ph01-platform-auth` |
| M01 | 15 | `feat/pvh-ph02-core-workflow` |
| M02 | 18 | `feat/pvh-ph06-domain-expansion-v2` |
| M03 | 12 | `feat/pvh-ph06-domain-expansion-v2` |
| M04 | 21 | `feat/pvh-ph03-domain-verticals` |
| M05 | 11 | `feat/pvh-ph03-domain-verticals` |
| M06 | 12 | `feat/pvh-ph06-domain-expansion-v2` |
| M07 | 6 | `feat/pvh-ph06-domain-expansion-v2` |
| M08 | 6 | `feat/pvh-ph03-domain-verticals` |
| M09 | 9 | `feat/pvh-ph04-reporting-integrations` |
| M10 | 6 | `feat/pvh-ph04-reporting-integrations` |

**File nguồn dữ liệu:** [X01_OP_BASELINE_EXTRACT.csv](X01_OP_BASELINE_EXTRACT.csv). Mỗi OP có mô tả gốc, backlog, REQ/WF, sensitivity, demo, implementation proposal, source status, screen và branch target. Không đánh dấu feature/field/code VERIFIED trước khi có chứng cứ.

## 2. Chênh lệch cần xử lý sớm (candidate gaps, không phải kết luận code thiếu)
| Ưu tiên | Module | Nguồn | Vấn đề | Spec mới | Hành động |
|---|---|---|---|---|---|
| P0 | M00 | OP-M00-003 | Ủy quyền có căn cứ và tự hết hiệu lực không được gộp đơn thuần vào quản lý vai trò | M00-F02 | Kiểm tra delegation entity, thời hạn, phạm vi, thu hồi, negative tests |
| P0 | M00 | OP-M00-004 | Loại nghiệp vụ/hồ sơ có checklist, bộ trạng thái và version, không chỉ tham số chung | M00-F06/M11 | Chốt ownership workflow template và cấu hình theo hiệu lực |
| P0 | M01 | FM-07; SCR-DL-01/02/03 | Function Map gốc có cá nhân/hộ/tổ chức/cơ sở và đối soát định danh; spec M01 mới không nêu đủ | M01-F02/M01-F05 | Bổ sung canonical entity registry, historical relations và identity reconciliation |
| P0 | M04 | SCR-VH-04/06/07 | Menu nguồn có cơ sở dịch vụ văn hóa, di sản/di tích, phòng chống bạo lực gia đình; spec mới chỉ nêu nhóm lớn | M04-F01/F05/F07 | Tách biến thể, field/permission đặc thù và trạng thái hoãn có phê duyệt |
| P0 | M06 | SCR-YT-04 | Bảo vệ trẻ em và đối tượng dễ tổn thương có trong Screen Map gốc; chưa được nêu rõ trong 10 feature mới | M06-F06/F07 | Tách hồ sơ nhạy cảm, actor, consent/legal, quyền và workflow chuyển phối hợp |
| P1 | M08 | SCR-KT-04 | Phản ánh, vụ việc chuyển đến trong nguồn, không thể suy ra từ nhóm kiểm tra thông thường | M08-F01/F07 | Tách sổ tiếp nhận/chuyển, actor, hạn, lịch sử và trường hợp nhạy cảm |
| P0 | M10 | OP-M10-005 | Idempotency và retry nguồn ngoài phải là hành vi có test, không chỉ lịch sử nhập/xuất | M10-F01/F03 | Dedupe key, event version, retry log, stale-message guard |
| P1 | M10 | OP-M10-006 | Liên kết hệ thống nguồn/SSO chỉ khi được cấp, khác cấu hình nguồn CSV | M10-F04 | Tách conditional/deferred, không giả lập tích hợp thật |

## 3. Bước tiếp theo
1. Đọc toàn bộ OP, so khớp chính xác với từng Mxx-Fnn và biến thể; ghi orphan/duplicate và phân loại trạng thái source vs target.
2. Xác định field-level theo từng OP, không suy từ tên module; dùng baseline/biểu mẫu/nguồn pháp lý, để blocker nếu chưa rõ.
3. Chốt ADR ownership M00/M11, M01 canonical data, M09/M10 và bảo mật M06/M07.
4. Mới sau đó triển khai đặc tả/code trong nhánh nhận, có unit/RLS/E2E, CI và owner review.

**Chưa thực hiện:** kiểm tra source code từng nhánh, Supabase deployed, migration, chạy test, thay đổi feature branch, merge main. 128/128 ở đây chỉ là kiểm kê OP.
