# VISUAL REGRESSION & UAT TEST PLAN — PVH
**Document:** VRUAT-v1.0 · **Priority:** P1 (bắt buộc trước preview acceptance) · **Status:** TEST PLAN ONLY / NOT RUN
Không được dùng ảnh mock hoặc screenshot không tương tác để chứng minh nghiệp vụ, RLS hay tốc độ. Tài liệu xác định **cách kiểm chứng** sau khi đã ghép code trên một SHA tích hợp.

## 1. Test strategy & coverage
4 lớp:
1. **Visual regression** — layout, màu, chữ, spacing, overflow, trạng thái trên breakpoint.
2. **Interaction/UX** — click/keyboard, form, trạng thái, thông báo, navigation, không dead end.
3. **Functional E2E** — browser → API → DB readback thật trên staging giả lập được, permission/object scope, không thành công giả.
4. **Performance & reliability** — metrics CWV, SQL p95, concurrency, offline/timeout, lớn dữ liệu.

UI-first acceptance không đồng nghĩa tất cả 128 OP phải hoàn thiện: chỉ các slice MVP bật thật phải đạt toàn bộ gate tương ứng; các OP deferred được thống kê rõ.

## 2. Test environment contract
| Field | Required evidence |
|---|---|
| SHA/build | git commit 40 chars, build ID, URL preview |
| Runtime | Node/Next/React, browser engine/version, release environment |
| Data | Fixture version, dataset seed checksum, app/DB migration SHA |
| Actors | P1 lãnh đạo có quyền thật; P2 công chức; P4 địa bàn; M00 admin riêng; unauthorized account |
| Scopes | Cùng tenant, khác địa bàn, user không có membership; nếu kiểm nhiều tenant dùng isolated synthetic test setup |
| Viewports | 375×812, 390×844, 768×1024, 1024×768, 1440×900 |
| Browsers | Chromium chuẩn; WebKit/Firefox smoke cho UI chính khi khả dụng |
| Network | cold/warm cache, desktop normal, simulated mobile 4G, offline |
| Dataset | 0,1,20,100,101,1k,10k work items, 5k+ events, 500 reports, linked/unlinked files |
| Dates | Frozen time, timezone Asia/Ho_Chi_Minh, near-midnight/day/month boundaries |
| Privacy | Only synthetic non-sensitive data; screenshots/logs redacted |

Do not use real people's data or real legal/medical case details in visual snapshots. Snapshot filenames must include SHA, role, route, viewport, state and theme.

## 3. Screenshot coverage matrix
**For each screen and viewport take base, loading, empty/no results, error/permission, populated and modal opened if applicable**. Mobile screenshot extends to full page and at scroll positions for long tables.
| Screen ID | Route/screen | 375 | 390 | 768 | 1024 | 1440 | Critical states |
|---|---|---|---|---|---|---|---|
| VIS-01 | Login/logout | ✓ | ✓ | ✓ | ✓ | ✓ | invalid credentials, loading |
| VIS-02 | AppShell/sidebar/header | ✓ | ✓ | ✓ | ✓ | ✓ | drawer open/closed, no permission |
| VIS-03 | Tổng quan dashboard | ✓ | ✓ | ✓ | ✓ | ✓ | demo, 0, partial data, 4 KPI |
| VIS-04 | Bàn làm việc | ✓ | ✓ | ✓ | ✓ | ✓ | no work, review, overdue |
| VIS-05 | Công việc list | ✓ | ✓ | ✓ | ✓ | ✓ | filtered, paginated, 101+ |
| VIS-06 | Tạo/sửa công việc | ✓ | ✓ | ✓ | ✓ | ✓ | validation, processing, conflict |
| VIS-07 | Chi tiết/timeline/evidence | ✓ | ✓ | ✓ | ✓ | ✓ | long text, file preview, 403 |
| VIS-08 | Văn hóa gia đình | ✓ | ✓ | ✓ | ✓ | ✓ | demo legal restriction |
| VIS-09 | M09 Báo cáo | ✓ | ✓ | ✓ | ✓ | ✓ | draft/review/finalized |
| VIS-10 | M09 Xuất PDF/XLSX | ✓ | ✓ | ✓ | ✓ | ✓ | pending, ready, error |
| VIS-11 | M10 Nhập CSV | ✓ | ✓ | ✓ | ✓ | ✓ | partial validation, receipt |
| VIS-12 | M00 Tài khoản & quyền | ✓ | ✓ | ✓ | ✓ | ✓ | no permission, revoke confirm |
| VIS-13 | Shared notifications | ✓ | ✓ | ✓ | ✓ | ✓ | toast stack, banner, field errors |
| VIS-14 | M02–M08 visible MVP pages | ✓ | ✓ | ✓ | ✓ | ✓ | skeleton vs real data label |
| VIS-15 | M11 (only if implemented) | ✓ | ✓ | ✓ | ✓ | ✓ | referenced catalog deny |

