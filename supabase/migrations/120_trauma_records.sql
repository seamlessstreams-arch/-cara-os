-- ════════════════════════════════════════════════════════════════════════
-- 120 — Trauma-Informed Care Records
-- CHR 2015 Reg 6, Reg 14, Reg 16
-- ════════════════════════════════════════════════════════════════════════

create table if not exists cs_trauma_records (
  id              uuid default gen_random_uuid() primary key,
  home_id         uuid not null references homes(id) on delete cascade,
  child_name      text not null,
  child_id        text not null,
  assessment_date date not null default now(),
  trauma_types    text[] not null default '{}',
  aces_score      integer,
  therapeutic_model text not null default 'other',
  recovery_progress text not null default 'not_assessed',
  tic_competency  text not null default 'not_trained',
  staff_trained_percentage integer not null default 0,
  therapeutic_environment_score integer,
  key_triggers    text[] not null default '{}',
  calming_strategies text[] not null default '{}',
  therapist_involved boolean not null default false,
  therapist_name  text,
  child_engaged_in_therapy boolean not null default false,
  trauma_informed_plan_in_place boolean not null default false,
  staff_aware_of_triggers boolean not null default false,
  review_date     date,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- RLS
alter table cs_trauma_records enable row level security;

DO $$ BEGIN
  create policy "trauma_records_home"
    on cs_trauma_records
    for all
    using  (home_id = get_my_home_id())
    with check (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Index
create index if not exists idx_trauma_records_home
  on cs_trauma_records(home_id);
