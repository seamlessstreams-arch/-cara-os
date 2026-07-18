-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — STAFF EXIT INTERVIEWS
-- CHR 2015 Reg 33, Reg 13, Reg 32
-- SCCIF: Leadership
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists cs_staff_exit_interviews (
  id                                  uuid primary key default gen_random_uuid(),
  home_id                             uuid not null references homes(id) on delete cascade,
  staff_name                          text not null default '',
  role                                text not null default '',
  leaving_date                        date not null default now(),
  interview_date                      date not null default now(),
  leaving_reason                      text not null default 'other',
  satisfaction_rating                 text not null default 'neutral',
  handover_status                     text not null default 'not_started',
  rehire_recommendation               text not null default 'not_assessed',
  length_of_service_months            integer not null default 0,
  would_recommend_employer            boolean not null default false,
  felt_supported                      boolean not null default false,
  adequate_training                   boolean not null default false,
  safeguarding_debrief_completed      boolean not null default false,
  keys_returned                       boolean not null default false,
  access_revoked                      boolean not null default false,
  dbs_notification_sent               boolean not null default false,
  children_informed                   boolean not null default false,
  children_supported_through_transition boolean not null default false,
  feedback_themes                     jsonb not null default '[]'::jsonb,
  improvements_suggested              jsonb not null default '[]'::jsonb,
  interviewed_by                      text not null default '',
  notes                               text,
  created_at                          timestamptz not null default now(),
  updated_at                          timestamptz not null default now()
);

alter table cs_staff_exit_interviews enable row level security;

DO $$ BEGIN
  create policy "staff_exit_interviews_home_access" on cs_staff_exit_interviews
    for all using (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

create index if not exists idx_staff_exit_interviews_home on cs_staff_exit_interviews(home_id);
create index if not exists idx_staff_exit_interviews_date on cs_staff_exit_interviews(leaving_date desc);
