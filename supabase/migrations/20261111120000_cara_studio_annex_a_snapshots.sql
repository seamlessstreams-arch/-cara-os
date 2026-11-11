-- Cara Studio — Annex A live inspection-readiness snapshots.
--
-- The intelligence/cara/annex-a-snapshot page builds a point-in-time Annex A
-- readiness snapshot and lets a manager lock it (a locked snapshot is immutable
-- inspection evidence). The builder read the in-memory store, which is emptied
-- on a live tenant, so on live there was nowhere to persist a snapshot and the
-- page could neither list history nor lock. This table is that store: one row
-- per snapshot, draft or locked.
--
-- The snapshot DATA (the nine Annex A section readings) is recomputed live from
-- the home's real records — young people, staff, the care-event spine, and the
-- cs_* incident/complaint/missing/restraint/reg44/reg45 tables — and frozen into
-- the `sections` jsonb here when the snapshot is generated.
--
-- home_id is uuid, matching every other live table. RLS scopes every row to the
-- caller's home; only the service role, which the app uses, has table grants.
-- Applied BY HAND in the Supabase SQL editor; idempotent.

create table if not exists cara_studio_annex_a_snapshots (
  id                 uuid primary key default gen_random_uuid(),
  home_id            uuid not null,
  period_start       date not null,
  period_end         date not null,
  generated_at       timestamptz not null default now(),
  status             text not null default 'draft'
                       check (status in ('draft', 'locked')),
  readiness_score    integer,
  overall_readiness  text not null default 'red'
                       check (overall_readiness in ('green', 'amber', 'red')),
  sections           jsonb not null default '[]'::jsonb,
  total_gaps         integer not null default 0,
  total_stale        integer not null default 0,
  locked_by          text,
  locked_at          timestamptz,
  lock_note          text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table cara_studio_annex_a_snapshots enable row level security;

drop policy if exists "Tenant isolation" on cara_studio_annex_a_snapshots;
create policy "Tenant isolation" on cara_studio_annex_a_snapshots
  for all
  using (home_id = (select get_my_home_id()))
  with check (home_id = (select get_my_home_id()));

grant select, insert, update on cara_studio_annex_a_snapshots to service_role;

-- List newest-first for a home; find the live draft for a given period fast.
create index if not exists idx_cara_annex_a_snap_home_generated
  on cara_studio_annex_a_snapshots (home_id, generated_at desc);
create index if not exists idx_cara_annex_a_snap_home_period_status
  on cara_studio_annex_a_snapshots (home_id, period_start, period_end, status);
