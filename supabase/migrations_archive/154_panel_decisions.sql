-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — PANEL DECISIONS
-- CHR 2015 Reg 13, Reg 14, Reg 36
-- SCCIF: Leadership
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists cs_panel_decisions (
  id                          uuid primary key default gen_random_uuid(),
  home_id                     uuid not null references homes(id) on delete cascade,
  panel_type                  text not null default 'admission_panel',
  panel_date                  date not null default now(),
  panel_decision              text not null default 'not_applicable',
  panel_quorum                text not null default 'not_applicable',
  follow_up_status            text not null default 'not_required',
  child_name                  text,
  child_id                    uuid,
  panel_chair                 text not null default '',
  panel_members               jsonb not null default '[]'::jsonb,
  child_views_considered      boolean not null default false,
  risk_assessment_reviewed    boolean not null default false,
  matching_criteria_assessed  boolean not null default false,
  impact_on_group_assessed    boolean not null default false,
  safeguarding_discussed      boolean not null default false,
  minutes_recorded            boolean not null default true,
  actions_agreed              jsonb not null default '[]'::jsonb,
  conditions                  jsonb not null default '[]'::jsonb,
  follow_up_date              date,
  issues_found                jsonb not null default '[]'::jsonb,
  actions_taken               jsonb not null default '[]'::jsonb,
  notes                       text,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

alter table cs_panel_decisions enable row level security;

DO $$ BEGIN
  create policy "panel_decisions_home_access" on cs_panel_decisions
    for all using (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

create index if not exists idx_panel_decisions_home on cs_panel_decisions(home_id);
create index if not exists idx_panel_decisions_date on cs_panel_decisions(panel_date desc);
