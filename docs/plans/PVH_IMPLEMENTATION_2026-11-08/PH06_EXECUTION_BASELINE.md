# PH06 — Domain expansion execution baseline

Status: SPECIFICATION_IN_PROGRESS / G6 BLOCKED. Branch: `feat/pvh-ph06-domain-expansion`.

## Dependency gate
PH06 is a post-G5 expansion. No domain release, production migration, deployment, or main merge until G5 has owner-accepted evidence. Phase 1–4 draft PRs do not count as acceptance.

## Delivery slices and order
1. P06-01 M02 people-of-merit tracking; P06-02 M02 labor/employment.
2. P06-03 M03 education.
3. P06-04 M06 health coordination; P06-05 M06 social assistance.
4. P06-06 M07 ethnicity/faith.
5. P06-07–09 M04/M05/M08 extensions.
6. P06-10–12 M10/M09/configurability.

Each OP pack must have: OP ID and REQ/WF traceability, legal/source-of-record reference, actor and jurisdiction, fields and validation, state transitions, authorization/record scope, sensitive-data classification, outputs, negative and concurrency cases, database read-back evidence, rollback and owner acceptance.

## Implementation contracts
- Reuse M00 authentication/authorization, M01 work items and audit, M09 reporting, M10 import provenance.
- No implicit approval, benefit payment, adjudication, clinical record, or legal decision authority.
- Sensitive M06 and M07 records require need-to-know scope; system administrators do not inherit record access.
- Domain writes must use authenticated server services and transaction-safe RPC, enforced by RLS, OCC and idempotency where applicable.
- Keep demo fixtures and legal assumptions explicitly marked; never present a simulated outcome as official.

## G6 acceptance matrix per OP
| ID | Verification | Required evidence |
| --- | --- | --- |
| G6-01 | Source, authority, workflow, data contract approved | Versioned OP_SPEC and decision log |
| G6-02 | Happy path with actual authenticated actors | Browser/API/DB read-back |
| G6-03 | Forbidden cross-role, cross-scope access | RLS and server denial tests |
| G6-04 | Invalid inputs, stale writes, retry | Validation/OCC/idempotency tests |
| G6-05 | Audit, lineage, report and export | Database records and artifact verification |
| G6-06 | No regression in core flows | CI and staging E2E |
| G6-07 | Owner acceptance | Explicit approval receipt |

## Open decisions (do not invent)
- Which OP pack is first for implementation, and its signed-off source and responsible authority.
- Whether PH05 G5 is accepted, including clone-to-second-commune evidence.
- Actual data-source contracts and permissible fields for each domain.
- Whether M06 sensitive data may be processed in the selected staging environment.

## Next implementation step
Select P06-01, collect the OP-level source and permissions, then add a versioned OP_SPEC and tests before database/UI implementation. No claim of DONE based on scaffold or static tests.
