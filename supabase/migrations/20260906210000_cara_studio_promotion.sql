-- ═══════════════════════════════════════════════════════════════════════════
-- CARA STUDIO PROMOTION — the archived artifact-studio schema, made live.
--
-- Promoted from migrations_archive/019_aria_studio_schema.sql (18 tables) and
-- 375_aria_studio.sql (profiles / generations / commit_links), renamed
-- aria_studio_* → cara_studio_* to match the tables the code has queried since
-- the rebrand. cara_studio_outputs is already live and untouched.
--
-- Conventions follow 20260722120000_persist_typed_tables.sql: id text
-- (default gen_random_uuid()::text), home_id uuid, every other column
-- nullable, no cross-table FKs. Judgement/observation defaults from the
-- archive (approval_status 'approved', is_sensitive false, risk_level
-- 'medium', quality-gate booleans false, dynamics counts 0, …) are STRIPPED:
-- a column default must not answer a judgement — the services write every one
-- of these explicitly, and absence stays absent. Two tables follow the CODE's
-- column contract where the archive drifted (generations: profile_json/error/
-- rejected_reason; commit_links: target_type/target_id/committed_by/at).
--
-- APPLIED MANUALLY (deliberate gap — schema reaches the live DB only via
-- `supabase db push` / `db query -f`, per the release model).
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists cara_studio_sources (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  child_id text,
  staff_id text,
  linked_record_id text,
  linked_record_type text,
  source_type text,
  title text,
  summary text,
  content text,
  extracted_text text,
  source_date timestamptz,
  category text,
  tags jsonb default '[]'::jsonb,
  confidentiality_level text,
  approval_status text,
  is_sensitive boolean,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

alter table cara_studio_sources enable row level security;
create index if not exists idx_cara_studio_sources_home on cara_studio_sources(home_id);
drop policy if exists "Tenant isolation" on cara_studio_sources;
create policy "Tenant isolation" on cara_studio_sources
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());
create index if not exists idx_cara_studio_sources_child on cara_studio_sources(child_id);

create table if not exists cara_studio_artifacts (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  artifact_type text,
  title text,
  status text default 'draft',
  child_id text,
  staff_id text,
  incident_id text,
  linked_record_id text,
  linked_record_type text,
  framework text,
  tone text default 'balanced',
  creative_mode text default 'balanced',
  generated_content text,
  structured_content jsonb,
  plain_text_content text,
  quality_score integer,
  evidence_confidence_score integer,
  safeguarding_level text,
  regulation_relevance jsonb default '[]'::jsonb,
  created_by text,
  reviewed_by text,
  approved_by text,
  committed_by text,
  rejected_by text,
  created_at timestamptz not null default now(),
  submitted_for_review_at timestamptz,
  reviewed_at timestamptz,
  approved_at timestamptz,
  committed_at timestamptz,
  rejected_at timestamptz,
  archived_at timestamptz,
  version_number integer default 1,
  filing_cabinet_path text,
  official_record_id text
);

alter table cara_studio_artifacts enable row level security;
create index if not exists idx_cara_studio_artifacts_home on cara_studio_artifacts(home_id);
drop policy if exists "Tenant isolation" on cara_studio_artifacts;
create policy "Tenant isolation" on cara_studio_artifacts
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());
create index if not exists idx_cara_studio_artifacts_child on cara_studio_artifacts(child_id);

create table if not exists cara_studio_artifact_sources (
  id text primary key default gen_random_uuid()::text,
  artifact_id text,
  source_id text,
  relevance_reason text,
  confidence_level text,
  confidence_score integer,
  source_strength text,
  is_primary_evidence boolean,
  is_child_voice boolean,
  is_contradicted boolean,
  created_at timestamptz not null default now()
);

alter table cara_studio_artifact_sources enable row level security;
create index if not exists idx_cara_studio_artifact_sources_artifact on cara_studio_artifact_sources(artifact_id);

