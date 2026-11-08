# M00–M11 notification scenarios and QA matrix
Status: DRAFT. Every case needs linked requirement, screenshot/automated evidence and reviewer.

| Module | Scenarios to test | Expected component |
|---|---|---|
| M00 | Role saved; user locked; password reset; organization parent invalid; integration config failed | Toast, ConfirmDialog, FieldError, InlineAlert |
| M01 | Task assigned/overdue; unsaved case; invalid deadline; deleted linked record | Inbox, ConfirmDialog, FieldError, InlineAlert |
| M02 | Duplicate personnel ID; policy record missing evidence; unauthorized personal data | FieldError, InlineAlert |
| M03 | Education facility duplicate; invalid reporting period; missing school data | FieldError, InlineAlert |
| M04 | Cultural award criteria unverified; event date invalid; facility referenced | InlineAlert, FieldError |
| M05 | Community digital team member duplicate; indicator missing source; infrastructure updated | FieldError, InlineAlert, Toast |
| M06 | Restricted health/social data; beneficiary duplicate; support record locked | InlineAlert, FieldError |
| M07 | Religious facility duplicate; unauthorized sensitive details; notice vs approval confusion | FieldError, InlineAlert |
| M08 | Inspection plan saved; remediation overdue; delete linked minutes blocked | Toast, Inbox, InlineAlert |
| M09 | Report finalized; source missing; export XLSX/DOCX/PDF/CSV ready/fail/expired | ConfirmDialog, InlineAlert, Toast |
| M10 | Import preview, invalid CSV rows, partial import, export ready; no API sync | InlineAlert, Progress, Toast |
| M11 | Parent catalog cyclic relation; duplicate code; referenced value delete blocked | FieldError, InlineAlert |

## Mandatory interaction test suite
| Test ID | Scenario | Pass criterion |
|---|---|---|
| NT-001 | Create success | Exactly one success toast, correct entity, no duplicate |
| NT-002 | Server validation | Field errors mapped; first invalid focused; entered data preserved |
| NT-003 | Destructive delete | Explicit target and consequence; Cancel default focus; no delete on cancel |
| NT-004 | Linked delete blocked | No mutation; related record explanation |
| NT-005 | Permission denied | No sensitive details; no false success; safe navigation |
| NT-006 | Cross-tenant event | Event never visible to other tenant/user |
| NT-007 | Concurrent edit | Conflict surfaced; no silent overwrite |
| NT-008 | Offline | Persistent status; submit disabled or queued only when designed |
| NT-009 | Timeout uncertain | No duplicate retry; check actual job/write status |
| NT-010 | Import partial | Counts match backend; error file download authorized |
| NT-011 | Export all formats | Correct content, naming, template, encoding, page layout and authorization |
| NT-012 | Screen reader | Status announced once; dialog focus trapped; errors linked to fields |
| NT-013 | Mobile | Toast safe area, modal usable, actions visible on small viewport |
| NT-014 | Dedupe and flood | Maximum 3 visible, queue, no repeated message storms |
| NT-015 | Notification inbox | Unread/read, deep-link, expired target, authorization recheck |
| NT-016 | Audit and privacy | Correlation logged safely; no PII or secret in previews/logs |

## Exit criteria
- 100% feature-operation-to-message mapping populated; no unregistered message code.
- 100% applicable NT tests pass with evidence; 0 severity-1/2 defects open.
- BA approves wording; UX approves interaction/accessibility; engineering approves event contract; QA signs regression suite.
- Any unresolved decision is BLOCKED, never counted as VERIFIED.
