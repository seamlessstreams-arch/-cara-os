-- ════════════════════════════════════════════════════════════════════════
-- 124 — Fire Safety & Drills
-- CHR 2015 Reg 25, Reg 36; Fire Safety Order 2005
-- ════════════════════════════════════════════════════════════════════════

create table if not exists cs_fire_safety (
  id                      uuid default gen_random_uuid() primary key,
  home_id                 uuid not null references homes(id) on delete cascade,
  event_type              text not null default 'planned_drill',
  event_date              date not null default now(),
  evacuation_result       text not null default 'not_applicable',
  evacuation_time_seconds integer,
  all_persons_accounted   boolean not null default true,
  children_present        integer not null default 0,
  staff_present           integer not null default 0,
  compliance_status       text not null default 'compliant',
  equipment_status        text not null default 'operational',
  issues_identified       text[] not null default '{}',
  actions_taken           text[] not null default '{}',
  conducted_by            text not null default '',
  fire_service_attended   boolean not null default false,
  peep_plans_followed     boolean not null default true,
  night_staff_competent   boolean,
  next_drill_date         date,
  review_date             date,
  notes                   text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- RLS
alter table cs_fire_safety enable row level security;

DO $$ BEGIN
  create policy "fire_safety_home"
    on cs_fire_safety
    for all
    using  (home_id = get_my_home_id())
    with check (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Index
create index if not exists idx_fire_safety_home
  on cs_fire_safety(home_id);
