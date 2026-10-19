-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — DATA PROTECTION
-- CHR 2015 Reg 37, UK GDPR, DPA 2018
-- SCCIF: Leadership
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists cs_data_protection (
  id                          uuid primary key default gen_random_uuid(),
  home_id                     uuid not null references homes(id) on delete cascade,
  event_type                  text not null default 'other',
  event_date                  date not null default now(),
  compliance_status           text not null default 'not_assessed',
  breach_severity             text not null default 'not_applicable',
  response_timeliness         text not null default 'not_applicable',
  requester_name              text,
  child_involved              boolean not null default false,
  staff_involved              boolean not null default false,
  ico_notified                boolean not null default false,
  dpo_consulted               boolean not null default false,
  deadline_date               date,
  completed_date              date,
  data_categories_affected    jsonb not null default '[]'::jsonb,
  remedial_actions            jsonb not null default '[]'::jsonb,
  issues_found                jsonb not null default '[]'::jsonb,
  actions_taken               jsonb not null default '[]'::jsonb,
  handled_by                  text not null default '',
  approved_by                 text,
  notes                       text,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

alter table cs_data_protection enable row level security;

DO $$ BEGIN
  create policy "data_protection_home_access" on cs_data_protection
    for all using (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

create index if not exists idx_data_protection_home on cs_data_protection(home_id);
create index if not exists idx_data_protection_date on cs_data_protection(event_date desc);
