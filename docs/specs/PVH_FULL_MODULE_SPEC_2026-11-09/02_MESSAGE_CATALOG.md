# Message catalog — stable IDs and content
Status: DRAFT. Format: ID | severity | surface | Vietnamese copy | action.

| ID | Severity | Surface | Copy | Action |
|---|---|---|---|---|
| PVH.COMMON.SAVE_OK | success | toast | Đã lưu thay đổi. | — |
| PVH.COMMON.SAVE_FAILED | error | inline | Không lưu được thay đổi. Kiểm tra dữ liệu và thử lại. | Thử lại |
| PVH.COMMON.DELETE_CONFIRM | warning | dialog | Xóa {entityName}? Hành động này có thể ảnh hưởng dữ liệu liên quan. | Hủy / Xóa |
| PVH.COMMON.DELETE_BLOCKED | warning | inline | Không thể xóa {entityName} vì đang được sử dụng. | Xem dữ liệu liên quan |
| PVH.COMMON.ARCHIVE_CONFIRM | warning | dialog | Ngừng sử dụng {entityName}? Dữ liệu lịch sử vẫn được giữ lại. | Hủy / Ngừng sử dụng |
| PVH.COMMON.EMPTY | info | empty | Chưa có dữ liệu. | Thêm mới nếu có quyền |
| PVH.COMMON.NO_RESULTS | info | empty | Không tìm thấy kết quả phù hợp. | Xóa bộ lọc |
| PVH.FORM.REQUIRED | error | field | Vui lòng nhập {fieldLabel}. | — |
| PVH.FORM.INVALID_FORMAT | error | field | {fieldLabel} không đúng định dạng. | — |
| PVH.FORM.OUT_OF_RANGE | error | field | {fieldLabel} phải nằm trong khoảng cho phép. | — |
| PVH.FORM.DATE_ORDER | error | field | Ngày kết thúc không được trước ngày bắt đầu. | — |
| PVH.FORM.DUPLICATE | error | field | {fieldLabel} đã tồn tại trong phạm vi quản lý. | — |
| PVH.FORM.UNSAVED | warning | dialog | Bạn có thay đổi chưa lưu. Rời trang mà không lưu? | Ở lại / Rời trang |
| PVH.AUTH.SESSION_EXPIRED | warning | inline | Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại. | Đăng nhập |
| PVH.AUTH.FORBIDDEN | error | inline | Bạn không có quyền thực hiện thao tác này. | Quay lại |
| PVH.AUTH.TENANT_DENIED | error | inline | Không thể truy cập dữ liệu ngoài phạm vi được phân quyền. | Quay lại |
| PVH.CONFLICT.STALE | warning | inline | Dữ liệu đã thay đổi. Tải lại phiên bản mới trước khi tiếp tục. | Tải lại |
| PVH.NETWORK.OFFLINE | warning | banner | Mất kết nối mạng. Thao tác cần mạng tạm thời không khả dụng. | Thử lại |
| PVH.NETWORK.TIMEOUT | warning | inline | Chưa xác nhận được kết quả thao tác. Kiểm tra trạng thái trước khi thử lại. | Kiểm tra trạng thái |
| PVH.SERVER.UNAVAILABLE | error | banner | Hệ thống đang gián đoạn. Vui lòng thử lại sau. | Thử lại |
| PVH.IMPORT.PREVIEW | info | inline | Đã kiểm tra {totalCount} dòng. {invalidCount} dòng cần sửa. | Xem lỗi |
| PVH.IMPORT.PARTIAL | warning | inline | Nhập thành công {successCount} dòng; {failedCount} dòng lỗi. | Tải tệp lỗi |
| PVH.IMPORT.SUCCESS | success | toast | Đã nhập {successCount} dòng dữ liệu. | Xem danh sách |
| PVH.IMPORT.FAIL | error | inline | Không thể nhập dữ liệu. Tải tệp lỗi để kiểm tra. | Tải tệp lỗi |
| PVH.EXPORT.STARTED | info | toast | Đang chuẩn bị tệp xuất. | Xem tiến độ |
| PVH.EXPORT.READY | success | toast | Tệp đã sẵn sàng để tải xuống. | Tải tệp |
| PVH.EXPORT.EXPIRED | warning | inline | Liên kết tải tệp đã hết hạn. | Tạo lại tệp |
| PVH.EXPORT.FAILED | error | inline | Không tạo được tệp xuất. | Thử lại |
| PVH.REPORT.FINALIZE_CONFIRM | warning | dialog | Chốt báo cáo kỳ {periodLabel}? Sau khi chốt, cần tạo bản điều chỉnh để thay đổi. | Hủy / Chốt báo cáo |
| PVH.REPORT.LOCKED | warning | inline | Báo cáo đã chốt và không thể sửa trực tiếp. | Tạo bản điều chỉnh |
| PVH.REPORT.MISSING_SOURCE | warning | inline | Còn {missingCount} chỉ tiêu chưa có nguồn số liệu. | Xem chỉ tiêu |
| PVH.TASK.OVERDUE | warning | inbox | Công việc {taskName} đã quá hạn. | Xem công việc |
| PVH.INSPECTION.REMEDIATION_DUE | warning | inbox | Kiến nghị {reference} sắp đến hạn khắc phục. | Xem kiến nghị |
| PVH.CATALOG.IN_USE | warning | inline | Giá trị danh mục đang được tham chiếu; không thể xóa. | Ngừng sử dụng |
| PVH.SYSTEM.MAINTENANCE | info | banner | Hệ thống dự kiến bảo trì từ {startTime} đến {endTime}. | Xem chi tiết |

## Localization constraints
- Never interpolate unescaped HTML. Missing placeholders are build/test failures.
- Values are formatted for vi-VN and authorized audience; no full personal names/health/religion in general notification previews unless explicitly approved.
- No vague messages such as “Có lỗi xảy ra” without a next step.
- Error codes remain stable even if copy changes; copy versioned and reviewed.
