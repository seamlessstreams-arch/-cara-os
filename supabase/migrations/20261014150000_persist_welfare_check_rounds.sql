-- ════════════════════════════════════════════════════════════════════════════
-- Persistence: welfare_check_rounds (night-check rounds + per-child checks).
--
-- /api/v1/welfare-checks read and created night-check rounds via
-- db.welfareCheckRounds directly (dal had findAll only, no create, no table), so
-- on a live tenant a completed round vanished with the serverless instance and
-- every stat tile — including "concerns flagged", a safeguarding signal — read 0.
-- The per-child checks are stored inline as a jsonb array (the flat welfareChecks
-- collection is a derived projection of these rounds, so it needs no own table).
-- Pure-new table; the record already carries home_id (the dal injects the home
-- uuid on create for tenant scoping).
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists welfare_check_rounds (
  id                     text primary key default gen_random_uuid()::text,
  home_id                uuid,
  staff_id               text not null,
  round_date             text not null,
  round_time             text not null,
  shift_type             text not null default '',
  checks                 jsonb not null default '[]',
  all_children_checked   boolean not null default false,
  building_secure        boolean not null default false,
  fire_exits_clear       boolean not null default false,
  external_doors_locked  boolean not null default false,
  alarm_set              boolean not null default false,
  additional_notes       text,
  completed_at           timestamptz,
  created_at             timestamptz not null default now()
);

alter table welfare_check_rounds enable row level security;

create index if not exists idx_welfare_check_rounds_home on welfare_check_rounds(home_id);
create index if not exists idx_welfare_check_rounds_date on welfare_check_rounds(round_date);

drop policy if exists "Tenant isolation" on welfare_check_rounds;
create policy "Tenant isolation" on welfare_check_rounds
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());

grant select, insert, update, delete on table welfare_check_rounds to service_role;
notify pgrst, 'reload schema';
