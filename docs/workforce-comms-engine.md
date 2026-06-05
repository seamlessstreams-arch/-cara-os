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

## Phase 4 — Shift-Based Access (implemented, feature-flagged DEFAULT OFF)

Makes the permission engine's `shiftActive` reflect **real on-shift state** (the
signal Phase 3 keeps current), so general care staff lose access to operational
child-facing records when **off shift**, while managers/senior leaders keep full
access off shift (per the brief). **Reuses** the existing engine (`checkAccess` +
role rules) — no parallel permission system.

### Feature flag — nothing changes until you enable it
- Master switch: server env **`SHIFT_BASED_ACCESS_ENFORCED`** (default unset = OFF).
- `computeShiftActive(role, staffId)` returns `true` for everyone when the flag is
  off → the engine's existing `requiresShift` gate never fires → **zero behaviour
  change**. Set the env var to `"true"` to enforce.
- A **preview** mode computes the result *as if* enforcement were on (display-only,
  never changes real access) so a manager can see exactly what would change first.

### What it does (when enabled)
- `shiftActive` = `true` for manager/senior-leader/admin roles (keep off-shift
  access); for gated general-staff roles (`rsw`, `senior_rsw`, `waking_night`,
  `agency_staff`) it = "are they actually clocked in right now?" (`isStaffOnShift`).
- Added `requiresShift: true` to the operational general-staff rules in
  `role-rules.ts` (`child_record`, `safeguarding` — the `["rsw","senior_rsw",
  "waking_night"]` rules, matched first per the engine's first-match selection;
  `agency_staff` already had it). Managers' own rules are untouched.
