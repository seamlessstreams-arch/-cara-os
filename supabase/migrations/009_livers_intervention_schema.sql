-- ══════════════════════════════════════════════════════════════════════════════
-- MIGRATION 009 — L.I.V.E.R.S. INTERVENTION INTELLIGENCE SYSTEM
-- Lived Experience, Immediate Risk, Viability, Environment, Relational,
-- Sustainability framework for ARIA-powered intervention planning.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── L.I.V.E.R.S. Analyses ────────────────────────────────────────────────────

create table if not exists livers_analyses (
  id                              text primary key,
  home_id                         text not null,
  child_id                        text not null,
  linked_record_id                text,
  linked_record_type              text, -- incident|missing|keywork|daily_log|assessment|situation_review
  -- L — Lived Experience
  lived_experience_summary        text,
  -- I — Immediate and Cumulative Risk
  immediate_cumulative_risk       text,
  risk_pattern                    text,
  -- V — Viability of Change
  viability_of_change             text,
  viability_rating                text check (viability_rating in ('low','moderate','high')),
  -- E — Environment and System Forces
  environment_system_forces       text,
  -- R — Relational and Psychological Drivers
  relational_psychological_drivers text,
  -- S — Sustainability and Independence of Safety
  sustainability_independence_safety text,
  sustainability_rating           text check (sustainability_rating in ('low','moderate','high')),
  -- Aria output
  aria_summary                    text,
  aria_confidence                 text check (aria_confidence in ('high','possible','needs_human_review','insufficient_information')),
  recommended_intervention_type   text,
  escalation_required             boolean default false,
  escalation_actions              jsonb default '[]', -- array of escalation action strings
  management_oversight            text,
  quality_check_passed            boolean default false,
  quality_check_notes             text,
  -- Metadata
  status                          text not null default 'draft' check (status in ('draft','reviewed','approved','archived')),
  review_date                     date,
  created_by                      text not null,
  reviewed_by                     text,
  approved_by                     text,
  created_at                      timestamp with time zone default now(),
  updated_at                      timestamp with time zone default now(),
  reviewed_at                     timestamp with time zone,
  approved_at                     timestamp with time zone
);

create index if not exists livers_analyses_child_id_idx on livers_analyses(child_id);
create index if not exists livers_analyses_home_id_idx  on livers_analyses(home_id);

-- ── Intervention Sessions ─────────────────────────────────────────────────────

create table if not exists intervention_sessions (
  id                          text primary key,
  home_id                     text not null,
  child_id                    text not null,
  livers_analysis_id          text references livers_analyses(id),
  linked_keywork_session_id   text,
  title                       text not null,
  session_type                text not null, -- see SessionType enum
  reason_for_session          text,
  aim                         text,
  staff_preparation           text,
  emotional_safety_notes      text,
  pace_opening_script         text,
  session_steps               jsonb default '[]', -- array of step objects
  child_friendly_version      text,
  reflective_questions_child  jsonb default '[]', -- string[]
  reflective_questions_staff  jsonb default '[]', -- string[]
  resources_generated         jsonb default '[]', -- string[]
  follow_up_actions           jsonb default '[]', -- string[]
  management_oversight_note   text,
  evidence_refs               jsonb default '[]', -- array of evidence link objects
  outcome                     text,
  outcome_summary             text,
  child_response              text,
  risk_change                 text check (risk_change in ('improved','same','worsened','unknown')),
  sustainability_change       text check (sustainability_change in ('improved','same','worsened','unknown')),
  further_action_required     boolean default false,
  -- Writing style versions (cached rewrites)
  style_professional          text,
  style_management_oversight  text,
  style_child_friendly        text,
  style_reflective_supervision text,
  style_social_worker_update  text,
  style_ofsted_ready          text,
  -- QA
  quality_check_passed        boolean default false,
  quality_check_notes         jsonb default '{}',
  -- Status and audit
  status                      text not null default 'draft' check (status in ('draft','in_progress','completed','reviewed','approved','archived')),
  review_date                 date,
  created_by                  text not null,
  completed_by                text,
  reviewed_by                 text,
  approved_by                 text,
  created_at                  timestamp with time zone default now(),
  updated_at                  timestamp with time zone default now(),
  completed_at                timestamp with time zone,
  reviewed_at                 timestamp with time zone,
  approved_at                 timestamp with time zone
);

create index if not exists intervention_sessions_child_id_idx      on intervention_sessions(child_id);
create index if not exists intervention_sessions_home_id_idx       on intervention_sessions(home_id);
create index if not exists intervention_sessions_livers_id_idx     on intervention_sessions(livers_analysis_id);

-- ── Intervention Outcomes ─────────────────────────────────────────────────────

create table if not exists intervention_outcomes (
  id                        text primary key,
  home_id                   text not null,
  intervention_session_id   text not null references intervention_sessions(id),
  child_id                  text not null,
  child_response            text,
  what_worked               text,
  what_did_not_work         text,
  emotional_presentation    text,
  risk_change               text check (risk_change in ('improved','same','worsened','unknown')),
  sustainability_change     text check (sustainability_change in ('improved','same','worsened','unknown')),
  further_action_required   boolean default false,
  further_action_notes      text,
  management_review         boolean default false,
  management_review_notes   text,
  follow_up_sessions_needed text,
  created_by                text not null,
  created_at                timestamp with time zone default now()
);

create index if not exists intervention_outcomes_session_id_idx on intervention_outcomes(intervention_session_id);
create index if not exists intervention_outcomes_child_id_idx   on intervention_outcomes(child_id);

-- ── RLS Policies ─────────────────────────────────────────────────────────────

alter table livers_analyses      enable row level security;
alter table intervention_sessions enable row level security;
alter table intervention_outcomes enable row level security;

-- Allow authenticated reads within same home
create policy "livers_analyses_read"
  on livers_analyses for select
  using (auth.role() = 'authenticated');

create policy "livers_analyses_write"
  on livers_analyses for insert
  with check (auth.role() = 'authenticated');

create policy "livers_analyses_update"
  on livers_analyses for update
  using (auth.role() = 'authenticated');

create policy "intervention_sessions_read"
  on intervention_sessions for select
  using (auth.role() = 'authenticated');

create policy "intervention_sessions_write"
  on intervention_sessions for insert
  with check (auth.role() = 'authenticated');

create policy "intervention_sessions_update"
  on intervention_sessions for update
  using (auth.role() = 'authenticated');

create policy "intervention_outcomes_read"
  on intervention_outcomes for select
  using (auth.role() = 'authenticated');

create policy "intervention_outcomes_write"
  on intervention_outcomes for insert
  with check (auth.role() = 'authenticated');
