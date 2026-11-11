# PVH — Audit độ đầy đủ trường dữ liệu và nghiệp vụ

**Ngày rà soát:** 11/11/2026 (M00 snapshot `e20f343`, M01 snapshot `2229ab5`, M04 source review snapshot `2383de8`)
**Phạm vi:** candidate PR #12, nguồn OP/feature crosswalk tại `docs/plans/PVH_MASTER_INTEGRATION_2026-11-09/OP_FUNCTION_SCREEN_CODE_DB_CROSSWALK.csv`.
**Kết luận:** Chưa đủ căn cứ để xác nhận trường dữ liệu và nghiệp vụ PVH đã đầy đủ. Có code và schema theo từng lát cắt, nhưng coverage nghiệp vụ, field dictionary và runtime evidence chưa được đo/đối soát xong. Tài liệu này không xác nhận thẩm quyền hành chính, pháp lý hoặc biểu mẫu chính thức.

## 1. Bằng chứng định lượng

| Phạm vi kiểm tra | Kết quả | Cách hiểu |
|---|---:|---|
| OP gốc M00–M10 đã kiểm kê | 128/128 | Có mã và mô tả nguồn; không đồng nghĩa đã triển khai đủ biến thể. |
| Feature M11 dự thảo | 5 | Theo dõi riêng, không cộng vào 128 OP. |
| Tổng dòng crosswalk | 133 | 128 OP + 5 feature draft. |
| `runtime_verified` | 133 `UNVERIFIED` | Chưa có OP/feature nào được crosswalk chứng minh đã nghiệm thu runtime. |
| M00/M01/M04 static source-map decisions | 48/48 OP thuộc ba module có giá trị trong 7 cột traceability; 85/133 dòng ngoài ba module còn trống | Liên kết được ghi từ static source review; chưa phải runtime evidence hoặc owner acceptance. Các dòng `NOT_FOUND_STATIC` ghi rõ chưa tìm thấy artifact chuyên biệt trong candidate. |
| `runtime_route`, `api_or_rpc`, `db_entity`, `permission`, `message_code`, `test_id`, `evidence_url` | Có giá trị cho 48/133 dòng; 85/133 dòng chưa được map | Các cột mô tả static source map; `NOT_FOUND_STATIC` là kết quả tìm kiếm source, không chứng minh quyết định DEFER. `test_id` dẫn đến test source/contract chứ không khẳng định browser/API/DB E2E đã chạy. |
| Field dictionary được duyệt | Chưa có coverage đo được | Các trường trong completion plan hiện là ứng viên phân tích; chưa phải danh mục đã duyệt theo biểu mẫu/căn cứ. |
| Browser/API/DB E2E coverage | Chưa đo | CI source/build và migration replay không thay thế coverage này. |

### Cách đọc phần map M00/M01/M04

- Link source/test M00 dùng snapshot `e20f343`; M01 dùng `2229ab5`; M04 dùng candidate source snapshot `2383de8`. Đây là các snapshot mã nguồn bất biến để kiểm tra mapping, không phải receipt runtime.
- `SOURCE_ONLY` xác nhận có lát cắt trong mã nguồn để review tĩnh; không xác nhận route đã chạy, RPC kết nối được với hosted schema, hoặc vai trò thực đã được thử.
- `NOT_FOUND_STATIC`/`NO_*_FOUND` nghĩa là chưa thấy artifact tương ứng trong candidate khi rà soát; đây không phải quyết định DEFER và cũng không thay xác nhận nghiệp vụ của chủ sở hữu.
- Tất cả 133 dòng vẫn `runtime_verified=UNVERIFIED`, `merge_decision=PENDING_CODE_AUDIT` và `review_owner=OWNER_PENDING`.

## 2. Kết quả theo module

