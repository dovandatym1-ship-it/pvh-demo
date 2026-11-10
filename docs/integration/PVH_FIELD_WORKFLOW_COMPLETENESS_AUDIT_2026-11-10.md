# PVH — Audit độ đầy đủ trường dữ liệu và nghiệp vụ

**Ngày:** 10/11/2026
**Phạm vi:** candidate PR #12, nguồn OP/feature crosswalk tại `docs/plans/PVH_MASTER_INTEGRATION_2026-11-09/OP_FUNCTION_SCREEN_CODE_DB_CROSSWALK.csv`.
**Kết luận:** Chưa đủ căn cứ để xác nhận trường dữ liệu và nghiệp vụ PVH đã đầy đủ. Có code và schema theo từng lát cắt, nhưng coverage nghiệp vụ, field dictionary và runtime evidence chưa được đo/đối soát xong. Tài liệu này không xác nhận thẩm quyền hành chính, pháp lý hoặc biểu mẫu chính thức.

## 1. Bằng chứng định lượng

| Phạm vi kiểm tra | Kết quả | Cách hiểu |
|---|---:|---|
| OP gốc M00–M10 đã kiểm kê | 128/128 | Có mã và mô tả nguồn; không đồng nghĩa đã triển khai đủ biến thể. |
| Feature M11 dự thảo | 5 | Theo dõi riêng, không cộng vào 128 OP. |
| Tổng dòng crosswalk | 133 | 128 OP + 5 feature draft. |
| `runtime_verified` | 133 `UNVERIFIED` | Chưa có OP/feature nào được crosswalk chứng minh đã nghiệm thu runtime. |
| `runtime_route`, `api_or_rpc`, `db_entity`, `permission`, `message_code`, `test_id`, `evidence_url` | 0/133 có giá trị | Không có traceability field-level/operation-level trong các cột này. Đây là thiếu bằng chứng liên kết, không phải bằng chứng rằng repo không có code tương ứng. |
| Field dictionary được duyệt | Chưa có coverage đo được | Các trường trong completion plan hiện là ứng viên phân tích; chưa phải danh mục đã duyệt theo biểu mẫu/căn cứ. |
| Browser/API/DB E2E coverage | Chưa đo | CI source/build và migration replay không thay thế coverage này. |

## 2. Kết quả theo module

