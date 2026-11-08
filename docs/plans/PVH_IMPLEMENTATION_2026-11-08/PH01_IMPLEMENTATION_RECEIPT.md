# PH01 implementation receipt — branch work in progress

**Branch:** `feat/pvh-ph01-platform-auth`  
**Starting commit:** `main@1b948f6cdbe8dae293dba9b6627c2b7201e036fc`  
**Cloud Supabase:** no schema/role/user/data modifications authorized or executed.  
**Status:** `IMPLEMENTED_PARTIAL — NOT VERIFIED / NOT OWNER_ACCEPTED`.

## Changes staged in this branch

1. Reconcile the active migration filenames with the two already-applied cloud SQL snapshots, keeping the nine legacy migration files under `_legacy/superseded_20261108/`. Replace the two-commune seed with a non-personal, empty seed.
2. Remove implicit SYSTEM_ADMIN/LANH_DAO_XA/m00:admin permission bypass from server authorization and route navigation. Respect explicit DB permission code only.
3. Require a real active membership with effective dates for credential login; never substitute a hard-coded tenant/actor when membership lookup fails. Fail closed on malformed dates.
4. Restrict demo session to opt-in local development, validate persona allowlist, and reject demo cookies in production middleware.
5. Protect file downloads by looking up evidence metadata under existing database RLS; no user-controlled storage path or blanket same-commune role override.
6. Make M01 repository RPC calls explicit to `app` schema, matching the deployed SQL contract. Transition RPC is still absent in cloud.
7. Incorporated the concurrent `main` change for a dedicated ADMIN persona, but only as an opt-in local demo role with scoped M00 permissions. Removed the new production fallback that accepted a fixed `Password123!` without a verified cloud account. Real SYSTEM_ADMIN remains a Supabase Auth account with DB role membership.

## Evidence and limits

- `node --test tests/security/*.test.mjs`: 7/7 passing in the scratch reconstruction (Node 24).
- `NODE_ENV=production NEXT_PUBLIC_DEMO_MODE=true node next.config.mjs`: correctly fails to load; false passes. Production build must re-run this guard in CI.
- GitHub Actions [CI run 42471572177](https://github.com/dovandatym1-ship-it/pvh-demo/actions/runs/42471572177) on merge commit `1c8d3ee4`: **PASS** (npm ci, seven security boundary tests, TypeScript typecheck, lint, architectural fitness and Next.js build; Node 22).
- GitHub code inspections against commit `1b948f6`, Supabase cloud migration list and read-only security advisor.
- **Not run:** browser E2E, local Supabase reset/pgTAP and multi-role auth/Storage tests against an isolated database; local Supabase CLI is unavailable in this execution environment. Cloud data was not mutated.
- **Still blocked:** complete audit event transaction contract, permission provisioning and UI, scoped RLS adversarial tests, executable local DB migration verification, private Storage upload tests, CI and advisor remediation.
- Live Supabase Security Advisor: `auth_leaked_password_protection` WARN; configuration remediation requires project operator approval.
- The old `audit-logger.ts` still swallows database write errors; its audit guarantees must not be considered verified. Do not use this branch in production before P01-09 is addressed.
- PH01/G1 is **not** passed. Only the project owner can accept it after the acceptance matrix is executed.
