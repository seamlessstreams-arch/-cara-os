-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — HOLIDAY & TRIPS
-- CHR 2015 Reg 7, Reg 10, Reg 25
-- SCCIF: Overall Experiences
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists cs_holiday_trips (
  id                          uuid primary key default gen_random_uuid(),
  home_id                     uuid not null references homes(id) on delete cascade,
  trip_type                   text not null default 'day_trip',
  trip_date                   date not null default now(),
  return_date                 date,
  trip_status                 text not null default 'planned',
  risk_assessment_status      text not null default 'pending',
  child_enjoyment             text not null default 'not_assessed',
  destination                 text not null default '',
  children_attending          integer not null default 0,
  staff_attending             integer not null default 0,
  child_chose_activity        boolean not null default false,
  consent_obtained            boolean not null default false,
  social_worker_informed      boolean not null default false,
  parent_carer_informed       boolean not null default false,
  delegated_authority_used    boolean not null default false,
  emergency_contacts_carried  boolean not null default true,
  medication_taken            boolean not null default false,
  first_aid_kit_carried       boolean not null default true,
  incident_during_trip        boolean not null default false,
  cost                        numeric,
  budget_approved             boolean not null default false,
  children_names              jsonb not null default '[]'::jsonb,
  learning_outcomes           jsonb not null default '[]'::jsonb,
  issues_found                jsonb not null default '[]'::jsonb,
  actions_taken               jsonb not null default '[]'::jsonb,
  organised_by                text not null default '',
  notes                       text,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

alter table cs_holiday_trips enable row level security;

DO $$ BEGIN
  create policy "holiday_trips_home_access" on cs_holiday_trips
    for all using (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

create index if not exists idx_holiday_trips_home on cs_holiday_trips(home_id);
create index if not exists idx_holiday_trips_date on cs_holiday_trips(trip_date desc);
