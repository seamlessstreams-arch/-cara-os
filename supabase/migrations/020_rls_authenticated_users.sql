-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — RLS POLICIES FOR AUTHENTICATED USERS
-- Migration 020 — 2026-05-09
--
-- Migration 019 added service_role bypass policies for the four supporting
-- tables introduced in that migration. This migration adds home-scoped read
-- policies for the `authenticated` role, so that:
--
--   1. Logged-in browser clients (Realtime subscriptions, direct queries) can
--      read data scoped to their home.
--   2. Managers-only restrictions are applied where appropriate.
--   3. All tables are explicitly GRANTed to authenticated/anon roles so the
--      Supabase Data API exposes them correctly.
--
-- The service_role key (used by API routes) still bypasses ALL policies.
-- auth_user_id column + get_my_home_id() helper were added in migration 003.
--
-- ROLLBACK: drop the listed policies; revoke GRANTs if needed.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── GRANT table access to authenticated role ──────────────────────────────────
-- Supabase's default Data API setup requires explicit GRANTs for custom tables.

grant usage on schema public to authenticated;

grant select on management_oversight_tasks to authenticated;
grant select on reg40_tasks                to authenticated;
grant select on filing_cabinet_items       to authenticated;
grant select on saved_time_metrics         to authenticated;

-- Also ensure care_events tables from migration 018 are granted
grant select on care_events              to authenticated;
grant select on care_event_routes        to authenticated;
grant select on care_event_jobs          to authenticated;
grant select on care_event_audit_log     to authenticated;
grant select on reg45_evidence_queue     to authenticated;
grant select on annex_a_evidence_queue   to authenticated;
grant select on child_daily_summaries    to authenticated;

-- ── MANAGEMENT OVERSIGHT TASKS ───────────────────────────────────────────────
-- All staff at the home can read; only managers can update/complete

create policy "management_oversight_tasks_home_select"
  on management_oversight_tasks
  for select
  to authenticated
  using (home_id = get_my_home_id());

create policy "management_oversight_tasks_manager_update"
  on management_oversight_tasks
  for update
  to authenticated
  using (home_id = get_my_home_id() and is_manager());

-- ── REGULATION 40 TASKS ──────────────────────────────────────────────────────
-- All staff can read; only managers can update (Reg 40 triage)

create policy "reg40_tasks_home_select"
  on reg40_tasks
  for select
  to authenticated
  using (home_id = get_my_home_id());

create policy "reg40_tasks_manager_update"
  on reg40_tasks
  for update
  to authenticated
  using (home_id = get_my_home_id() and is_manager());

-- ── FILING CABINET ITEMS ─────────────────────────────────────────────────────
-- All home staff can read filed records; writes via service_role only

create policy "filing_cabinet_items_home_select"
  on filing_cabinet_items
  for select
  to authenticated
  using (home_id = get_my_home_id());

-- ── SAVED TIME METRICS ───────────────────────────────────────────────────────
-- Managers-only read (dashboard metrics are management-facing)

create policy "saved_time_metrics_manager_select"
  on saved_time_metrics
  for select
  to authenticated
  using (home_id = get_my_home_id() and is_manager());

-- ── CARE EVENTS (supplement migration 018 policies) ─────────────────────────
-- migration 018 already has home-scoped policies for authenticated users.
-- No additional policies needed — those are in place.

-- ── REG45 / ANNEX A (supplement migration 018 policies) ─────────────────────
-- migration 018 already restricts these to is_manager().
-- No additional policies needed.

-- ── CARE EVENT AUDIT LOG ─────────────────────────────────────────────────────
-- Managers can read the full audit log for their home.

create policy "care_event_audit_manager_select"
  on care_event_audit_log
  for select
  to authenticated
  using (home_id = get_my_home_id() and is_manager());

-- The generic insert from migration 018 handles staff inserts.
-- Ensure only service_role can delete (audit logs must be immutable)
create policy "care_event_audit_no_delete"
  on care_event_audit_log
  for delete
  to authenticated
  using (false);

-- ══════════════════════════════════════════════════════════════════════════════
-- STAFF MEMBERS — auth_user_id lookup index (already in 003, ensure exists)
-- ══════════════════════════════════════════════════════════════════════════════

create index if not exists idx_staff_auth_user
  on staff_members(auth_user_id);
