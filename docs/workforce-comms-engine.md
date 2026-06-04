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

### Next phases
Phase 2 (message governance: convert-to-record, ARIA professional language,
retention/hold), Phase 3 (Smart Sign-In), Phase 4 (wire the access engine to real
clock-in + `withPermission` rollout + off-shift portal).