| Module | Có thể xác nhận từ candidate | Phần trường/luồng chưa đủ hoặc chưa có nguồn xác nhận | Trạng thái kiến trúc |
|---|---|---|---|
| **M00** Quản trị | Membership, phân vai, phạm vi thôn, xác thực/khôi phục mật khẩu, audit receipt, M11 catalog CRUD và thông báo công việc có lát cắt schema/RPC/UI. Crosswalk đã có static source map cho 12 OP. | Cả 12 OP vẫn `UNVERIFIED`; thiếu quản trị đơn vị theo hiệu lực/lịch sử, ủy quyền có căn cứ, cấu hình loại hồ sơ/quy trình, vòng đời rule/template dùng chung, audit truy cập/xuất toàn diện, bootstrap/tắt module và reset demo có audit. Thông báo mới là in-app từ sự kiện việc, chưa có lịch nhắc/cấu hình kênh/owner policy. Cần owner chốt quan hệ M00–M11. | Có nền quản trị tài khoản và quyền theo một xã; chưa đủ mô hình vận hành đa đơn vị/ủy quyền/cấu hình quản trị theo OP. |
| **M01** Công việc/hồ sơ | Work item, phân công, thời hạn, trạng thái, audit, tệp minh chứng, OCC/idempotency và phân trang đã có lát cắt triển khai. | Chưa thấy bộ master data canonical đầy đủ cho cá nhân/hộ/tổ chức/cơ sở và hồ sơ nguồn; plan/crosswalk còn yêu cầu chốt ownership, mã lĩnh vực và biến thể tiếp nhận. Không tự thêm trường CCCD/sức khỏe khi chưa có mục đích và căn cứ. | Workflow công việc không đồng nghĩa đã có nền dữ liệu chủ/hồ sơ nghiệp vụ đầy đủ. |
| **M02** Nội vụ/lao động | Có các thực thể và thao tác theo lát cắt cán bộ, người có công, lao động/tranh chấp; đã có xử lý PII theo DTO ở một số luồng. | 18 OP `UNVERIFIED`; cần đối chiếu quyết định/căn cứ từng diện chính sách, lịch sử hiệu lực, hồ sơ chứng minh, thống kê và phân quyền từng trường. Enum lạ phải giữ trạng thái chưa xác định, không gán sang diện khác. | Chưa đủ để xác nhận hồ sơ/chi trả/chính sách chính thức. |
| **M03** Giáo dục | Có schema/query cho cơ sở, học sinh/chỉ tiêu/hỗ trợ theo lát cắt. | 12 OP `UNVERIFIED`; thiếu đối chiếu biểu mẫu/năm học, quan hệ trường–lớp–người học, nguồn chính sách và trường tối thiểu cần lưu. Cần kiểm riêng dữ liệu trẻ em, truy cập theo trường/địa bàn, retention và export. | Không được suy rộng từ schema mẫu thành đủ hồ sơ giáo dục. |
| **M04** Văn hóa/gia đình | 21/21 OP đã có static source-map. PH03 có hai route danh hiệu, campaign, rule-pack version, hồ sơ tiếp nhận và rà soát nội bộ. RPC chặn `DAT` nếu pack chưa `VERIFIED`, thiếu ngưỡng hoặc thiếu minh chứng. | Cả 21 OP vẫn `UNVERIFIED`. `submissions` dùng `subject_ref`/`household_head_name` chung, không có sổ hộ/thành viên hộ canonical; form Thôn vẫn bắt buộc tên chủ hộ. Không có meeting/opinion/checklist/evidence theo tiêu chí, đường phát hành rule pack `VERIFIED`, hoặc quyết định công nhận chính thức (số/ký hiệu, cơ quan, người ký, ngày hiệu lực). 15/21 OP không có route/entity/RPC chuyên biệt; 4 OP khác chỉ có lát cắt chung của M01/M09. | Chỉ phù hợp tiếp nhận/rà soát minh họa; không đủ cho quyết định công nhận, lịch/sổ hoạt động, hồ sơ cơ sở hoặc vụ việc gia đình. Nguồn, field dictionary, quyền và owner vẫn phải chốt. |
| **M05** Khoa học/CĐS | PH03 lưu kế hoạch, chỉ tiêu, kỳ, đơn vị, ý nghĩa, giá trị có kiểu, trạng thái thu thập/đối soát, nguồn và phiên bản; phân biệt số 0/thiếu/không áp dụng. | 11 OP `UNVERIFIED`; schema chỉ tiêu chưa mô hình hóa công thức, tử số/mẫu số, mục tiêu, chủ thể xác nhận và phiên bản phương pháp tính. Chưa đối soát các trường này với biểu mẫu/nguồn chuẩn từng chỉ tiêu. | Không được công bố tỷ lệ/KPI chính thức chỉ từ một giá trị số có nguồn. |
| **M06** Y tế/an sinh | Có hồ sơ tiếp nhận/quy trình giao dịch theo lát cắt, giới hạn territorial scope và masking ở một số payload. | 12 OP `UNVERIFIED`; cần chốt trường eligibility, khoảng hiệu lực, nguồn quyết định, mức chi trả, trạng thái hồ sơ, lịch sử điều chỉnh và quyền đọc/xuất. Không lưu bệnh án hoặc thao tác chi trả nếu OP/căn cứ không yêu cầu và chưa được duyệt. | Lát cắt code không chứng minh đủ hồ sơ chính sách hay quyền truy cập PII. |
| **M07** Dân tộc/tín ngưỡng/tôn giáo | Có cơ sở, sự kiện và một phần hồ sơ người có uy tín; route có kiểm tra quyền xem và payload được giảm trường nhạy cảm ở một số luồng. | 6 OP `UNVERIFIED`; thiếu đối chiếu danh mục/hiệu lực công nhận, nguồn số liệu và quyền theo từng trường. Tín ngưỡng/tôn giáo cần phân loại dữ liệu, mục đích, masking, export và log truy cập rõ ràng. | Bắt buộc negative test quyền và xác nhận owner dữ liệu trước UAT. |
| **M08** Kiểm tra/kiến nghị | PH03 lưu biên bản, đối tượng/địa bàn, checklist version, nguồn thẩm quyền khai báo, kiến nghị, hạn, công việc M01 và hậu kiểm. Hạn được tính từ ngày hạn và trạng thái mở. | 6 OP `UNVERIFIED`; hiện chưa có thực thể finding/vi phạm riêng với phân loại, căn cứ, biên bản/đính kèm và liên kết kiến nghị; `notes` không thay thế danh mục phát hiện có cấu trúc. Mẫu kiểm tra và thẩm quyền chưa được xác minh. | Theo dõi nội bộ; không kết luận vi phạm/xử phạt. Finding-level và hồ sơ chính thức còn thiếu. |
| **M09** Báo cáo | Có snapshot, lineage, nhãn nguồn/chất lượng, xuất file và trạng thái chốt theo lát cắt. | 9 OP `UNVERIFIED`; cần so từng công thức, đơn vị, kỳ, template/version, nguồn, quyền tải và điều chỉnh snapshot với biểu mẫu thực. Chưa có golden file và read-back theo role. | Không coi file tạo thành công là số liệu/biểu mẫu đã được nghiệp vụ chấp nhận. |
| **M10** Nhập/xuất/tích hợp | Có luồng CSV preview/row errors/import receipt và các guard theo PH04 ở mức code. | 6 OP `UNVERIFIED`; cần xác nhận format, mapping, encoding, khóa chống trùng, quyền commit/export, retention file và phạm vi adapter. Đồng bộ hệ thống ngoài chưa nằm trong scope đã chốt. | Phân biệt nhập CSV MVP với tích hợp liên thông chính thức. |
| **M11** Danh mục | Có console/định nghĩa catalog theo lát cắt. | 5 feature draft; chưa có OP độc lập, owner danh mục, mã chuẩn dùng chung, effective dates và quyết định sở hữu so với M00. | Giữ trạng thái draft đến khi chốt ownership và version/effective-date rules. |

