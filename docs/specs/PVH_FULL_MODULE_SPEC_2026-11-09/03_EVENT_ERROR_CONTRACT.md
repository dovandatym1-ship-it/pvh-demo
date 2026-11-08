# Event, API error and state contract
Status: DRAFT; implementation technology to be confirmed.

## Server error envelope
```json
{"code":"PVH.FORM.DUPLICATE","message":"Mã đã tồn tại.","fieldErrors":{"code":["PVH.FORM.DUPLICATE"]},"correlationId":"opaque-id","retryable":false}
```
No stack traces or internal SQL in client response. HTTP status mapping: 400/422 validation; 401 session; 403 forbidden; 404 not found; 409 duplicate/version conflict; 413 file size; 429 rate limit; 5xx unavailable. Network timeout does not imply write failed.

## Client event schema
```ts
type UiEvent = { eventId: string; attemptId: string; code: string; entityType?: string; entityId?: string; tenantScope?: string; severity: 'success'|'info'|'warning'|'error'|'critical'; params?: Record<string,string|number>; correlationId?: string; occurredAt: string; };
```
Server authorizes tenant and recipient; never trust tenantScope sent by client. dedupe key = eventId for durable events and attemptId+code for transient operations. Ensure each attempt produces one terminal state; retry non-idempotent writes only after status reconciliation or with idempotency key.

## Operation lifecycle
idle → validating → submitting → success OR field_error OR conflict OR forbidden OR failed OR unknown_timeout. Unknown timeout shows 'check status' rather than retry blindly. Long jobs: queued → running → partial/succeeded/failed/cancelled; transitions and retry policy owned by job service.

## Security, observability and persistence
Persist business inbox notifications only; toast state ephemeral. Notification list/read APIs filter tenant_id and recipient server-side. Events have retention policy, structured safe logs, correlation IDs, and redaction. Access to target revalidated when user clicks. Delivery is at-least-once with dedupe if queue used; do not claim exactly-once delivery.

## API acceptance tests
- Unauthorized and cross-tenant access return safe error with no payload leakage.
- 409 optimistic concurrency preserves user's unsaved form and offers reload.
- 422 multiple field errors focus first invalid and show summary.
- Timeout after successful write does not create duplicate on retry.
- 500 response redacts internal details but retains correlation ID.
- Partial import has per-row errors and deterministic counts.
- Notification mark-read is idempotent and scoped to recipient.
