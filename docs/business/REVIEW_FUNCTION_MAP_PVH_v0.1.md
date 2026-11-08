# Rà soát phân rã chức năng và tên menu PVH

**Ngày:** 07/11/2026. **Trạng thái:** DRAFT. **Đối tượng:** [FUNCTION_MAP_PVH_v0.1.md](FUNCTION_MAP_PVH_v0.1.md), bản tác giả và lần chỉnh review 1. Phạm vi là tài liệu nghiệp vụ/điều hướng; chưa sửa sidebar hoặc route ứng dụng.

## 1. Kết luận

Bản phân rã có nền tảng tốt: giữ ID, tách Function Map/Screen Map/menu, có nguồn BL/REQ, nhận diện hồ sơ nhạy cảm và phân biệt thông báo với đăng ký. Có thể tiếp tục dùng làm working draft. Chưa đủ để chốt danh mục nghiệp vụ hoàn chỉnh hoặc triển khai nguyên trạng vì đang gắn cách dùng component chung với cách hiển thị menu, còn nghiệp vụ gộp và một số quy tắc tự đặt.

Yêu cầu của người dùng là menu phân cấp có điểm vào từng nghiệp vụ. Hai nghiệp vụ có thể dùng chung engine/form nhưng vẫn có hai menu chọn đúng ngữ cảnh. Không cần viết hai page giống nhau để đạt điều này.

## 2. Phát hiện và xử lý

| ID | Vị trí / mức độ | Phát hiện và tác động | Xử lý trong tài liệu / phần còn lại |
|---|---|---|---|
| RFM-01 | FM-04/14, §3/5.3 — HIGH | OP dùng màn hình chung chỉ được mở từ Tổng quan. Người dùng vẫn không có menu con theo nghiệp vụ như đã yêu cầu | Đã sửa quy tắc, bổ sung cây menu đích và bảng điểm vào §3.1. Chưa sinh registry hoặc code |
| RFM-02 | FM-03/05 — HIGH | “Một màn hình chính” và “cùng WF thì gộp” dễ bị dùng như quy tắc một–một; khác biệt checklist/quyền/đầu ra có thể bị che | Đã đổi sang một nơi xử lý/sở hữu chính; nhiều màn/nhiều menu được phép. Cần đặc tả contract từng OP trước khi quyết định dùng chung controller |
| RFM-03 | FM-09, số lượng menu — MEDIUM | Ngưỡng ≥3 màn và >10 mục, 5–8 nhóm/4–10 mục không có căn cứ trong tài liệu; ép cây thành ít mục | Bỏ ngưỡng cứng, giữ tối đa ba cấp theo yêu cầu, dùng nhóm có nghĩa nghiệp vụ. Chưa có usability test để chốt độ dài menu |
| RFM-04 | FM-10 — HIGH | “BUILDING trở lên” không có thứ tự trạng thái được định nghĩa; tắt module là ẩn hết dễ mất lối xem lịch sử; DEFERRED_PROPOSED chưa được quyết định | Đã tách readiness/release khỏi trạng thái OP/disposition; làm rõ quyền lịch sử. Manifest và test thực chưa có |
| RFM-05 | §6 — HIGH | “Giữ trần 50%” dễ cố định một rule tự thêm. B3/finding UI-06 xác định 2/4 là tỷ lệ hồ sơ có kết quả, không phải hạn ngạch công nhận | Đã loại khỏi hành vi phải bảo toàn; lỗi cần correction ledger. Không thẩm định lại luật trong lượt này; PVH-I-006 còn OPEN |
| RFM-06 | §4/7 — HIGH | 128 OP có truy vết số lượng nhưng vẫn gộp: OP-M03-008 chứa hoạt động/đình chỉ/sáp nhập/giải thể; OP-M02-015 chứa hồ sơ người có công và đợt hỗ trợ. 1 BL không nhất thiết 1 OP | Đã nêu rõ giới hạn, giữ ID cha và yêu cầu variant/OP con theo nguồn. Chưa tự tách thêm OP hoặc phê duyệt scope để tránh bịa quy trình |
| RFM-07 | §6 — MEDIUM | Bật registry trước route đích gây liên kết chết; giữ nguyên mọi query có thể mang tenant/ID sai; “giữ mọi hành vi” có thể giữ cả lỗi | Đã chuyển sang packet có target được kiểm tra trước khi bật, query whitelist và expected correction riêng; sửa path mặc định của công việc |
| RFM-08 | §3/5 — MEDIUM | Tên lẫn ngôn ngữ kỹ thuật/kiểu nhãn như Dashboard, module, chủ thể, gói quy tắc; dấu & và nhóm dài khó đọc | Đã chỉnh cây menu và nhãn Screen Map, giữ ID/route. Mã kỹ thuật và mô tả sâu vẫn giữ ở phần đặc tả |

