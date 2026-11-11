# Component behavior specification — PVH
Status: DRAFT. All timings are design defaults pending UX review.

## Toast
Props: id, code, severity, title?, description, action?, dismissible, durationMs, dedupeKey, createdAt. Success=4000ms, info=6000ms; warnings/errors requiring action do not auto-dismiss. Maximum 3 visible; queue remainder; same dedupeKey updates existing toast; dismiss on route change only if no pending action. Anchor top-right desktop, top safe area mobile; z-index token centralized. No sensitive data in toast.

States: queued → visible → dismissed; visible → paused on hover/focus → visible; visible → action invoked → dismissed or pending. Screen reader uses role=status for success/info and role=alert for urgent error; never announce duplicate text twice.

## InlineAlert
Props: code, severity, heading?, description, action?, dismissible=false, relatedFields?. States active/resolved/dismissed; persistent validation errors cannot be manually dismissed while invalid. Position adjacent to affected content. Preserve alert when changing tabs if unresolved.

## ConfirmDialog
Props: title, description, impactSummary?, targetLabel, confirmLabel, cancelLabel, destructive, onConfirm async, pending, error. States closed/open/processing/error/closed. Focus on Cancel for destructive; keyboard Escape cancels only before processing; click outside does not dismiss destructive dialog; double-submit prevented. Confirmation must mention affected entity and impact. If delete blocked by FK, close processing and show inline error with link to references.

## FieldError and form summary
Show field error on blur for format, on submit for required, and on server validation response. Map errors by field path; summary at top links to fields; focus first invalid on submit; preserve entered values. For arrays, include row index and human label. Handle hidden/conditional fields by moving error to visible parent section. No success toast on validation-only changes.

## SystemBanner
Global incidents only, not routine field errors. Offline, maintenance, security incidents, service degradation. Single banner with highest priority; more notices available in details. Persistent until recovered. Status must reflect actual health state, not guessed. Retry button triggers actual retry.

## NotificationCenter
Only durable user-actionable events. Required fields id, tenantId, recipientId, eventCode, title, safeSummary, target, createdAt, readAt, expiresAt, dedupeKey. Filter unread/all, pagination, mark read, open target. Authorization rechecked when opening target. No client-supplied recipient/tenant trust. If inbox UI deferred, retain event contract and do not claim delivery.

## EmptyState and Progress
Distinguish empty database vs empty filtered results vs no permission vs fetch error. Progress states idle/pending/partial/success/error/cancelled; show processed/total when known, never fake percentage. For imports allow download error rows; exports provide signed or authorized retrieval, expiry and retry.

## Interaction invariants
- Global portal layering and focus order documented in design tokens.
- Every button has an actual action; all actions have disabled/pending/error handling.
- Motion respects prefers-reduced-motion; minimum contrast and keyboard focus meet WCAG 2.2 AA target.
- User cannot receive contradictory success/error for same operation attempt.
