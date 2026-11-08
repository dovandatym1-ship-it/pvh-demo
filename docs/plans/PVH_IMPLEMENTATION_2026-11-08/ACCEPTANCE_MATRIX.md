# Acceptance Matrix — Bằng chứng nghiệm thu độc lập PVH

**Tính chất:** test plan bắt buộc, không phải kết quả chạy test.  
**Quy tắc:** mỗi `TEST_ID` có `expected`, `actual`, environment, commit, DB migrations, artifacts, executor, reviewer và owner decision. `NOT_RUN`/`PARTIAL`/`SKIPPED` không được coi là PASS. Test static source không được tính là browser E2E.

## 1. Coverage theo Gate

| Gate | Test types bắt buộc | Đối tượng |
|---|---|---|
| G0 | Static evidence audit, traceability review, source/legal gap review | Repo, scope, migration map, OP/REQ/WF |
| G1 | SQL/pgTAP + Server Actions/API + browser auth | M00, RLS, Auth, Storage, audit |
| G2 | Browser E2E + SQL readback + concurrency/retry | M01 full lifecycle |
| G3 | 2 domain browser E2E + 1 mini-flow + business rule test | M04, M05, M08 |
| G4 | Metric reconciliation + export parser + import + jobs | M09, M10 |
| G5 | Security regression, performance, backup restore, deploy/cloning UAT | Toàn MVP |
| G6 | Mỗi OP pack riêng: domain/authority/permission/E2E/regression | M02/M03/M06/M07 và mở rộng |

## 2. Core security/identity tests

| ID | Điều kiện/bước | Expected |
|---|---|---|
| SEC-001 | Anonymous mở app và gọi Server Action trực tiếp | 401/redirect, không có DB write |
| SEC-002 | Cookie `pvh_demo_session=P1/P999` tại staging/prod | Không được trở thành auth/role hợp lệ |
| SEC-003 | Auth user không membership | 403, không xuất dữ liệu/số lượng nhạy cảm |
| SEC-004 | Membership hết hạn, JWT cũ | 403 ngay lần gọi tiếp theo, không có mutation |
| SEC-005 | User A đổi tenant cookie/ID payload | Bị chặn, không phân quyền bằng giá trị client |
| SEC-006 | Admin kỹ thuật không có PII entitlement | Không thấy trường CCCD/điều trị/đối tượng hạn chế |
| SEC-007 | Người có permission khác nhưng cùng xã truy cập hồ sơ ngoài scope | 403/empty theo contract, không có file signed URL |
| SEC-008 | Cố ghi trực tiếp bảng có workflow bắt buộc | RLS/GRANT từ chối, chỉ RPC an toàn được phép |
| SEC-009 | Function `SECURITY DEFINER` không có actor hoặc bị cấp EXECUTE PUBLIC | Test FAIL; không triển khai |
| SEC-010 | Log audit bị fail trong mutation bắt buộc | Mutation rollback/FAIL, không return success |
| SEC-011 | Cố update/delete audit append-only bằng authenticated | Denied, audit event vẫn bất biến |
| SEC-012 | Người khác gọi signed URL bằng path của file cùng xã | Storage/record policy chặn; route path prefix không được thay thế record scope |
| SEC-013 | Signed URL quá 60s hoặc hết hạn | Server không phát hành TTL quá ngưỡng; link hết hạn bị từ chối |
| SEC-014 | Secret service role nằm trong JS/browser/env `NEXT_PUBLIC_*` | CI FAIL |

## 3. Data and transaction tests

| ID | Dữ liệu/thao tác | Expected |
|---|---|---|
| DB-001 | Dựng DB test từ migration canonical | Schema/function/policy/grant checksum khớp |
| DB-002 | So migration local và cloud | Không conflict/ghost migrations; mọi drift có mapping |
| DB-003 | Cùng idempotency key + payload hai request | Một bản ghi/sự kiện, cùng result |
| DB-004 | Cùng key khác payload | 409/422 theo contract, không mutate |
| DB-005 | Hai actor chuyển state cùng expectedVersion | Một 200, một 409; audit không duplicate |
| DB-006 | RPC lỗi hoặc update affected_rows=0 | `ok:false` với mã lỗi đúng, không báo 200 success |
| DB-007 | Lỗi ghi event/audit trong transaction | Rollback work item transition, không partial write |
| DB-008 | Tạo việc với assignee khác tenant/org ngoài scope | FK/policy từ chối |
| DB-009 | Thay đổi quyền/ủy quyền giữa hai request | Request sau chặn quyền cũ |
| DB-010 | DB empty, timeout, permission denied | Trạng thái UI tách `EMPTY`, `ERROR`, `FORBIDDEN`; không seed fallback |

## 4. E2E-WORK-001 — điều hành công việc

| ID | Bước | Expected |
|---|---|---|
| WORK-01 | Manager tạo việc có nguồn và hạn | Work+event+audit tồn tại |
| WORK-02 | Giao officer hợp lệ | Assignment và inbox đúng người |
| WORK-03 | Officer tiếp nhận | State `IN_PROGRESS`, version +1 |
| WORK-04 | Officer upload evidence | Private file + metadata, role ngoài phạm vi không thấy |
| WORK-05 | Officer trình duyệt | `UNDER_REVIEW`, queue quản lý +1 |
| WORK-06 | Manager trả lại thiếu minh chứng | `RETURNED`, reason không rỗng |
| WORK-07 | Officer bổ sung, trình lại | File version + event đủ |
| WORK-08 | Manager xác nhận hoàn thành | `COMPLETED`, timeline đúng; không giả làm quyết định hành chính |
| WORK-09 | Reload/relogin/browser thứ hai | Data còn, state thống nhất DB |
| WORK-10 | Dashboard my/overdue/review counts | Count khớp SQL, overdue từ due_at không từ priority |

