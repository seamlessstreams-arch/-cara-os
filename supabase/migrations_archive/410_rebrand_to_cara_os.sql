-- ══════════════════════════════════════════════════════════════════════════════
-- 410 — REBRAND TO CARA OS
--
-- The product (formerly "Cornerstone Care OS") and its AI layer (formerly
-- "ARIA") are now Cara OS / Cara. This migration is intentionally ADDITIVE and
-- backwards-compatible:
--
--   • NO tables, columns, functions, policies or buckets are renamed or
--     dropped. All aria_* objects keep their names — application code and any
--     existing deployments continue to work unchanged.
--   • For every existing public.aria_* table, a read-only public.cara_*
--     compatibility VIEW is created with security_invoker = on, so the
--     querying user's RLS applies exactly as it does on the base table.
--     New code may read via cara_* names; writes continue to target aria_*.
--   • If a user-facing settings table exists (platform_settings or
--     app_settings with key/value columns), branded values are updated and
--     canonical Cara OS keys are upserted. These tables do not exist in the
--     current schema, so the blocks are no-ops until they do.
--
-- Safe to run on an empty project (all blocks are guarded with IF EXISTS).
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Compatibility views: cara_* → aria_* ─────────────────────────────────────
do $$
declare
  t record;
  view_name text;
begin
  for t in
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_type = 'BASE TABLE'
      and table_name like 'aria\_%' escape '\'
  loop
    view_name := 'cara_' || substring(t.table_name from 6); -- aria_logs → cara_logs
    -- Never shadow a real table of the same name.
    if not exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = view_name and table_type = 'BASE TABLE'
    ) then
      execute format(
        'create or replace view public.%I with (security_invoker = on) as select * from public.%I',
        view_name, t.table_name
      );
      execute format('grant select on public.%I to authenticated, service_role', view_name);
      execute format(
        'comment on view public.%I is %L',
        view_name,
        'Cara OS rebrand compatibility view over ' || t.table_name || ' (security_invoker; RLS of the base table applies).'
      );
    end if;
  end loop;
end $$;

-- ── User-facing settings labels (no-op until such tables exist) ──────────────
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'platform_settings'
  ) then
    update public.platform_settings
    set value = 'Cara OS'
    where key in ('app_name', 'platform_name', 'product_name')
      and value ilike '%cornerstone%';

    update public.platform_settings
    set value = 'Cara Intelligence'
    where key in ('ai_name', 'assistant_name', 'intelligence_name')
      and (value ilike '%aria%' or value ilike '%cornerstone%');

    insert into public.platform_settings (key, value)
    values
      ('app_name', 'Cara OS'),
      ('platform_name', 'Cara OS'),
      ('product_name', 'Cara OS'),
      ('ai_name', 'Cara Intelligence'),
      ('assistant_name', 'Cara Assistant'),
      ('insights_name', 'Cara Insights')
    on conflict (key) do update set value = excluded.value;
  end if;

  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'app_settings'
  ) then
    update public.app_settings
    set value = 'Cara OS'
    where key in ('app_name', 'platform_name', 'product_name')
      and value ilike '%cornerstone%';
  end if;
end $$;