- The engine's existing shift gate (`access-decision-service.ts`, `if
  (rule.requiresShift && !user.shiftActive) deny("not_on_shift")`) now does real
  work — no engine-logic change needed.
- `middleware.loadUserContext` (Supabase path) derives `shiftActive` from the real
  signal when the flag is on, else preserves the original column behaviour.

### Off-shift portal
- `GET /api/v1/access/shift-status[?preview=1]` runs the REAL engine for the acting
  user against the shift-sensitive capabilities and reports what they can/can't do.
- `OffShiftBanner` (on `/sign-in`): off-shift general staff see what's restricted +
  a **Clock-in CTA** (ties to Phase 3); managers see "you keep full off-shift
  access". Clearly labelled **Preview** until the flag is enabled.

### Centralised on-shift truth
`isStaffOnShift(staffId, now?)` now lives in `src/lib/attendance/sign-in-service.ts`
and is the single source used by Comms (`comms-service.isOnShift` delegates to it),
Phase 3 sign-in, and Phase 4 access. One definition, no drift.

### Files
- `src/lib/permissions/shift-enforcement.ts` (flag, `computeShiftActive`,
  `buildShiftAwareUserContext`, `buildShiftAccessOverview`)
- `role-rules.ts` (+`requiresShift` on 2 rules), `middleware.ts` (loadUserContext)
- `GET /api/v1/access/shift-status`, `src/hooks/use-shift-access.ts`,
  `src/components/attendance/off-shift-banner.tsx`, wired into `/sign-in`
- Tests: `src/lib/permissions/__tests__/shift-enforcement.test.ts` (11) — the real
  engine flips child_record/safeguarding purely on shift state; managers exempt;
  flag default off = no change.

### Safety
Default OFF (no runtime change until enabled); managers/senior leaders never
shift-blocked; only `child_record`/`safeguarding` operational rules gated (no
weakening of any other permission/RLS/audit); reuses the audited engine. The hard
gate currently bites callers of `checkAccess` (the engine) + the status endpoint;
broad `withPermission` rollout onto every route remains a later increment.

## Phase 5 — Geofence / QR / Kiosk sign-in (implemented)

Adds **discrete, opt-in presence verification** to Phase 3's clock-in — confirming a
staff member is physically at the home — **without any continuous location tracking
and without storing raw coordinates**. Extends sign-in; no biometrics.

### Three methods (all opt-in, checked once at clock-in)
- **Kiosk / QR code** — a time-rotating code shown on a device at the home
  (`/kiosk` page). Staff enter it at clock-in; you can only read it if you're there,
  and it rotates (15-min window + previous-window grace) so it can't be shared
  usefully.
- **Geofence** — an optional ONE-TIME `navigator.geolocation` reading taken on an
  explicit tap. The server checks "within the home's radius?" and stores only a
  pass/fail + **coarse band** (`on_site`/`nearby`/`off_site`). The latitude/longitude
  are used for that single check and **never returned or persisted**.
- **Manual** — explicit fallback, recorded as **unverified**.

### Hard privacy guarantees (enforced in code + tests)
- A `PresenceResult` / `SignInVerification` carries **method + verified + band only**
  — no coordinates. Unit tests assert the result/record JSON never contains
  lat/lng/coords.
- Verification happens **once**, on the clock-in action — there is no background or
  continuous location capture anywhere.
- The geolocation prompt is user-initiated (browser permission), and the UI says the
  reading is one-time and not stored.

### Files
- Pure core: `src/lib/attendance/presence-verification.ts` (`verifyPresence`,
  `verifyGeofence`, `haversineMetres`, `currentKioskCode`/`verifyKioskCode`,
  per-home `HOME_CONFIG`, `SignInVerification` type)
- Store: `db.signInVerifications` (Phase 5 collection — no coordinates)
- Service: `clockIn` extended with optional `verification` (records method/verified/
  band); `buildSignInStatus.presence`
- API: `POST /api/v1/sign-in` accepts `verification`; `GET /api/v1/sign-in/kiosk-code`
  (rotating code for the home's kiosk display)
- UI: `presence-clock-in.tsx` (method chooser + kiosk-code entry + opt-in
  geolocation), wired into `smart-sign-in.tsx`; `/kiosk` display page (deliberately
  NOT in nav so the code isn't trivially read remotely)
- Tests: `presence-verification.test.ts` (12) + 5 added to `sign-in-service.test.ts`

### Note on the kiosk page
`/kiosk` is reachable by direct URL for demo/setup but is intentionally unlisted; in
production it would be locked to the home's on-site device. The geofence method
provides location-based proof independently of the code.

## Phase 6 — Sensitive Screen Protection (implemented)

A **defence-in-depth UI layer** over the server-side permission engine (Phase 4) —
it reduces shoulder-surfing / accidental exposure of already-permitted content. It
is **never a security boundary on its own**: the server still decides what a user may
load. Drives off the sensitivity scales already in the app.

### What it does
- **Privacy screen lock** — a full-screen blur overlay (`PrivacyScreenOverlay`)
  triggered by: a "Hide screen now" panic button, **idle** (configurable, default
  2 min), or the **tab being switched away / hidden**. Tap to return. Clearing the
  lock also clears any reveals.
- **Privacy mode** (opt-in, off by default) — obscures sensitive content until the
  user taps to reveal it (for public/visible spaces). When obscured, the sensitive
  text is **kept out of the DOM** (a redaction chip is rendered instead of the
  content — not merely a CSS blur).
- **`PrivacyToggle`** — floating control (bottom-left, clear of the sidebar + the
  bottom-right action buttons): hide-now, privacy-mode toggle, auto-hide-when-idle
  interval, and "hide when I switch tabs". Preferences persist in localStorage.
- **Sensitivity-driven** — `restricted` / `confidential` / `safeguarding` /
  `highly_restricted` are protected; `public` / `internal` are not (unifies the
  permissions `Sensitivity` + `CommsSensitivity` scales).

### Files
- Pure core: `src/lib/privacy/screen-protection.ts` (`shouldProtect`,
  `sensitivityRank/Label`, `maxSensitivity`, `isIdleLocked`, idle options) — distinct
  from the pre-existing GDPR `privacy-engine.ts`
- Context: `src/contexts/privacy-context.tsx` (`PrivacyProvider`/`usePrivacy`;
  idle + visibility auto-lock; localStorage prefs; safe no-op outside the provider)
- Components: `protected-content.tsx`, `privacy-screen-overlay.tsx`,
  `privacy-toggle.tsx`; wired into `(platform)/layout.tsx`
- Reference integration: Comms Centre message bodies wrapped in `ProtectedContent`
  by channel sensitivity
- Tests: `src/lib/privacy/__tests__/screen-protection.test.ts` (9)

### Safety note
Display-only. The server-side permission engine remains the real control; this layer
assumes content was already permitted and simply governs whether it's visible on
screen right now. `usePrivacy()` returns a safe no-op outside the provider so
components never crash.

## Phase 7 — Safe Staffing & Emergency (implemented)

Real-time safe-staffing from **who is actually clocked in now** (Phase 3 live data —
distinct from the rota-service, which analyses the *planned* rota), plus a fast,
**privacy-safe emergency broadcast**. Composes the shipped phases.

### Real-time safe staffing
- `buildSafeStaffingStatus(homeId, now)` reads live clock-ins (`db.shifts`,
  in-progress / clocked-in-not-out) for the home and assesses against a minimum for
  the current **day/night period**: understaffed, **lone working** (only one on
  shift), and **no waking-night cover** alerts, with a severity (ok / high /
  critical). Surfaces who's on shift + the active **on-call** contact (reuses
  `OnCallShift`). Defaults: day ≥ 2, night ≥ 1 with waking-night required
  (`getStaffingConfig`, per-home overridable).
- `GET /api/v1/safe-staffing`; `SafeStaffingCard` (on `/safe-staffing` + the sign-in
  page), auto-refreshes.

### Emergency broadcast / panic
- `triggerEmergency()` raises an `EmergencyAlert` and posts a **privacy-safe**
  message into the Phase 1 `emergency_broadcast` Comms channel: operational category
  (medical/fire/security/evacuation/missing/other) + optional location + who raised
  it — **never** child / safeguarding / medical / placement detail (a test asserts
  the broadcast body contains none of those). Priority `emergency`,
  requires-acknowledgement.
- Acknowledge ("I'm responding") + resolve, tracked with responders; every action
  audited. `POST`/`GET /api/v1/emergency`, `PATCH /api/v1/emergency/[id]`.
- `EmergencyButton` (two-step, to avoid accidental triggers) + `ActiveEmergencyBanner`
  (respond/resolve), on `/safe-staffing` + the sign-in page.

### Files
- Pure: `src/lib/staffing/safe-staffing.ts` (`assessStaffing`, `currentPeriod`,
  config), `emergency-types.ts`
- Service: `safe-staffing-service.ts`, `emergency-service.ts`
- Store: `db.emergencyAlerts`
- API: `safe-staffing`, `emergency`, `emergency/[id]`
- Hook: `use-safe-staffing.ts` · UI: `safe-staffing-card.tsx`,
  `emergency-controls.tsx`, page `/safe-staffing` (+ nav "Safe Staffing"), wired into
  `/sign-in`
- Reuse: Phase 3 live clock-ins, Phase 1 `emergency_broadcast` channel +
  `db.commsMessages` + `persistCommsMessage`, `OnCallShift`
- Tests: `safe-staffing.test.ts` (8) + `emergency-service.test.ts` (4)

### Safety
The emergency broadcast is generic by construction (operational type only); detail
lives in the permission-gated alert record, never the notification — honouring "no
sensitive details in notifications". Additive; existing rota/staffing analytics
unchanged.

### Next phase
Phase 8 (evidence / oversight).
