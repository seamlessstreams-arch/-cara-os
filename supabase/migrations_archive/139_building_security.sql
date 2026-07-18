-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — BUILDING SECURITY
-- CHR 2015 Reg 36, Reg 25, Reg 12
-- SCCIF: Helped & Protected
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists cs_building_security (
  id              uuid primary key default gen_random_uuid(),
  home_id         uuid not null references homes(id) on delete cascade,
  event_type      text not null default 'routine_check',
  event_date      date not null default now(),
  security_status text not null default 'not_checked',
  alarm_status    text not null default 'not_tested',
  key_management  text not null default 'not_checked',
  all_doors_secure          boolean not null default false,
  all_windows_secure        boolean not null default false,
  external_lighting_working boolean not null default false,
  perimeter_secure          boolean not null default false,
  visitors_log_checked      boolean not null default false,
  children_accounted_for    boolean not null default false,
  issues_found    jsonb not null default '[]'::jsonb,
  actions_taken   jsonb not null default '[]'::jsonb,
  checked_by      text not null default '',
  next_check_date date,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- RLS
alter table cs_building_security enable row level security;

DO $$ BEGIN
  create policy "building_security_home_access" on cs_building_security
    for all using (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Indexes
create index if not exists idx_building_security_home on cs_building_security(home_id);
create index if not exists idx_building_security_date on cs_building_security(event_date desc);
create index if not exists idx_building_security_type on cs_building_security(event_type);
