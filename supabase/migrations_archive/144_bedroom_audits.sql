-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — BEDROOM AUDITS
-- CHR 2015 Reg 36, Reg 6, Reg 10
-- SCCIF: Overall Experiences
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists cs_bedroom_audits (
  id              uuid primary key default gen_random_uuid(),
  home_id         uuid not null references homes(id) on delete cascade,
  audit_type      text not null default 'routine_inspection',
  audit_date      date not null default now(),
  room_name       text not null default '',
  child_name      text,
  room_condition  text not null default 'satisfactory',
  personalisation_level text not null default 'not_assessed',
  safety_rating   text not null default 'not_assessed',
  furniture_adequate boolean,
  furniture_good_condition boolean,
  bedding_clean   boolean,
  window_restrictors_fitted boolean not null default false,
  lock_working    boolean,
  lighting_adequate boolean,
  heating_adequate boolean,
  ventilation_adequate boolean,
  decoration_acceptable boolean,
  child_consulted boolean not null default false,
  privacy_respected boolean,
  issues_found    jsonb not null default '[]'::jsonb,
  actions_taken   jsonb not null default '[]'::jsonb,
  audited_by      text not null default '',
  next_audit_date date,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table cs_bedroom_audits enable row level security;

DO $$ BEGIN
  create policy "bedroom_audits_home_access" on cs_bedroom_audits
    for all using (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

create index if not exists idx_bedroom_audits_home on cs_bedroom_audits(home_id);
create index if not exists idx_bedroom_audits_date on cs_bedroom_audits(audit_date desc);
create index if not exists idx_bedroom_audits_type on cs_bedroom_audits(audit_type);
