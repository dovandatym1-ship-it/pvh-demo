# PVH execution baseline

**Execution:** D1/GIT-01 and local portion of GIT-02\
**Candidate:** local branch `codex/pvh-completion-candidate` at `2a13091ad4cd8cd3cd1a8bb23487dad5b9023403`
**Base:** `origin/main` at `e08fa3587bede82be6ea77c45d7a83a76cf9be24`
**Source:** `origin/integrate/pvh-backbone-review-20261110` at the same candidate SHA
**Refreshed:** 2026-11-11; all branch and PR-head refs refreshed, and tree comparison recomputed at `2a13091`.

## D2 revalidation — 2026-11-11

The code candidate was verified at `7a3bc7c0d0361ae8a0416acbeafc8bfeca222693`. The current PR source head is `2a13091ad4cd8cd3cd1a8bb23487dad5b9023403`, a documentation-only evidence refresh; it has base `main@e08fa3587bede82be6ea77c45d7a83a76cf9be24`, 166 commits ahead, 389 changed files, and no merge commits. Application source and migrations are unchanged from the tested code candidate.

- Local checks on the candidate working tree, Node `v25.9.0`: all configured Integration static/contract commands **119/119 PASS**; `npm run test:ph04` **14/14 PASS**; `npm run typecheck`, `npm run lint`, `npm run fitness`, `npm run build`, `npm audit --omit=dev --audit-level=high` (0 vulnerabilities), migration ledger, Vietnamese scanner, and `git diff --check` PASS. Lint reports four existing warnings in the legacy shared-data page and avatar image component.
- GitHub Actions at current SHA `2a13091`: CI run [42942188484](https://github.com/dovandatym1-ship-it/pvh-demo/actions/runs/42942188484), Integration run [42942188495](https://github.com/dovandatym1-ship-it/pvh-demo/actions/runs/42942188495), and PH05 run [42942188567](https://github.com/dovandatym1-ship-it/pvh-demo/actions/runs/42942188567) failed before starting their jobs. Check annotations state GitHub blocked the runner because recent account payments failed or the spending limit needs to be increased. No CI command ran; the result is **billing-blocked**, not a code verdict or pass.
- These are local source/static and contract checks. `test:ph04` applies only seven migration files in isolated PGlite; the 14 canonical migration replay and pgTAP have not been run at this candidate head. No authenticated browser E2E, hosted Auth/RLS/Storage test, or API-to-DB readback was performed.
- Fresh 14-migration replay/pgTAP was last evidenced at `0adec43e`; it was not re-run at `7a3bc7c`. This checkout has no Docker executable, and no staging resource is configured. G-DB/G-SEC/G-FLOW/G-UX/G-PERF and owner acceptance remain BLOCKED; merge/deploy remains **NO-GO**.

The D1 snapshot below is retained as historical evidence and does not describe the latest remote CI status.

## Git snapshot

Fetched all 20 remote branch refs and all 12 pull-request head refs into this isolated checkout. The complete ref-to-SHA snapshot for the D2 source snapshot is recorded below. Re-fetch and compare before each integration change.

```text
origin/docs/pvh-full-module-spec-20261109 77c4e066b0fe8d41b74fd358cd2b6a5f1026131a
origin/feat/pvh-dashboard 90c479fedb2f7d420c64611011e5c287a6563b04
origin/feat/pvh-government-login-split-screen 91b37883b4266f292f5fed27a226fcd83582e87d
origin/feat/pvh-personal-profile-notifications-20261109 282aa8d941b6d6b5f6435cf912223029c6f4e12c
origin/feat/pvh-ph01-platform-auth 48d98e9b6dd8b0084f51c744d4f6208bf49b4802
origin/feat/pvh-ph02-core-workflow 18280d1e3eadefe073b678a903f6e11ae8ddba9e
origin/feat/pvh-ph03-domain-verticals 5876113884ca9eb0325002d0ea352d5ad622668c
origin/feat/pvh-ph04-reporting-integrations 223baa3473ca1987f3105e9c28bc90aec7ae474c
origin/feat/pvh-ph05-release-clone 8eb29aa90ea1daae968e2244c14b2613e1034dbe
origin/feat/pvh-ph06-domain-expansion a488cd5f1e1dd60ace072cba73d219c8ba173f65
origin/feat/pvh-ph06-domain-expansion-v2 c4fc1011ac151c3513509415fb1a62a8f9cd03cc
origin/fix/pvh-ph02-completion-20261109 521e6fe75fe7a36b3e1bf9cdab3ca6fb3435a01c
origin/fix/pvh-ph03-crud-ux-20261109 4304097d9a56d05b326c6f59a6e71a925c2fcea1
origin/fix/pvh-ph04-data-quality-20261109 b76423e8897cb30bd95522586732754521fb795b
origin/fix/pvh-ph05-clone-brand-20261109 36fa5c3feb4b6e824930c3a89317cb1934452de4
origin/fix/pvh-ph06-data-safety-20261109 0506748c01f8f43293163b2f529a5c00675c92eb
origin/fix/pvh-vietnamese-language-standardization-20261109 144272f730c35bd5cf695a256f1934cd218d5bc2
origin/integrate/pvh-backbone-review-20261110 2a13091ad4cd8cd3cd1a8bb23487dad5b9023403
origin/main e08fa3587bede82be6ea77c45d7a83a76cf9be24
origin/plan/pvh-master-integration-ux-first-20261109 b491c7375a470d3c1e7a8fc490b117ceacf6c170
pulls/1 48d98e9b6dd8b0084f51c744d4f6208bf49b4802
pulls/10 36fa5c3feb4b6e824930c3a89317cb1934452de4
pulls/11 0506748c01f8f43293163b2f529a5c00675c92eb
pulls/12 2a13091ad4cd8cd3cd1a8bb23487dad5b9023403
pulls/2 18280d1e3eadefe073b678a903f6e11ae8ddba9e
pulls/3 5876113884ca9eb0325002d0ea352d5ad622668c
pulls/4 223baa3473ca1987f3105e9c28bc90aec7ae474c
pulls/5 282aa8d941b6d6b5f6435cf912223029c6f4e12c
pulls/6 91b37883b4266f292f5fed27a226fcd83582e87d
pulls/7 521e6fe75fe7a36b3e1bf9cdab3ca6fb3435a01c
pulls/8 4304097d9a56d05b326c6f59a6e71a925c2fcea1
pulls/9 b76423e8897cb30bd95522586732754521fb795b
```

At the historical D1 candidate SHA, the PR was 162 commits ahead of base with zero merge commits and 386 changed files. At the refreshed D2 source SHA above, it is 166 commits ahead with 389 changed files. Source branch commits are not considered integrated solely because a ref exists. PR #1–#11 still require content/semantic disposition because their changes were ported and rewritten. A simple commit ancestry or patch-id result is insufficient for those rewritten changes.

## Local baseline evidence

- Dependency install: `npm ci --ignore-scripts` completed from the committed lockfile.
- Runtime used for CI-equivalent checks: Node `v22.23.4`.
- PASS: security tests, M01 rules and SQL guardrails, M00 route guard, protected layout, M04 legacy-retirement, dashboard metrics/role semantics, self-service notifications, dashboard server contract, PH03 static and presentation contracts, PH06 data-safety, M06 transaction guard, PH04 contracts/export/DB smoke, PH05 branding, membership/hamlet scope and export locale, Vietnamese scanner/login contract.
- PASS: migration-ledger script, 14 canonical migrations and 9 archived immutable migrations with no version collisions.
- PASS: `npm run typecheck`, `npm run lint`, `npm run fitness`, and `npm run build`.
- Lint succeeds with four existing warnings in legacy data page hooks and avatar image handling. `next lint` is deprecated.
- PASS: `npm audit --omit=dev --audit-level=moderate` reports zero production dependency advisories. Full `npm ci` audit reports six moderate advisories across the complete dependency tree. Record full-tree audit for dependency owner review.
- The local PH04 PGlite smoke applies only seven migration files. It does not prove replay of all fourteen active migrations.
- NOT RUN locally: Supabase CLI replay and pgTAP, because this machine has no Docker executable. Hosted staging is not provisioned or configured in this checkout. Candidate CI replay/pgTAP evidence is recorded below and does not imply staging readiness.
- NOT RUN: authenticated browser E2E, hosted RLS/Storage, restore drill, two-commune UAT, visual/performance measurements. Source CI is not a substitute for these gates.

## Disposition

D1 fetch and base verification are complete. Source/build checks pass at `a7e4fa6`; fresh replay of 14 canonical migrations plus pgTAP passed in candidate CI at `0adec43e`, and the migration tree is unchanged through `a7e4fa6`. The local-Docker replay remains unavailable and staging G-DB/G-SEC remain open. No cloud project, deployment, or production data was changed.

## PR #1–#11 source-tree comparison

The comparison below counts files changed relative to each source branch's merge base with `origin/main`. An exact blob is identical in the candidate. A same-path difference can be a newer change, a rewrite or a mismatch; it is not classified as present automatically.

| PR | Source files | Exact blobs in candidate | Same path, different blob | Missing path |
|---:|---:|---:|---:|---:|
| #1 | 53 | 29 | 23 | 1 |
| #2 | 62 | 45 | 16 | 1 |
| #3 | 78 | 55 | 23 | 0 |
| #4 | 125 | 85 | 40 | 0 |
| #5 | 24 | 16 | 7 | 1 |
| #6 | 1 | 0 | 1 | 0 |
| #7 | 66 | 50 | 14 | 2 |
| #8 | 81 | 62 | 19 | 0 |
| #9 | 128 | 91 | 37 | 0 |
| #10 | 135 | 93 | 42 | 0 |
| #11 | 151 | 92 | 59 | 0 |

These figures prove source-tree overlap only. They do not prove that an entire PR was integrated or that behavior is equivalent.

### Action from the comparison

- Ported the missing M01 presentation regression test from PR #7 and added it to the integration candidate workflow. Commit `75ae99051c4ea969fd90874e5d47e1223ed4e63c`; targeted Node 22 test passes 3/3. It covers Vietnamese status/priority and event labels plus UTC+07 deadline conversion.
- PR #1's DB-CI fixture is ported to the candidate replay workflow. Fresh replay of all 14 canonical migrations plus pgTAP passed at `0adec43e` ([run 42750990737](https://github.com/dovandatym1-ship-it/pvh-demo/actions/runs/42750990737)); no migration file changed through `a7e4fa6`. The old standalone `db-ci.yml`, `verify-db-local.sh`, and archived historical SQL tests remain absent; their semantic replacement/disposition is still open.
- Added PR #2's detailed 20-case M01 staging checklist as `PVH_M01_STAGING_ACCEPTANCE_2026-11-10.md`, updated to require replay of the candidate's 14 canonical migrations. It remains unexecuted. Its historical open-issue section needs a fresh code review before G2 starts. The PR #7 completion delta remains a historical document without an explicit line-by-line disposition.
- The PR #5 standalone workflow's self-service test is already invoked by the candidate workflow. The behavior and workflow path still need to be recorded in the branch disposition matrix before GIT-03 can close.
- Same-path differences across all PRs remain open until categorized against the branch disposition ledger. No cumulative feature branch was merged blindly.

### Paths absent from the candidate tree and current disposition

| PR | Source path(s) absent from candidate | Current disposition | Remaining evidence |
|---:|---|---|---|
| #1 | `.github/workflows/db-ci.yml`; `scripts/verify-db-local.sh`; two archived SQL test files under `supabase/_legacy/.../tests/` | Replay fixture/trigger precondition is ported to `pvh-db-replay.yml`; these old paths are not copied because the legacy tests/scripts do not match the canonical migration set | Review the old test assertions against current pgTAP/CI coverage; keep open until that mapping is recorded |
| #2 | `docs/plans/PVH_IMPLEMENTATION_2026-11-08/PH02_GATE_G2_VERIFICATION.md` | Replaced by `docs/integration/PVH_M01_STAGING_ACCEPTANCE_2026-11-10.md`, preserving the 20-case procedure and updating it for 14 canonical migrations | The cases remain unexecuted; run on isolated staging |
| #5 | `.github/workflows/self-service-notifications.yml` | Separate workflow was not copied; its test is invoked by the candidate Integration Gate | Candidate CI passes that test; review whether the old independent trigger/schedule had any required behavior |
| #7 | `docs/plans/PVH_IMPLEMENTATION_2026-11-08/PH02_COMPLETION_DELTA_2026-11-09.md`; `docs/plans/PVH_IMPLEMENTATION_2026-11-08/PH02_GATE_G2_VERIFICATION.md` | Gate procedure is replaced by the M01 staging checklist from PR #2; completion-delta document has no semantic disposition yet | Reconcile the historical completion delta with current M01 source and record each requirement as present/reworked/deferred |

**GIT-03 · IN PROGRESS.** The PR #7 test is ported. The rest of the deltas listed above still need a disposition before GIT-03/GIT-04 can be marked complete.


The M01 staging checklist was added on the candidate after this source-tree comparison. It preserves test procedures and does not claim G2 execution or PASS.

### PR #1 database replay fixture disposition

The initial blob comparison found the PR #1 CI fixture absent from the candidate. The active foundation migration explicitly detects and revokes REST execution of `public.rls_auto_enable()`, while the PR #1 fixture documents the existing cloud `ensure_rls` event trigger. The full-replay workflow was updated to reproduce that precondition in an isolated temporary migration file.

Ported `supabase/_ci_fixtures/rls_event_trigger.sql` and updated `pvh-db-replay.yml` to copy it temporarily to `20261108000000_ci_only_cloud_prerequisite.sql` only after the canonical migration ledger check, before local replay. The workflow removes that exact path with an `always()` cleanup step. The fixture remains outside the canonical and archived migration directories. The source fixture explicitly models an existing trigger and is not a deployment migration.

**Static checks:** migration ledger passes with 14 canonical migrations and 9 archived immutable migrations; temporary path absent after local checks; `git diff --check` passes.\
**Runtime status:** The local machine has no Docker executable. Hosted CI replay and pgTAP passed at `0adec43e` ([run 42750990737](https://github.com/dovandatym1-ship-it/pvh-demo/actions/runs/42750990737)); migration files are unchanged through `a7e4fa6`. This is local-candidate replay evidence, not staging/cloud G-DB evidence.
