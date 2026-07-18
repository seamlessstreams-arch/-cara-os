-- ══════════════════════════════════════════════════════════════════════════════
-- 128 · VISITOR MANAGEMENT
-- Tracks visitor registration, DBS verification, purpose of visits,
-- safeguarding checks, and visitor impact on children.
-- CHR 2015 Reg 22, Reg 12, Reg 36.
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists cs_visitor_management (
  id            uuid primary key default gen_random_uuid(),
  home_id       uuid not null references homes(id) on delete cascade,

  visitor_name                  text    not null,
  visitor_type                  text    not null default 'other',
  visit_purpose                 text    not null default 'other',
  visit_date                    date    not null default now(),
  arrival_time                  text    not null,
  departure_time                text,
  child_visited                 text,
  dbs_status                    text    not null default 'not_checked',
  id_verified                   boolean not null default false,
  supervision_level             text    not null default 'supervised',
  safeguarding_check_completed  boolean not null default false,
  signed_in                     boolean not null default false,
  signed_out                    boolean not null default false,
  visit_approved_by             text    not null default '',
  child_informed                boolean not null default false,
  child_consent_given           boolean,
  notes                         text,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Index
create index if not exists idx_cs_visitor_mgmt_home
  on cs_visitor_management(home_id);

-- RLS
alter table cs_visitor_management enable row level security;

do $$ begin
  create policy "Tenant isolation" on cs_visitor_management
    using (home_id = get_my_home_id());
exception when duplicate_object then null;
end $$;
