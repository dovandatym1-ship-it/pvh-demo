# Dashboard PVH — ma trận nguồn dữ liệu và điều kiện tích hợp

Cập nhật 2026-11-09. Phạm vi: `feat/pvh-dashboard` đối chiếu `main`, `fix/pvh-ph03-crud-ux-20261109`, `fix/pvh-ph04-data-quality-20261109`. Đây là kiểm tra mã nguồn tĩnh, **không** phải xác nhận dữ liệu thực hoặc kiểm thử E2E.

## Chỉ số đang tính từ M01

| Chỉ số | Nguồn | Logic / giới hạn |
|---|---|---|
| Tổng công việc | `getWorkItems(ctx)` → `work_items` | Sau lọc tenant, vai trò, địa bàn |
| Chưa đóng | `work_items.status` | Loại `COMPLETED`, `CANCELLED` |
| Quá hạn | `work_items.due_date`, `status` | Chưa đóng và hạn trước ngày hiện tại theo múi giờ Việt Nam |
| Sắp đến hạn | `due_date` | 0–7 ngày, chưa đóng |
| Chờ rà soát | `status = UNDER_REVIEW` | Trạng thái M01, không phải hồ sơ chờ duyệt toàn hệ thống |
| Xu hướng phát sinh | `work_items.created_at` | Theo tuần, chỉ M01 |
| Xu hướng hoàn thành | `getCompletionEvents(ctx)` → `work_item_events.to_status, created_at` | Tối đa một lần/việc/tuần; ẩn khi nguồn lịch sử thiếu/truncated |
| Phân bổ lĩnh vực | `work_items.category` | Phân loại công việc M01, **không** đếm hồ sơ chuyên ngành |

Điểm vào: `src/app/(app)/dashboard/page.tsx`; phép tính: `src/features/dashboard/metrics.mjs`; UI: `src/features/dashboard/components/dashboard-view.tsx`.

## Nguồn nghiệp vụ tìm thấy ở các nhánh — chưa kết nối trực tiếp Dashboard

| Module | Nhánh chứa code | Điểm ghi/nguồn | Tình trạng và việc cần làm |
|---|---|---|---|
| M02 Nội vụ | `main` | `resolveLaborDisputeAction` → `labor_disputes` | Chưa có truy vấn KPI; cần xác định số hồ sơ, trạng thái, thời điểm |
| M03 Giáo dục | `main` | `approveTuitionExemptionAction` → `tuition_exemptions` | Chưa có truy vấn KPI |
| M04 Văn hóa | `fix/pvh-ph03-crud-ux-20261109` | `submitCultureDossierAction`, `reviewCultureDossierAction` → RPC schema `app` | Chưa có truy vấn KPI hồ sơ; cần đối chiếu bảng/RPC sau migration |
| M05 Chuyển đổi số | `fix/pvh-ph03-crud-ux-20261109` | `createDigitalPlanAction`, `createDigitalIndicatorAction`, `linkDigitalPlanWorkAction` | Có khả năng liên kết công việc M01 bằng `work_item_id`; KPI chỉ tiêu chưa tích hợp |
| M06 Y tế, an sinh | `main` | `createBeneficiaryAction`, `recordSocialAidPaymentAction` → `social_protection_beneficiaries` | Chưa có truy vấn KPI; tránh đưa PII lên dashboard |
| M08 Kiểm tra | `fix/pvh-ph03-crud-ux-20261109` | `createInspectionRecommendationAction` trả `work_item_id`; RPC nghiệp vụ | Có khả năng liên kết M01; chưa có KPI kiểm tra độc lập |
| M09 Báo cáo | `fix/pvh-ph04-data-quality-20261109` | `report_snapshots`, `report_snapshot_lineage` | Có truy xuất nguồn cho báo cáo, chưa nối Dashboard |
| M10 Nhập dữ liệu | `fix/pvh-ph04-data-quality-20261109` | `commitIndicatorImport` → RPC `commit_indicator_import` | Chưa nối Dashboard; cần xác nhận dữ liệu, kỳ, nguồn |

M07 và các nhánh Phase 1/5/6 cần đối soát bổ sung ở mức truy vấn + quy tắc nghiệp vụ trước khi đưa ra cam kết KPI.

## Gate bắt buộc khi tích hợp/merge

1. Merge nhánh theo thứ tự phụ thuộc, xử lý xung đột và đảm bảo migration tương ứng đã được áp dụng lên môi trường đích.
2. Xác nhận bảng/RPC, quyền RLS, tenant và scope; không dùng service role để vượt quyền khi tính Dashboard.
3. Với mỗi KPI chuyên ngành, định nghĩa tên tiếng Việt, tử số/mẫu số, trạng thái, mốc thời gian, xử lý trùng, dữ liệu thiếu, quyền xem và drill-down về danh sách gốc.
4. Bổ sung lớp truy vấn server chuyên ngành theo module, tránh suy diễn hồ sơ từ `work_items.category`. Nếu hồ sơ có liên kết M01, tránh cộng trùng hồ sơ và công việc.
5. Kiểm thử tạo → duyệt/cập nhật → báo cáo/Dashboard → truy ngược nguồn cho từng module; test dữ liệu rỗng, quá hạn, trả lại, đa tenant và phân quyền.
6. Chỉ bật KPI khi truy vấn thật và E2E đạt; trước đó hiển thị “Chưa kết nối dữ liệu nghiệp vụ”, tuyệt đối không hiển thị số 0 giả như đã kiểm chứng.

**Lưu ý:** Merge code không tự tạo dữ liệu, không tự chạy migration và không tự kích hoạt truy vấn chuyên ngành. Dashboard hiện tại chỉ dùng M01 cho KPI đang hiển thị.
