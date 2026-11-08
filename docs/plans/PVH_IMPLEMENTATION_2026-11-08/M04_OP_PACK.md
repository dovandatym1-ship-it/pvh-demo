# OP-M04 — Bình xét danh hiệu văn hóa (PH03)

**Trạng thái:** IMPLEMENTED_PARTIAL / LEGAL_UNVERIFIED. Chưa phải đặc tả pháp lý được chủ dự án xác nhận.

## Đối tượng và luồng riêng

| Luồng | Chủ thể nguồn | Địa bàn | Kết quả của PVH trong MVP |
|---|---|---|---|
| Gia đình văn hóa | Hồ sơ/đầu mối thôn và mã tham chiếu hộ, không sao chép CSDL dân cư | Xóm/thôn | Tiếp nhận, rà soát, yêu cầu bổ sung và chuyển hồ sơ; chưa ban hành công nhận |
| Thôn/xóm văn hóa | Hồ sơ tập thể do đầu mối có thẩm quyền cung cấp | Xóm/thôn | Rà soát minh chứng và ghi nhận nguồn, không gộp mẫu với hộ |
| Xã tiêu biểu | **Chưa triển khai giao diện**; cần xác minh chủ thể/thẩm quyền cấp xét | Xã | Chỉ giữ enum định hướng; không mở công bố/chứng nhận |

## Trạng thái và điều kiện

1. Người có quyền `m04:culture:evaluate` tạo bộ tiêu chí có version, jurisdiction; mặc định `ILLUSTRATIVE_ONLY`, không có cờ xác minh pháp lý từ UI.
2. Mở đợt ghi cố định `rule_pack_id`, năm, loại danh hiệu, hạn đóng; chỉ nhận hồ sơ khi `OPEN`, trong thời gian tiếp nhận.
3. Người có quyền `m04:culture:create` nộp mã nguồn, tên đại diện, địa bàn, `source_ref`, `idempotency_key`. DB kiểm tra quyền theo thôn và uniqueness theo (đợt, đối tượng).
4. Người có quyền rà soát khác người nộp: `CHO_RA_SOAT` → `THIEU_MINH_CHUNG` / `YEU_CAU_BO_SUNG` / `KHONG_DAT` (kết luận nội bộ). Mọi chuyển trạng thái bắt buộc có reason, expected_version và audit.
5. `DAT` bị chặn nếu chưa có rule pack `VERIFIED`, ngưỡng được xác minh và minh chứng Storage thật thuộc scope M01. **Ngay cả trạng thái `DAT` cũng không đồng nghĩa quyết định công nhận.**
6. Không có thao tác `OFFICIAL_RESULT_RECORDED` hay ban hành quyết định vì chưa có contract nguồn/số quyết định/cơ quan ký đáng tin cậy.

## Danh mục pháp lý cần xác minh — không gán hiệu lực

| Rule ID | Nội dung cần xác minh | Trạng thái |
|---|---|---|
| LEG-M04-01 | Văn bản hiện hành theo thời điểm đợt, đối tượng và chuyển tiếp | UNVERIFIED |
| LEG-M04-02 | Bộ tiêu chí, điểm/điều kiện không dùng ngưỡng 85 cố định | UNVERIFIED |
| LEG-M04-03 | Biểu mẫu và đầu mối tiếp nhận gia đình so với thôn/xóm | UNVERIFIED |
| LEG-M04-04 | Trình tự công khai, phản ánh và kết quả thẩm quyền khác nhau | UNVERIFIED |
| LEG-M04-05 | Căn cứ, số/ngày/người ký quyết định hợp lệ để ghi nhận từ nguồn | UNVERIFIED |

Không dùng nguồn cũ chưa kiểm chứng để tự chuyển `VERIFIED`. Cần legal source URL, effective_from/to, jurisdiction và phê duyệt owner trước gate.

## Ngoại lệ và dữ liệu

- Cùng đối tượng/đợt: unique constraint, không tạo hai hồ sơ; cùng key và payload là replay.
- Hết hạn: DB chặn tiếp nhận; không có quyền "bỏ qua hạn" ngầm.
- Cùng người tạo và rà soát: 42501, không ghi kết quả.
- Version xung đột: PV409, không ghi partial audit.
- Thiếu file thật: không có `DAT`, không tự suy từ `evidencePath` do client cung cấp.
- Cần bổ sung: trạng thái khác `KHONG_DAT`.
- PII: không seed dữ liệu cá nhân, không lưu CCCD; dữ liệu nguồn dùng tham chiếu có kiểm soát.

**Còn thiếu để P03-01→11 và G3 PASS:** BPMN xác nhận thẩm quyền, nguồn pháp lý, import có receipt, attach/version file theo hồ sơ, lưu số quyết định từ nguồn, staging RLS/Storage, E2E-CULTURE-001 bằng 2 tài khoản và DB readback.