| Module | Có thể xác nhận từ candidate | Phần trường/luồng chưa đủ hoặc chưa có nguồn xác nhận | Trạng thái kiến trúc |
|---|---|---|---|
| **M00** Quản trị | Membership, quyền, đơn vị, xác thực và một số thao tác quản trị có schema/RPC. | 12 OP còn `UNVERIFIED`; chưa có field-level mapping cho ủy quyền, hiệu lực tổ chức/phân công, version mẫu/quy tắc, retention/audit, vòng đời tài khoản và seed/reset demo. Cần owner chốt quan hệ M00–M11. | Có nền an toàn; chưa đủ mô hình quản trị theo OP. |
| **M01** Công việc/hồ sơ | Work item, phân công, thời hạn, trạng thái, audit, tệp minh chứng, OCC/idempotency và phân trang đã có lát cắt triển khai. | Chưa thấy bộ master data canonical đầy đủ cho cá nhân/hộ/tổ chức/cơ sở và hồ sơ nguồn; plan/crosswalk còn yêu cầu chốt ownership, mã lĩnh vực và biến thể tiếp nhận. Không tự thêm trường CCCD/sức khỏe khi chưa có mục đích và căn cứ. | Workflow công việc không đồng nghĩa đã có nền dữ liệu chủ/hồ sơ nghiệp vụ đầy đủ. |
| **M02** Nội vụ/lao động | Có các thực thể và thao tác theo lát cắt cán bộ, người có công, lao động/tranh chấp; đã có xử lý PII theo DTO ở một số luồng. | 18 OP `UNVERIFIED`; cần đối chiếu quyết định/căn cứ từng diện chính sách, lịch sử hiệu lực, hồ sơ chứng minh, thống kê và phân quyền từng trường. Enum lạ phải giữ trạng thái chưa xác định, không gán sang diện khác. | Chưa đủ để xác nhận hồ sơ/chi trả/chính sách chính thức. |
| **M03** Giáo dục | Có schema/query cho cơ sở, học sinh/chỉ tiêu/hỗ trợ theo lát cắt. | 12 OP `UNVERIFIED`; thiếu đối chiếu biểu mẫu/năm học, quan hệ trường–lớp–người học, nguồn chính sách và trường tối thiểu cần lưu. Cần kiểm riêng dữ liệu trẻ em, truy cập theo trường/địa bàn, retention và export. | Không được suy rộng từ schema mẫu thành đủ hồ sơ giáo dục. |
| **M04** Văn hóa/gia đình | PH03 có đợt, bộ quy tắc phiên bản, hồ sơ tiếp nhận và rà soát nội bộ. Luồng ghi rõ minh họa; RPC chặn kết luận `DAT` khi pack chưa `VERIFIED`, thiếu ngưỡng hoặc thiếu minh chứng. | 21 OP `UNVERIFIED`; schema hiện không có sổ hộ canonical, chi tiết thành viên hộ, quyết định công nhận chính thức (số/ký hiệu, cơ quan, người ký, ngày hiệu lực) hoặc mô hình đầy đủ cho sự kiện/thiết chế/vụ việc gia đình. Review hiện ghi điểm tổng; criteria JSON chưa được chấm và kiểm từng tiêu chí trong workflow. Không có căn cứ đã xác minh để mở các quyết định đó. | Chỉ phù hợp tiếp nhận/rà soát minh họa. Phần quyết định và trường chuyên ngành bị khóa chờ nguồn/owner. |
| **M05** Khoa học/CĐS | PH03 lưu kế hoạch, chỉ tiêu, kỳ, đơn vị, ý nghĩa, giá trị có kiểu, trạng thái thu thập/đối soát, nguồn và phiên bản; phân biệt số 0/thiếu/không áp dụng. | 11 OP `UNVERIFIED`; schema chỉ tiêu chưa mô hình hóa công thức, tử số/mẫu số, mục tiêu, chủ thể xác nhận và phiên bản phương pháp tính. Chưa đối soát các trường này với biểu mẫu/nguồn chuẩn từng chỉ tiêu. | Không được công bố tỷ lệ/KPI chính thức chỉ từ một giá trị số có nguồn. |
| **M06** Y tế/an sinh | Có hồ sơ tiếp nhận/quy trình giao dịch theo lát cắt, giới hạn territorial scope và masking ở một số payload. | 12 OP `UNVERIFIED`; cần chốt trường eligibility, khoảng hiệu lực, nguồn quyết định, mức chi trả, trạng thái hồ sơ, lịch sử điều chỉnh và quyền đọc/xuất. Không lưu bệnh án hoặc thao tác chi trả nếu OP/căn cứ không yêu cầu và chưa được duyệt. | Lát cắt code không chứng minh đủ hồ sơ chính sách hay quyền truy cập PII. |
| **M07** Dân tộc/tín ngưỡng/tôn giáo | Có cơ sở, sự kiện và một phần hồ sơ người có uy tín; route có kiểm tra quyền xem và payload được giảm trường nhạy cảm ở một số luồng. | 6 OP `UNVERIFIED`; thiếu đối chiếu danh mục/hiệu lực công nhận, nguồn số liệu và quyền theo từng trường. Tín ngưỡng/tôn giáo cần phân loại dữ liệu, mục đích, masking, export và log truy cập rõ ràng. | Bắt buộc negative test quyền và xác nhận owner dữ liệu trước UAT. |
| **M08** Kiểm tra/kiến nghị | PH03 lưu biên bản, đối tượng/địa bàn, checklist version, nguồn thẩm quyền khai báo, kiến nghị, hạn, công việc M01 và hậu kiểm. Hạn được tính từ ngày hạn và trạng thái mở. | 6 OP `UNVERIFIED`; hiện chưa có thực thể finding/vi phạm riêng với phân loại, căn cứ, biên bản/đính kèm và liên kết kiến nghị; `notes` không thay thế danh mục phát hiện có cấu trúc. Mẫu kiểm tra và thẩm quyền chưa được xác minh. | Theo dõi nội bộ; không kết luận vi phạm/xử phạt. Finding-level và hồ sơ chính thức còn thiếu. |
| **M09** Báo cáo | Có snapshot, lineage, nhãn nguồn/chất lượng, xuất file và trạng thái chốt theo lát cắt. | 9 OP `UNVERIFIED`; cần so từng công thức, đơn vị, kỳ, template/version, nguồn, quyền tải và điều chỉnh snapshot với biểu mẫu thực. Chưa có golden file và read-back theo role. | Không coi file tạo thành công là số liệu/biểu mẫu đã được nghiệp vụ chấp nhận. |
| **M10** Nhập/xuất/tích hợp | Có luồng CSV preview/row errors/import receipt và các guard theo PH04 ở mức code. | 6 OP `UNVERIFIED`; cần xác nhận format, mapping, encoding, khóa chống trùng, quyền commit/export, retention file và phạm vi adapter. Đồng bộ hệ thống ngoài chưa nằm trong scope đã chốt. | Phân biệt nhập CSV MVP với tích hợp liên thông chính thức. |
| **M11** Danh mục | Có console/định nghĩa catalog theo lát cắt. | 5 feature draft; chưa có OP độc lập, owner danh mục, mã chuẩn dùng chung, effective dates và quyết định sở hữu so với M00. | Giữ trạng thái draft đến khi chốt ownership và version/effective-date rules. |

