-- ══════════════════════════════════════════════════════════════════════════════
-- CARA — enable RLS on every public table that lacks it (Supabase SECURITY advisor:
-- "RLS Disabled in Public" / "Policy Exists RLS Disabled")
--
-- This project grants anon/authenticated on public tables by default, and the anon
-- key is public (shipped to the browser). A public table with RLS *disabled* is
-- therefore readable by anyone with that key. Enabling RLS closes that: with no
-- policy, anon/authenticated are denied; the app is unaffected because it reads
-- server-side as service_role, which BYPASSES RLS, and no table is ever read with
-- the anon key client-side (the browser client is used only for auth + uploads).
--
-- Legacy/platform + incident/oversight/voice tables are the ones affected (our
-- capture tables already enable RLS). Deny-all is the correct posture for tables
-- only ever touched by service_role; a feature that later needs anon/authenticated
-- access adds its own policy then.
--
-- Idempotent + safe: only touches tables where rowsecurity is still off; per-table
-- guarded so one failure reports a WARNING instead of aborting the batch.
-- ══════════════════════════════════════════════════════════════════════════════

do $$
declare
  r record;
  n int := 0;
begin
  for r in
    select c.relname as tbl
    from pg_class c
    join pg_namespace ns on ns.oid = c.relnamespace
    where ns.nspname = 'public'
      and c.relkind = 'r'          -- ordinary tables only (not views / partitions)
      and c.relrowsecurity = false -- RLS not yet enabled
    order by c.relname
  loop
    begin
      execute format('alter table public.%I enable row level security', r.tbl);
      n := n + 1;
    exception when others then
      raise warning 'RLS_ENABLE_SKIP %: %', r.tbl, sqlerrm;
    end;
  end loop;
  raise notice 'enabled RLS on % public table(s)', n;
end $$;

notify pgrst, 'reload schema';
