# PVH execution baseline

**Execution:** D1/GIT-01 and local portion of GIT-02  
**Candidate:** local branch `codex/pvh-completion-candidate` at `fcd420a6d71c69612c2ec60d83ce180199e5e261`  
**Base:** `origin/main` at `e08fa3587bede82be6ea77c45d7a83a76cf9be24`  
**Source:** `origin/integrate/pvh-backbone-review-20261110` at the same candidate SHA  
**Refreshed:** 2026-11-10

## Git snapshot

Fetched all 20 remote branch refs and all 12 pull-request head refs into this isolated checkout. The complete ref-to-SHA snapshot for this execution is recorded below. Re-fetch and compare before each integration change.

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
origin/integrate/pvh-backbone-review-20261110 fcd420a6d71c69612c2ec60d83ce180199e5e261
origin/main e08fa3587bede82be6ea77c45d7a83a76cf9be24
origin/plan/pvh-master-integration-ux-first-20261109 b491c7375a470d3c1e7a8fc490b117ceacf6c170
pulls/1 48d98e9b6dd8b0084f51c744d4f6208bf49b4802
pulls/10 36fa5c3feb4b6e824930c3a89317cb1934452de4
pulls/11 0506748c01f8f43293163b2f529a5c00675c92eb
pulls/12 fcd420a6d71c69612c2ec60d83ce180199e5e261
pulls/2 18280d1e3eadefe073b678a903f6e11ae8ddba9e
pulls/3 5876113884ca9eb0325002d0ea352d5ad622668c
pulls/4 223baa3473ca1987f3105e9c28bc90aec7ae474c
pulls/5 282aa8d941b6d6b5f6435cf912223029c6f4e12c
pulls/6 91b37883b4266f292f5fed27a226fcd83582e87d
pulls/7 521e6fe75fe7a36b3e1bf9cdab3ca6fb3435a01c
pulls/8 4304097d9a56d05b326c6f59a6e71a925c2fcea1
pulls/9 b76423e8897cb30bd95522586732754521fb795b
```

At the tested source SHA, the candidate was 152 commits ahead of base with zero merge commits and 362 changed files. This receipt adds one documentation-only local commit and no application source changes. Source branch commits are not considered integrated solely because a ref exists. PR #1–#11 still require content/semantic disposition because their changes were ported and rewritten. A simple commit ancestry or patch-id result is insufficient for those rewritten changes.

## Local baseline evidence

- Dependency install: `npm ci --ignore-scripts` completed from the committed lockfile.
- Runtime used for CI-equivalent checks: Node `v22.23.4`.
- PASS: security tests, M01 rules and SQL guardrails, M00 route guard, protected layout, M04 legacy-retirement, dashboard metrics/role semantics, self-service notifications, dashboard server contract, PH03 static and presentation contracts, PH06 data-safety, M06 transaction guard, PH04 contracts/export/DB smoke, PH05 branding, membership/hamlet scope and export locale, Vietnamese scanner/login contract.
- PASS: migration-ledger script, 14 canonical migrations and 9 archived immutable migrations with no version collisions.
- PASS: `npm run typecheck`, `npm run lint`, `npm run fitness`, and `npm run build`.
- Lint succeeds with four existing warnings in legacy data page hooks and avatar image handling. `next lint` is deprecated.
- PASS: `npm audit --omit=dev --audit-level=moderate` reports zero production dependency advisories. Full `npm ci` audit reports six moderate advisories across the complete dependency tree. Record full-tree audit for dependency owner review.
- The local PH04 PGlite smoke applies only seven migration files. It does not prove replay of all fourteen active migrations.
- NOT RUN: full Supabase CLI replay and pgTAP. This machine has no Docker executable. Hosted staging is not provisioned or configured in this checkout.
- NOT RUN: authenticated browser E2E, hosted RLS/Storage, restore drill, two-commune UAT, visual/performance measurements. Source CI is not a substitute for these gates.

## Disposition

D1 fetch and base verification are complete. GIT-02 is **PARTIAL** until all fourteen migrations replay locally in Supabase and the remaining baseline evidence is available. No source migration, cloud project, deployment, or production data was changed by this baseline run.
