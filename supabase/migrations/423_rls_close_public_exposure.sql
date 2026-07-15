-- ══════════════════════════════════════════════════════════════════════════════
-- 423 — CLOSE THE public-SCHEMA RLS EXPOSURE
--
-- ⚠️  REVIEW BEFORE APPLYING TO PRODUCTION.
--     Authored WITHOUT a live Supabase connection and NOT executed. Apply to a
--     branch/staging database first and read the NOTICEs it raises. Same status
--     as 421 — static review only.
--
-- WHY THIS EXISTS
-- ───────────────
-- Two classes of hole were found by a static sweep of all 406 migrations:
--
--   A. 102 tables in `public` never had RLS enabled at all — including every
--      hr_* table (cases, disciplinary, sickness, exit interviews, safer
--      recruitment), incident_sessions, post_incident_reflections,
--      restorative_conversations, therapeutic_profiles, child_pace_profiles
--      and recruitment_candidates.
--
--   B. ~44 tables DO have RLS enabled, but carry a policy named
--      "service_role_full_access" that omits the TO clause:
--
--          CREATE POLICY "service_role_full_access" ON manager_attention_items
--            FOR ALL USING (true) WITH CHECK (true);   -- 015_intelligence_layer
--
--      A policy with no TO clause applies to PUBLIC — which includes `anon`.
--      The name reads as "service role only" in review; the semantics are
--      "everyone, unrestricted". Affected tables include child_voice_entries,
--      child_progress_entries, child_outcome_snapshots, reg44_visits,
--      reg45_reviews and incident_learning_reviews.
--
-- WHY IT IS SAFE TO FIX BLUNTLY
-- ─────────────────────────────
-- The app never reads as `anon` or `authenticated`:
--   • src/lib/supabase/server.ts builds its client with SUPABASE_SERVICE_ROLE_KEY,
--     persistSession:false, and never attaches a user JWT ⇒ every query runs as
--     service_role, which bypasses RLS.
--   • The browser client (src/lib/supabase/client.ts) is imported by exactly one
--     file — the login form — and performs ZERO table reads.
-- So enabling RLS and dropping the open policies cannot break a feature. It only
-- removes reachability for keys that are public by design.
--
-- The "service_role_full_access" policies are redundant as well as dangerous:
-- service_role bypasses RLS whether or not a policy exists. Dropping them costs
-- the app nothing and restores deny-by-default for anon/authenticated.
--
-- WHAT THIS DOES NOT CLAIM
-- ────────────────────────
-- Whether `anon` currently holds table GRANTs depends on the project's Data API
-- settings, which cannot be read from here — so the live severity is unconfirmed.
-- RLS is the gate that holds regardless of how those settings are configured, and
-- is defence-in-depth if the grants were never issued.
--
-- ROLLBACK: `alter table <t> disable row level security;` per table, and
-- re-create any dropped policy from its original migration.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── A. Enable RLS on every table in `public` that lacks it ───────────────────
-- Deny-by-default is the correct access model here: nothing but service_role
-- touches these tables, so no policy is needed alongside it.
do $$
declare
  t record;
  enabled_count int := 0;
begin
  for t in
    select c.oid::regclass as tbl, c.relname
    from pg_class c
    join pg_namespace ns on ns.oid = c.relnamespace
    where ns.nspname = 'public'
      and c.relkind in ('r', 'p')     -- ordinary + partitioned tables
      and not c.relrowsecurity
    order by c.relname
  loop
    begin
      execute format('alter table %s enable row level security', t.tbl);
      enabled_count := enabled_count + 1;
    exception when others then
      -- e.g. extension-owned tables we do not own (postgis spatial_ref_sys).
      raise notice 'RLS skipped on %: %', t.relname, sqlerrm;
    end;
  end loop;
  raise notice 'RLS enabled on % table(s)', enabled_count;
end $$;

-- ── B. Drop permissive policies that grant unrestricted access to PUBLIC/anon ─
-- Precise by construction rather than by table list:
--   • roles include PUBLIC (no TO clause) or anon;
--   • the policy is unrestricted — USING (true), or an INSERT-only policy whose
--     WITH CHECK is (true).
-- A policy with a real predicate (e.g. home_id = get_my_home_id()::text, added by
-- 421) has qual <> 'true' and is left untouched, as are TO service_role and
-- TO authenticated policies.
do $$
declare
  p record;
  dropped_count int := 0;
begin
  for p in
    select tablename, policyname, roles, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and permissive = 'PERMISSIVE'
      and (roles @> array['public']::name[] or roles @> array['anon']::name[])
      and (
        qual = 'true'                                   -- unrestricted read/all
        or (qual is null and with_check = 'true')       -- unrestricted insert-only
      )
    order by tablename, policyname
  loop
    execute format('drop policy if exists %I on public.%I', p.policyname, p.tablename);
    dropped_count := dropped_count + 1;
    raise notice 'dropped open policy %.% (roles=%)', p.tablename, p.policyname, p.roles;
  end loop;
  raise notice 'dropped % unrestricted PUBLIC/anon polic(ies)', dropped_count;
end $$;

-- ── C. Prove the postcondition rather than assume it ─────────────────────────
do $$
declare
  missing_rls int;
  still_open  int;
begin
  select count(*) into missing_rls
  from pg_class c
  join pg_namespace ns on ns.oid = c.relnamespace
  where ns.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity;

  select count(*) into still_open
  from pg_policies
  where schemaname = 'public'
    and (roles @> array['public']::name[] or roles @> array['anon']::name[])
    and (qual = 'true' or (qual is null and with_check = 'true'));

  if missing_rls > 0 then
    raise warning 'RLS still disabled on % table(s) in public — review the NOTICEs above', missing_rls;
  end if;
  if still_open > 0 then
    raise warning '% unrestricted PUBLIC/anon polic(ies) remain', still_open;
  end if;
  if missing_rls = 0 and still_open = 0 then
    raise notice 'public schema: RLS on every table, no unrestricted PUBLIC/anon policies';
  end if;
end $$;