create table if not exists cara_studio_artifact_versions (
  id text primary key default gen_random_uuid()::text,
  artifact_id text,
  version_number integer,
  title text,
  content text,
  structured_content jsonb,
  change_summary text,
  changed_by text,
  changed_at timestamptz default now(),
  previous_version_id text,
  created_at timestamptz not null default now()
);

alter table cara_studio_artifact_versions enable row level security;
create index if not exists idx_cara_studio_artifact_versions_artifact on cara_studio_artifact_versions(artifact_id);

create table if not exists cara_studio_artifact_reviews (
  id text primary key default gen_random_uuid()::text,
  artifact_id text,
  reviewer_id text,
  review_status text,
  review_comment text,
  requested_changes text,
  created_at timestamptz not null default now()
);

alter table cara_studio_artifact_reviews enable row level security;
create index if not exists idx_cara_studio_artifact_reviews_artifact on cara_studio_artifact_reviews(artifact_id);

create table if not exists cara_studio_artifact_actions (
  id text primary key default gen_random_uuid()::text,
  artifact_id text,
  task_id text,
  action_title text,
  action_description text,
  assigned_to text,
  due_date timestamptz,
  priority text,
  status text default 'open',
  escalation_level text,
  created_by text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  reviewed_at timestamptz
);

alter table cara_studio_artifact_actions enable row level security;
create index if not exists idx_cara_studio_artifact_actions_artifact on cara_studio_artifact_actions(artifact_id);

create table if not exists cara_studio_audit_log (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  actor_id text,
  action_type text,
  artifact_id text,
  source_ids jsonb default '[]'::jsonb,
  prompt_summary text,
  model_provider text,
  model_name text,
  request_metadata jsonb,
  response_metadata jsonb,
  before_state jsonb,
  after_state jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table cara_studio_audit_log enable row level security;
create index if not exists idx_cara_studio_audit_log_home on cara_studio_audit_log(home_id);
drop policy if exists "Tenant isolation" on cara_studio_audit_log;
create policy "Tenant isolation" on cara_studio_audit_log
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());
create index if not exists idx_cara_studio_audit_log_artifact on cara_studio_audit_log(artifact_id);

create table if not exists cara_studio_care_graph_nodes (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  node_type text,
  linked_record_id text,
  linked_record_type text,
  label text,
  summary text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table cara_studio_care_graph_nodes enable row level security;
create index if not exists idx_cara_studio_care_graph_nodes_home on cara_studio_care_graph_nodes(home_id);
drop policy if exists "Tenant isolation" on cara_studio_care_graph_nodes;
create policy "Tenant isolation" on cara_studio_care_graph_nodes
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());