Visual comparison rules: baseline from main/dashboard captured first; dynamic values, date, ID, user info are frozen through fixtures or masked **only for nondeterministic content**. Layout areas must not be silently masked. Differences requiring explicit review: sidebar width, wrapping, mobile horizontal overflow, column collapse, focus, font, badge meaning, modal position, chart legend/scale.

## 4. Detailed UAT test cases (Given–When–Then)
### Navigation & identity
| ID | Given / When | Expected Then |
|---|---|---|
| UAT-001 | P2 logs in on mobile and opens menu | Drawer opens, focus correct, authorized routes only, closes after navigate |
| UAT-002 | User without module permission opens sidebar | No DEFAULT_GROUPS fallback; unauthorized route denied server-side |
| UAT-003 | Tenant/role context unavailable | Clear error/login; not false “Chủ tịch UBND xã” |
| UAT-004 | Logout button clicked while form dirty | Proper policy for dirty form; session ends, protected page inaccessible |
| UAT-005 | Open invalid/deferred route | Meaningful not-found/deferred state; no dead CTA |

### Dashboard & data truth
| ID | Given / When | Expected Then |
|---|---|---|
| UAT-006 | 101+ work items exist, leader loads dashboard | KPI computes all permitted rows, not capped at 100 |
| UAT-007 | P4 scope includes hamlet A, B has other records | No B counts/names in KPI, chart, queue or drill-down |
| UAT-008 | Completion event history truncated or query failed | Trend marked incomplete/unavailable, not silently 0 |
| UAT-009 | Click KPI overdue and inspect work list | Same scope, denominator and filter semantics, no leak |
| UAT-010 | Create/complete a task, refresh | KPI/queue reflect readback and audit; no stale optimistic false success |
| UAT-011 | Test TODAY and +7 day boundaries | Correct “sắp đến hạn” with VN timezone and closed exclusions |

### M01 CRUD/flow
| ID | Given / When | Expected Then |
|---|---|---|
| UAT-012 | P2 creates valid task with assignee/deadline | One record, one success state, correct details, audit |
| UAT-013 | Form missing title or invalid date | Inline field errors, focus first invalid, no mutation |
| UAT-014 | Two users edit same work item simultaneously | Stale version blocked with actionable conflict UI |
| UAT-015 | Same submit repeated after timeout | Idempotent result / no duplicate task |
| UAT-016 | Unauthorized user invokes direct transition action | Denied by server/RLS; UI does not claim success |
| UAT-017 | P2 searches, pages, changes filter and goes back | No client-only cap, URL and result count consistent |
| UAT-018 | Task with long description/attachments opened mobile | Drawer/detail scrolls, actions remain reachable |
| UAT-019 | Evidence upload invalid type, denied scope, retry | No public file, real error and secure attachment link |
| UAT-020 | Collab/assignment changed then reloaded | Correct actor/time/version, history retained |

### M09/M10/reporting and privacy
| ID | Given / When | Expected Then |
|---|---|---|
| UAT-021 | Report created from valid period/source | Source/period/version recorded; 0 distinct from NULL |
| UAT-022 | User without finalize right attempts finalize | Disabled or safe denied, no snapshot mutation |
| UAT-023 | Finalized report edited directly | Rejected; revision flow provided, old snapshot intact |
| UAT-024 | PDF/XLSX export for authorized user | File opens, version/period correct, no missing Vietnamese glyphs |
| UAT-025 | Unauthorized user guesses export job URL | Denied and no content leaked |
| UAT-026 | CSV import malformed/duplicate rows | Preview row errors, policy applied, counts and receipt correct |
| UAT-027 | CSV partial success | Success/failed counts match DB and downloadable error file |
| UAT-028 | M06/M07 sensitive record or notification viewed without right | Hidden/masked/denied, no personal data in preview |

