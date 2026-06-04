# Workforce, Comms, Safe Access & Governance Engine

Phased extension of Cornerstone. This document grows per phase.

## Architecture context (from inspection)

- **Dual backend**: in-memory store (`src/lib/db/store.ts`) + Supabase
  (`src/lib/supabase/`), gated by `isSupabaseEnabled()`. API routes write
  in-memory and **best-effort write-through** to Supabase (no-op when off).
- **Permission engine already exists** in `src/lib/permissions/`
  (`checkAccess`, `withPermission`, `break-glass`, delegation, 15 roles,
  employment statuses, `shiftActive`). New work **extends** it — no parallel
  engine.
- **Audit** = `src/lib/supabase/audit.ts` → `audit_log` (append-only) +
  `careEventAuditLog`.
- Migrations live in `supabase/migrations/NNN_*.sql`; RLS is home-scoped via
  `get_my_home_id()` / `get_my_role()`, service-role bypasses RLS.

## Phase 1 — Comms Centre (implemented)

Secure internal messaging to replace WhatsApp / personal email.

### What it does
- 12 standard channels per home (announcements, handover, managers, waking
  night, medication, safeguarding, rota cover, H&S, maintenance, training, key
  work, emergency). Lazy-seeded in demo.
- Role- and shift-aware access (`src/lib/comms/comms-access.ts`): managers read
  relevant channels **off shift**; general staff get operational channels only
  **on shift**; off-shift staff keep limited read access (announcements, rota,
  training, H&S, emergency). Child/incident/safeguarding channels need elevated
  permission. Emergency/announcement posting is manager-only.
- Read receipts + acknowledgements; urgent/emergency messages send
  **privacy-safe** notifications (no child/incident/safeguarding content).
- **Soft delete only** (messages are never hard-deleted); edit history;
  retention category + investigation-hold flags (wired for Phases 13/14).
- **Staff Trust Notice** — must be acknowledged before first use; reopenable.
- Every action audited via `audit_log` (Supabase) when enabled.

### Files
- Types: `src/types/comms.ts`
- Access (pure): `src/lib/comms/comms-access.ts` — `canViewChannel`/`canPostChannel`
- Service: `src/lib/comms/comms-service.ts` — `resolveCommsUser`, `isOnShift`, `auditComms`
- Store: `src/lib/db/store.ts` — `db.commsChannels/commsMessages/commsMessageReceipts/...`
- Write-through: `src/lib/supabase/comms.ts`
- API: `src/app/api/v1/comms/{channels,messages,messages/[id],messages/[id]/receipt,trust-notice}`
- Hooks: `src/hooks/use-comms.ts`; identity header added to `src/hooks/use-api.ts`
- UI: `src/components/comms/comms-centre.tsx`, `staff-trust-notice-panel.tsx`,
  page `src/app/(platform)/comms/page.tsx`, nav entry in `src/config/navigation.ts`
- Migration: `supabase/migrations/403_comms_centre.sql` (tables + home-scoped RLS)
- Permission engine: added `comms_channel`/`comms_message` resource types
- Tests: `src/lib/comms/__tests__/comms-access.test.ts`

### Identity (current limitation)
Identity is resolved from `x-user-id` (the demo session), consistent with the
rest of the platform (the localStorage auth stub). **Real Supabase-session
enforcement + `withPermission` on routes is Phase 4** — until then access control
is enforced in `comms-access.ts` but identity is request-supplied.

### Manual QA
1. Open `/comms` → Staff Trust Notice shows; acknowledge it.
2. Channels list appears; pick "Whole Home Announcements", send a message.
3. Send an **urgent** message → check a privacy-safe notification appears (no
   content leaked) and the message shows an Acknowledge action for other users.
4. Switch user (demo) to a non-manager (`cs_user_id`), go off-shift (no active
   shift today) → operational channels (medication, handover) are hidden; limited
   channels (announcements, rota) remain readable; cannot post to announcements.
