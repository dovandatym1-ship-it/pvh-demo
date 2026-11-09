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
- Avatar upload/replace/remove: now CODED with private bucket, fixed user-owned object path, JPEG normalization, input checks, authenticated proxy and RLS. **Needs staging Storage/RLS and browser readback to be VERIFIED.**
- Session management/revoke other sessions: depends Auth policy and administrator requirements.
- Notification delivery preferences and channel selection: need design for email/SMS/worker/opt-in; in-app only here.
- Reminder scheduler for upcoming deadlines/overdue: not added. Current database trigger only emits assignment/status/deadline changes.
- Inbox PH02 read-receipt tables: intentionally NOT cherry-picked; this feature has its own pvh_user_notifications for main compatibility. Merge strategy must reconcile two inbox systems to prevent duplicate messages. Prefer one canonical user notification event source after integration.
- Mark-all-read, archive, retention lifecycle and quiet hours: still P1; per-item read is implemented, filtered list reads remain server scoped.
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

## VI. UX/Performance polish approved 09/11/2026 (implementation update)
| Feature | Code | Data/privacy guard | Test evidence required |
|---|---|---|---|
| F-ACC-05 Avatar | `src/features/self-service/{avatar-contract.ts,components/avatar-*,server/avatar-actions.ts}`, `src/app/api/me/avatar/route.ts` | Canvas square crop 320, JPEG re-encode removes EXIF, 1MB output, fixed `auth.uid()/avatar.jpg`, private Storage bucket; read only via authenticated same-origin API | Upload PNG/JPEG/WebP, reject SVG/oversized, replace/remove, RLS stranger denial, mobile display |
| F-ACC-02 / F-ACC-03 Validation | `src/features/self-service/schemas.ts`, `components/account-forms.tsx`, `server/actions.ts` | Same strict Zod schema on client/server; rejects authorization fields and password mismatch; errors by field | Invalid name/phone, 12+ password confirmation, replay, no false success |
| F-NOT-05 Filters | `src/features/notifications/filters.ts`, `server/queries.ts`, `components/notification-list.tsx` | Status all/unread/read; group all/assignment/workflow/deadline; period all/7d/30d; server paginated with tenant+recipient RLS | Filter combinations, URL deep link, page count, unread count, zero/error |
| UX-SHELL-03 Popovers | `src/features/notifications/components/topbar-actions.tsx`, `src/app/(app)/layout.tsx` | One menu at a time, outside-click, Esc, route close, focus return, fixed mobile overlay, role from server | 375/390/768/1440, tab order, keyboard, route transitions, reduced-motion |

### Avatar details and states
- Original file: local browser file input accepts PNG/JPEG/WebP **<=8MB**. Client canvas crop/resize to **320×320** and re-encodes JPEG quality .82, stripping EXIF from normal UI uploads.
- Server accepts **JPEG <=1MB**, verifies start/end magic, dimensions <=1024×1024 and rejects EXIF APP1. A direct Storage client can still attempt an allowed JPEG under the bucket limits; a full content antivirus/decoder validation gate is deferred pending an agreed backend image-processing service.
- Object remains private, located at `{auth.uid()}/avatar.jpg`; RLS SELECT/INSERT/UPDATE/DELETE requires active membership. Storage `pvh-avatars` configured private with 1MB cap and JPEG MIME-only.
- Same-origin authenticated endpoint `GET /api/me/avatar` returns image bytes with `Cache-Control: private,no-store`; no public URL, no long-lived bearer signed URL.
- Replace: upload + update `avatar_updated_at` display metadata to bust image cache, revalidate own profile/layout. Delete: confirm inline and remove object + refresh. Auth metadata is never authority.
- Error state: invalid image / browser conversion failure / Storage/RLS unavailable / auth mismatch; no success until storage API acknowledges. The output is a feature-branch implementation, not a cloud-verified storage contract.

### Filter & popover behaviors
- Filter state is URL-backed; changing status preserves group/period and resets pagination, "Xóa bộ lọc" returns to all. Each query applies tenant+recipient conditions and only loads the requested page.
- Header unread counts remain unfiltered; list total corresponds to current filters. Distinguishes verified zero from DB unavailability.
- At mobile widths, the popover anchors to viewport with max-height and backdrop. Both controls are 44px touch targets. Escape restores focus to originating button; outside click, explicit close and route changes dismiss.
- Shared contact/password validation includes inline aria-invalid and aria-describedby for errors, disabled pending states and confirmation password check.

### Compatibility and rollout risks
1. New Storage policy sits in un-applied feature migration `20261109130000_pvh_user_notifications.sql`. Existing main/deployed cloud history is not synchronized. Do not apply migration in production.
2. Current M01 Phase 2 inbox and feature branch `pvh_user_notifications` are parallel sources. Before combined release, choose one canonical notification event store and dedupe migration.
3. Existing `main` demo Auth fallback remains separate security hardening. No production use of demo fixed credentials.
4. Bulk operations, scheduled reminders, email/SMS/push, avatar moderation by admin and other-sessions revoke are deferred.
5. GitHub CI typecheck/build/unit are separate from browser tests, Supabase DB replay, Storage RLS verification and security review.
