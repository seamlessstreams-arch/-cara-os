-- ══════════════════════════════════════════════════════════════════════════════
-- CARA — RLS perf re-optimisation (Supabase advisor: auth_rls_initplan)
--
-- Re-run of 20261019120000's wrap after the storage-table promotions since then
-- (#1327/#1329/#1332/#1334/#1338/#1340) re-introduced bare `home_id =
-- get_my_home_id()` policies on the newly-promoted tables (~222 flagged).
--
-- The function, called bare, is re-planned per row; wrapping it as a scalar
-- subquery `(select get_my_home_id())` makes Postgres evaluate it ONCE per query
-- (an InitPlan). SEMANTICS ARE IDENTICAL — same boolean, same rows. The live app
-- reads as service_role (RLS bypassed), so this only silences the advisor.
--
-- Catalogue-driven + idempotent: wraps only policies still calling it bare, skips
-- any already wrapped, ALTERs in place (atomic), reports skips as warnings.
-- ══════════════════════════════════════════════════════════════════════════════

-- 1) Wrap get_my_home_id() in every public RLS policy that still calls it bare.
do $$
declare
  r  record;
  nq text;
  nc text;
begin
  for r in
    select n.nspname                               as sch,
           c.relname                               as tbl,
           p.polname                               as pol,
           pg_get_expr(p.polqual,      p.polrelid) as qual,
           pg_get_expr(p.polwithcheck, p.polrelid) as wcheck
    from pg_policy p
    join pg_class     c on c.oid = p.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and pg_get_expr(p.polqual, p.polrelid) ~ 'get_my_home_id\(\)'
      and pg_get_expr(p.polqual, p.polrelid) !~* 'select get_my_home_id'
  loop
    begin
      nq := regexp_replace(r.qual, 'get_my_home_id\(\)', '(select get_my_home_id())', 'g');
      if r.wcheck is not null then
        nc := regexp_replace(r.wcheck, 'get_my_home_id\(\)', '(select get_my_home_id())', 'g');
        execute format('alter policy %I on %I.%I using (%s) with check (%s)', r.pol, r.sch, r.tbl, nq, nc);
      else
        execute format('alter policy %I on %I.%I using (%s)', r.pol, r.sch, r.tbl, nq);
      end if;
    exception when others then
      raise warning 'RLS_WRAP_SKIP %.% [%]: %', r.sch, r.tbl, r.pol, sqlerrm;
    end;
  end loop;
end $$;

-- 2) Also wrap any WITH CHECK-only policy whose USING is null but withcheck is bare.
do $$
declare
  r  record;
  nc text;
begin
  for r in
    select n.nspname as sch, c.relname as tbl, p.polname as pol,
           pg_get_expr(p.polwithcheck, p.polrelid) as wcheck
    from pg_policy p
    join pg_class c on c.oid = p.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and p.polqual is null
      and pg_get_expr(p.polwithcheck, p.polrelid) ~ 'get_my_home_id\(\)'
      and pg_get_expr(p.polwithcheck, p.polrelid) !~* 'select get_my_home_id'
  loop
    begin
      nc := regexp_replace(r.wcheck, 'get_my_home_id\(\)', '(select get_my_home_id())', 'g');
      execute format('alter policy %I on %I.%I with check (%s)', r.pol, r.sch, r.tbl, nc);
    exception when others then
      raise warning 'RLS_WRAP_WC_SKIP %.% [%]: %', r.sch, r.tbl, r.pol, sqlerrm;
    end;
  end loop;
end $$;

-- 3) Cover any home_id foreign key that lacks a leading-column index.
do $$
declare r record;
begin
  for r in
    select c.relname as tbl
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
      and exists (select 1 from pg_attribute a
                  where a.attrelid = c.oid and a.attname = 'home_id' and not a.attisdropped)
      and exists (select 1 from pg_constraint k
                  where k.conrelid = c.oid and k.contype = 'f')
      and not exists (
        select 1 from pg_index i
        join pg_attribute a on a.attrelid = i.indrelid and a.attnum = i.indkey[0]
        where i.indrelid = c.oid and a.attname = 'home_id')
  loop
    begin
      execute format('create index if not exists %I on public.%I(home_id)',
                     left('idx_' || r.tbl || '_home', 63), r.tbl);
    exception when others then
      raise warning 'FK_INDEX_SKIP %: %', r.tbl, sqlerrm;
    end;
  end loop;
end $$;

notify pgrst, 'reload schema';
