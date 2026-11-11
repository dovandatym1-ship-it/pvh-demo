# PVH Entity ownership, relationships and normalization
Status: PROPOSED. This is a logical model, not a verified physical ERD.

## Ownership rules
- M00: tenant, organization tree, account membership, roles, permission grants, system configuration.
- M01: cases, tasks, plans; proposed canonical people/household/organization/facility registry pending alignment with existing repo OP and screen maps.
- M02–M08: domain-specific cases, evidence and activity records. Reuse canonical references where legally appropriate; domain-sensitive attributes remain domain-scoped.
- M09: templates, metrics, periods, report instances, values, lineage, snapshots, exports.
- M10: file imports/exports, source configuration and job history only for MVP.
- M11: catalog definitions, values, hierarchies and versioned mappings. No duplicate person/household tables.

## Cardinality and invariants
| Parent | Child | Relation | Invariant |
|---|---|---|---|
| tenant | membership | 1:N | membership belongs to one tenant; same auth user may belong to several tenants |
| org_unit | org_unit | 1:N | no cycles; effective dates and archived nodes preserved |
| user | membership | 1:N | active membership and permissions checked server-side |
| role | membership_role | 1:N | grants scoped and effective-dated |
| canonical person | household membership | 1:N over time | historical relationships require valid_from/valid_to |
| canonical organization/facility | domain activity | 1:N | source ownership and cross-tenant reference policy explicit |
| case | case_event | 1:N | event log append-only; legal transitions checked |
| task | assignment | 1:N | assignment history retained |
| catalog_definition | catalog_value | 1:N | unique code per catalog/scope/version; referenced values deactivated, not hard-deleted |
| report_period | report_run | 1:N | multiple draft/revision runs, one explicit current approved snapshot if business rule allows |
| report_run | report_value | 1:N | metric version and provenance mandatory |
| import_job | import_row_error | 1:N | errors scoped to authorized uploader and tenant |
| record | attachment | 1:N | private storage and versioned metadata |

## ERD deliverable checklist
- [ ] Enumerate every entity from 128 OP crosswalk and M00–M11 function map.
- [ ] Assign physical table, PK, FK, unique, check constraints, nullable, indexes.
- [ ] Distinguish many-to-many bridge tables and temporal relationships.
- [ ] Document deletion and archival policy per FK, including references from reports and audit.
- [ ] Document entity sensitivity, source of record, owner, retention, field masking.
- [ ] Validate with DBA/BA and run migration-backed FK/RLS tests.
