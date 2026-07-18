-- ══════════════════════════════════════════════════════════════════════════════
-- 135 · TRANSPORT SAFETY
-- Tracks vehicle safety checks, driver qualifications, journey logs,
-- risk assessments, and transport compliance.
-- CHR 2015 Reg 25, Reg 12; Road Traffic Act 1988.
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists cs_transport_safety (
  id            uuid primary key default gen_random_uuid(),
  home_id       uuid not null references homes(id) on delete cascade,

  event_type                    text    not null default 'other',
  event_date                    date    not null default now(),
  vehicle_registration          text    not null default '',
  vehicle_status                text    not null default 'not_checked',
  journey_purpose               text,
  driver_name                   text    not null default '',
  driver_compliance             text    not null default 'not_checked',
  children_transported          text[]  not null default '{}',
  seatbelts_checked             boolean not null default false,
  child_locks_engaged           boolean not null default false,
  risk_assessment_completed     boolean not null default false,
  insurance_valid               boolean not null default true,
  mot_valid                     boolean not null default true,
  mileage                       integer,
  issues_identified             text[]  not null default '{}',
  actions_taken                 text[]  not null default '{}',
  conducted_by                  text    not null default '',
  next_check_date               date,
  notes                         text,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Index
create index if not exists idx_cs_transport_safety_home
  on cs_transport_safety(home_id);

-- RLS
alter table cs_transport_safety enable row level security;

do $$ begin
  create policy "Tenant isolation" on cs_transport_safety
    using (home_id = get_my_home_id());
exception when duplicate_object then null;
end $$;