create table if not exists cara_studio_care_graph_edges (
  id text primary key default gen_random_uuid()::text,
  from_node_id text,
  to_node_id text,
  relationship_type text,
  strength integer,
  evidence_source_id text,
  confidence_score integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table cara_studio_care_graph_edges enable row level security;

create table if not exists cara_studio_evidence_assessments (
  id text primary key default gen_random_uuid()::text,
  source_id text,
  relevance_score integer,
  recency_score integer,
  reliability_score integer,
  approval_score integer,
  corroboration_score integer,
  child_voice_score integer,
  contradiction_score integer,
  overall_confidence_score integer,
  evidence_level text,
  assessment_notes text,
  created_at timestamptz not null default now()
);

alter table cara_studio_evidence_assessments enable row level security;

create table if not exists cara_studio_gaps (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  child_id text,
  staff_id text,
  gap_type text,
  severity text,
  title text,
  description text,
  recommended_action text,
  linked_record_id text,
  linked_record_type text,
  status text default 'open',
  assigned_to text,
  due_date timestamptz,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table cara_studio_gaps enable row level security;
create index if not exists idx_cara_studio_gaps_home on cara_studio_gaps(home_id);
drop policy if exists "Tenant isolation" on cara_studio_gaps;
create policy "Tenant isolation" on cara_studio_gaps
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());
create index if not exists idx_cara_studio_gaps_child on cara_studio_gaps(child_id);

create table if not exists cara_studio_contradictions (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  child_id text,
  source_a_id text,
  source_b_id text,
  contradiction_type text,
  description text,
  severity text,
  recommended_review_action text,
  status text default 'open',
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table cara_studio_contradictions enable row level security;
create index if not exists idx_cara_studio_contradictions_home on cara_studio_contradictions(home_id);
drop policy if exists "Tenant isolation" on cara_studio_contradictions;
create policy "Tenant isolation" on cara_studio_contradictions
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());
create index if not exists idx_cara_studio_contradictions_child on cara_studio_contradictions(child_id);

create table if not exists cara_studio_safeguarding_patterns (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  child_id text,
  pattern_type text,
  risk_level text,
  title text,
  description text,
  indicators jsonb default '[]'::jsonb,
  evidence_source_ids jsonb default '[]'::jsonb,
  recommended_actions jsonb default '[]'::jsonb,
  status text default 'open',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  resolved_at timestamptz
);

alter table cara_studio_safeguarding_patterns enable row level security;
create index if not exists idx_cara_studio_safeguarding_patterns_home on cara_studio_safeguarding_patterns(home_id);
drop policy if exists "Tenant isolation" on cara_studio_safeguarding_patterns;
create policy "Tenant isolation" on cara_studio_safeguarding_patterns
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());
create index if not exists idx_cara_studio_safeguarding_patterns_child on cara_studio_safeguarding_patterns(child_id);

create table if not exists cara_studio_home_dynamics (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  snapshot_date date,
  summary text,
  emotional_climate text,
  incident_count integer,
  missing_episode_count integer,
  restraint_count integer,
  complaint_count integer,
  staff_absence_count integer,
  agency_staff_count integer,
  education_concerns_count integer,
  safeguarding_alerts_count integer,
  overdue_actions_count integer,
  risk_level text,
  recommended_manager_focus text,
  data jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table cara_studio_home_dynamics enable row level security;
create index if not exists idx_cara_studio_home_dynamics_home on cara_studio_home_dynamics(home_id);
drop policy if exists "Tenant isolation" on cara_studio_home_dynamics;
create policy "Tenant isolation" on cara_studio_home_dynamics
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());

create table if not exists cara_studio_early_warnings (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  child_id text,
  staff_id text,
  warning_type text,
  risk_level text,
  title text,
  description text,
  indicators jsonb default '[]'::jsonb,
  confidence_score integer,
  recommended_action text,
  status text default 'open',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  resolved_at timestamptz
);

alter table cara_studio_early_warnings enable row level security;
create index if not exists idx_cara_studio_early_warnings_home on cara_studio_early_warnings(home_id);
drop policy if exists "Tenant isolation" on cara_studio_early_warnings;
create policy "Tenant isolation" on cara_studio_early_warnings
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());
create index if not exists idx_cara_studio_early_warnings_child on cara_studio_early_warnings(child_id);

create table if not exists cara_studio_formulations (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  child_id text,
  title text,
  presenting_behaviour text,
  possible_unmet_need text,
  trauma_link text,
  attachment_considerations text,
  triggers jsonb default '[]'::jsonb,
  protective_factors jsonb default '[]'::jsonb,
  relational_strengths jsonb default '[]'::jsonb,
  staff_response_patterns jsonb default '[]'::jsonb,
  what_helps text,
  what_escalates text,
  therapeutic_hypothesis text,
  recommended_intervention text,
  review_date date,
  evidence_source_ids jsonb default '[]'::jsonb,
  created_by text,
  approved_by text,
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

alter table cara_studio_formulations enable row level security;
create index if not exists idx_cara_studio_formulations_home on cara_studio_formulations(home_id);
drop policy if exists "Tenant isolation" on cara_studio_formulations;
create policy "Tenant isolation" on cara_studio_formulations
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());
create index if not exists idx_cara_studio_formulations_child on cara_studio_formulations(child_id);

