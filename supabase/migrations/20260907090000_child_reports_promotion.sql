-- ═══════════════════════════════════════════════════════════════════════════
-- CHILD REPORTS PROMOTION — the Cara Reports engine's schema, made live.
--
-- Promoted from migrations_archive/021_aria_reports_intelligence.sql, but the
-- columns come from the CODE's own contracts (src/types/cara-reports.ts) —
-- the services drifted well past the archive (agent runs and audit events
-- especially; the archive's aria_agent_runs/aria_audit_events are the same
-- tables under their pre-rebrand names). filed_document_id is added for the
-- report-filing back-link. The archive's judgement defaults (risk_tier 'low')
-- are NOT carried: no column default answers a judgement — every field is
-- written explicitly by the services per their Insert types.
--
-- Conventions follow 20260722120000_persist_typed_tables.sql. APPLIED
-- MANUALLY (deliberate gap — schema reaches the live DB only via db push).
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists child_reports (
  id text primary key default gen_random_uuid()::text,
  organisation_id text,
  home_id uuid,
  child_id text,
  report_type text,
  audience text,
  title text,
  status text,
  version integer,
  parent_report_id text,
  date_range_start text,
  date_range_end text,
  overall_summary text,
  overall_confidence_score numeric,
  risk_tier text,
  child_voice_included boolean,
  evidence_gap_count integer,
  agent_run_id text,
  requested_by text,
  generated_at timestamptz,
  reviewed_by text,
  reviewed_at timestamptz,
  review_notes text,
  approved_by text,
  approved_at timestamptz,
  rejection_reason text,
  locked_by text,
  locked_at timestamptz,
  filed_document_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table child_reports enable row level security;
create index if not exists idx_child_reports_home on child_reports(home_id);
drop policy if exists "Tenant isolation" on child_reports;
create policy "Tenant isolation" on child_reports
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());
create index if not exists idx_child_reports_child on child_reports(child_id);

create table if not exists child_report_sections (
  id text primary key default gen_random_uuid()::text,
  report_id text,
  section_key text,
  title text,
  "order" integer,
  content text,
  structured_content jsonb,
  evidence_status text,
  confidence_score numeric,
  evidence_count integer,
  child_voice_present boolean,
  manager_note text,
  manager_edited boolean,
  last_edited_by text,
  last_edited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table child_report_sections enable row level security;
create index if not exists idx_child_report_sections_report on child_report_sections(report_id);

create table if not exists child_report_evidence (
  id text primary key default gen_random_uuid()::text,
  section_id text,
  report_id text,
  source_table text,
  source_record_id text,
  source_date text,
  excerpt text,
  reasoning text,
  relevance_score numeric,
  is_child_voice boolean,
  is_primary boolean,
  created_at timestamptz not null default now()
);

alter table child_report_evidence enable row level security;
create index if not exists idx_child_report_evidence_report on child_report_evidence(report_id);

create table if not exists child_report_actions (
  id text primary key default gen_random_uuid()::text,
  report_id text,
  section_key text,
  action_title text,
  action_description text,
  assigned_to text,
  assigned_role text,
  due_date text,
  priority text,
  status text,
  linked_task_id text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table child_report_actions enable row level security;
create index if not exists idx_child_report_actions_report on child_report_actions(report_id);

create table if not exists regulation45_evidence_items (
  id text primary key default gen_random_uuid()::text,
  organisation_id text,
  home_id uuid,
  child_id text,
  month text,
  year integer,
  category text,
  title text,
  description text,
  source_table text,
  source_record_id text,
  source_date text,
  quality_score numeric,
  is_child_voice boolean,
  is_safeguarding boolean,
  is_risk_related boolean,
  agent_run_id text,
  reviewed_by text,
  reviewed_at timestamptz,
  status text,
  created_at timestamptz not null default now()
);

alter table regulation45_evidence_items enable row level security;
create index if not exists idx_regulation45_evidence_items_home on regulation45_evidence_items(home_id);
drop policy if exists "Tenant isolation" on regulation45_evidence_items;
create policy "Tenant isolation" on regulation45_evidence_items
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());
create index if not exists idx_regulation45_evidence_items_child on regulation45_evidence_items(child_id);

create table if not exists cara_agent_runs (
  id text primary key default gen_random_uuid()::text,
  organisation_id text,
  home_id uuid,
  agent_id text,
  status text,
  triggered_by text,
  trigger_type text,
  input_params jsonb,
  output_summary text,
  output_data jsonb,
  error_message text,
  tokens_used integer,
  duration_ms integer,
  parent_run_id text,
  child_id text,
  report_id text,
  risk_tier text,
  requires_approval boolean,
  approved_by text,
  approved_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table cara_agent_runs enable row level security;
create index if not exists idx_cara_agent_runs_home on cara_agent_runs(home_id);
drop policy if exists "Tenant isolation" on cara_agent_runs;
create policy "Tenant isolation" on cara_agent_runs
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());
create index if not exists idx_cara_agent_runs_report on cara_agent_runs(report_id);
create index if not exists idx_cara_agent_runs_child on cara_agent_runs(child_id);

create table if not exists cara_audit_events (
  id text primary key default gen_random_uuid()::text,
  organisation_id text,
  home_id uuid,
  event_type text,
  agent_id text,
  agent_run_id text,
  report_id text,
  actor_id text,
  actor_role text,
  action text,
  target_type text,
  target_id text,
  details jsonb,
  risk_tier text,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table cara_audit_events enable row level security;
create index if not exists idx_cara_audit_events_home on cara_audit_events(home_id);
drop policy if exists "Tenant isolation" on cara_audit_events;
create policy "Tenant isolation" on cara_audit_events
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());
create index if not exists idx_cara_audit_events_report on cara_audit_events(report_id);
