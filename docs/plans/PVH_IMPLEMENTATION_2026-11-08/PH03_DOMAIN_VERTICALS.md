# PH03 — Ba vertical slices chứng minh năng lực PVH

**Gate:** G3 `DOMAIN VERTICALS` · **Phụ thuộc:** G2 PASS + OP/Authority được xác minh phù hợp · **Ước lượng:** 12–20 ngày

## 1. Nguyên tắc

- **Hai E2E:** (A) bình xét danh hiệu văn hóa (M04); (B) kế hoạch VH-XH/chuyển đổi số và thu thập chỉ tiêu (M01+M05).
- **Một mini-flow:** kiểm tra cơ sở → kiến nghị → khắc phục (M08).
- Domain module phải dùng `RequestContext`, permission registry, assignment, audit, Storage, job/error contracts và report source chung. Không tạo database/role/workflow engine thứ hai.
- Không dùng rule văn hóa “85 điểm” hay các tỷ lệ trong demo làm căn cứ pháp lý nếu chưa xác minh văn bản áp dụng/hiệu lực/đối tượng, thẩm quyền.
- Khi điều kiện pháp lý chưa rõ, cho phép `ILLUSTRATIVE_ONLY` trên demo, nhưng ngăn action tạo quyết định chính thức và không chấm `LEGAL_READY` PASS.

## 2. Slice A — M04 Bình xét danh hiệu văn hóa

| ID | Task / bước triển khai | AC và bằng chứng |
|---|---|---|
| P03-01 | Đặc tả OP-M04 theo một đợt, phân biệt gia đình/thôn/xóm, tác nhân cung cấp số liệu, rà soát, công khai, trình, kết quả | `M04_OP_PACK.md` có BPMN/state/actor/checklist/exception, không gom hai biến thể khác thẩm quyền vào một form mơ hồ |
| P03-02 | Lập `LEGAL_RULE_REGISTER` cho quốc gia/tỉnh/xã và tại ngày hồ sơ; xác minh mẫu/đợt/tiêu chí/điểm, quy tắc chuyển tiếp | Rule có source URL/reference, effective_from/to, version, jurisdiction, status; `UNVERIFIED` không được phát hành chính thức |
| P03-03 | Thiết kế entities: campaign, rule_pack/version, criteria, submission, household reference, hamlet, evidence, evaluation, public result reference | ERD và FK, uniqueness trong đợt, bảo toàn lịch sử; không nhân bản CSDL dân cư |
| P03-04 | Thực hiện migrations M04 trên baseline canonical, RLS theo quyền thôn/PVH/đơn vị, private files | New environment dựng lại được; truy cập ngoài scope denied; migration có backward check |
| P03-05 | Workflow mở đợt, gán rule version, deadline, phạm vi xóm, form nộp danh sách/hồ sơ | Đợt có version bất biến sau khi nhận hồ sơ; đóng đợt ngăn nộp mới trừ quyền có căn cứ |
| P03-06 | Tiếp nhận hồ sơ từ thôn/xóm hoặc import có kiểm soát; lập mã hồ sơ, chống trùng theo campaign/đối tượng | 1 household/đợt/loại không tạo bản trùng; ghi provenance nguồn; lỗi từng dòng import có receipt |
| P03-07 | Bộ tiêu chí minh họa có phiên bản; biểu nhập điểm và minh chứng; không hardcode 85 trong UI/server | Điểm/điều kiện lấy từ pack; thay pack mới không sửa kết quả quá khứ; test boundary theo pack |
| P03-08 | Rà soát và yêu cầu bổ sung; `THIEU_MINH_CHUNG` khác `KHONG_DAT`; lý do và lịch sử bắt buộc | Actor sai 403; thiếu minh chứng không thể chốt `DAT`; file bổ sung tạo version mới |
| P03-09 | Trình cấp có thẩm quyền/ghi nhận kết quả quyết định từ nguồn; phân biệt `TASK_COMPLETED`, `DOSSIER_REVIEWED`, `OFFICIAL_RESULT_RECORDED` | Không có nút "PVH công nhận" mặc định; ghi số/ngày/người ký/căn cứ nếu nhận được hợp lệ, không tự phát hành |
| P03-10 | UI menu theo nghiệp vụ riêng, nhưng tái sử dụng engine; lịch sử phiên bản, trạng thái, chứng cứ, export và nhãn demo | Giao diện gia đình/thôn có đầu vào rõ; không tạo route chết; nhãn quy tắc minh họa hiện thị |
| P03-11 | E2E `E2E-CULTURE-001` với hồ sơ hợp lệ, hồ sơ thiếu chứng cứ, sai thẩm quyền, pack rollover, cùng một cá nhân nhiều role | 100% case có DB readback và ảnh/browser; 0 record sai scope; audit nhất quán |

## 3. Slice B — M05 Kế hoạch/CĐS ↔ M01 công việc ↔ M09 chỉ tiêu

