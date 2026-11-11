# BRANCH INTEGRATION RESOLUTION MATRIX — CHI TIẾT THEO COMMIT/FILE
**Document:** BIRM-v1.0 · **Status:** REVIEWED SOURCE INVENTORY / MERGE NOT EXECUTED · **Priority:** P0
**Scope:** pvh-demo, source branch snapshots ngày 09/11/2026. Mọi tip SHA phải kiểm lại trước khi chạy merge; diff ở đây là **ứng viên xung đột về hành vi**, không phải kết quả git merge conflict thực tế.

## 1. Immutable source ledger
| Alias | Branch | Tip SHA snapshot | Quyết định |
|---|---|---|---|
| BASE | main | e08fa3587bede82be6ea77c45d7a83a76cf9be24 | Nền tích hợp, bảo toàn thay đổi UX mới |
| P1 | feat/pvh-ph01-platform-auth | d2ccbf1e95f5bd5894a26911ba187716d706a03f | Truy hồi delta chưa kế thừa |
| P2 | feat/pvh-ph02-core-workflow | 18280d1e3eadefe073b678a903f6e11ae8ddba9e | Truy hồi delta chưa kế thừa |
| P3 | feat/pvh-ph03-domain-verticals | 5876113884ca9eb0325002d0ea352d5ad622668c | Đã nằm trong lịch sử P6v2 |
| P4 | feat/pvh-ph04-reporting-integrations | 223baa3473ca1987f3105e9c28bc90aec7ae474c | Đã nằm trong lịch sử P6v2 |
| P5 | feat/pvh-ph05-release-clone | 8eb29aa90ea1daae968e2244c14b2613e1034dbe | Đã nằm trong lịch sử P6v2 |
| P6v1 | feat/pvh-ph06-domain-expansion | a488cd5f1e1dd60ace072cba73d219c8ba173f65 | Tài liệu baseline cũ, không merge code |
| P6v2 | feat/pvh-ph06-domain-expansion-v2 | c4fc1011ac151c3513509415fb1a62a8f9cd03cc | Nền code tích lũy, KHÔNG đạt G6 |
| DASH | feat/pvh-dashboard | ecfa289fd9cd9be1bd8debfc408571c49a711628 | Chọn UI/metric, sửa data contract |
| SPECS | docs/pvh-full-module-spec-20261109 | 77c4e066b0fe8d41b74fd358cd2b6a5f1026131a | Tích hợp docs, label DRAFT |

**Branch hierarchy:** P3 → P4 → P5 → P6v2 là fast-forward ancestry khi so sánh tương ứng; P1/P2 tip phân kỳ. So P6v2 với P1: 7 commit P1 riêng; so P6v2 với P2: 7 commit P2 riêng; một phần có thể cùng lịch sử/cherry-pick tương đương, cần so patch-ID trước khi đếm và backport. So P6v2 với BASE: BASE còn 1 commit riêng, chạm 16 paths. DASH và SPECS đều tách từ BASE.

## 2. Merge plan by evidence, not chronology alone
**Step A:** Snapshot + backup tags/SHAs, check clean and freeze CI.\
**Step B:** Merge P6v2 into new integration branch from BASE, resolve per matrix below.\
**Step C:** Audit P1 and P2 unique commits (full diff/patch-ID), classify REQUIRED, EQUIVALENT, SUPERSEDED, UNSAFE. Cherry-pick -x / re-implement **only proven missing behavior**.\
**Step D:** Bring DASH as selective component/behavior changes; never simply take its M01 page over P6 paging.\
**Step E:** Bring SPECS docs and P6v1 baseline note; do not enable M11 runtime without code.\
**Step F:** Unified Design System / perf / migration replay, PR owner review.