## 2.1. Trace source-level cho 15 OP M01 — snapshot `3d35d94`

Đối chiếu tĩnh source/migration trên candidate PR #12; **không phải kết quả chạy browser, API, PostgreSQL hay nghiệm thu nghiệp vụ**. Tên OP lấy từ 15 dòng `OP-M01-001..015` trong `OP_FUNCTION_SCREEN_CODE_DB_CROSSWALK.csv`. Các liên kết static source map đã được điền cho 15 OP M01 ở snapshot `2229ab5`; `runtime_verified` vẫn `UNVERIFIED` cho cả 133 dòng.

| OP | Dấu vết trong candidate | Kết luận source-level và gap |
|---|---|---|
| `OP-M01-001` Tiếp nhận việc, chống trùng | `/cong-viec`; `createWorkItemAction` → `create_work_item_v2`; `source_ref`, idempotency | **Một phần.** Có chống gửi lặp theo actor/idempotency key; chưa thấy tiếp nhận có receipt riêng theo kênh trực tiếp/kế hoạch/văn bản. `source_ref` không là khóa duy nhất nên chưa bảo đảm chống trùng theo hồ sơ nguồn. |
| `OP-M01-002` Phân loại/mở hồ sơ | `CreateWorkItemSchema.category`; `work_items` | **Một phần.** `category` là chuỗi tự do; chưa nối danh mục lĩnh vực/loại hồ sơ và mã nhiệm vụ đã duyệt. |
| `OP-M01-003` Giao chủ trì/phối hợp, hạn | `assignWorkItemAction`, `updateWorkItemDetailsAction`, `setWorkCollaboratorsAction` và các RPC tương ứng | **Có lát cắt workflow.** Có giao lại, hạn, địa bàn, cộng tác viên, lý do/OCC/audit ở source; quyền/phạm vi vẫn cần test âm/dương bằng PostgreSQL với vai trò thật. |
| `OP-M01-004` Tiến độ, làm lại, trao đổi, cảnh báo | `transition_work_item`, `work_item_events`, inbox; `IN_PROGRESS/UNDER_REVIEW/RETURNED` | **Một phần.** Có chuyển trạng thái, trả lại có lý do, lịch sử và inbox; chưa thấy trao đổi nhiều lượt có người gửi/nhận/đọc và chưa xác minh runtime cảnh báo. |
| `OP-M01-005` Tài liệu/minh chứng theo trạng thái nguồn | `evidence_files`; actions register/finalize; trạng thái `PENDING/UPLOADED` | **Một phần.** Có vòng đời upload và xác nhận metadata; chưa có phân loại bản nháp/bản gửi/bản được nguồn xác nhận cùng metadata nguồn/chữ ký được owner duyệt. |
| `OP-M01-006` Dự thảo văn bản/phiếu trình | Không tìm thấy route/action M01 tương ứng | **Chưa thấy triển khai.** Cần xác nhận thuộc MVP hay DEFER có owner chấp thuận. |
| `OP-M01-007` Yêu cầu bổ sung/phối hợp, lưu từng lượt | `set_work_collaborators`; trạng thái `RETURNED` và lý do trong event | **Một phần.** Có cộng tác viên và trả lại; chưa thấy entity lưu từng lượt yêu cầu, hạn phản hồi, nội dung, người xử lý và trạng thái. |
| `OP-M01-008` Trình rà soát, kết quả, chuyển UBND | `transition_work_item`; `UNDER_REVIEW/RETURNED/COMPLETED` | **Một phần.** Có rà soát nội bộ; chưa thấy hồ sơ trình/đầu ra chính thức hay bàn giao liên cơ quan theo thẩm quyền. |
| `OP-M01-009` Đóng/hủy/chuyển đơn vị/mở lại/liên kết việc nối tiếp | `COMPLETED`, `CANCELLED`; gán lại cá nhân và audit | **Một phần.** Hoàn thành/hủy có workflow; gán lại cá nhân không tương đương chuyển đơn vị. Chưa thấy mở lại, liên kết việc tiếp nối hoặc hồ sơ chuyển giao. |
| `OP-M01-010` Kế hoạch/chương trình lĩnh vực | M05 `digital_plans`: title, period, status, source_ref | **Một phần ở M05, chưa đủ OP.** Chưa thấy mục tiêu, mốc, người phụ trách và version kế hoạch; cần chốt ownership M01/M05. |
| `OP-M01-011` Sinh việc từ kế hoạch, theo dõi kết quả/điều chỉnh | M05 `digital_plan_tasks`; `app.link_digital_plan_work` | **Một phần ở M05.** Chỉ thấy liên kết việc có sẵn với kế hoạch; chưa thấy sinh việc, kết quả theo kỳ hoặc lịch sử phiên bản/điều chỉnh. |
| `OP-M01-012` Tuyên truyền/phổ biến/thi hành pháp luật | Không thấy luồng M01 có mapping route/API/DB | **Chưa thấy triển khai hoặc ownership.** Cần phân loại module; không suy diễn từ nội dung demo. |
| `OP-M01-013` Cá nhân/hộ/tổ chức tham chiếu, chống trùng, phân quyền | Màn hình legacy `/du-lieu-dung-chung` đọc `demo-state` | **Demo-only, chưa có master data canonical.** Không thấy bảng canonical tương ứng trong migrations; mô phỏng gộp không chứng minh persistence, chống trùng hay quyền theo hồ sơ. |
| `OP-M01-014` Cơ sở/thiết chế dùng chung, lịch sử biến động | `org_units` cho đơn vị/thôn; không thấy entity cơ sở/thiết chế trong migrations | **Chưa đủ mô hình.** Đơn vị hành chính không thay cho cơ sở nghiệp vụ có lịch sử đổi tên/biến động. |
| `OP-M01-015` Ghép/tách định danh, chuyển địa bàn | Màn hình legacy mô phỏng “Golden ID” trên `demo-state` | **Demo-only, chưa có giao dịch DB canonical.** Chưa thấy migration/RPC ghép-tách, ánh xạ định danh, xử lý FK xung đột, audit và quyền phê duyệt. |

