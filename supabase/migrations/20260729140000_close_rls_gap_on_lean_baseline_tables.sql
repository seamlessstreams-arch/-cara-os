-- ══════════════════════════════════════════════════════════════════════════════
-- Close the RLS gap on the 6 lean-baseline tables that shipped without RLS
--
-- WHY THIS EXISTS
-- ───────────────
-- The lean live baseline (00000000000000_lean_live_baseline.sql) creates 25
-- tables, of which 19 enable RLS in the same migration and 6 do not:
--
--   ai_usage, cara_ai_runs, cara_guardrail_events,
--   organisations, platform_admins, usage_events
--
-- The archived 423_rls_close_public_exposure.sql was written to close this
-- class dynamically via a pg_class sweep, but it was superseded by the lean
-- baseline BEFORE ever executing, so the runtime sweep never ran on live.
-- check-rls.js's BASELINE is 423 and only enforces on migrations >= 423, so
-- these 6 tables sit below its floor and are unflagged.
--
-- WHY IT IS SAFE
-- ──────────────
-- Per project_rls_audit + project_auth_security_posture: the app talks to
-- Postgres as service_role, which BYPASSES RLS. Enabling RLS on these tables
-- without adding any policy means:
--   • service_role (the app): unchanged — bypass still applies.
--   • anon / authenticated (public Data API): deny-by-default, as intended.
-- No app feature reads these tables via anon/authenticated. Verified by:
--   • src/lib/supabase/server.ts uses SUPABASE_SERVICE_ROLE_KEY only;
--   • src/lib/supabase/client.ts is used only by the login form (zero reads).
--
-- Two of the six are cross-tenant (organisations, platform_admins) — leaving
-- them with a wide-open policy would let any authenticated user from any home
-- read the platform administrator list and every tenant organisation. Enabling
-- RLS with no policy is deny-by-default here, which is exactly the intent.
--
-- WHY NO POLICIES
-- ───────────────
-- A "service_role_full_access" policy is worse than useless — service_role
-- bypasses RLS whether or not a policy exists, and a policy without a TO clause
-- defaults to PUBLIC (i.e. also grants anon). See 423's header for the two
-- classes of hole this creates. If any of these tables ever needs
-- authenticated read access, add a scoped policy at that time; do not add
-- unrestricted ones prophylactically.
--
-- ROLLBACK: `alter table <t> disable row level security;` per table.
-- ══════════════════════════════════════════════════════════════════════════════

alter table if exists public.ai_usage             enable row level security;
alter table if exists public.cara_ai_runs         enable row level security;
alter table if exists public.cara_guardrail_events enable row level security;
alter table if exists public.organisations        enable row level security;
alter table if exists public.platform_admins      enable row level security;
alter table if exists public.usage_events         enable row level security;
