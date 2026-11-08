# PH06 — Mở rộng nghiệp vụ theo OP pack, giữ scope PVH

**Gate:** G6 `DOMAIN RELEASE` cho mỗi gói OP · **Phụ thuộc:** G5 PASS và nguồn/authority của gói mới · **Tiến độ:** backlog theo nhu cầu xác nhận, không ước tính chung 128 OP

## 1. Quy tắc mở rộng

- Chỉ mở khi nghiệp vụ có `OP_SPEC`, actor, nguồn, rule, thẩm quyền, form, trạng thái, quyền, dữ liệu, AC và use-case ngoại lệ.
- Dùng shared core M00/M01/M09/M10; không nhân bản CRUD, workflow, permission checker hoặc audit logger cho từng module.
- Mỗi domain xác định rõ **PVH tác nghiệp gì** vs **đơn vị/hệ thống khác giữ source of record hoặc quyền ban hành gì**.
- Có menu con theo từng nghiệp vụ người dùng tìm được; có thể tái dùng route/form engine nhưng không ép nhiều OP khác nhau thành một màn hình tổng hợp thiếu ngữ cảnh.
- Đặc biệt M06 có dữ liệu cá nhân nhạy cảm; không cung cấp quyền xem mọi trường cho lãnh đạo/quản trị theo tên role; cần scope/need-to-know.

## 2. Backlog theo module

| ID | Module/OP family | Lát cắt đầu tiên cần đặc tả | Gate riêng |
|---|---|---|---|
| P06-01 | M02 Nội vụ/người có công | Sổ theo dõi/phối hợp chính sách người có công, nguồn danh mục, hồ sơ/đợt rà soát | Không nhân bản CSDL người có công; thử role, source ref, import, report |
| P06-02 | M02 Lao động/việc làm | Tiếp nhận thông tin, việc làm/đào tạo, tranh chấp/kiến nghị thuộc phạm vi theo dõi | Không mặc định PVH có quyền ra kết quả hòa giải, quyết định hoặc xử phạt |
| P06-03 | M03 Giáo dục | Trường/cơ sở, nhóm trẻ, rà soát chỉ tiêu và theo dõi hồ sơ miễn giảm/chính sách | Xác minh tuyến và thẩm quyền từng nghiệp vụ; code `approveTuitionExemptionAction` không được coi là đủ authority |
| P06-04 | M06 Y tế | Cơ sở/kiểm tra/giám sát, dịch bệnh/chỉ tiêu do PVH được giao phối hợp | Không xây HIS/EMR; cần source/ref, case scope và dữ liệu tối thiểu |
| P06-05 | M06 An sinh | Hồ sơ/đối tượng theo dõi, rà soát/đề xuất, trạng thái chi trả nhận từ hệ thống nguồn | Không thực hiện lệnh thanh toán; `recordSocialAidPaymentAction` chỉ là ghi nhận đã đối soát theo nguồn hợp lệ |
| P06-06 | M07 Dân tộc/tín ngưỡng/tôn giáo | Cơ sở, sinh hoạt/thông báo, người có uy tín, hoạt động phối hợp | Tách sổ thông báo với hồ sơ cần chấp thuận; phân quyền nhạy cảm theo địa bàn |
| P06-07 | M04 mở rộng | Thể thao, du lịch, sự kiện, thông tin và gia đình ngoài bình xét | Không áp lại workflow bình xét cho các nghiệp vụ khác trigger/output |
| P06-08 | M05 mở rộng | Nhiệm vụ KH&CN, hạ tầng số, chỉ tiêu, Tổ CNS cộng đồng | Chỉ tiêu có owner, period, formula/version; không duplicate kế hoạch M01 |
| P06-09 | M08 mở rộng | Lập kế hoạch kiểm tra, hậu kiểm, theo dõi kiến nghị liên ngành | Quyền xử phạt/quyết định tách khỏi quyền theo dõi công việc |
| P06-10 | M10 adapters | Tích hợp văn bản điều hành, TTHC, danh mục chuyên ngành khi có contract và quyền | Mỗi connector có sandbox/prod status, rate limit/retry/identity/provenance, no PII over-fetch |
| P06-11 | M09 chuyên ngành | Báo cáo định kỳ và mẫu đối chiếu theo từng OP/nguồn | Formula lineage, đối soát, chốt kỳ, biểu mẫu theo hiệu lực và approval |
| P06-12 | Platform configurability | Rule/form/checklist/organization/module config có version và history | Triển khai xã mới không sửa code; quy tắc pháp lý không cho xã tự tùy ý sửa |

## 3. Mẫu Definition of Ready của mỗi OP pack

| Thuộc tính | Bắt buộc |
|---|---|
| `operation_id` | ID duy nhất và nguồn REQ/BL/WF |
| `business_goal` | Kết quả, người hưởng lợi và phạm vi PVH |
| `actors` | Người tạo, chủ trì, phối hợp, rà soát, cơ quan có thẩm quyền |
| `triggers` | Sự kiện mở hồ sơ/đợt/kiểm tra/kỳ, điều kiện bắt đầu |
| `inputs` | Mẫu, trường, validation, source of record, PII classification |
| `workflow` | State/transition, guard, thẩm quyền, reason, SLA, xử lý trả lại/huỷ |
| `outputs` | Kết quả nội bộ, tham chiếu kết quả chính thức, báo cáo |
| `rules` | Căn cứ văn bản, jurisdiction, version, effective date, uncertainty |
| `permissions` | RBAC/ABAC, record scope, audit, separation-of-duties |
| `integrations` | Mock/sandbox/production, owner, contract, mapping, retry |
| `acceptance` | 1 happy, 1 deny, 1 invalid, 1 concurrency/idempotency, 1 end-to-end readback |

**Không cho OP chuyển từ `DISCOVERED` thẳng sang `DONE`** vì có page, mock, fixture hoặc test chỉ kiểm file. Các trạng thái: DISCOVERED → SPECIFIED → READY → IMPLEMENTED → VERIFIED → OWNER_ACCEPTED.

## 4. Chính sách release theo gói

Một gói OP có thể được phát hành độc lập sau G5 nếu migrations backward-compatible, module entitlement/permission có version, không làm vỡ 3 flow cốt lõi, có E2E riêng và regression suite PASS. Bật/tắt module không được xóa dữ liệu hoặc làm mất quyền đọc lịch sử phải lưu.

**Gate G6:** Owner duyệt từng OP pack sau khi traceability và 100% acceptance của gói có evidence. Không yêu cầu toàn bộ 128 OP phải cùng hoàn thiện.
