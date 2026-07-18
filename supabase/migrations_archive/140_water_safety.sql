-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — WATER SAFETY & LEGIONELLA
-- CHR 2015 Reg 25, Reg 36; HSE L8, HSG274
-- SCCIF: Helped & Protected
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists cs_water_safety (
  id              uuid primary key default gen_random_uuid(),
  home_id         uuid not null references homes(id) on delete cascade,
  check_type      text not null default 'temperature_check',
  check_date      date not null default now(),
  location        text not null default 'bathroom_1',
  hot_water_temp  numeric,
  cold_water_temp numeric,
  temperature_compliance text not null default 'not_tested',
  risk_level      text not null default 'not_assessed',
  tmv_fitted      boolean not null default false,
  tmv_operational boolean not null default false,
  flushing_completed boolean not null default false,
  legionella_assessment_current boolean not null default false,
  scalding_risk_mitigated boolean not null default false,
  issues_found    jsonb not null default '[]'::jsonb,
  actions_taken   jsonb not null default '[]'::jsonb,
  checked_by      text not null default '',
  next_check_date date,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- RLS
alter table cs_water_safety enable row level security;

DO $$ BEGIN
  create policy "water_safety_home_access" on cs_water_safety
    for all using (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Indexes
create index if not exists idx_water_safety_home on cs_water_safety(home_id);
create index if not exists idx_water_safety_date on cs_water_safety(check_date desc);
create index if not exists idx_water_safety_type on cs_water_safety(check_type);
