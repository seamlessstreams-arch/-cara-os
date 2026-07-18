-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — EMERGENCY DRILL RECORDS
-- CHR 2015 Reg 25, Reg 36, Regulatory Reform (Fire Safety) Order 2005
-- SCCIF: Helped & Protected
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists cs_emergency_drills (
  id                          uuid primary key default gen_random_uuid(),
  home_id                     uuid not null references homes(id) on delete cascade,
  drill_type                  text not null default 'fire_evacuation',
  drill_date                  date not null default now(),
  drill_outcome               text not null default 'not_assessed',
  time_of_day                 text not null default 'day_shift',
  staff_readiness             text not null default 'not_assessed',
  evacuation_time_seconds     integer,
  all_children_accounted      boolean not null default true,
  all_staff_participated      boolean not null default true,
  assembly_point_used         boolean not null default true,
  equipment_working           boolean not null default true,
  children_informed_beforehand boolean not null default false,
  children_distressed         boolean not null default false,
  learning_points             jsonb not null default '[]'::jsonb,
  actions_required            jsonb not null default '[]'::jsonb,
  staff_present               integer not null default 0,
  children_present            integer not null default 0,
  conducted_by                text not null default '',
  next_drill_date             date,
  notes                       text,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

alter table cs_emergency_drills enable row level security;

DO $$ BEGIN
  create policy "emergency_drills_home_access" on cs_emergency_drills
    for all using (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

create index if not exists idx_emergency_drills_home on cs_emergency_drills(home_id);
create index if not exists idx_emergency_drills_date on cs_emergency_drills(drill_date desc);
