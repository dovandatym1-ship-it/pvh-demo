# Execution backlog & acceptance gates — UI / Performance first
Status: PROPOSED. Order by dependency, **not dates or claimed completion**. Owner approves PR once.

## W0 — Inventory / freeze / contracts
| ID | P | Deliverable | Acceptance |
|---|---|---|---|
| INT-001 | P0 | Freeze tips SHA of 10 branches and old PR/CI state | Branch SHA ledger + diff summary |
| INT-002 | P0 | Map exclusive PH01 and PH02 commits, inspect SQL/config | Per commit disposition + reason + owner |
| INT-003 | P0 | Baseline screenshots and current performance numbers before change | Evidence at 4 breakpoints, 3 roles, core routes |
| INT-004 | P0 | Lock MVP: one commune per configured deployment, synthetic demo policy | ADR accepted; names not hardcoded |
| INT-005 | P0 | Define merge source-of-truth/conflict owner by file | Signed conflict matrix; no blanket 'ours/theirs' |

## W1 — Safe integrated backbone
| ID | P | Deliverable | Acceptance |
|---|---|---|---|
| INT-101 | P0 | Integration branch from main, merge cumulative PH06 v2 | All 16 main UI changes disposition; no unresolved conflict |
| INT-102 | P0 | Reconcile PH01 tip security/account/migrations | Auth/RLS/DB tests; M00 account actions authorized |
| INT-103 | P0 | Reconcile PH02 tip M01 forms/workflow/migrations | Assignment/edit/evidence/inbox parity and tests |
| INT-104 | P0 | Fix sidebar fail-open display, fake role/tenant label | Empty permission returns empty nav; no misleading identity |
| INT-105 | P0 | Lock SQL migration sequence, receipts and RLS | Clean local replay + negative cross-scope tests |
| INT-106 | P0 | Block false success / unverified legal/payment actions | Failing RPC yields safe failure and no mutation |

## W2 — Premium shared UI
| ID | P | Deliverable | Acceptance |
|---|---|---|---|
| UI-201 | P0 | AppShell/header/nav responsive | No overflow; menu/tenant/role correct on 375/768/1024/1440 |
| UI-202 | P0 | Token system: typography, spacing, colors, states | 100% priority screens consume shared tokens |
| UI-203 | P0 | Standard Table, FilterBar, FormField, Drawer/Modal | Accessible, consistent CRUD, paging, no dead actions |
| UI-204 | P0 | Shared Toast/Alert/Confirm and error mapping | No duplicate module toast; retries/validation deterministic |
| UI-205 | P0 | M01 list-detail-edit-create visual polish | All listed actions work with same backend semantics |
| UI-206 | P1 | M04 representative workflow + M09 reports UI polish | Meaningful states and export UX |
| UI-207 | P1 | Design review: before/after and 4-size evidence | Owner-approved visuals with no critical focus/contrast bugs |

## W3 — Dashboard + performance correctness
| ID | P | Deliverable | Acceptance |
|---|---|---|---|
| PERF-301 | P0 | Integrate DashboardView/insights/role semantics | Role-appropriate KPI and responsive layout |
| PERF-302 | P0 | Replace capped getWorkItems dashboard aggregation | 101+ records yield correct totals; scope/role filters and ledger |
| PERF-303 | P0 | Server paging/filter/sort for work UI | No 100-record cap as overall total, no mass hydration |
| PERF-304 | P0 | Profiling baseline + fixes | LCP/INP/CLS budget on defined profile or documented exception |
| PERF-305 | P1 | Lazy charts, modals, exports and search UX | Bundle regression within baseline budget; no broken async actions |
| PERF-306 | P1 | Three-role visual/data UAT | KPI→queue→detail→action→updated KPI source consistency |

## W4 — Core functional demonstration
| ID | P | Deliverable | Acceptance |
|---|---|---|---|
| CORE-401 | P0 | Login/logout, role-gated navigation and no unauthorized file | Auth/RLS/browser test and negative paths |
| CORE-402 | P0 | M01 create/assign/update/transition, OCC, idempotency | Auth user, DB readback, conflict/timeout scenarios |
| CORE-403 | P1 | M09 draft/report/finalize/export PDF/XLSX | Real snapshot and authorized output checks |
| CORE-404 | P1 | M10 CSV preview/import/export MVP | Row-level error/provenance, safe policy and no false job success |
| CORE-405 | P1 | One M04 example end-to-end, others clearly labeled | No unverified legal decision; source + demo labels |
| CORE-406 | P1 | Specs M00–M11 integrated and mapped to code status | Spec≠implemented; module status manifest accurate |

## W5 — Release decision / branch closure
| ID | P | Deliverable | Acceptance |
|---|---|---|---|
| REL-501 | P0 | Unified CI triggers on integration push and PR main | All checks linked to exact SHA |
| REL-502 | P0 | E2E on preview/staging core journeys | 0 critical regression, screenshots and log receipts |
| REL-503 | P0 | DB/security readback, storage role tests | Tenant/scope and direct API denial verified |
| REL-504 | P0 | UX/performance scorecard and regression matrix | Metrics actually measured, target met or documented exception |
| REL-505 | P0 | One owner PR review + change summary | Only owner merges main |
| REL-506 | P1 | Branch ledger and rollback plan | Each legacy branch INTEGRATED/SUPERSEDED/DEFERRED with evidence |

## W6 — Can be deferred *after* premium preview
- Expand 128 OP packs, legal-source review and deep per-module CRUD; no production claim for unverified flows.
- Advanced M10 external connectors, scheduler, bi-directional sync beyond agreed MVP.
- M11 full catalog management UI (spec and data dictionary can exist earlier).
- Complete reporting templates including DOCX when actual template/owner is confirmed.
- Multi-commune shared DB architecture: only if owner changes from per-deployment clone to central hosted platform.
- Sophisticated workflow dashboards, advanced search, global dark mode, optional notifications outside in-app inbox.

## Hard stop vs soft backlog
**Hard stop:** security leak, unauthorized action, data loss/duplicate, fake success, server error swallowed as success, broken login, wrong KPI counts presented as complete, critically broken mobile navigation, modal trapping, inoperable main CRUD.

**Soft backlog:** missing advanced OP form, extra filter presets, chart variety, 3rd-party live connector, styling of deferred pages, cosmetic animation, nonessential report formats.

## Acceptance gates
| Gate | What must be proven | Required evidence |
|---|---|---|
| G-MERGE | Source integration correct | Diff matrix resolved, no lost PH01/02 fixes, no semantic merge conflicts |
| G-UX | Premium core UX | Owner screenshots, responsive + keyboard audit, coherent design tokens |
| G-PERF | Smooth under realistic size | Web Vitals and query metrics on seeded profile; no capped KPI |
| G-FLOW | Core workflows real | Browser/API/DB readback for M00/M01/M09/M10 MVP |
| G-SEC | Minimum safety | Auth/RLS/storage/scope, unsafe action denial, no false success |
| G-CI | Reproducible build | install, typecheck, lint, fitness, relevant unit/DB suite, build |
| G-OWNER | Single reviewer accepts PR | Recorded approval from user, no unreviewed main merge |

## Evidence index template
For each task attach: `task_id`, `branch`, `commit_sha`, `file_paths`, `test_name`, `test_result`, `CI_url`, `screenshot_or_trace`, `blocker`, `reviewer`, `date`.
No check box counts as done without evidence. A screenshot cannot prove business authorization or RLS.

## Final disposition
The preview may be visually excellent and fast before all modules are mature. The production/pilot decision remains separate and requires the security/database/legal gates relevant to live usage.