## 5. Domain E2E và business rules

| ID | Kịch bản | Expected |
|---|---|---|
| CULT-01 | Mở đợt văn hóa với rule pack version | Version cố định gắn đợt |
| CULT-02 | Thôn nhập hồ sơ đúng scope | Có source/provenance, người khác không đọc ngoài quyền |
| CULT-03 | Hồ sơ thiếu minh chứng | `THIEU_MINH_CHUNG`, không tự coi `KHONG_DAT` |
| CULT-04 | Rà soát trả lại có lý do | Lịch sử/actor/reason đầy đủ |
| CULT-05 | Hồ sơ đủ điều kiện theo pack minh họa | Kết quả nội bộ đúng rule demo, không phát hành quyết định chính thức |
| CULT-06 | Rule pack đổi phiên bản | Hồ sơ đã chốt không đổi, hồ sơ mới dùng pack đúng hiệu lực |
| CULT-07 | Cùng đối tượng nộp trùng trong một đợt | Duplicate/idem defense rõ |
| PLAN-01 | Tạo kế hoạch và 3 task M01 | Các task liên kết kế hoạch, một đầu mối chịu trách nhiệm |
| PLAN-02 | Hai đơn vị/xóm cập nhật chỉ tiêu khác nhau | Có source, period, actor, value, unit và status |
| PLAN-03 | Một đơn vị chưa nộp, một đơn vị xác nhận 0 | `NOT_REPORTED` khác `CONFIRMED_ZERO` |
| PLAN-04 | Rà soát/chốt kỳ | Đóng băng bản chốt, không override ngầm |
| PLAN-05 | Drill-down từ KPI kế hoạch | Lấy đúng contributors và không lộ trường bị cấm |
| INSP-01 | Tạo cuộc kiểm tra/cơ sở/checklist | Đúng phạm vi và authority, version checklist |
| INSP-02 | Tạo kiến nghị và công việc khắc phục | Có source_ref link tới M01, một state source |
| INSP-03 | Khắc phục và hậu kiểm | Có proof, lịch sử, người đóng đúng quyền |

## 6. Reports, integrations, and deployment

| ID | Kịch bản | Expected |
|---|---|---|
| RPT-01 | Tổng việc=2, hoàn thành=1 | KPI chính xác, không hardcoded fallback |
| RPT-02 | Source record đổi sau finalize | Snapshot cũ không đổi, revision có nguồn |
| RPT-03 | Export XLSX/PDF | Signature/parse/open hợp lệ, số khớp, nhãn demo |
| RPT-04 | Lineage drill-down | Full contributors không `limit(3)` và đúng scope |
| RPT-05 | Thiếu dữ liệu | Không trả con số minh họa giả trong nguồn live |
| INT-01 | Import file đúng/sai | Preview, lỗi từng dòng, commit/receipt nhất quán |
| INT-02 | Replay batch | Idempotent, không duplicate |
| INT-03 | Adapter lỗi mạng/timeout | Retry có giới hạn, không thông báo kết nối thành công giả |
| JOB-01 | Thực thi tác vụ nền | Worker thật, receipt đúng, retry/error đúng |
| REL-01 | Build Vercel preview commit xác định | URL/commit/env/migration match, E2E PASS |
| REL-02 | Backup/restore thử | Row/file checksum đúng trong DB độc lập |
| REL-03 | Clone xã B từ cùng artifact | Không sửa code, config và data tách biệt |
| REL-04 | Xã B cố truy cập dữ liệu xã A | Không thể cross read (trong phương án separate projects, chứng minh isolation ở deployment level; không tuyên bố pooled RLS đã được test) |
| REL-05 | Rollback release | UI/API khôi phục build cũ; DB tương thích theo kế hoạch đã duyệt |

## 7. Điểm chặn tuyệt đối

**GATE FAIL ngay** nếu bất kỳ điều nào đúng:

1. Một API báo thành công khi DB không ghi/đọc lại được.
2. Có thể bypass Auth bằng demo cookie ở staging/prod.
3. Quyền sai scope đọc được hồ sơ/file nhạy cảm; `m00:admin` tự vượt qua mọi permission.
4. Báo cáo chốt lấy con số fallback mà không có source; tệp PDF/XLSX giả dạng.
5. Có schema/cloud drift chưa được reconcile và không có rollback plan.
6. Test chỉ tìm chuỗi source được gọi là browser E2E.
7. Một hành vi có giá trị pháp lý được phát hành khi thẩm quyền/rule đang `UNVERIFIED`.
8. Nhân bản xã mới đòi sửa code chuyên biệt hoặc làm lộ dữ liệu xã khác.

## 8. Mẫu test receipt

```yaml
test_id: WORK-03
type: BROWSER_E2E_PLUS_DB_READBACK
commit_sha: <exact-sha>
environment: staging
db_project: <project-ref>
db_migration_versions: [<versions>]
scenario: Officer receives work item and starts processing
expected: status=IN_PROGRESS; version_increment=1; audit_actor=officer
actual: <observed-actual>
result: PASS|FAIL|BLOCKED|NOT_RUN
evidence_refs: [<sanitized-links>]
executor: <agent-or-person>
reviewer: <person-or-agent>
owner_decision: PENDING|ACCEPTED|REWORK
```

**Không dùng kết quả test case này thay cho case khác nếu code/schema/source thay đổi.** Khi sửa lỗi, retest các case liên quan và regression theo change impact.
