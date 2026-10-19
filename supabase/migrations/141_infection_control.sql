-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — INFECTION CONTROL
-- CHR 2015 Reg 25, Reg 12, Reg 36
-- SCCIF: Helped & Protected
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists cs_infection_control (
  id              uuid primary key default gen_random_uuid(),
  home_id         uuid not null references homes(id) on delete cascade,
  event_type      text not null default 'hand_hygiene_audit',
  event_date      date not null default now(),
  hygiene_standard text not null default 'not_assessed',
  outbreak_status  text not null default 'no_outbreak',
  ppe_compliance   text not null default 'not_checked',
  hand_washing_observed boolean not null default false,
  sanitiser_available   boolean not null default false,
  cleaning_schedule_followed boolean not null default false,
  laundry_procedures_followed boolean not null default false,
  food_hygiene_maintained     boolean not null default false,
  children_symptomatic int not null default 0,
  staff_symptomatic    int not null default 0,
  gp_contacted         boolean not null default false,
  public_health_notified boolean not null default false,
  isolation_measures_in_place boolean not null default false,
  issues_found    jsonb not null default '[]'::jsonb,
  actions_taken   jsonb not null default '[]'::jsonb,
  assessed_by     text not null default '',
  next_review_date date,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- RLS
alter table cs_infection_control enable row level security;

DO $$ BEGIN
  create policy "infection_control_home_access" on cs_infection_control
    for all using (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Indexes
create index if not exists idx_infection_control_home on cs_infection_control(home_id);
create index if not exists idx_infection_control_date on cs_infection_control(event_date desc);
create index if not exists idx_infection_control_type on cs_infection_control(event_type);
