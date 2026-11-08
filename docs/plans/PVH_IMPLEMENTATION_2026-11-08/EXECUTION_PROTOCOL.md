# Execution Protocol — Một owner, nhiều tác vụ nhỏ, evidence trước PASS

## 1. Cách dùng gói plan

1. Đọc `README.md` và đúng tệp phase hiện tại, không bắt AI triển khai đồng thời 7 phase.
2. Khóa base SHA; xác minh worktree sạch hoặc phân loại thay đổi thuộc người dùng; không reset/overwrite code chưa xác nhận.
3. Chọn **một task ID** hoặc một nhóm nhỏ không tranh chấp file/schema; bảo đảm DoR và dependency PASS.
4. Viết Implementation Notes (các file sẽ sửa, migration impact, tests, rollback) rồi mới đổi code.
5. Implement → test → evidence → tự review/challenger → cập nhật issue/gate, nhưng trạng thái chỉ đến `VERIFIED`.
6. Đưa diff/receipt cho **Đỗ Văn Đạt** duyệt; chỉ owner chuyển `OWNER_ACCEPTED`, không để agent tự merge/approve khi chưa có lệnh.
7. Sau owner acceptance, merge/release theo workflow; cập nhật baseline SHA/migration versions. Chuyển task tiếp theo.

## 2. Quy tắc an toàn cho agent coding

- Không thay đổi Supabase cloud schema/dữ liệu hoặc Vercel production chỉ vì task viết plan; các thao tác thay đổi bên ngoài phải thuộc task được phê duyệt.
- Không chạy `supabase db reset` trên project remote; xác nhận target local/ephemeral trước mọi lệnh reset.
- Không chạy migration cũ `20261108000001..09` lên cloud đang có baseline khác; lập reconcile và thử trên DB riêng trước.
- Không thêm fallback `return ok(fakeId)` để qua UI hoặc test.
- Không bỏ RLS/turn off auth để cứu lỗi.
- Không nhúng service role/secret key vào code, frontend, fixture, logs, reports.
- Không tự bịa căn cứ pháp luật, điều kiện, thẩm quyền, biểu mẫu, tác nhân hay tình trạng được duyệt.
- Không mở rộng scope từ PVH thành hệ thống trực tiếp chi trả, quản trị trường, bệnh viện hoặc cổng DVC toàn xã.
- Không dùng số lượng test assertions làm mẫu số readiness nếu chưa phân loại test types.
- Mỗi khi task sửa contract chung, chạy regression module phụ thuộc và ghi ảnh hưởng.

## 3. Prompt mẫu giao cho Claude Code/Gemini

```text
Act as a Principal BA + Staff Software Engineer implementing the PVH Workbench.

Repository: dovandatym1-ship-it/pvh-demo.
Plan: docs/plans/PVH_IMPLEMENTATION_2026-11-08/README.md.
Current phase: <PHxx>; current task IDs: <IDs only>.
Baseline commit: <exact SHA>; baseline DB migrations: <exact version list>.
Owner and ONLY final approver: Do Van Dat.

Before editing:
1) Read the phase file, linked OP/REQ/WF, actual source and current DB contract.
2) Report mismatches, unresolved authority/legal rules, impacted files and migration hazards.
3) Preserve unrelated user changes; no destructive reset, remote DDL or production deploy without task-specific authorization.

Implementation rules:
- Do only these task IDs and their necessary dependencies. Keep one source-of-truth per business operation.
- Reuse M00/Auth/tenant/context/RLS/audit and M01 service/workflow contracts.
- Never silently fall back from failed RPC/DB write to fake success.
- Keep demo mocks isolated from real server actions and never promote illustrative rules to legal authority.
- For any privileged function, check actor, membership, record scope, grant, RLS and transaction semantics.

Verification:
- Show actual browser/API/SQL readback evidence (not just source-string tests).
- Include happy path, invalid, forbidden, duplicate/retry, version conflict and record-scope tests where relevant.
- If tests cannot run, mark NOT_RUN/BLOCKED; never claim PASS.
- Provide files changed, diff summary, exact commands/results, migration impact, security impact, rollback, unresolved issues.

Output: a task receipt following the prescribed schema.
Do not mark OWNER_ACCEPTED or merge/release unless the owner explicitly approves.
```

