# Branch Reconciliation / Conflict Resolution Matrix
Status: PROPOSED. Exact tip SHAs and file-level diff hunks must be pinned at execution time; branch tips may move.

## Branch dispositions
| Branch | Treatment | Reason | Completion evidence |
|---|---|---|---|
| main | KEEP AS INTEGRATION BASE | Preserve newer UI/M01 changes on 16 paths | UI before/after screenshots & route smoke |
| feat/pvh-ph01-platform-auth | SEMANTIC BACKPORT OF UNINHERITED TIP | 7 commits not in PH06 v2 history; security/M00 changes | M00 page, migrations, auth/RLS tests verified |
| feat/pvh-ph02-core-workflow | SEMANTIC BACKPORT OF UNINHERITED TIP | 7 commits not in PH06 v2 history; workflow/forms/migration | M01 operational parity & workflow tests |
| feat/pvh-ph03-domain-verticals | INHERITED IN PH06 v2 | PH04→PH05→PH06 includes PH03 branch | Commit ancestry + regression, no separate merge |
| feat/pvh-ph04-reporting-integrations | INHERITED IN PH06 v2 | PH05/06 built upon it | M09/M10 smoke + export/import |
| feat/pvh-ph05-release-clone | INHERITED IN PH06 v2 | PH06 v2 based PH05 | Retain release gate/runbook |
| feat/pvh-ph06-domain-expansion | DOC-ONLY BASELINE | One plan file; older fork, no unique working feature | Copy/refer baseline; SUPERSEDED |
| feat/pvh-ph06-domain-expansion-v2 | PRIMARY CUMULATIVE CODE MERGE | Contains PH03–PH05, safety changes M02/03/06 | Build, DB replay, code acceptance |
| feat/pvh-dashboard | UI COMPONENT SELECTIVE INTEGRATION | Began from main, not latest phase architecture | Role dashboard + scoped metric tests + visual |
| docs/pvh-full-module-spec-20261109 | DOC MERGE | M00–M11, alerts, DB spec; no tested runtime | Docs index/crosswalk, no placeholder code advertised |

A branch marked INHERITED may stay unmerged individually: integration is judged by preserved **behavior and evidence**, not forced merge-commit ancestry or artificial 'ours' merges.

## Conflict hotspots & source-of-truth policy
| Area / path | Main | PH06 v2 | Dashboard | Resolution rule / tests |
|---|---|---|---|---|
| src/config/navigation.ts | updated menu & routes | explicit permission helper, revised grouping | adds dashboard route | Single route registry, preserve permission enforcement and dashboard route; no dead routes |
| src/components/layout/sidebar.tsx | newer sidebar | phase navigation | dashboard mobile style | New shared shell, no fallback to all menus when filtered empty, keyboard/mobile QA |
| src/app/(app)/layout.tsx | current shell | hardcoded tenant/role label | mobile header | dynamic identity, fail-closed no fake role, consistent responsive layout |
| src/app/(app)/cong-viec/page.tsx | WorkItemManager, modal UX | server paging, filter & create form | WorkItemManager from main | Keep server-paginated data/authorization; transplant modal/table UX via paginated UI contract |
| src/features/m01-core-work/server/queries.ts | existing | getWorkItemsPage; legacy getWorkItems limit 100 | dashboard calls getWorkItems | Add scoped aggregate queries, prohibit total KPI from capped list |
| src/features/m01-core-work/server/repository.ts | updated CRUD | workflow/RPC | main-like changes | Preserve transactions/OCC/idempotency/RLS; no UI write directly to DB |
| src/features/m01-core-work/components/* | new modal/table | old forms/assignment/evidence | reuses main modal | Keep rich UX and security operations; verify field parity & empty/error states |
| src/features/m04-culture-family/* | newer dialogs | PH03 legal-safe workflow | main dialogs | Use legal-safe server contract, transplant UI, no hardcoded approval |
| src/features/m06-health-social/* | newer modal/table | PH06 no fake UUID/payment | dashboard mostly main | Preserve fail-safe domain action and privacy, no fabricated success |
| src/features/m07-ethnicity-faith/* | newer tables | domain source | dashboard mostly main | Preserve record scope and privacy, UX improvements only after DB contract review |
| src/features/dashboard/* | none | none | role KPI/chart | Reuse composition; rebuild authorized data source for full totals |
| src/components/ui / shared notification | per-feature patterns | mixed | dashboard CSS isolated | Shared UI tokens, Toast/InlineAlert/Dialog contract; no parallel copies |
| supabase/migrations/* | baseline | PH01–PH04 chain | none | Compare deployed checksum; backport PH01 late security SQL only after migration replay |
| .github/workflows/* | baseline | phase-specific CI | altered CI | One unified PR pipeline, no duplicated/bypassing mandatory checks |
| docs/specs/PVH_FULL_MODULE_SPEC_* | none | none | none | Merge from specs branch as docs, label DRAFT |
| package.json/lock | baseline | exceljs/pdfkit/PGlite/tooling | baseline | Keep validated deps from PH06; npm ci, audit, build/bundle tests |

## Parity checklist for UI merge
Each merged feature needs: list, search, filter, sort, paginate, create, details, edit, workflow transition, permission denial, empty/loading/error, responsive and audit (as applicable). For changed components record `old behavior → new behavior → evidence`.
No raw `window.alert`, no fake success, no global role fallback, no trust of browser tenant or permission flags.

## Canonical routes & labels
- Dashboard should display **“Tổng quan”** (not awkward repeated “Trung tâm điều hành…”), Bàn làm việc means actionable personal queue.
- Use one authoritative NAVIGATION_REGISTRY with menuId/parentId/route/permission/status; module features hidden or disabled based on real capability.
- M11 is still a spec-only module; do not present route or admin CRUD as live before implemented.
- Source indicator badges only for genuine demos/synthetic data, displayed consistently.

## Pending exact verification
- Compare 7 PH01 exclusive commits and 7 PH02 exclusive commits at frozen tips, use `git log --left-right --cherry-pick`, inspect every PR/file and migration.
- 16 file main delta: code-level diff review and visual regression, not merely taking one side of conflict.
- Dash role permission and Phase 6 context must agree; no UI-only 'switch role'.
- Check every exported report template/code page and Storage permission before enabling.
