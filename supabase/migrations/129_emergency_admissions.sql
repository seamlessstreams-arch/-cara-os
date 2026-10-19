-- ══════════════════════════════════════════════════════════════════════════════
-- 129 · EMERGENCY ADMISSIONS
-- Tracks emergency placements, matching assessments, impact evaluations,
-- and admission compliance for unplanned admissions.
-- CHR 2015 Reg 35, Reg 14, Reg 12.
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists cs_emergency_admissions (
  id            uuid primary key default gen_random_uuid(),
  home_id       uuid not null references homes(id) on delete cascade,

  child_name                    text    not null,
  child_id                      text    not null,
  admission_date                date    not null default now(),
  admission_type                text    not null default 'emergency',
  referral_source               text    not null default 'local_authority',
  matching_outcome              text    not null default 'not_assessed',
  impact_on_existing_children   text    not null default 'not_assessed',
  risk_assessment_completed     boolean not null default false,
  placement_plan_within_24h     boolean not null default false,
  social_worker_contacted       boolean not null default false,
  ofsted_notified               boolean not null default false,
  existing_children_consulted   boolean not null default false,
  staff_briefed                 boolean not null default false,
  child_needs_identified        boolean not null default false,
  child_views_captured          boolean not null default false,
  disruption_to_placement       boolean not null default false,
  admission_approved_by         text    not null default '',
  review_date                   date,
  notes                         text,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Index
create index if not exists idx_cs_emergency_admissions_home
  on cs_emergency_admissions(home_id);

-- RLS
alter table cs_emergency_admissions enable row level security;

do $$ begin
  create policy "Tenant isolation" on cs_emergency_admissions
    using (home_id = get_my_home_id());
exception when duplicate_object then null;
end $$;
