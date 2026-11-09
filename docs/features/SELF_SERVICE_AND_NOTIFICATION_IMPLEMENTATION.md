# PVH — Personal Account & Notifications Implementation
**Branch:** feat/pvh-personal-profile-notifications-20261109
**Baseline:** main at e08fa3587bede82be6ea77c45d7a83a76cf9be24
**Status:** CODED / NOT_DB_VERIFIED / NOT_BROWSER_VERIFIED

## I. Exact scope delivered in this branch
- /thong-tin-ca-nhan: authenticated account self-view, editable contact metadata, read-only official role, password reauthentication + change.
- /thong-bao: scoped 20-item/paged notification center, mark-read, safe code-to-copy, task link.
- Header: notification bell with unread count/preview, avatar-based account menu, navigation to two routes, native logout action.
- Shared source app layout/sidebar adjusted minimally from main; fixes filtered menu fallback and hardcoded commune display.
- SQL: additive pvh_user_notifications table, RLS recipient+active membership, column-specific update grants, trigger for new/assigned/status/deadline-changed work items, dedupe by tenant/item/recipient/version/code. **Migration NOT applied**.
- CI: typecheck, build, targeted structural/presentation tests on branch/PR.

## II. Security invariants
- A real Supabase Auth account must match server RequestContext; demo account is read-only and has no confirmed notifications.
- User can only write display_name and contact_phone in auth user_metadata. Never write official profile/tenant/roles/permissions from client metadata. Email and role are read-only.
- Password change verifies current credentials against real Supabase Auth then updates the SAME account. Do not store password/confirm in DB/analytics.
- Notifications only show generic event titles, not task content or sensitive personal records; target route rechecks its own authorization.
- RLS requires current auth.uid and active membership; no INSERT/DELETE grants to authenticated.
- DB error maps to explicit Unavailable, not synthetic empty list/zero count. Session demo shows explanatory state.
- No email/SMS/push; no background poller; no arbitrary link from notification data.
- Main's existing Auth demo fallback and historical migration drift are **external security blockers** and not fixed by this feature branch. Do not claim production-ready.

## III. Feature boundaries / deliberately deferred
- Official personnel record edits are admin workflow M00, not personal self-service.
- Avatar upload: requires approved private Storage policy + image conversion, MIME/size checks, readback and retention.
- Session management/revoke other sessions: depends Auth policy and administrator requirements.
- Notification delivery preferences and channel selection: need design for email/SMS/worker/opt-in; in-app only here.
- Reminder scheduler for upcoming deadlines/overdue: not added. Current database trigger only emits assignment/status/deadline changes.
- Inbox PH02 read-receipt tables: intentionally NOT cherry-picked; this feature has its own pvh_user_notifications for main compatibility. Merge strategy must reconcile two inbox systems to prevent duplicate messages. Prefer one canonical user notification event source after integration.
- Bulk mark-all-read, archiving, retention policy, clearing all, quiet hours: P1, requires UX/legal/DB acceptance.
- Application audit receipts for updating self metadata: Supabase Auth audit must be inspected; enterprise app-level audit integration is not proved.

## IV. Tests to execute with evidence
1. npm ci; node --experimental-strip-types --test tests/self-service-notifications.test.mjs; npm run typecheck; npm run build.
2. Isolated PostgreSQL migration replay **after reconciling main's conflicting baseline**. SQL RLS: own vs foreign notification, active vs revoked membership, both updates and direct writes. Trigger idempotency.
3. Real user login: own profile read/edit and password; unauthorized demo change denied, role unchanged after metadata update.
4. Bell preview, route list, read/unread count, page 2, closed task link, 403 direct target, zero/unavailable.
5. Responsive 375/390/768/1440; focus/keyboard/screenreader, UI timeout/offline.
6. PH02 inbox reconciliation before merging branches; duplicate-event tests after integration.

## V. Merge/release rule
- Main is source of truth: no rewrite of existing auth/login policy or M01 workflow in this branch; additions isolated.
- Merge only through reviewed PR and user approval; no automatic deployment, no cloud DB mutation.
- Branch code **not** proof of fully working feature until CI + isolated DB + browser E2E + owner review PASS.
