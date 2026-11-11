# X01 — BƯỚC 2: ÁNH XẠ 128 OP → FEATURE (ĐỀ XUẤT)
**Nguồn:** `main/docs/business/FUNCTION_MAP_PVH_v0.1.md` blob `5a904d4f810c66cb5460b2beb6c42b025094481b`.
**Kết quả:** 128 OP có feature đề xuất; 53 OP có dấu hiệu thiếu chức năng con/ownership hoặc biến thể; 75 OP tạm ánh xạ không phát hiện xung đột rõ từ tên. **Tất cả mapping đều UNREVIEWED, không phải xác nhận đầy đủ.**

## Nguyên tắc
- Đối chiếu theo từng câu mô tả OP gốc, không theo tên module chung.
- `NEEDS_SUBFEATURE_OR_ADR` = cần tách feature con hoặc chốt owner, không khẳng định code thiếu.
- `PROPOSED_REVIEW` = chỉ có feature đích dự kiến, vẫn cần xác minh rule/field/route/API/DB.
- M11 không có OP nguồn độc lập, có thể sở hữu OP-M00-006 sau ADR; không nhân đôi.

## Các OP có cảnh báo
- **OP-M00-003:** Ủy quyền thời hạn/phạm vi chưa có feature độc lập
- **OP-M00-004:** Cấu hình loại nghiệp vụ + checklist/version chưa có feature độc lập
- **OP-M00-005:** Vòng đời gói quy tắc chưa có feature độc lập
- **OP-M00-007:** Version biểu mẫu chưa có feature độc lập
- **OP-M00-009:** Clone tenant chưa có feature độc lập
- **OP-M00-010:** Chính sách thông báo chưa có feature độc lập
- **OP-M00-011:** Đăng nhập/đa phiên chưa có feature độc lập
- **OP-M00-012:** Reset demo có audit chưa có feature độc lập
- **OP-M01-013:** Canonical cá nhân/hộ/tổ chức bị lược trong spec mới
- **OP-M01-014:** Canonical cơ sở/thiết chế bị lược
- **OP-M01-015:** Ghép/tách định danh cần quyền và lịch sử riêng
- **OP-M02-005:** Cải cách hành chính 6 lĩnh vực chưa có feature chuyên biệt
- **OP-M02-007:** Hội/quỹ/NGO chưa có feature chuyên biệt
- **OP-M02-008:** Văn thư lưu trữ chưa có feature chuyên biệt
- **OP-M02-009:** Công tác thanh niên chưa có feature chuyên biệt
- **OP-M02-010:** Bình đẳng giới chưa có feature chuyên biệt
- **OP-M02-013:** BHXH cần tách BHYT M06
- **OP-M02-014:** An toàn vệ sinh lao động chưa có feature chuyên biệt
- **OP-M02-018:** Người dưới 13 tuổi là conditional, phải chặn thẩm quyền
- **OP-M03-002:** Trung tâm học tập cộng đồng chưa có feature riêng
- **OP-M03-004:** Tuyển sinh đầu cấp chưa có feature riêng
- **OP-M03-007:** Thành lập cơ sở giáo dục là hồ sơ có thẩm quyền riêng
- **OP-M03-008:** Đình chỉ/sáp nhập/giải thể là workflow khác
- **OP-M03-010:** Đánh giá chất lượng giáo dục cần luồng riêng
- **OP-M03-011:** Đồng bộ CSDL giáo dục cần mapping nguồn
- **OP-M04-006:** GCN trò chơi điện tử công cộng cần hồ sơ riêng
- **OP-M04-007:** Đăng ký lễ hội khác thông báo lễ hội
- **OP-M04-008:** Thông báo lễ hội không được nhập chung đăng ký
- **OP-M04-014:** Thông báo thư viện và biến động riêng
- **OP-M04-015:** Khai báo photocopy riêng
- **OP-M04-016:** Di sản/di tích riêng
- **OP-M04-018:** Thông tin đối ngoại riêng
- **OP-M04-020:** Vụ việc bạo lực gia đình riêng, nhạy cảm
- **OP-M05-003:** Mô hình mẫu cấp tỉnh chưa có feature riêng
- **OP-M05-005:** Điểm bưu chính cần sổ cơ sở riêng
- **OP-M05-006:** Điểm viễn thông/Internet riêng
- **OP-M05-007:** Tiêu chuẩn đo lường chất lượng chưa có feature riêng
- **OP-M05-008:** Sở hữu trí tuệ chưa có feature riêng
- **OP-M05-010:** IOC chỉ liên kết, không dựng hệ thống IOC
- **OP-M06-005:** Bảo vệ trẻ em cần hồ sơ hạn chế riêng
- **OP-M06-007:** Dược/mỹ phẩm/thiết bị y tế khác cơ sở y tế
- **OP-M06-008:** Vụ việc vi phạm y tế chuyển thẩm quyền riêng
- **OP-M06-011:** BHYT chỉ đối soát không sửa nguồn
- **OP-M07-004:** Thông báo tín ngưỡng cần workflow riêng
- **OP-M07-005:** Thông báo tôn giáo cần workflow riêng
- **OP-M08-006:** Phản ánh/vụ việc chuyển đến cần sổ và cảnh báo riêng
- **OP-M09-006:** Bàn làm việc theo vai trò thuộc dashboard
- **OP-M09-007:** Drilldown chỉ tiêu phải kiểm quyền
- **OP-M09-008:** Dashboard KPI nội bộ/pháp định khác nhau
- **OP-M10-003:** Tham chiếu trạng thái TTHC không ghi đè nguồn
- **OP-M10-004:** Đối soát nguồn riêng
- **OP-M10-005:** Idempotency/retry cần feature riêng
- **OP-M10-006:** SSO/link nguồn conditional

## Gate kế tiếp
1. Từng owner xác nhận mapping và tách biến thể theo FM-05, ghi `variant_id` và screen ownership.
2. Lập data dictionary có trường cụ thể cho từng variant và nguồn biểu mẫu; đánh dấu legal blocker.
3. So sánh trực tiếp code/migrations/RLS của từng branch, không đoán mức hoàn thành.
4. Chỉ sau owner approval mới cập nhật code trên nhánh Phase; không merge main.

**File:** [X01_OP_TO_FEATURE_CROSSWALK_PROPOSED.csv](X01_OP_TO_FEATURE_CROSSWALK_PROPOSED.csv).