### Kết luận trace M01

- Phần có cơ sở source rõ nhất là **workflow công việc nội bộ**: tạo, giao/phối hợp, cập nhật hạn/địa bàn, chuyển trạng thái, minh chứng, lịch sử, inbox và phân trang. Đây chỉ là lát cắt, không đại diện toàn bộ 15 OP.
- Chưa thể xác nhận M01 đầy đủ trường/nghiệp vụ: loại việc còn tự do; thiếu hồ sơ nguồn, trao đổi/yêu cầu bổ sung hoàn chỉnh; kế hoạch mới là lát cắt M05; entity chủ cá nhân/hộ/tổ chức/cơ sở và quản lý định danh chưa có mô hình DB canonical được chứng minh.
- Artifact `tests/e2e/m01_multi_role.spec.ts` đã bị loại vì không có Playwright dependency/config/script, dùng mật khẩu mẫu và gọi các route assign/audit không tồn tại. Các case nghiệp vụ được giữ trong `PVH_M01_STAGING_ACCEPTANCE_2026-11-10.md`; checklist còn `NOT_EXECUTED_ON_STAGING`, nên không có E2E/runtime evidence.
- Trạng thái phù hợp: **PARTIAL / RUNTIME_UNVERIFIED / OWNER_PENDING**. Chưa thể kết luận PR #12 sẵn sàng merge chỉ từ workflow code.

