-- ══════════════════════════════════════════════════════════════════════════════
-- 134 · ALLEGATION MANAGEMENT
-- Tracks allegations against staff/volunteers, LADO referrals,
-- investigation progress, outcomes, and safeguarding actions.
-- CHR 2015 Reg 12, Reg 33; Working Together 2023.
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists cs_allegation_management (
  id            uuid primary key default gen_random_uuid(),
  home_id       uuid not null references homes(id) on delete cascade,

  allegation_date               date    not null default now(),
  allegation_type               text    not null default 'other',
  allegation_source             text    not null default 'other',
  investigation_stage           text    not null default 'received',
  allegation_outcome            text    not null default 'pending',
  subject_name                  text    not null,
  subject_role                  text    not null default '',
  child_involved                text,
  lado_referral_made            boolean not null default false,
  lado_referral_date            date,
  lado_response_within_1_day    boolean,
  police_informed               boolean not null default false,
  ofsted_notified               boolean not null default false,
  dbs_referral_made             boolean not null default false,
  subject_suspended             boolean not null default false,
  risk_assessment_completed     boolean not null default false,
  child_safe_and_supported      boolean not null default false,
  support_for_subject           boolean not null default false,
  investigation_officer         text    not null default '',
  days_to_resolution            integer,
  learning_identified           boolean not null default false,
  learning_details              text,
  notes                         text,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Index
create index if not exists idx_cs_allegation_mgmt_home
  on cs_allegation_management(home_id);

-- RLS
alter table cs_allegation_management enable row level security;

do $$ begin
  create policy "Tenant isolation" on cs_allegation_management
    using (home_id = get_my_home_id());
exception when duplicate_object then null;
end $$;