## 3. Các P0 xử lý trong candidate và phần còn mở

| P0 | Thay đổi candidate | Kết luận còn lại |
|---|---|---|
| P0-3 navigation demo | Lọc menu legacy theo permission chính xác của persona demo; không suy `admin`, `all` hoặc `*` thành quyền mọi module. | Direct-route denial vẫn phải kiểm trên browser/server cho từng route; demo menu không thay authorization server-side. |
| P0-8 nhận diện thôn văn hóa | Đã gỡ bảng/query legacy gắn `CÔNG NHẬN` và số hộ giả; không tái dùng khi chưa có quyết định và nguồn số hộ. | Thiếu mô hình sổ hộ và quyết định công nhận. Không thể đánh dấu đã hoàn thiện nghiệp vụ. |
| P0-9 số liệu M05 | Đã gỡ query/UI legacy dùng fallback mẫu; PH03 giữ `0` khác `null`, trạng thái nguồn tách biệt. | Công thức và mẫu số từng chỉ tiêu cần chốt; runtime readback chưa chạy trên staging. |
| P0-10 diện người có công | Mapping UI dùng allowlist nhãn cho từng enum và hiển thị “Chưa xác định diện chính sách” với enum lạ. | Cần xác nhận danh mục chuẩn và rule phân loại thực tế theo nguồn nghiệp vụ. |
| P0-11 quá hạn M08 | Tạo trạng thái hạn từ ngày hạn + trạng thái; hạn đã qua không tự đóng, status không được phép/thiếu ngày thành `UNKNOWN`. | Cần đối soát ngày nghiệp vụ trên staging và thống nhất lịch/giờ làm việc nếu chính sách hạn có tính ngày nghỉ. |
| P0-12 chấm điểm M04 | Gỡ modal legacy mặc định khoảng 90 điểm; luồng cũ vốn đã bị action server từ chối. Luồng hiện hành không tự tạo điểm mặc định. | Chưa có chấm từng tiêu chí, minh chứng cho từng tiêu chí hoặc bộ căn cứ được owner/pháp chế xác minh. M04 quyết định công nhận vẫn khóa. |
| P0-13 chi tiết công việc | Bảng legacy dùng ID cụ thể; trang M08 hiện hành đã link tới `/cong-viec/{workItemId}`. | Cần browser deep-link test với ID ngoài scope/không tồn tại để xác nhận 404/deny. |

## 4. Quyết định kiến trúc và thứ tự hoàn thiện

1. **Freeze nguồn**: ghim SHA Function Map, REQ/BL/WF/SCR, biểu mẫu và văn bản; ghi bản/điều khoản hiệu lực, owner xác nhận và biến thể. Không dùng trường ứng viên trong plan làm mặc định pháp lý.
2. **Chốt mô hình chủ**: ADR cho person, household, organization, facility, org unit, catalog và owner từng bảng. Xác định định danh canonical, gộp/tách, lịch sử hiệu lực, tenant/hamlet FK, retention và rollback.
3. **Đóng field dictionary cho MVP**: mỗi trường có type/length, bắt buộc có điều kiện, null/default, enum, nguồn, permission read/write/export, lớp nhạy cảm, masking, FK/unique, rule, UI, migration và test ID.
4. **Ưu tiên domain cần căn cứ**: M04 criteria/decision, M05 formula/source, M08 finding/minutes và M06/M07 sensitive records; chỉ triển khai khi được xác nhận. Thiếu nguồn ghi `BLOCKED_SOURCE`; thiếu thẩm quyền ghi `BLOCKED_LEGAL`.
5. **Nối traceability**: bổ sung `runtime_route/api_or_rpc/db_entity/permission/test_id/evidence_url` cho từng OP/biến thể; duy trì trạng thái riêng cho code, staging, pháp lý và owner acceptance.
6. **Nghiệm thu**: browser → action/API/RPC → DB read-back → audit, negative scope/role/Storage/export, UAT từng actor, kỳ/0/N/A, retry/OCC, lỗi và khôi phục. Báo riêng phần `VERIFIED`, `DEFERRED`, `BLOCKED_SOURCE`, `BLOCKED_LEGAL`.

## 5. Điều kiện kết luận “đầy đủ”

Không dùng một tỷ lệ tổng để thay coverage. Chỉ kết luận một OP/biến thể đầy đủ khi có nguồn đã duyệt, field dictionary, rule/actor/ngoại lệ, route/UI, API/RPC, DB/RLS/Storage, test âm/dương/biên, runtime read-back và owner acceptance cùng một SHA hoặc receipt rõ ràng. Tới lúc đó, inventory 128/128 tiếp tục chỉ là “đã kiểm kê”, còn implementation/runtime/authority coverage phải được đếm riêng.
