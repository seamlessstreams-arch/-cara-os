-- ════════════════════════════════════════════════════════════════════════════
-- 421 — Security: scope child-data RLS policies to the caller's home
--
-- From an authentication/authorization review. Migrations 010 and 011 created
-- read policies on child-data tables as `to authenticated using (true)` — i.e.
-- ANY authenticated user, in ANY home, could read EVERY home's oversight reviews
-- (child_id + oversight drafts + safeguarding/missing-from-care records) and
-- voice-of-the-child summaries via the Supabase Data API. The original comments
-- noted home scoping was "expected to be enforced via the application layer" —
-- which does not happen, so this migration enforces it at the database instead
-- (defence in depth: RLS holds even if a route forgets the check).
--
-- It replaces those 5 `using (true)` policies with home-scoped equivalents built
-- on the existing get_my_home_id() helper (003_rls_policies.sql). The parent
-- tables carry home_id directly; the child/audit tables are scoped through their
-- FK to the parent. The service_role policies are intentionally left untouched —
-- the server (service key) legitimately bypasses RLS for trusted writes.
--
-- ⚠️  REVIEW BEFORE APPLYING TO PRODUCTION — this was authored without access to
--     a live Supabase and has NOT been executed. In particular verify:
--       • get_my_home_id() returns uuid; these tables declare `home_id text`, so
--         the comparison casts the function result to text (`::text`). Confirm the
--         stored home_id values are the uuid strings of staff_members.home_id
--         (not slugs like 'home_oak'); if the schema standardises home_id types,
--         drop the cast.
--
--         ANSWERED by static review (still unexecuted). The cast is correct:
--           - 003_rls_policies.sql:28  get_my_home_id() returns uuid, selecting
--             staff_members.home_id, which 001 declares `uuid not null`;
--           - 010:25 / 011:25 declare `home_id text` (and nullable);
--           - the writer sends a uuid STRING: homeId() in src/lib/supabase/
--             care-records.ts returns SUPABASE_HOME_ID ?? the seeded home uuid
--             'a0000000-0000-0000-0000-000000000001' (004_seed_data.sql:15).
--         So text = uuid::text matches. Two live landmines remain, both silent:
--           - if SUPABASE_HOME_ID is ever set to a slug, every policy here
--             matches zero rows and the home locks itself out — it fails closed,
--             but as "no data", not as an error;
--           - home_id is nullable, so any row written without one is invisible
--             to every authenticated reader for the same reason.
--       • Run in a staging project and confirm a same-home user still reads their
--         own rows while a cross-home user reads none.
--
-- NOT fixed here (need per-table review — different shapes / generated policy
-- names): the dynamic `execute format(... using (true) ...)` policies in
-- 013_aria_universal_layer.sql and 014_aria_suggestions.sql, and the tables
-- created without RLS enabled in 019, 020, 024, 025, 026, 027.
--
-- SUPERSEDED by 423_rls_close_public_exposure.sql, which closes both by dynamic
-- predicate over pg_class/pg_policies instead of per-table review — and found
-- the list above was an undercount: 102 tables across 17 migrations had no RLS,
-- and ~44 more carried an unrestricted policy misleadingly named
-- "service_role_full_access". 423 leaves the scoped policies below untouched.
-- ════════════════════════════════════════════════════════════════════════════

-- ── Parent tables (home_id is a direct column) ──────────────────────────────

drop policy if exists "authenticated_read_oversight_reviews" on oversight_reviews;
create policy "authenticated_read_oversight_reviews"
  on oversight_reviews for select to authenticated
  using (home_id = get_my_home_id()::text);

drop policy if exists "authenticated_read_voice_summaries" on voice_summaries;
create policy "authenticated_read_voice_summaries"
  on voice_summaries for select to authenticated
  using (home_id = get_my_home_id()::text);

-- ── Child / audit tables (scoped through their FK to the parent's home) ──────

drop policy if exists "authenticated_read_oversight_actions" on oversight_actions;
create policy "authenticated_read_oversight_actions"
  on oversight_actions for select to authenticated
  using (
    review_id in (select id from oversight_reviews where home_id = get_my_home_id()::text)
  );

drop policy if exists "authenticated_read_oversight_audit_log" on oversight_audit_log;
create policy "authenticated_read_oversight_audit_log"
  on oversight_audit_log for select to authenticated
  using (
    review_id in (select id from oversight_reviews where home_id = get_my_home_id()::text)
  );

drop policy if exists "authenticated_read_voice_summary_audit_log" on voice_summary_audit_log;
create policy "authenticated_read_voice_summary_audit_log"
  on voice_summary_audit_log for select to authenticated
  using (
    summary_id in (select id from voice_summaries where home_id = get_my_home_id()::text)
  );
