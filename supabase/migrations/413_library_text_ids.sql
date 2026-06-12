-- ══════════════════════════════════════════════════════════════════════════════
-- 413 — RESOURCE LIBRARY: TEXT APPLICATION IDS
--
-- cara_resource_library (migration 411) used uuid ids, but the application
-- addresses rows by its own text ids (clr_…) for approval updates — the same
-- pattern as cara_studio_outputs (412). The table is empty before activation,
-- so retyping the column is safe; guarded for idempotence.
-- ══════════════════════════════════════════════════════════════════════════════

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'cara_resource_library'
      and column_name = 'id' and data_type = 'uuid'
  ) then
    alter table cara_resource_library alter column id drop default;
    alter table cara_resource_library alter column id type text using id::text;
  end if;
end $$;

comment on column cara_resource_library.id is
  'TEXT application id (clr_…) so approval updates address the row the create wrote.';