## 4. Receipt schema bắt buộc cho mỗi task

```yaml
task_id: P02-03
phase: PH02
baseline_commit: <sha>
head_commit: <sha-or-uncommitted>
db_before: [<migration-version>]
db_after: [<migration-version-or-UNCHANGED>]
scope: [<OP/REQ/WF>]
decision_refs: [<D-IDs>]
files_changed: [<paths>]
implementation_summary: <what changed and why>
tests:
  static: { status: PASS|FAIL|NOT_RUN, evidence: <ref> }
  unit: { status: PASS|FAIL|NOT_RUN, evidence: <ref> }
  integration: { status: PASS|FAIL|NOT_RUN, evidence: <ref> }
  browser_e2e: { status: PASS|FAIL|NOT_RUN, evidence: <ref> }
  db_readback: { status: PASS|FAIL|NOT_RUN, evidence: <ref> }
security_review:
  severity_remaining: <P0/P1/P2 counts>
  rls: <check result>
  pii: <check result>
rollback_plan: <safe strategy>
open_questions: [<questions>]
review_verdict: VERIFIED|REWORK|BLOCKED
owner_approval: PENDING
```

Các giá trị mẫu `<...>` là placeholder, **không** phải kết quả thật. Review receipt phải chỉ ra nguồn/bằng chứng trực tiếp, không nhận “AI reviewer said PASS” là tự đủ căn cứ.

## 5. Cách phản biện để tránh phình hệ thống

Mỗi reviewer/challenger chỉ cần trả lời 7 câu:

1. Tác vụ giải quyết vấn đề người dùng nào? Có nằm trong OP/REQ và scope MVP không?
2. Có xây trùng dữ liệu/workflow/authorization đã tồn tại ở core không?
3. Người dùng có đi từ đầu vào đến đầu ra thực hay chỉ nhìn thấy UI/list?
4. Rule/thẩm quyền có căn cứ, phiên bản và ngày hiệu lực? Chưa chắc thì đã khóa đúng chưa?
5. Mọi đường đi lỗi có trả lỗi thật và giữ dữ liệu nhất quán không?
6. Kiểm thử có quan sát đúng hành vi, actor và DB? Hay chỉ kiểm chuỗi source?
7. Diff có tác động ngoài task, làm tăng complexity, latency hoặc phá stable flow không?

Challenger đề xuất thay đổi nhưng **không** tự mở thêm phase, phê duyệt scope, sửa tài liệu pháp lý hay merge branch. Người duyệt cuối cùng vẫn là owner.

## 6. Lựa chọn phát triển có ý thức

- Ưu tiên một vertical slice thật trước 10 module shell.
- Dùng CRUD đơn giản cho master data, chỉ dùng workflow khi có vòng đời và phân quyền cụ thể; không ép mọi danh mục qua workflow engine.
- Không tự sinh microservice/message broker nếu Next.js + PostgreSQL RPC + tracked jobs đã đáp ứng NFR.
- Không xây rules engine quá tổng quát cho 128 OP chưa được đặc tả; cấu hình hóa các điểm thật sự thay đổi theo địa phương/hiệu lực.
- Chỉ thêm abstraction sau khi có ít nhất 2–3 use-case thực buộc phải dùng chung và test chứng minh không phá nghiệp vụ.

## 7. Kết thúc phase

```text
IMPLEMENTED → independent test evidence → VERIFIED → owner review
    ├─ ACCEPTED → update gate and baseline → next phase
    └─ REWORK/BLOCKED → issue log + targeted fix + retest
```

**Mục tiêu kiểm soát:** tối ưu số lượng quyết định cần owner duyệt, không tổ chức hàng loạt vai trò hình thức. Agent có thể làm implement/review/test độc lập về logic; nhưng không thay thế một chữ ký owner và không tạo “AI consensus” như bằng chứng pháp lý.
