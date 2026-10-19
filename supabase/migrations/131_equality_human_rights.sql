-- ══════════════════════════════════════════════════════════════════════════════
-- 131 · EQUALITY & HUMAN RIGHTS
-- Tracks equality impact assessments, human rights compliance,
-- protected characteristics monitoring, and discrimination prevention.
-- CHR 2015 Reg 11, Reg 4; Equality Act 2010; Human Rights Act 1998.
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists cs_equality_human_rights (
  id            uuid primary key default gen_random_uuid(),
  home_id       uuid not null references homes(id) on delete cascade,

  assessment_type               text    not null default 'other',
  assessment_date               date    not null default now(),
  protected_characteristic      text    not null default 'none_identified',
  compliance_level              text    not null default 'not_assessed',
  action_status                 text    not null default 'planned',
  assessed_by                   text    not null default '',
  child_involved                text,
  staff_involved                text,
  description                   text    not null default '',
  findings                      text,
  actions_required              text[]  not null default '{}',
  actions_completed             text[]  not null default '{}',
  reasonable_adjustment_made    boolean not null default false,
  human_rights_article          text,
  discrimination_type           text,
  impact_on_child               boolean not null default false,
  review_date                   date,
  notes                         text,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Index
create index if not exists idx_cs_equality_hr_home
  on cs_equality_human_rights(home_id);

-- RLS
alter table cs_equality_human_rights enable row level security;

do $$ begin
  create policy "Tenant isolation" on cs_equality_human_rights
    using (home_id = get_my_home_id());
exception when duplicate_object then null;
end $$;
