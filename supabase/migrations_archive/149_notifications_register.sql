-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — NOTIFICATIONS REGISTER
-- CHR 2015 Reg 40, Reg 41, Reg 44, Reg 45
-- SCCIF: Leadership
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists cs_notifications_register (
  id                        uuid primary key default gen_random_uuid(),
  home_id                   uuid not null references homes(id) on delete cascade,
  notification_type         text not null default 'significant_event',
  event_date                date not null default now(),
  notification_date         date not null default now(),
  notified_bodies           jsonb not null default '[]'::jsonb,
  notification_status       text not null default 'draft',
  timeliness_met            text not null default 'not_assessed',
  child_name                text,
  child_id                  uuid,
  staff_name                text,
  ofsted_reference          text,
  description               text not null default '',
  outcome                   text,
  follow_up_required        boolean not null default false,
  follow_up_date            date,
  follow_up_completed       boolean not null default false,
  evidence_attached         boolean not null default false,
  reg40_applicable          boolean not null default false,
  reg41_applicable          boolean not null default false,
  submitted_by              text not null default '',
  approved_by               text,
  issues_found              jsonb not null default '[]'::jsonb,
  actions_taken             jsonb not null default '[]'::jsonb,
  notes                     text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

alter table cs_notifications_register enable row level security;

DO $$ BEGIN
  create policy "notifications_register_home_access" on cs_notifications_register
    for all using (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

create index if not exists idx_notifications_register_home on cs_notifications_register(home_id);
create index if not exists idx_notifications_register_date on cs_notifications_register(notification_date desc);