Các finding chưa được coi là VERIFIED_CLOSED của hệ thống chỉ vì đã sửa tài liệu. RFM-01..08 được theo dõi tổng hợp tại PVH-I-013; liên quan PVH-I-006/007/008/010/012 và câu hỏi PVH-Q-016/018/019.

## 3. Một số tên đã chỉnh

| Tên bản đầu | Tên hiển thị đề xuất |
|---|---|
| Chủ thể (cá nhân, hộ, tổ chức) | Cá nhân, hộ và tổ chức |
| Gia đình văn hóa | Bình xét gia đình văn hóa |
| Thôn, tổ dân phố văn hóa | Bình xét thôn, tổ dân phố văn hóa |
| Thông tin việc làm | Việc làm và đào tạo |
| Rà soát chính sách bảo trợ xã hội | Hồ sơ bảo trợ xã hội |
| Đối tượng hưởng bảo trợ xã hội | Người hưởng trợ cấp xã hội |
| Kiến nghị & khắc phục | Theo dõi khắc phục |
| Báo cáo & bản chốt | Báo cáo |
| Dashboard điều hành | Tổng hợp điều hành |
| Nguồn & kết nối | Kết nối hệ thống |
| Nhật ký giao dịch tích hợp | Lịch sử đồng bộ |
| Người dùng, phân công & ủy quyền | Tài khoản và phân quyền |
| Gói quy tắc | Bộ quy tắc nghiệp vụ |
| Xã & module | Đơn vị và phân hệ |
| Nhật ký kiểm toán | Nhật ký hệ thống |

Tên ngắn chỉ là nhãn điều hướng. Ví dụ “Hồ sơ bảo trợ xã hội” vẫn chỉ làm nhiệm vụ rà soát/đề xuất theo OP, không thêm quyền quyết định hưởng; “Nhật ký hệ thống” vẫn phải bảo toàn audit. Thông tin, thể thao, du lịch vẫn nằm trong phạm vi M04 dù menu lĩnh vực dùng nhãn ngắn “Văn hóa và gia đình”.

## 4. Các điểm cần hoàn thiện trước triển khai

- Chốt danh mục lá/nhóm theo persona; cây đầy đủ dài hơn nhưng không phải ai cũng thấy toàn bộ. Chưa có bằng chứng để khẳng định số menu tối ưu.
- Lập menuId/parentId/screenId/operationId và filter cho từng lá; không chỉ gắn screenId chung rồi bỏ bộ lọc. Breadcrumb chọn từ context ổn định, không nhân đôi URL hồ sơ chuẩn.
- Phân rã variant còn gộp. Việc tách menu Phổ cập/Xóa mù chữ không tự xác nhận thực tế có một hay hai đợt; giữ PVH-Q-019 mở.
- Kiểm lại persona/thẩm quyền, miễn giảm học phí và tuyến chuyển cơ quan tại PVH-Q-024. Không biến source FE thành nguồn xác nhận nghiệp vụ.
- Bóc danh sách thực thể dùng chung đúng quyền; không bắt mọi người dùng phải có quyền quản trị dữ liệu nền mới xem được hồ sơ chuyên ngành thuộc phạm vi của họ.
- Cập nhật OP lifecycle, input/output/form/checklist và AC theo quy định nguồn; bảng hiện vẫn là catalog khung, chưa phải đặc tả triển khai đầy đủ.

## 5. Phạm vi kiểm chứng và giới hạn

Đã đọc bản Function Map theo các lát cắt, đối chiếu B1, finding kế hoạch canvas, sidebar và inventory source hiện tại. Có 14 page dashboard, từ 379 đến 1.727 dòng; store demo 1.926 dòng, đúng số file quan sát tại thời điểm review. Nội dung miễn giảm học phí và chuyển hồ sơ lên huyện thực sự có trong FE; báo cáo chỉ ghi cần xác minh, không khẳng định tuyến đúng/sai theo luật hiện hành.

Kiểm tra cấu trúc sau sửa gồm ID OP/SCR không trùng, số cột, screen reference, route chuẩn không trùng, REQ/DEM-ADD có token mapping và liên kết Markdown nội bộ. Không chạy ứng dụng vì lượt này không sửa code. Chưa đọc lại nguyên văn toàn bộ 96 nhiệm vụ trong ZIP hoặc ma trận pháp lý; chưa kiểm usability, quyền server/RLS, navigation registry hoặc route đích mới.

Các claim PASS của bản đầu không tự trở thành kết quả review. Context hook PARTIAL nên không kết luận đã xem hết tồn đọng. Tài liệu được giữ PROPOSED/DRAFT; không đóng issue, không duyệt yêu cầu và không thay đổi trạng thái câu hỏi. Đăng ký artifact không thay xác nhận host ghi memory hội thoại.