## 2.2. Trace source-level cho 21 OP M04 — snapshot `2383de8`

Đối chiếu tĩnh route, action/RPC, schema, permission và test. Bảy cột traceability đã có giá trị cho cả 21 OP M04; `runtime_verified` vẫn `UNVERIFIED` ở mọi dòng. Các locator `SOURCE_ONLY` cho thấy chỉ có code gần với một phần nghiệp vụ; `NOT_FOUND_STATIC` là chưa tìm thấy artifact chuyên biệt trong candidate.

| Nhóm OP | Dấu vết trong candidate | Kết luận kiến trúc và gap |
|---|---|---|
| `OP-M04-001` Gia đình văn hóa | `/van-hoa/gia-dinh-van-hoa`; `open_illustrative_culture_campaign`, `submit_culture_dossier`, `review_culture_dossier`; `culture_rule_packs`, `campaigns`, `submissions`, `culture_submission_events`; pgTAP actor workflow | **Lát cắt nội bộ.** Có campaign, nộp và rà soát. Chưa có hộ/thành viên hộ canonical, họp/ý kiến, checklist có tiêu chí chấm, minh chứng theo tiêu chí hay quyết định chính thức. `criteria_scores` được lưu nhưng action/RPC chưa nhận/kiểm điểm từng tiêu chí. Test DB mới chứng minh hồ sơ `GIA_DINH` minh họa và chặn `DAT` khi pack chưa xác minh. |
| `OP-M04-002` Thôn/Xóm văn hóa | `/van-hoa/thon-van-hoa`; dùng cùng action/RPC/schema với Gia đình văn hóa, `title_type=THON` | **Chưa có form/model riêng đủ nghiệp vụ.** Bảng `submissions` bắt buộc `household_head_name` cho cả loại `THON`; chưa có subject là thôn với bộ checklist riêng. Chưa có actor test cho `THON`. |
| `OP-M04-003`, `OP-M04-017` phong trào/tuyên truyền | Chỉ có `/cong-viec` và M01 `work_items.category`; có thể gắn việc lĩnh vực `VAN_HOA` | **Chỉ tái sử dụng công việc chung.** Không có kế hoạch/đợt, kênh/nội dung, đối tượng tiếp cận, lịch, kết quả hoặc chỉ số phong trào/tuyên truyền riêng. |
| `OP-M04-019`, `OP-M04-021` số liệu/báo cáo | `/bao-cao`; M09 `RPT-CULTURE`/`RPT-SUMMARY` đưa `submissions` vào snapshot | **Báo cáo giới hạn ở số hồ sơ bình xét.** Không có nguồn ca gia đình/bạo lực để tổng hợp; không thấy `RPT-08` trong catalog hiện hành; không có dữ liệu thiết chế, sự kiện, thể thao, du lịch hay thông tin. Report/export tests là presentation/export contract, không phải golden database formula test. |
| `OP-M04-004..016`, `OP-M04-018`, `OP-M04-020` | Không tìm thấy route, action/RPC hoặc entity M04 chuyên biệt tương ứng | **Chưa thấy triển khai trong candidate.** Bao gồm thiết chế/cơ sở kinh doanh, giấy phép, đăng ký/thông báo lễ hội và hoạt động, lịch, thư viện, photocopy, di sản, thông tin đối ngoại, ca gia đình/bạo lực. Các dòng vẫn cần owner quyết định MVP/DEFER; kết quả static không tự đặt scope. |

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
