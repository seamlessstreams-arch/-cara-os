-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — MAINTENANCE & REPAIRS
-- CHR 2015 Reg 36, Reg 25, Reg 13
-- SCCIF: Helped & Protected
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists cs_maintenance_repairs (
  id              uuid primary key default gen_random_uuid(),
  home_id         uuid not null references homes(id) on delete cascade,
  maintenance_type text not null default 'repair_request',
  reported_date   date not null default now(),
  completed_date  date,
  priority        text not null default 'routine',
  status          text not null default 'reported',
  description     text not null default '',
  location        text not null default '',
  contractor_used boolean not null default false,
  contractor_name text,
  contractor_status text not null default 'not_required',
  cost            numeric,
  children_impact_assessed boolean not null default false,
  safeguarding_check_completed boolean not null default false,
  certificate_obtained boolean not null default false,
  days_to_completion int,
  reported_by     text not null default '',
  completed_by    text,
  issues_found    jsonb not null default '[]'::jsonb,
  actions_taken   jsonb not null default '[]'::jsonb,
  next_due_date   date,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- RLS
alter table cs_maintenance_repairs enable row level security;

DO $$ BEGIN
  create policy "maintenance_repairs_home_access" on cs_maintenance_repairs
    for all using (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Indexes
create index if not exists idx_maintenance_repairs_home on cs_maintenance_repairs(home_id);
create index if not exists idx_maintenance_repairs_date on cs_maintenance_repairs(reported_date desc);
create index if not exists idx_maintenance_repairs_status on cs_maintenance_repairs(status);
create index if not exists idx_maintenance_repairs_priority on cs_maintenance_repairs(priority);
