# PVH Shared Notification, Alert, Warning & Message Design System

Status: DRAFT — cross-cutting specification for M00–M11. Applies to all screens, APIs, forms, imports, exports, and background jobs. This is a design contract, not an implementation claim.

## 1. Component contract
| ID | Component | Trigger | Placement | Persistence | User action |
|---|---|---|---|---|---|
| UI-MSG-01 | Toast | Operation success, recoverable transient failure | Top-right desktop, safe-area top mobile | Success 4s; info 6s; errors persistent if actionable | Optional View/Retry; dismiss |
| UI-MSG-02 | InlineAlert | Contextual warning/error/info | Inside form/page near affected section | Until resolved/dismissed if appropriate | Fix/View details |
| UI-MSG-03 | ConfirmDialog | Destructive/irreversible/high-impact change | Focus-trapped modal | Until choice | Cancel/Confirm; destructive label explicit |
| UI-MSG-04 | FieldError | Client/server field validation | Immediately below field + summary on submit | Until corrected | Focus field |
| UI-MSG-05 | SystemBanner | Maintenance, offline, outage, system-wide notice | App header/top | Until resolved | Retry/Details |
| UI-MSG-06 | NotificationCenter | Assigned work, deadline, actionable business event | Bell + inbox | Stored until retention policy | Mark read, open record |
| UI-MSG-07 | EmptyState | No data/no matching results | Main content | Until data/filter changes | Create/Clear filters |
| UI-MSG-08 | Loading/Progress | Async operation, import/export | Near operation | Until completion | Cancel if supported |

## 2. Severity vs component
- success: completed action; toast. Do not use dialog.
- info: non-blocking information; toast or inline.
- warning: user can continue but should review risk; inline; confirm only for high-impact actions.
- error: operation failed; field error for field-specific, inline/toast for action-specific, banner for system-wide.
- critical: data loss/security/outage; persistent banner or blocking dialog **only if proceeding is unsafe**.
- Severity must not determine component alone; scope, persistence, user action and consequence decide.

## 3. Vietnamese content standard
Message must be specific, actionable, concise; state what happened and next step. Never expose raw stack traces, SQL, tokens, PII, internal IDs, or unexplained HTTP codes.
| Message ID | Severity | Component | Text | Action |
|---|---|---|---|---|
| CRUD.CREATE.SUCCESS | success | Toast | Đã thêm {entityName} thành công. | Xem chi tiết (optional) |
| CRUD.UPDATE.SUCCESS | success | Toast | Đã cập nhật {entityName}. | — |
| CRUD.DELETE.CONFIRM | warning | ConfirmDialog | Xóa {entityName}? Dữ liệu đã xóa có thể không khôi phục được. | Hủy / Xóa |
| CRUD.DELETE.BLOCKED_REFERENCE | warning | InlineAlert | Không thể xóa vì dữ liệu đang được sử dụng ở {relatedArea}. | Xem liên kết |
| VALIDATION.REQUIRED | error | FieldError | Vui lòng nhập {fieldLabel}. | Focus field |
| VALIDATION.DUPLICATE | error | FieldError | {fieldLabel} đã tồn tại. Vui lòng kiểm tra lại. | Focus field |
| AUTH.FORBIDDEN | error | InlineAlert | Bạn không có quyền thực hiện thao tác này. | Quay lại |
| TENANT.SCOPE_DENIED | error | InlineAlert | Dữ liệu không thuộc phạm vi được phép truy cập. | Quay lại |
| NETWORK.OFFLINE | warning | SystemBanner | Mất kết nối mạng. Một số thao tác tạm thời không khả dụng. | Thử lại |
| SERVER.UNAVAILABLE | error | SystemBanner | Hệ thống tạm thời gián đoạn. Vui lòng thử lại sau. | Thử lại |
| CONFLICT.STALE | warning | ConfirmDialog or InlineAlert | Dữ liệu đã được người khác cập nhật. Tải lại để xem phiên bản mới. | Tải lại |
| IMPORT.PARTIAL | warning | InlineAlert | Đã nhập {successCount} dòng; {failedCount} dòng lỗi. | Tải danh sách lỗi |
| EXPORT.READY | success | Toast + download | Tệp báo cáo đã sẵn sàng. | Tải tệp |
| EXPORT.FAILED | error | InlineAlert | Không thể xuất báo cáo. Vui lòng thử lại. | Thử lại |
| REPORT.LOCKED | warning | InlineAlert | Báo cáo đã chốt; cần tạo bản điều chỉnh để thay đổi. | Tạo bản điều chỉnh |

