# PH05 — Security release blocker (09/11/2026)

**Bằng chứng:** [CI PH05 run 42626767489](https://github.com/dovandatym1-ship-it/pvh-demo/actions/runs/42626767489) (push); kiểm tra tất cả source/test/build PASS, bước `npm audit --omit=dev --audit-level=high` FAIL.

| Rủi ro | Nhóm phụ thuộc | Hành động bắt buộc |
| --- | --- | --- |
| Critical | `next` 15.2.3 hiện tại | Xem xét nhánh cập nhật Next.js nhận bản vá theo npm audit; chạy đầy đủ React Server Actions/Auth/SSR/screenshot regression |
| High | `postcss` (gián tiếp), `sharp` (gián tiếp) | Xác minh các phiên bản kéo theo khi nâng Next; quét lại lockfile và kiểm tra xử lý tài nguyên |
| High | `zod` 3.x | Xem xét bản vá tương thích hoặc nâng major có kiểm tra toàn bộ schema/validation, không tự chạy `npm audit fix --force` trên nhánh phát hành |
| Moderate | `uuid` qua `exceljs` | Xem xét bản vá upstream/giải pháp pin/patch tương thích với xuất XLSX; test import/export không đổi dữ liệu |

**Tổng CI:** 6 cảnh báo (1 critical, 3 high, 2 moderate). Bản tổng hợp từ công cụ; cần chạy lại trên lockfile được sửa để xác nhận chính xác danh sách còn tồn tại. Không coi số cảnh báo đồng nhất với số lỗ hổng khai thác được.

### Gate xử lý
1. Khởi tạo nhánh bảo trì phụ thuộc riêng từ nhánh tích hợp đã được chủ hệ thống duyệt.
2. Đọc advisory, chốt phiên bản bản vá phù hợp, cập nhật package.json + package-lock.json nhất quán.
3. CI: `npm ci`, audit, typecheck/lint/unit, xuất PDF/XLSX, đăng nhập, workflow, E2E; chặn nếu một bước fail.
4. Chỉ thực hiện staging deploy và thử 2 xã sau khi đánh giá ảnh hưởng migration/data.

**G5: BLOCKED.** Không disable `npm audit`; chưa được phép deploy production, merge lên main hoặc dùng dữ liệu thật.
