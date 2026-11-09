# PH05 — Release and clone runbook (draft)
Status: IMPLEMENTED DOCUMENTATION ONLY; not a production authorization.

## Preconditions
- G4 evidence and owner acceptance recorded. Otherwise release and clone remain BLOCKED.
- Exact commit SHA, migrations, Vercel project/environment and Supabase project confirmed.
- Only synthetic fixture data and test accounts are permitted in staging.
- Never copy service_role keys into NEXT_PUBLIC variables, client bundles or logs.

## Staging release
1. Review PR diff, CI results and dependency scan for the exact SHA.
2. Confirm Vercel preview uses the intended staging environment and isolated Supabase project.
3. Record migration versions and schema drift; back up before approved migrations.
4. Run authenticated browser E2E, API and DB readback using at least three roles.
5. Verify unauthorized direct API requests, file access and revoked sessions are denied.
6. Record URL, SHA, migration checksum, fixture IDs, expected/actual outcomes, failures and owner decision.
7. Do not promote if G4 is unaccepted, any P0/P1 remains, or E2E is NOT_RUN.

## Clone to a second commune
1. Provision a separate Supabase project/DB and private Storage for synthetic commune B.
2. Apply the same canonical migrations; compare migration checksums with commune A.
3. Provision distinct test identities and tenant configuration; never fork business logic.
4. Deploy the exact same source SHA with environment-specific server secrets.
5. Verify each commune's authenticated work, report and file access.
6. Attempt cross-commune record ID and Storage URL access in both directions; expect denial.
7. Capture evidence and obtain owner approval before marking the clone VERIFIED.

## Recovery
- Roll back the immutable Vercel build to the last compatible release.
- Database rollback is NOT equivalent to deleting or reversing applied migrations.
- Restore only to an isolated environment first; validate row counts, event IDs and file checksums.
- Record measured recovery time and data-loss window; do not claim RPO/RTO before approval.

## Explicitly unverified
Browser E2E, cloud deployment, backup/restore drill, legal review, security penetration testing and UAT signoff are NOT_RUN until evidenced.