## 4. Shared component API (framework-agnostic)
```ts
type Severity = 'success'|'info'|'warning'|'error'|'critical';
type MessageCode = string; // stable registry key, never localized
interface UiMessage {
  code: MessageCode;
  severity: Severity;
  title?: string;
  description: string;
  action?: { label: string; actionId: string };
  correlationId?: string; // optional for support; not raw stack trace
  dedupeKey?: string;
  scope?: 'field'|'record'|'page'|'global';
}
interface ConfirmRequest {
  code: MessageCode;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive: boolean;
  targetId?: string;
}
```

## 5. UX rules
1. One global notification provider, one message registry; modules emit codes + safe parameters, not arbitrary strings.
2. Toast stack max 3; deduplicate same code/entity; avoid repeated alerts on retries. Success auto-dismiss after ~4s, non-actionable info ~6s; actionable errors persist or have accessible history.
3. Never auto-dismiss destructive confirmation or critical alerts. Default focus Cancel for destructive dialog; Escape cancels; return focus to invoking control.
4. Field errors use visible text and aria-describedby; submit focuses first invalid field and displays error summary; do not rely on color alone.
5. Accessible live regions: polite for routine status, assertive only for urgent blocking errors; prevent multiple simultaneous announcements.
6. Mobile: safe-area, no covering form action buttons; responsive dialog; long messages wrap; no layout shift from banners if possible.
7. Async actions: disable duplicate submission, progress for long tasks, explicit retry; cancel only when actually supported.
8. Sensitive content: notification preview and logs must not reveal health, religion, benefit details, passwords, secrets; role/tenant scope always enforced server-side.
9. Message templates support parameter escaping and localization; avoid user-controlled HTML. All date/time/number formatting uses locale vi-VN and explicit timezone where needed.
10. No notification for every background polling event; only meaningful status transitions and actionable events.

## 6. Error mapping
| Category | Example | UI |
|---|---|---|
| Validation / 400,422 | Invalid field | FieldError + summary |
| Unauthenticated / 401 | Session expired | Re-auth flow; preserve draft if safe |
| Forbidden / 403 | Role/scope | InlineAlert |
| Not found / 404 | Deleted/unavailable record | Empty/error state |
| Conflict / 409 | Duplicate or version mismatch | FieldError or conflict alert |
| Rate limit / 429 | Too many requests | InlineAlert with retry timing if provided |
| Server / 5xx | Service unavailable | InlineAlert or banner, correlation ID |
| Network timeout | Request uncertain | Retry option; check status before retrying non-idempotent writes |

## 7. Domain-specific events
- M00: role change, account lock, config update; security-sensitive messages only to authorized operators.
- M01: assigned work, overdue task; notification center, no spamming.
- M02–M07: entity validation, case deadlines, missing evidence; only legally grounded workflow alerts.
- M08: inspection schedule, overdue remediation; actionable notification.
- M09: report deadline, reconciliation differences, finalized report, export ready/error; use async job status for large exports.
- M10 MVP: import preview, row-level errors, export result; no advanced sync notifications.
- M11: referenced catalog value cannot be deleted, parent-child constraints, deactivation warnings.

## 8. Data model and governance
`message_templates(code PK, severity, default_component, title_vi, body_vi, action_label_vi, active, version)`;
`notifications(id, tenant_id, recipient_user_id, code, safe_payload_json, target_type, target_id, read_at, created_at, expires_at)`;
`notification_events(id, tenant_id, code, target_id, dedupe_key, created_at)` if audit/dispatch needs it.
Keep transient toasts in client state; persist only meaningful inbox notifications. Retention, audit, and consent must follow applicable policy.

## 9. Acceptance criteria and tests
- [ ] All M00–M11 messages use shared registry and components; no raw window.alert/confirm or module-specific toast forks.
- [ ] All create/update/delete/import/export scenarios have success, validation, permission, conflict, network and server-failure cases as applicable.
- [ ] All destructive actions have correct confirmation and reference protection; ordinary CRUD save does not prompt unnecessarily.
- [ ] Cross-tenant and unauthorized notification payloads never leak.
- [ ] Keyboard, focus management, screen reader, responsive/mobile, reduced motion tested.
- [ ] Dedupe, concurrency, retry, offline, timeout, async progress and bulk-operation cases tested.
- [ ] Message ID registry reviewed by BA/UX/dev/QA; Vietnamese wording and placeholder safety checked.
- [ ] Test evidence linked to message codes and relevant module features.

## 10. Open decisions
- Confirm exact visual tokens and component library after inspecting frontend stack.
- Confirm whether inbox notifications are in initial MVP; if not, implement only event contract and defer inbox UI.
- Confirm retention and notification delivery policy; no push/email assumed.