### Shared UX & failure modes
| ID | Given / When | Expected Then |
|---|---|---|
| UAT-029 | Save succeeds | One common toast message, no double notifications |
| UAT-030 | Attempt destructive delete | Explicit target + impact; default focus Cancel, Escape behavior safe |
| UAT-031 | Server returns 422 field map | Error summary + field links, entered content preserved |
| UAT-032 | Network goes offline while browsing | Accurate offline banner and retry; no synthetic rows |
| UAT-033 | Request times out after possible server commit | UI says unknown outcome and checks status before resend |
| UAT-034 | Keyboard navigate full dashboard / modal | Visible focus, no trap except proper modal, Escape restores |
| UAT-035 | Reduced motion enabled | UI works without animations and avoids motion effects |
| UAT-036 | 10k synthetic records & 375px viewport | No all-record hydration, scoped paging, smooth scroll |
| UAT-037 | Import/export job still processing | Real progress/receipt, page remains responsive |
| UAT-038 | Unimplemented M11/deferred OP accessed | Honest “Đang hoàn thiện”; no fake operational success |

## 5. Automated test architecture
- **Unit:** dashboard metrics (scope/date/role), form schemas, message registry, status transitions, report formula.
- **DB contract:** SQL migration clean replay, grants/RLS/Storage/private files, authorization negative tests.
- **Browser E2E:** Playwright or chosen equivalent on one consistent test environment; dedicated fixed test accounts, fixture isolated; run main journeys and mobile.
- **Visual:** screenshot snapshots with stable fixtures per viewport/theme/state. Separate baseline changes from regressions; manual review required on major redesigned screens.
- **A11y:** automated axe or equivalent plus manual keyboard/screen-reader spot tests; WCAG 2.2 AA target.
- **Perf:** lab Web Vitals + SQL p95 and trace; thresholds from PERF spec; separate cold vs warm.

Suggested CI tiers: on every integration PR => unit/typecheck/lint/build/security static + critical E2E + mobile smoke; nightly => full visual multi-browser, DB migration replay, large-data perf; pre-release => hosted RLS/storage E2E and full UAT. Workflow trigger must include integration branch and PR to main.

## 6. Severity and defect triage
| Severity | Criteria | Release decision |
|---|---|---|
| S0 Blocker | Cross-tenant leak, irreversible loss, arbitrary privilege escalation, fake financial/legal success | Stop preview/release immediately |
| S1 Critical | Main CRUD unusable, wrong dashboard totals without warning, mobile navigation unusable, auth broken | Block owner acceptance |
| S2 Major | Form validation/flow broken, significant layout clipping, export wrong glyph/content, severe perf regression | Fix before user-facing preview of affected feature |
| S3 Minor | Cosmetic spacing, noncritical animation, secondary filter UX | Can defer with ticket, owner informed |
| S4 Enhancement | Additional charts, extra export type, deep OP expansion | Planned next phase |

No P0/S0/S1 open for core preview; S2 on a visible flagship screen also blocks sign-off. Domain slices not ready must be clearly disabled/deferred rather than shipped broken.

## 7. Visual scorecard (measured, no subjective 100% claims)
| Dimension | Evidence | Gate |
|---|---|---|
| Typography & spacing | Screenshots + tokens consistency | No critical inconsistency across flagship screens |
| Visual hierarchy | user task completion + UX review | primary CTA/action clear on each screen |
| Responsive | five widths, drawer/table/modal | no viewport overflow or inaccessible action |
| Feedback | toast, inline errors, loading states | all priority actions explain outcome |
| Navigation | menu, breadcrumb, back/deep-link | 0 dead links / 0 forbidden menu exposure |
| Data semantics | dashboard & report source labels | values reconcile with backend |
| Accessibility | automated + keyboard tests | no critical focus/name/contrast issues |
| Speed | CWV/DB traces PERF spec | actual targets or signed exception |

## 8. Acceptance transcript template
    Case ID:
    Build SHA / URL:
    Role / Tenant / Scope:
    Fixture version / schema checksum:
    Viewport / Browser / Network:
    Preconditions:
    Steps:
    Expected:
    Actual:
    Status: PASS | FAIL | BLOCKED | NOT_RUN
    Evidence: screenshot / video / trace / SQL result / CI URL:
    Defect ID / Severity:
    Tester:
    Reviewer:
    Date:

## 9. Test execution and owner approval
- Tester records screenshot and database/API evidence, separate from test-plan author.
- BA verifies business wording/status, architect verifies cross-branch behavior/security, UX reviews UI, owner is final merge approver.
- Re-run visual baseline and critical flows after each conflict resolution touching shell, M01, dashboard or permissions.
- UAT approval is tied to exact integration commit + migration state; any subsequent changes invalidate affected evidence.
- **Current result: NOT_RUN.** This document is the full proposed acceptance framework, not evidence that UI is beautiful/fast yet.