5. Delete a message → it soft-deletes (shows "[message deleted]"), still present
   in the DB.

### Supabase activation
Set `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (already enabled per
project decision) and run migration `403_comms_centre.sql`. With Supabase off the
feature runs fully on the in-memory store.

## Phase 2 — Message Governance (implemented)

Turns everyday messages into accountable records so nothing important lives **only**
as a chat message ("capture once, surface everywhere, no hidden second record").
Purely additive over Phase 1 — no schema change (Phase 1's migration 403 already
created `comms_message_actions` + the `retention_category`/`investigation_hold`
columns). External notifications are still never auto-sent.

### What it does
- **Professional-language nudge** — as staff type (debounced, ≥12 words) the draft
  is scored by the **shared ARIA recording-quality engine**
  (`scoreRecordingQuality`); a non-blocking tip appears when the writing is thin or
  unprofessional. Advisory only — it never blocks a send and never alters a message.
- **Recordable-content detection** — a pure keyword heuristic flags messages that
  look like they belong in a formal record (safeguarding/disclosure, missing-from-
  care, restraint, medication error, incident, complaint), ordered by concern, and
  suggests the right conversion. It *prompts a human*; it never auto-files.
- **Convert message → formal record / task (capture once)** — any staff member who
  can see a message may escalate it:
  - record types are written to the **Cornerstone event spine** via
    `captureDomainEvent` (validated + de-duplicated once); the canonical-event id is
    `evt_cap_<messageId>_<action>`, so re-converting the same message to the same
    record type **upserts** rather than duplicates;
  - `task` creates a real `db.tasks` task;
  - the source message is stamped with `linked_record_type`/`linked_record_id` and
    the thread shows **"Recorded as …"** — the link back that prevents a hidden
    second record. The conversion is logged in `comms_message_actions` and audited.
  - Held messages cannot be converted (423).
- **Investigation hold + retention (manager-only)** — a manager can **freeze** a
  message (no edit / delete / convert — enforced server-side by 423 checks) and set
  a **retention category** (routine, child-related, safeguarding, HR/conduct,
  investigation). Releasing lifts the freeze. The body is never altered; every
  change is audited.

### Files
- Governance (pure): `src/lib/comms/comms-governance.ts` —
  `analyseMessageLanguage`, `detectRecordableContent`, `ACTION_EVENT_MAP`,
  `CONVERSION_ACTIONS`, `RETENTION_CATEGORIES`, `isValidRetentionCategory`
- API: `src/app/api/v1/comms/analyse-language` (advisory, read-only),
  `.../comms/messages/[id]/convert`, `.../comms/messages/[id]/hold`
- Write-through: `persistCommsMessageAction` in `src/lib/supabase/comms.ts`
- Audit events: `message_converted`/`message_held`/`message_hold_released` in
  `comms-service.ts`
- Hooks: `useAnalyseLanguage`, `useConvertMessage`, `useSetInvestigationHold`
  in `src/hooks/use-comms.ts`
- UI: `src/components/comms/message-governance.tsx` (`LanguageNudge`,
  `MessageActionMenu`), wired into `comms-centre.tsx`
- Reuse (no new validate/route/score logic): `scoreRecordingQuality`
  (`src/lib/aria/recording-quality.ts`), `captureDomainEvent`
  (`src/lib/event-capture/capture-event-service.ts`), `db.tasks.create`
- Tests: `src/lib/comms/__tests__/comms-governance.test.ts` (17)

### Safety / guarantees
- Pure cores are deterministic (no wall-clock / I/O) — language scoring,
  detection and mapping are unit-tested in isolation.
- Conversions are **additive**: a message is never deleted by converting it; the
  capture pipeline keeps external destinations gated (`requires_human_approval`),
  so converting never sends anything to Ofsted / families / professionals.
- Permissions are unchanged: hold is manager-only (server-side role check);
  conversion is attributed + audited; held messages are immutable server-side.

### Manual QA
1. In `/comms`, type a thin message ("he was kicking off again all day") → a
   **Writing tip** appears under the composer (non-blocking).
2. Type "C disclosed something happened, possible allegation" → a **"may need a
   formal record"** prompt appears; send it.
3. On the sent message, open **Record / Task** → convert to *Safeguarding concern*
   → the bubble shows **"Recorded as incident record"**; check the event appears in
   `/event-stream` (id `evt_cap_…`).
4. Convert the same message to *Safeguarding concern* again → no duplicate (upsert).
5. As a manager, **Place under investigation hold** → the message shows a lock
   badge; edit/delete/convert are now blocked (423). **Release** to restore.

## Phase 3 — Smart Sign-In (implemented)

The missing **self-service clock-in / clock-out** write path. Inspection found the
`Shift` model already carries `clock_in_at`/`clock_out_at`/`actual_start`/
`actual_end`/`status`, and `isOnShift()` (Comms) already *reads* them — but nothing
*wrote* them (timesheets/shift-mode only display). Smart Sign-In lets the signed-in
staff member clock into/out of their own shift, making "on shift" a real, current
fact. This is the data foundation **Phase 4** (shift-based access) consumes.

### What it does
- **One-tap clock in / out** for the current user. Clocking in sets
  `clock_in_at`/`actual_start` + `status: in_progress`; clocking out sets
  `clock_out_at`/`actual_end` + `status: completed` + computed `overtime_minutes`.
- **Smart briefing** on the page: today's shift + scheduled times, **lateness** at
  clock-in, **who else is on shift now** + staffing count, shift duration + overtime
  on clock-out, and a nudge that **operational Comms channels are now unlocked**
  (ties to Phase 1's shift-aware access) / a reminder to complete the end-of-shift
  checklist on clock-out.
- **Ad-hoc cover**: if no shift is scheduled, sign-in creates an ad-hoc shift so
  unscheduled/cover work is still captured (never blocks signing in).
- **Idempotent**: a second clock-in while already on shift is a no-op.

### Explicitly NOT in scope (per the brief)
- **No biometrics** (no facial recognition / fingerprint clock-in) — sign-in is an
  authenticated action only (the nav icon is deliberately `UserCheck`, not
  `Fingerprint`).
- **No continuous location tracking** — discrete clock events only. Geofence / QR /
  kiosk is the separate later phase.
- Server-side: the subject is always the resolved user — you can only sign yourself
  in/out. Every clock event is audited.

### Files
- Service (pure cores + store mutation): `src/lib/attendance/sign-in-service.ts` —
  `clockIn`/`clockOut`/`buildSignInStatus`/`pickTodayShift` + pure
  `computeLatenessMinutes`/`computeOvertimeMinutes`/`minutesBetween`/`inferShiftType`
- API: `GET`/`POST /api/v1/sign-in` (status + clock_in/clock_out)
- Hook: `src/hooks/use-sign-in.ts` (`useSignInStatus`, `useClockInOut` — invalidates
  `comms/channels` + `shift-summary` + `rota` since on-shift changes access)
- UI: `src/components/attendance/smart-sign-in.tsx`, page
  `src/app/(platform)/sign-in/page.tsx`, nav entry "Shift Sign-In" → `/sign-in`
- Reuse: existing `Shift` model + `db.shifts.update/create`; consistent with
  `isOnShift()` (Comms reads the same fields)
- Tests: `src/lib/attendance/__tests__/sign-in-service.test.ts` (12)

### Relationship to existing rota/attendance (no duplication)
`/rota`, `/timesheets`, `/shift-mode`, `/api/operations/staff-attendance` already
exist but are **read/plan/analytics only** — none wrote `clock_in_at`. Smart Sign-In
adds the write path they were missing; `isOnShift()` (and therefore Comms shift-aware
access) now reflects real clock-ins automatically.

### Next phases
Phase 4 (wire the permission engine's `loadUserContext` to real on-shift state via
`isOnShift`/sign-in + `withPermission` rollout + off-shift portal for managers).
