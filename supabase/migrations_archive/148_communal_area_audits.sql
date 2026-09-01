-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — COMMUNAL AREA AUDITS
-- CHR 2015 Reg 36, Reg 6, Reg 25
-- SCCIF: Overall Experiences
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists cs_communal_area_audits (
  id                        uuid primary key default gen_random_uuid(),
  home_id                   uuid not null references homes(id) on delete cascade,
  area_type                 text not null default 'lounge',
  audit_date                date not null default now(),
  cleanliness_rating        text not null default 'acceptable',
  homeliness_rating         text not null default 'not_assessed',
  safety_check              text not null default 'not_checked',
  furniture_good_condition  boolean,
  decoration_fresh          boolean,
  temperature_comfortable   boolean,
  lighting_adequate         boolean,
  ventilation_adequate      boolean,
  accessible                boolean,
  child_artwork_displayed   boolean not null default false,
  age_appropriate_resources boolean,
  hazards_removed           boolean,
  fire_exits_clear          boolean,
  children_consulted        boolean not null default false,
  issues_found              jsonb not null default '[]'::jsonb,
  actions_taken             jsonb not null default '[]'::jsonb,
  audited_by                text not null default '',
  next_audit_date           date,
  notes                     text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

alter table cs_communal_area_audits enable row level security;

DO $$ BEGIN
  create policy "communal_area_audits_home_access" on cs_communal_area_audits
    for all using (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

create index if not exists idx_communal_area_audits_home on cs_communal_area_audits(home_id);
create index if not exists idx_communal_area_audits_date on cs_communal_area_audits(audit_date desc);