## 3. File-level decision register
| ID | Files / scope | Preserve from | Change in integration | Hard gate | Priority |
|---|---|---|---|---|---|
| R-001 | src/config/navigation.ts | P6 explicit permissions + DASH dashboard + BASE useful menu labels | One NAVIGATION_REGISTRY, correct menuId/route/status/entitlement; no route dead link, no permissive fallback | NAV-01/02 | P0 |
| R-002 | src/components/layout/sidebar.tsx | BASE styling usability; P6 auth filtering | Fix DEFAULT_GROUPS when filtered=[]; mobile focus, close on navigate, proper empty permission state | NAV-03/UX-01 | P0 |
| R-003 | src/app/(app)/layout.tsx | DASH mobile navigation plus P6 server auth | Remove hardcoded xã/role fallback; use valid context; unauthorized state safe | AUTH-01/UX-02 | P0 |
| R-004 | src/app/(app)/cong-viec/page.tsx | P6 paging/search and BASE/DASH polished UI | Paginated server-backed WorkItemManager, URL filters, focus ID fetch authorized | WORK-01/PERF-101 | P0 |
| R-005 | src/features/m01-core-work/server/queries.ts | P6 getWorkItemsPage, events, detail | Add scoped aggregate API for dashboard, never total from getWorkItems limit(100) | PERF-101, 102, 104 | P0 |
| R-006 | src/features/m01-core-work/server/repository.ts | P6 RPC/OCC/idempotency + BASE needed fields | Align SQL signatures and conflict handling, preserve safe audit; no direct client write | WORK-02/DB-04 | P0 |
| R-007 | src/features/m01-core-work/components/work-item-manager.tsx | BASE/DASH modals & filter UX | Rewire to server page contract; prevent client-only filtering of capped dataset; use shared Toast | WORK-03/UX-03 | P0 |
| R-008 | create-work-item-modal.tsx + create-work-item-form.tsx | BASE accessible modal + P6 safe RPC intent | Compose one actual create flow, preserve assignee/deadline/validation, no duplicate submit | WORK-04 | P0 |
| R-009 | work-item-detail-modal.tsx, work-item-return-modal.tsx, work-item-table.tsx | BASE visual details + P2 workflow | Preserve transition, timeline, evidence, edit, collaboration; row action permissions | WORK-05/06 | P0 |
| R-010 | update-work-item-details-form.tsx + set-work-collaborators-form.tsx | P2 latest tip (files absent P6v2) | Backport verified code + server actions + SQL, do not transplant detached UI | WORK-07 | P0 |
| R-011 | src/features/m00-platform/components/accounts-console.tsx | P1 latest tip | Restore account console, role grant/revoke, lock/reset intent with real auth and safety | AUTH-02 | P0 |
| R-012 | src/app/(app)/quan-tri/tai-khoan/page.tsx | P1 latest tip | Add guarded route, menu node, no cached privilege | AUTH-03 | P0 |
| R-013 | supabase/migrations/20261108104745_ph01_security_contract.sql | P1 latest tip | Inventory dependencies/order, no duplicate migration; verify exact DB grants/RLS | DB-01 | P0 |
| R-014 | .github/workflows/db-ci.yml; tests/security/*; supabase/tests/* | P1 latest tip | Keep hostile permission tests, RLS fixture and DB gate | CI-01 | P0 |
| R-015 | supabase/migrations/20261108060000_m01_core_workflow.sql | P2 latest tip vs P6 version | Semantic diff, check updated SQL rules/signatures; migrations are forward-only | DB-02 | P0 |
| R-016 | src/features/m02-internal-affairs/server/actions.ts | P6v2 fail-safe + P1 hardening | RPC failure never succeeds; remove fallback direct writes; preserve actor scope | SEC-06 | P0 |
| R-017 | src/features/m03-education/server/actions.ts | P6v2 fail-safe + P1 | Unverified exemption/approval must be blocked safely | SEC-07 | P0 |
| R-018 | src/features/m06-health-social/server/actions.ts + beneficiary UI | P6v2 safety + BASE better modal | Preserve no fake UUID/PAID, sensitive data masked, validation | SEC-08 | P0 |
| R-019 | src/features/m04-culture-family/server/actions.ts + culture-dossier UI | P3 safe legal pack + BASE UI | Separate illustrative workflow from formal recognition; preserve evidence | CULT-01 | P0 |
| R-020 | src/features/m07-ethnicity-faith/* | BASE improved table + P6 role gates | No unverified authority; access privacy and source refs | SEC-09 | P1 |
| R-021 | src/features/m05-science-digital/* | P3 vertical | Preserve 0 vs NULL vs NOT_REPORTED and real data | DATA-05 | P1 |
| R-022 | src/features/m08-inspections/* | P3 vertical | Closing remediation requires completed linked work + actor guards | INSP-01 | P1 |
| R-023 | src/features/m09-reporting/*, /bao-cao | P4 | Keep snapshot, lineage, PDF/XLSX, async authorized jobs; add consistent shared UX | RPT-01/02 | P1 |
| R-024 | src/features/m10-integrations/*, /nhap-chi-tieu | P4 | Keep MVP CSV preview/commit and receipt; hide simulated adapter as non-live | INT-01 | P1 |
| R-025 | src/features/dashboard/**, /dashboard | DASH | Migrate role semantics + charts + screen hierarchy; rebuild trusted aggregate datasource | DASH-01/02 | P0 |
| R-026 | src/features/dashboard/components/dashboard.module.css | DASH | Harmonize --dash-* with global semantic tokens; light mode first | UI-01 | P0 |
| R-027 | .github/workflows/ci.yml and ph0x gates | P1/P4/P5 relevant checks | Unified on integration push & PR main, run unit/DB/build/perf/visual separately | CI-02 | P0 |
| R-028 | package.json / package-lock.json | P6v2 validated dependency set | Keep required exceljs/pdfkit/PGlite/tsx, npm ci, pin versions after audit | CI-03 | P0 |
| R-029 | docs/specs/PVH_FULL_MODULE_SPEC_2026-11-09/** | SPECS | Merge docs only, crosslink OP, preserve unresolved TBD | DOC-01 | P1 |
| R-030 | P6v1 PH06_EXECUTION_BASELINE.md | P6v1 | Archive as prior baseline / superseded; never overwrite P6v2 implementation | DOC-02 | P2 |
| R-031 | src/components/ui/button.tsx, input.tsx + shared UI | BASE + UI Master Spec | Replace hardcoded colors with semantic tokens, add error variants, no duplicate button | UI-02 | P0 |
| R-032 | permission policy & storage files | P1/P2 | Verify sessions, private bucket, file parent access, no service key in client | SEC-01/04 | P0 |

## 4. Decision protocol for EVERY conflict
1. Record base/ours/theirs sha + function intent; run semantic diff and identify overlapping business rule.
2. Identify authoritative invariant: security first, data correctness second, UX parity third, aesthetics fourth.
3. If source versions both valid: compose and test; if one unsafe: reject unsafe with rationale.
4. Produce table entry: decisionId, sourceSHAs, keptLines/behavior, removedLines/behavior, tests, screenshots, reviewer, commitSHA.
5. Re-run affected unit + DB + UI regression immediately; do not defer all tests until final.
6. Zero unclassified conflicted files; do not mark EQUIVALENT by file name alone.

## 5. Exclusive-tip review checklist
**P1 unique:** M00 accounts-console + route, invitations, membership validity, role delegation, security contract migration, DB CI, RLS fix, audit-logger. Check executable parity rather than assuming all absent.
**P2 unique:** work item update fields, collaborator management, mark inbox read, evidence uploader, workflow/DB tests, route loading/error and SQL extension. Some may be superseded by later version; document reason.
**BASE unique 16 paths:** all M01 modals/table/work manager, M04 culture dossier/propose, M06 beneficiary, M07 establishment, navigation/sidebar; capture visual before/after.

## 6. SQL and environment rule
MVP current deployed Supabase baseline described as **single commune** in supabase/README.md; do NOT silently transform it into multi-tenant shared database in merge. Test multi-tenant abstraction separately with synthetic fixtures if required, but no cloud reset/push. Never modify already applied migration in place. Resolve contradictory docs via ADR: one codebase clone, each configured commune isolated deployment/DB for initial release.

## 7. Exit checklist
- [ ] Source ledger confirmed (SHAs re-checked), commit delta tagged REQUIRED/ALREADY_EQUIVALENT/SUPERSEDED/UNSAFE.
- [ ] R-001..032 dispositions recorded with exact code SHA and test ID.
- [ ] All P0 tests pass on integrated branch; tests for cloud/owner not claimed before run.
- [ ] 16-file BASE UX regression reviewed by screenshots.
- [ ] 0 unreviewed security/SQL merge conflict.
- [ ] One approved PR to main; original branches kept until approval.
