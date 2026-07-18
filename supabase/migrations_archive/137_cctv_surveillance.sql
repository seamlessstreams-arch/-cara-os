-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — CCTV & SURVEILLANCE
-- CHR 2015 Reg 36, Reg 12; ICO CCTV Code; GDPR Article 6
-- SCCIF: Helped & Protected
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists cs_cctv_surveillance (
  id              uuid primary key default gen_random_uuid(),
  home_id         uuid not null references homes(id) on delete cascade,
  event_type      text not null default 'system_check',
  event_date      date not null default now(),
  camera_location text not null default 'entrance',
  compliance_status text not null default 'not_assessed',
  retention_status  text not null default 'not_checked',
  gdpr_compliant    boolean not null default false,
  signage_visible   boolean not null default false,
  children_informed boolean not null default false,
  staff_informed    boolean not null default false,
  footage_accessed  boolean not null default false,
  accessed_by       text,
  access_reason     text,
  privacy_impact_completed boolean not null default false,
  data_protection_officer_consulted boolean not null default false,
  issues_found      jsonb not null default '[]'::jsonb,
  actions_taken     jsonb not null default '[]'::jsonb,
  reviewed_by       text not null default '',
  next_review_date  date,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- RLS
alter table cs_cctv_surveillance enable row level security;

DO $$ BEGIN
  create policy "cctv_home_access" on cs_cctv_surveillance
    for all using (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Indexes
create index if not exists idx_cctv_surveillance_home on cs_cctv_surveillance(home_id);
create index if not exists idx_cctv_surveillance_date on cs_cctv_surveillance(event_date desc);
create index if not exists idx_cctv_surveillance_type on cs_cctv_surveillance(event_type);
