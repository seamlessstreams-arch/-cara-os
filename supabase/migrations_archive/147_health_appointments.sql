-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — HEALTH APPOINTMENTS
-- CHR 2015 Reg 7, Reg 10, Reg 33
-- SCCIF: Health
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists cs_health_appointments (
  id                        uuid primary key default gen_random_uuid(),
  home_id                   uuid not null references homes(id) on delete cascade,
  child_name                text not null default '',
  child_id                  uuid,
  appointment_type          text not null default 'gp_visit',
  appointment_date          date not null default now(),
  appointment_status        text not null default 'pending',
  appointment_outcome       text not null default 'not_applicable',
  consent_status            text not null default 'not_required',
  child_accompanied         boolean not null default true,
  accompanied_by            text,
  child_views_captured      boolean not null default false,
  child_anxious             boolean not null default false,
  follow_up_date            date,
  follow_up_actions         jsonb not null default '[]'::jsonb,
  health_plan_updated       boolean not null default false,
  social_worker_informed    boolean not null default false,
  parent_carer_informed     boolean not null default false,
  notes                     text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

alter table cs_health_appointments enable row level security;

DO $$ BEGIN
  create policy "health_appointments_home_access" on cs_health_appointments
    for all using (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

create index if not exists idx_health_appointments_home on cs_health_appointments(home_id);
create index if not exists idx_health_appointments_date on cs_health_appointments(appointment_date desc);
