-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — INSPECTION HISTORY SCHEMA
-- Migration 022 — 2026-05-08
--
-- Creates the ofsted_inspections table for recording Ofsted inspection history,
-- including grade, inspector details, action counts, and report references.
--
-- This replaces the static INSPECTION_HISTORY array previously hard-coded in
-- the inspection page component.
--
-- ROLLBACK: DROP TABLE IF EXISTS ofsted_inspections;
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Enums ─────────────────────────────────────────────────────────────────────

do $$ begin
  create type ofsted_grade as enum (
    'Outstanding',
    'Good',
    'Requires improvement',
    'Inadequate'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type inspection_type as enum (
    'Full inspection',
    'Short notice',
    'Focused visit',
    'Monitoring visit'
  );
exception when duplicate_object then null; end $$;

-- ── Table ─────────────────────────────────────────────────────────────────────

create table if not exists ofsted_inspections (
  id                 text primary key default 'insp_' || gen_random_uuid()::text,
  home_id            text not null,
  inspection_date    date not null,
  inspection_type    inspection_type not null default 'Full inspection',
  grade              ofsted_grade not null,
  inspector_name     text not null,
  report_reference   text,
  report_url         text,
  actions_required   integer not null default 0,
  actions_completed  integer not null default 0,
  summary            text,
  published_at       date,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint actions_completed_lte_required
    check (actions_completed <= actions_required)
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

create index if not exists ofsted_inspections_home_date_idx
  on ofsted_inspections (home_id, inspection_date desc);

-- ── RLS ───────────────────────────────────────────────────────────────────────

alter table ofsted_inspections enable row level security;

-- All authenticated users in the home can read inspection history
create policy "ofsted_inspections_select" on ofsted_inspections
  for select to authenticated
  using (home_id = current_setting('app.home_id', true));

-- Only service role (API routes) can insert / update
create policy "ofsted_inspections_insert" on ofsted_inspections
  for insert to service_role with check (true);

create policy "ofsted_inspections_update" on ofsted_inspections
  for update to service_role using (true);

-- ── updated_at trigger ────────────────────────────────────────────────────────

create or replace function update_ofsted_inspections_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists set_ofsted_inspections_updated_at on ofsted_inspections;
create trigger set_ofsted_inspections_updated_at
  before update on ofsted_inspections
  for each row execute function update_ofsted_inspections_updated_at();

-- ── Seed Data (Oak House inspection history) ──────────────────────────────────

insert into ofsted_inspections
  (id, home_id, inspection_date, inspection_type, grade, inspector_name,
   report_reference, report_url, actions_required, actions_completed,
   summary, published_at)
values
  (
    'insp_001', 'home_oak', '2025-10-15', 'Full inspection', 'Good',
    'Jane Whitfield', 'REP-2025-10-OAK', null, 2, 2,
    'Overall the home provides good care and outcomes for children. Leadership and management are effective.',
    '2025-11-01'
  ),
  (
    'insp_002', 'home_oak', '2024-04-22', 'Full inspection', 'Good',
    'Mark Tanner', 'REP-2024-04-OAK', null, 1, 1,
    'The home continues to provide a good standard of care. Relationships between staff and children are warm and supportive.',
    '2024-05-10'
  ),
  (
    'insp_003', 'home_oak', '2023-11-08', 'Short notice', 'Requires improvement',
    'Susan Blake', 'REP-2023-11-OAK', null, 5, 5,
    'Some aspects of care require improvement. Record keeping and supervision arrangements need strengthening.',
    '2023-11-30'
  )
on conflict (id) do nothing;
