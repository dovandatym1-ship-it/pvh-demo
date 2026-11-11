# Safe Integration & Merge Runbook — do not auto-merge main
Status: PROPOSED COMMAND PLAN. Nothing executed by this documentation.

## 0. Freeze inputs and preserve provenance
- Fetch all branches; record SHA, branch owner, date, CI state, and pending PR state in `INTEGRATION_RECEIPT.md` on the *future integration branch*.
- Pin `main`, PH01 latest, PH02 latest, PH06 v2, Dashboard and Specs before acting.
- Inventory migration SQL names/checksums against existing deployed DB; use isolated test DB and **never reset/diff/push cloud** as a merge convenience.
- On active branches keep originals unchanged; any new bugfix goes to integration branch with changelog.
- Verify local Git status clean before each merge/candidate cherry-pick.

## 1. Create integration branch FROM latest main
```bash
git fetch origin --prune
git switch main
git pull --ff-only origin main
git switch -c integrate/pvh-ui-perf-unified
git branch backup/pvh-main-before-integration HEAD
```
The backup branch is local until deliberately pushed; no production protection is implied.

## 2. Bring cumulative PH06 v2 code once
```bash
git merge --no-commit --no-ff origin/feat/pvh-ph06-domain-expansion-v2
git diff --name-only --diff-filter=U
# Resolve every conflict by behavior matrix; inspect base/ours/theirs.
# Do not blindly use 'ours' or 'theirs' for src, migration or CI.
git add -A
git commit -m "merge(pvh): reconcile phase baseline and current main UI"
```
If resolution unsafe, `git merge --abort`. The merge commit is not a release verdict. If branch tips moved, repeat preflight, do not merge stale assumptions.

## 3. Recover uninherited PH01 and PH02 tip improvements
```bash
git log --oneline --left-right --cherry-pick origin/feat/pvh-ph06-domain-expansion-v2...origin/feat/pvh-ph01-platform-auth
git log --oneline --left-right --cherry-pick origin/feat/pvh-ph06-domain-expansion-v2...origin/feat/pvh-ph02-core-workflow
```
For EACH exclusive commit: classify `REQUIRED / ALREADY_EQUIVALENT / SUPERSEDED / UNSAFE`, note files + tests. Backport with reviewed `git cherry-pick -x <actual-sha>` when clean, or implement equivalent *semantic* changes in smaller commits. **Do not blindly import old schema or overwrite newer SQL.** Explicit checks:
- PH01 accounts-console, account route, invitation/grant/revoke protections, security contract migration, DB CI, fail-closed auth/RLS.
- PH02 update work details, collaborators, inbox/read, evidence handling, SQL workflow contract, UI loading/error and tests.
- Run schema replay and security/workflow tests after each DB-sensitive batch.

## 4. Integrate Dashboard/UI branch
Use reviewed commits/diff of `feat/pvh-dashboard` rather than replacing all PH06 M01 files. Favor:
- New dashboard components, role presentation, visual hierarchy, accessibility, related tests.
- Preserve PH06 `getWorkItemsPage` and server-side authorization; **replace dashboard's limit-100 input with real scoped aggregates**, no synthetic counts.
- Compose a shared UI shell: responsive navigation, page header, cards, tables, form and modal. Fix nav empty-list fallback and hardcoded tenant/role labels.
- Treat main's 16-file UI update as valuable source, keep behavior parity.
- Add test for `>100` jobs showing correct totals, plus hamlet/role scope and zero-data.
- Charts, routing and modals only claim DONE after browser screenshots and keyboard tests.

## 5. Integrate docs and archive old baseline
- Merge `docs/pvh-full-module-spec-20261109` into integration branch via ordinary reviewed docs merge (contains docs only at review time).
- Copy/refer `PH06_EXECUTION_BASELINE.md` from legacy PH06 if not otherwise captured; mark old PH06 branch `SUPERSEDED`, **do not force stale code into current tree**.
- M00–M11 are a spec catalog; only enable routes with implemented/secured behavior.
- Create `OP_FUNCTION_SCREEN_CODE_DB_RTM.md`: OP ID → REQ → screen/route → API/RPC → table → permission → message code → test evidence. Unresolved OP status `DRAFT`.

## 6. Stabilize UX and performance (before broad business scope)
- Define Design Tokens and 8 shared components: AppShell, PageHeader, KPI, DataTable, FilterBar, FormField, Dialog, Toast/Alert/Empty/Loading.
- Refactor the highest visible screens first: dashboard, work list/detail, culture list/form, report list/detail, import/export.
- Correct source queries, implement loading/error/empty everywhere, do not ship 100-record dashboards.
- Measure Core Web Vitals and query latency in a reproducible seeded staging profile; optimize based on trace rather than guess.
- Keep domain expansion M02–M08 behind visibility/readiness gates when only skeleton or unsafe law authority exists.

## 7. Quality gates and PR to main
```bash
npm ci
npm run typecheck
npm run lint
npm run fitness
npm run build
# Run actual available test commands discovered from the merged package.json
# Use isolated Supabase/local DB and security suites for database-sensitive changes
```
Mandatory: security contract, DB migration replay, workflow tests, report/import unit, smoke navigation, browser E2E for core journeys, desktop/mobile screenshot review, performance metrics. Configure CI to run on integration pushes AND PR to main, not only legacy phase branches. Do not claim pass without CI URL and exact commit SHA.

Open one integrated PR to `main`, link screenshots and receipts; **user alone approves merge**. Use a freeze window for DB-sensitive changes, deploy Preview to isolated staging. Release only if no P0 issues and required gates pass.

## 8. Rollback
- Pre-merge: abort conflicted merge, revert individual integration commits if needed; no side effects on main or cloud.
- Post-merge: revert reviewed integration merge commit or deploy previous immutable build, with migration compatibility check.
- Never “rollback” PostgreSQL by dropping applied migrations; backup/restoration only under approved isolated rehearsal.
- Keep source branches until integration and owner acceptance complete; mark `INTEGRATED`, `SUPERSEDED` or `DEFERRED` in ledger, don't silently delete.

## 9. What not to do
- No mass merge of every phase branch after PH06 baseline: duplicated ancestry and overwriting late fixes.
- No `git checkout --theirs .` on UI/backend/schema; no fake `-s ours` merges to show green.
- No production `supabase db push`, service key use, user invitations, or Vercel promotion without explicit release authorization.
- No 100% claim from code compilation, static tests, mocked charts or screenshots alone.
