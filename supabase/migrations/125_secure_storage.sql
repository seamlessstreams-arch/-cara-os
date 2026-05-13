-- ════════════════════════════════════════════════════════════════════════
-- 125 — Secure Storage & Records Access
-- CHR 2015 Reg 39, Reg 40; GDPR / UK DPA 2018
-- ════════════════════════════════════════════════════════════════════════

create table if not exists cs_secure_storage (
  id                        uuid default gen_random_uuid() primary key,
  home_id                   uuid not null references homes(id) on delete cascade,
  event_type                text not null default 'storage_audit',
  event_date                date not null default now(),
  storage_location          text not null default 'locked_cabinet',
  compliance_rating         text not null default 'fully_compliant',
  access_decision           text not null default 'not_applicable',
  requested_by              text,
  authorised_by             text not null default '',
  records_affected          integer not null default 0,
  gdpr_compliant            boolean not null default true,
  encryption_verified       boolean not null default false,
  retention_schedule_followed boolean not null default true,
  issues_found              text[] not null default '{}',
  actions_taken             text[] not null default '{}',
  next_review_date          date,
  notes                     text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

alter table cs_secure_storage enable row level security;

DO $$ BEGIN
  create policy "secure_storage_home"
    on cs_secure_storage
    for all
    using  (home_id = get_my_home_id())
    with check (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

create index if not exists idx_secure_storage_home
  on cs_secure_storage(home_id);