create table if not exists cara_studio_decision_support (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  decision_context text,
  child_id text,
  staff_id text,
  known_facts jsonb default '[]'::jsonb,
  unknowns jsonb default '[]'::jsonb,
  risks jsonb default '[]'::jsonb,
  options jsonb default '[]'::jsonb,
  pros_cons jsonb default '[]'::jsonb,
  child_impact text,
  staff_impact text,
  compliance_impact text,
  recommended_next_steps jsonb default '[]'::jsonb,
  evidence_needed jsonb default '[]'::jsonb,
  decision_made_by text,
  decision_recorded_at timestamptz,
  created_at timestamptz not null default now()
);

alter table cara_studio_decision_support enable row level security;
create index if not exists idx_cara_studio_decision_support_home on cara_studio_decision_support(home_id);
drop policy if exists "Tenant isolation" on cara_studio_decision_support;
create policy "Tenant isolation" on cara_studio_decision_support
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());
create index if not exists idx_cara_studio_decision_support_child on cara_studio_decision_support(child_id);

create table if not exists cara_studio_quality_checks (
  id text primary key default gen_random_uuid()::text,
  artifact_id text,
  evidence_cited boolean,
  child_voice_considered boolean,
  risk_considered boolean,
  safeguarding_considered boolean,
  regulation_considered boolean,
  actions_clear boolean,
  owner_assigned boolean,
  review_date_set boolean,
  human_approval_complete boolean,
  sensitive_language_reviewed boolean,
  no_unsupported_claims boolean,
  no_ai_style_filler boolean,
  dignity_language_passed boolean,
  overall_passed boolean,
  issues jsonb default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table cara_studio_quality_checks enable row level security;
create index if not exists idx_cara_studio_quality_checks_artifact on cara_studio_quality_checks(artifact_id);

create table if not exists cara_studio_profiles (
  id text primary key default gen_random_uuid()::text,
  organisation_id text,
  home_id uuid,
  child_id text,
  profile_version integer default 1,
  profile_json jsonb,
  evidence_refs jsonb default '[]'::jsonb,
  risk_flags text[] default '{}',
  strengths text[] default '{}',
  needs text[] default '{}',
  created_by text,
  created_at timestamptz not null default now(),
  expires_at timestamptz default now()
);

alter table cara_studio_profiles enable row level security;
create index if not exists idx_cara_studio_profiles_home on cara_studio_profiles(home_id);
drop policy if exists "Tenant isolation" on cara_studio_profiles;
create policy "Tenant isolation" on cara_studio_profiles
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());
create index if not exists idx_cara_studio_profiles_child on cara_studio_profiles(child_id);

create table if not exists cara_studio_generations (
  id text primary key default gen_random_uuid()::text,
  organisation_id text,
  home_id uuid,
  child_id text,
  generation_type text,
  title text,
  brief text,
  tone text default 'warm_professional',
  audience text default 'staff',
  status text default 'DRAFT',
  output_json jsonb,
  safety_json jsonb default '{}'::jsonb,
  model text,
  created_by text,
  approved_by text,
  approved_at timestamptz,
  committed_by text,
  committed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  profile_json jsonb,
  error text,
  rejected_reason text
);

alter table cara_studio_generations enable row level security;
create index if not exists idx_cara_studio_generations_home on cara_studio_generations(home_id);
drop policy if exists "Tenant isolation" on cara_studio_generations;
create policy "Tenant isolation" on cara_studio_generations
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());
create index if not exists idx_cara_studio_generations_child on cara_studio_generations(child_id);

create table if not exists cara_studio_commit_links (
  id text primary key default gen_random_uuid()::text,
  organisation_id text,
  home_id uuid,
  generation_id text,
  target_type text,
  target_id text,
  committed_by text,
  committed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table cara_studio_commit_links enable row level security;
create index if not exists idx_cara_studio_commit_links_home on cara_studio_commit_links(home_id);
drop policy if exists "Tenant isolation" on cara_studio_commit_links;
create policy "Tenant isolation" on cara_studio_commit_links
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());
