-- Close the RLS policies on live that still granted access beyond the service role.
--
-- check-rls.js read only the first three characters of each migration's file
-- name, so every timestamped migration parsed as 202 (below its 423 cut-off) and
-- was never checked. Fixed alongside this file and judged on the end state of the
-- migration chain, it finds two open policies. A read-only check of live
-- pg_policies on 2026-11-09 confirmed both, and found a third that comes from the
-- lean baseline, which the guard does not scan:
--
--   cs_communication_drafts  "Tenant isolation"              for all, using (true) with check (true)
--                            20260816210000_persist_communication_drafts
--   cara_outputs             "Users can insert own outputs"  for insert, with check (true)
--                            20260918120000_restore_direct_query_tables
--   audit_log                audit_log_insert                for insert, with check (true)
--                            00000000000000_lean_live_baseline
--
-- None has a TO clause, so each applied to PUBLIC, which includes anon.
--
-- The app reads and writes these tables only as service_role (createServerClient),
-- which bypasses RLS, so no change can affect a feature:
--   • cs_communication_drafts keeps its "Tenant isolation" policy, now scoped to
--     the caller's home like the other home tables. home_id is text here, so the
--     uuid from get_my_home_id() is cast.
--   • cara_outputs has no home column to scope by and no browser caller, so the
--     insert policy is dropped. RLS stays enabled with no policy, which leaves the
--     table to the service role.
--   • audit_log: the insert policy is dropped, so only the service role can add
--     entries to the audit trail. Its read policy is unchanged.
--
-- cs_regulation_mappings also has a public read policy (cs_reg_mappings_read).
-- It holds regulatory reference data only, with no home or child data, so it is
-- left as it is.
--
-- Applied BY HAND in the Supabase SQL editor. Idempotent.
-- Rollback: not recommended, because it would re-open these tables. The previous
-- definitions are in the migrations named above.

drop policy if exists "Tenant isolation" on cs_communication_drafts;
create policy "Tenant isolation" on cs_communication_drafts
  for all
  using (home_id = (select get_my_home_id()::text))
  with check (home_id = (select get_my_home_id()::text));

drop policy if exists "Users can insert own outputs" on cara_outputs;

drop policy if exists audit_log_insert on audit_log;

-- All three tables already have RLS enabled; restated so the end state is explicit.
alter table cs_communication_drafts enable row level security;
alter table cara_outputs enable row level security;
alter table audit_log enable row level security;
