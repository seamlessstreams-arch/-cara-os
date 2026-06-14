-- ══════════════════════════════════════════════════════════════════════════════
-- 419 — RENAME THE ARIA DATA LAYER TO CARA
--
-- Completes the Cara OS rebrand at the database layer. Migration 410 was
-- additive (it left aria_* tables in place and added read-only cara_* views).
-- Application code is now fully renamed to cara_* (tables AND columns), so this
-- migration renames the live schema to match.
--
-- Generic + guarded (same information_schema-loop pattern as 410), so it adapts
-- to whatever aria_* objects exist and is safe to run on an empty project or to
-- re-run (idempotent — already-renamed objects are skipped):
--   1. drop the 410 cara_* compatibility VIEWS (their names are needed for the
--      renamed base tables);
--   2. rename every public.aria_* BASE TABLE  → cara_*  (skip if a cara_* table
--      of that name already exists);
--   3. rename every public.aria_* COLUMN       → cara_*  (skip on name clash).
--
-- ALTER ... RENAME updates dependent indexes, constraints, sequences, RLS
-- policies and views automatically. CAVEAT: any plpgsql FUNCTION or TRIGGER body
-- that hard-codes an aria_* table/column name is NOT auto-updated by a rename —
-- the helper functions in this schema key off home_id / user ids, not aria_*,
-- so none are affected; verify at activation if custom functions are added.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. drop the 410 cara_* compatibility views (free the names for base tables)
do $$
declare v record;
begin
  for v in
    select table_name
    from information_schema.views
    where table_schema = 'public'
      and table_name like 'cara\_%' escape '\'
  loop
    execute format('drop view if exists public.%I cascade', v.table_name);
  end loop;
end $$;

-- ── 2. rename aria_* base tables → cara_*
do $$
declare t record; newname text;
begin
  for t in
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_type = 'BASE TABLE'
      and table_name like 'aria\_%' escape '\'
  loop
    newname := 'cara_' || substring(t.table_name from 6); -- aria_logs → cara_logs
    if not exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = newname and table_type = 'BASE TABLE'
    ) then
      execute format('alter table public.%I rename to %I', t.table_name, newname);
    end if;
  end loop;
end $$;

-- ── 3. rename aria_* columns → cara_* (on any remaining table)
do $$
declare c record; newname text;
begin
  for c in
    select table_name, column_name
    from information_schema.columns
    where table_schema = 'public'
      and column_name like 'aria\_%' escape '\'
  loop
    newname := 'cara_' || substring(c.column_name from 6); -- aria_flags → cara_flags
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = c.table_name and column_name = newname
    ) then
      execute format('alter table public.%I rename column %I to %I', c.table_name, c.column_name, newname);
    end if;
  end loop;
end $$;