| ID | Task / bước triển khai | AC và bằng chứng |
|---|---|---|
| P03-12 | Tách các đối tượng: plan/program, objective, indicator definition/formula/unit, activity, assignment, period, submission, evidence, review, report source | `PLAN_INDICATOR_CONTRACT.md`; chỉ tiêu có đơn vị, kỳ, nguồn và owner; không hardcode value trực tiếp trên dashboard |
| P03-13 | Workflow: lập kế hoạch → trình rà soát nội bộ → giao việc → đơn vị/xóm cập nhật tiến độ/chỉ tiêu → đối soát → chốt kỳ | 1 plan sinh nhiều task M01 nhưng không trùng; update task phản ánh tiến độ plan có nguồn |
| P03-14 | Cấu hình chỉ tiêu CĐS và phiên bản công thức; `0` xác nhận khác `NOT_REPORTED`, `N/A`, `UNVERIFIED`; có denominator | 0 và null được tính khác nhau; test KPI không ngụy tạo 60%/82.5% khi không có số liệu |
| P03-15 | Cấp tài khoản/phân công nhập chỉ tiêu hoặc import từ biểu đã kiểm soát, yêu cầu file/source/time, review nội bộ | Chỉ người chủ trì/phối hợp đúng scope được gửi; reviewer khác cập nhật status; ghi source lineage |
| P03-16 | KPI/dashboard tiến độ theo mục tiêu, đơn vị, kỳ; cảnh báo chưa nộp/sắp quá hạn; drill-down | KPI bằng SQL aggregate chuẩn; click đi đến đúng danh sách contributor; trường nhạy cảm không rò rỉ |
| P03-17 | E2E `E2E-PLAN-001`: lập kế hoạch và 3 việc, hai người cập nhật, người quản lý rà soát, chốt kỳ, vào report manager | Task status, indicator, plan progress và báo cáo số liệu nhất quán, không refresh mất dữ liệu |

## 4. Mini-flow M08 Kiểm tra và khắc phục

| ID | Task / bước triển khai | AC và bằng chứng |
|---|---|---|
| P03-18 | Phân biệt loại kiểm tra và thẩm quyền; xây checklist có version, đối tượng/cơ sở, thời điểm, đoàn/đầu mối | Không gán quyền thanh tra/xử phạt theo role UI khi chưa có căn cứ |
| P03-19 | Luồng tạo cuộc kiểm tra → ghi nhận phát hiện/minh chứng → kiến nghị → giao đầu mối/hạn khắc phục → kiểm tra lại/đóng | Kiến nghị và công việc khắc phục M01 được liên kết source_ref; không có hai source trạng thái |
| P03-20 | Mobile layout cho checklist, file/ảnh, xử lý mạng yếu có thông báo rõ; không tuyên bố offline đầy đủ | Chạy trên màn hẹp; request fail không xóa dữ liệu người dùng đang nhập, không tạo duplicate |
| P03-21 | Mini-E2E `E2E-INSPECTION-001`: ghi nhận 1 phát hiện, giao xử lý, nộp khắc phục, kiểm tra lại và đóng | Query join từ cuộc kiểm tra đến M01 task, kiến nghị, ảnh và audit; unauthorized denied |

## 5. Ma trận ngoại lệ trọng tâm

| Tình huống | Kỳ vọng |
|---|---|
| Hồ sơ nộp ngoài đợt | Từ chối hoặc đưa vào ngoại lệ có quyền và lý do; không silently accept |
| Cùng hộ nộp hai lần | Replay idempotent hoặc duplicate nghiệp vụ có thông báo |
| Rule pack mới có hiệu lực | Hồ sơ đã chốt dùng version cũ; hồ sơ mới chọn version theo ngày áp dụng |
| Chưa đủ minh chứng | Không tự đánh `KHONG_DAT`/`DAT` hay giả lập chứng cứ |
| Người rà soát tự tạo rồi tự chốt | Tùy rule separation-of-duties được duyệt, mặc định chặn nếu cần tách nhiệm vụ |
| Chỉ tiêu bằng 0 | `CONFIRMED_ZERO` khác `NOT_REPORTED`, không sử dụng `|| fallback` |
| Một đơn vị không nộp | Không được coi không phát sinh; hiển thị chưa nộp |
| Quá hạn kiểm tra | Tính từ hạn và event, không thay đổi lịch sử âm thầm |
| Phát hiện có dữ liệu cá nhân | File/chi tiết bị giới hạn theo case scope, không lộ trên tổng hợp công khai |

**Gate G3 PASS:** cả 2 E2E + mini-flow chạy browser + DB staging; rule/source phiên bản rõ; nguyên tắc thẩm quyền được duyệt hoặc kết quả được khóa ở chế độ mô phỏng; có mẫu dữ liệu và read-back; không xuất hiện quyền/phê duyệt/chi trả ngoài scope.

**Đường dẫn chính:** `src/features/m04-culture-family/*`, `m05-science-digital/*`, `m08-inspections/*`, `src/app/(app)/van-hoa/*`, `khcn-chuyen-doi-so/*`, `kiem-tra/*`, `supabase/migrations/20261108000003_*`, `00008_*`, `00009_*`. Mỗi migration cần làm lại theo canonical baseline, không push file cũ nguyên trạng.
