-- ═══════════════════════════════════════════════════════════════════════════
-- PRACTICE INTELLIGENCE PROMOTION — the OS spine's persistence, made live.
--
-- Promoted from migrations_archive/020_practice_intelligence_schema.sql; the
-- seven services (scanner, therapeutic profiles, workflow triggers, session
-- builder, learning studio, regulation mapping, oversight drafts) match 020
-- exactly — zero code-vs-DDL drift. Conventions per persist_typed_tables
-- (id text, home_id uuid, all else nullable, no FKs/CHECKs). Mechanical
-- defaults kept (jsonb containers, lifecycle statuses, counters); the one
-- doctrine strip is scan_date's CURRENT_DATE — a UTC server day is the
-- London-dates class at the schema layer, so absence stays absent.
--
-- APPLIED MANUALLY after merge (fourth pending live migration).
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists therapeutic_profiles (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  child_id text,
  status text default 'draft',
  version integer default 1,
  pre_placement_history text,
  known_trauma_themes jsonb default '[]'::jsonb,
  attachment_presentation text,
  emotional_regulation_needs jsonb default '[]'::jsonb,
  known_triggers jsonb default '[]'::jsonb,
  known_soothing_strategies jsonb default '[]'::jsonb,
  relational_strengths jsonb default '[]'::jsonb,
  staff_relationships jsonb default '[]'::jsonb,
  family_contact_themes jsonb default '[]'::jsonb,
  education_themes jsonb default '[]'::jsonb,
  identity_culture_belonging jsonb default '[]'::jsonb,
  communication_style text,
  neurodiversity_considerations jsonb default '[]'::jsonb,
  risk_themes jsonb default '[]'::jsonb,
  protective_factors jsonb default '[]'::jsonb,
  current_presentation text,
  progress_over_time jsonb default '[]'::jsonb,
  child_voice_entries jsonb default '[]'::jsonb,
  what_staff_need_to_remember jsonb default '[]'::jsonb,
  what_helps jsonb default '[]'::jsonb,
  what_does_not_help jsonb default '[]'::jsonb,
  current_therapeutic_priorities jsonb default '[]'::jsonb,
  approved_by text,
  approved_at timestamptz,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table therapeutic_profiles enable row level security;
create index if not exists idx_therapeutic_profiles_home on therapeutic_profiles(home_id);
drop policy if exists "Tenant isolation" on therapeutic_profiles;
create policy "Tenant isolation" on therapeutic_profiles
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());
create index if not exists idx_therapeutic_profiles_child on therapeutic_profiles(child_id);

create table if not exists practice_workflow_triggers (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  trigger_event text,
  source_table text,
  source_id text,
  child_id text,
  suggestions jsonb default '[]'::jsonb,
  status text default 'pending',
  actioned_by text,
  actioned_at timestamptz,
  created_at timestamptz not null default now()
);

alter table practice_workflow_triggers enable row level security;
create index if not exists idx_practice_workflow_triggers_home on practice_workflow_triggers(home_id);
drop policy if exists "Tenant isolation" on practice_workflow_triggers;
create policy "Tenant isolation" on practice_workflow_triggers
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());
create index if not exists idx_practice_workflow_triggers_child on practice_workflow_triggers(child_id);

create table if not exists practice_intelligence_scans (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  scan_type text,
  scan_date date,
  status text default 'completed',
  home_dynamics_summary jsonb default '{}'::jsonb,
  child_summaries jsonb default '[]'::jsonb,
  risk_patterns jsonb default '[]'::jsonb,
  practice_drift_alerts jsonb default '[]'::jsonb,
  training_need_alerts jsonb default '[]'::jsonb,
  oversight_prompts jsonb default '[]'::jsonb,
  suggested_plan_updates jsonb default '[]'::jsonb,
  suggested_keywork jsonb default '[]'::jsonb,
  suggested_reflective jsonb default '[]'::jsonb,
  relationship_mapping jsonb default '{}'::jsonb,
  rota_impact_analysis jsonb default '{}'::jsonb,
  staff_consistency jsonb default '{}'::jsonb,
  repeated_triggers jsonb default '[]'::jsonb,
  therapeutic_patterns jsonb default '[]'::jsonb,
  created_by text,
  created_at timestamptz not null default now()
);

alter table practice_intelligence_scans enable row level security;
create index if not exists idx_practice_intelligence_scans_home on practice_intelligence_scans(home_id);
drop policy if exists "Tenant isolation" on practice_intelligence_scans;
create policy "Tenant isolation" on practice_intelligence_scans
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());

create table if not exists generated_sessions (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  child_id text,
  session_type text,
  title text,
  framework text,
  tone text,
  status text default 'draft',
  content jsonb default '{}'::jsonb,
  evidence_links jsonb default '[]'::jsonb,
  quality_score integer,
  scheduled_date date,
  delivered_at timestamptz,
  delivered_by text,
  recording_notes text,
  follow_up_actions jsonb default '[]'::jsonb,
  plan_update_suggestions jsonb default '[]'::jsonb,
  approved_by text,
  approved_at timestamptz,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table generated_sessions enable row level security;
create index if not exists idx_generated_sessions_home on generated_sessions(home_id);
drop policy if exists "Tenant isolation" on generated_sessions;
create policy "Tenant isolation" on generated_sessions
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());
create index if not exists idx_generated_sessions_child on generated_sessions(child_id);

create table if not exists learning_resources (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  resource_type text,
  title text,
  description text,
  target_audience text default 'staff',
  format text default 'document',
  content jsonb default '{}'::jsonb,
  preferences jsonb default '{}'::jsonb,
  tags jsonb default '[]'::jsonb,
  framework text,
  reading_level text,
  communication_needs jsonb default '[]'::jsonb,
  neurodiversity_adaptations jsonb default '[]'::jsonb,
  status text default 'draft',
  use_count integer default 0,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table learning_resources enable row level security;
create index if not exists idx_learning_resources_home on learning_resources(home_id);
drop policy if exists "Tenant isolation" on learning_resources;
create policy "Tenant isolation" on learning_resources
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());

create table if not exists framework_mappings (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  artifact_id text,
  artifact_type text,
  framework text,
  regulation text,
  quality_standard text,
  sccif_theme text,
  evidence_text text,
  created_at timestamptz not null default now()
);

alter table framework_mappings enable row level security;
create index if not exists idx_framework_mappings_home on framework_mappings(home_id);
drop policy if exists "Tenant isolation" on framework_mappings;
create policy "Tenant isolation" on framework_mappings
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());

create table if not exists management_oversight_drafts (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  oversight_type text,
  record_id text,
  record_type text,
  child_id text,
  status text default 'draft',
  content jsonb default '{}'::jsonb,
  evidence_links jsonb default '[]'::jsonb,
  regulatory_refs jsonb default '[]'::jsonb,
  quality_score integer,
  approved_by text,
  approved_at timestamptz,
  committed_at timestamptz,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table management_oversight_drafts enable row level security;
create index if not exists idx_management_oversight_drafts_home on management_oversight_drafts(home_id);
drop policy if exists "Tenant isolation" on management_oversight_drafts;
create policy "Tenant isolation" on management_oversight_drafts
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());
create index if not exists idx_management_oversight_drafts_child on management_oversight_drafts(child_id);
