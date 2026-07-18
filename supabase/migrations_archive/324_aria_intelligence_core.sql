create extension if not exists "uuid-ossp";

-- =========================================================
-- ENUMS
-- =========================================================

do $$ begin
  create type aria_role_mode as enum (
    'practitioner',
    'senior',
    'deputy_manager',
    'registered_manager',
    'responsible_individual',
    'operations',
    'director',
    'commissioner',
    'ofsted_mock'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type aria_output_status as enum (
    'draft',
    'requires_review',
    'approved',
    'rejected',
    'superseded',
    'archived'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type aria_risk_level as enum ('low', 'medium', 'high', 'critical');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type aria_signal_type as enum (
    'risk_drift',
    'missing_evidence',
    'quality_gap',
    'child_voice_gap',
    'management_oversight_gap',
    'placement_stability',
    'staff_development',
    'safeguarding_theme',
    'therapeutic_opportunity',
    'regulatory_gap',
    'business_risk'
  );
exception when duplicate_object then null;
end $$;

-- =========================================================
-- AI GOVERNANCE
-- =========================================================

create table if not exists public.aria_ai_runs (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  child_id uuid,
  requested_by uuid not null,
  role_mode aria_role_mode not null default 'practitioner',
  feature_key text not null,
  prompt_hash text not null,
  model text not null,
  input_summary text,
  output_summary text,
  output_json jsonb not null default '{}'::jsonb,
  status aria_output_status not null default 'draft',
  confidence numeric(5,2) not null default 0,
  requires_human_approval boolean not null default true,
  human_approved_by uuid,
  human_approved_at timestamptz,
  rejection_reason text,
  safety_flags jsonb not null default '[]'::jsonb,
  evidence_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_aria_ai_runs_home on public.aria_ai_runs(home_id);
create index if not exists idx_aria_ai_runs_child on public.aria_ai_runs(child_id);
create index if not exists idx_aria_ai_runs_status on public.aria_ai_runs(status);

create table if not exists public.aria_evidence_links (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  ai_run_id uuid not null references public.aria_ai_runs(id) on delete cascade,
  source_table text not null,
  source_id uuid not null,
  source_date timestamptz,
  source_title text,
  source_excerpt text not null,
  source_author_id uuid,
  relevance_score numeric(5,2) not null default 0,
  evidence_type text not null default 'record',
  regulation_refs text[] not null default '{}',
  quality_standard_refs text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_aria_evidence_ai_run on public.aria_evidence_links(ai_run_id);
create index if not exists idx_aria_evidence_source on public.aria_evidence_links(source_table, source_id);

create table if not exists public.aria_approval_events (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  ai_run_id uuid not null references public.aria_ai_runs(id) on delete cascade,
  actor_id uuid not null,
  action text not null check (action in ('created','edited','approved','rejected','committed','superseded','exported')),
  notes text,
  before_json jsonb,
  after_json jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_aria_approval_events_run on public.aria_approval_events(ai_run_id);

-- =========================================================
-- GOLDEN THREAD ENGINE
-- =========================================================

create table if not exists public.golden_thread_events (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  child_id uuid,
  event_type text not null,
  title text not null,
  summary text not null,
  event_date timestamptz not null default now(),
  source_table text not null,
  source_id uuid not null,
  linked_risk_ids uuid[] not null default '{}',
  linked_plan_ids uuid[] not null default '{}',
  linked_task_ids uuid[] not null default '{}',
  linked_regulation_refs text[] not null default '{}',
  linked_quality_standard_refs text[] not null default '{}',
  child_voice_present boolean not null default false,
  management_oversight_present boolean not null default false,
  requires_review boolean not null default false,
  review_reason text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_golden_thread_child on public.golden_thread_events(child_id, event_date desc);
create index if not exists idx_golden_thread_home on public.golden_thread_events(home_id, event_date desc);
create index if not exists idx_golden_thread_review on public.golden_thread_events(requires_review);

-- =========================================================
-- AI SUGGESTED UPDATES
-- =========================================================

create table if not exists public.aria_suggested_updates (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  ai_run_id uuid references public.aria_ai_runs(id) on delete set null,
  child_id uuid,
  target_table text not null,
  target_id uuid,
  update_type text not null check (update_type in ('create','update','review','archive','task','notification')),
  title text not null,
  rationale text not null,
  suggested_payload jsonb not null default '{}'::jsonb,
  evidence_link_ids uuid[] not null default '{}',
  risk_level aria_risk_level not null default 'low',
  status aria_output_status not null default 'requires_review',
  reviewed_by uuid,
  reviewed_at timestamptz,
  committed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_aria_suggested_updates_child on public.aria_suggested_updates(child_id, status);
create index if not exists idx_aria_suggested_updates_home on public.aria_suggested_updates(home_id, status);

-- =========================================================
-- OFSTED READINESS
-- =========================================================

create table if not exists public.ofsted_readiness_snapshots (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  generated_by uuid,
  generated_at timestamptz not null default now(),
  overall_score numeric(5,2) not null default 0,
  leadership_score numeric(5,2) not null default 0,
  care_score numeric(5,2) not null default 0,
  safeguarding_score numeric(5,2) not null default 0,
  workforce_score numeric(5,2) not null default 0,
  child_voice_score numeric(5,2) not null default 0,
  evidence_strength jsonb not null default '{}'::jsonb,
  missing_evidence jsonb not null default '[]'::jsonb,
  priority_actions jsonb not null default '[]'::jsonb,
  quality_standard_map jsonb not null default '{}'::jsonb,
  regulation_map jsonb not null default '{}'::jsonb,
  status text not null default 'draft'
);

create index if not exists idx_ofsted_readiness_home on public.ofsted_readiness_snapshots(home_id, generated_at desc);

-- =========================================================
-- RISK AND PRACTICE SIGNALS
-- =========================================================

create table if not exists public.aria_intelligence_signals (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  child_id uuid,
  staff_id uuid,
  signal_type aria_signal_type not null,
  risk_level aria_risk_level not null default 'low',
  title text not null,
  summary text not null,
  suggested_action text not null,
  evidence jsonb not null default '[]'::jsonb,
  status text not null default 'open' check (status in ('open','acknowledged','in_progress','closed','dismissed')),
  assigned_to uuid,
  due_at timestamptz,
  closed_by uuid,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_aria_signals_home on public.aria_intelligence_signals(home_id, status, risk_level);
create index if not exists idx_aria_signals_child on public.aria_intelligence_signals(child_id, status, risk_level);
create index if not exists idx_aria_signals_staff on public.aria_intelligence_signals(staff_id, status, risk_level);

-- =========================================================
-- CHILD VOICE PROTECTION
-- =========================================================

create table if not exists public.child_voice_segments (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  child_id uuid not null,
  source_table text not null,
  source_id uuid not null,
  direct_quote text,
  paraphrased_wishes_feelings text,
  staff_observation text,
  staff_interpretation text,
  action_taken text,
  ai_detected boolean not null default false,
  verified_by uuid,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_child_voice_child on public.child_voice_segments(child_id, created_at desc);

-- =========================================================
-- MOCK INSPECTION SIMULATOR
-- =========================================================

create table if not exists public.mock_inspection_sessions (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  started_by uuid not null,
  inspection_focus text[] not null default '{}',
  status text not null default 'active' check (status in ('active','completed','archived')),
  overall_rating_estimate text,
  strengths jsonb not null default '[]'::jsonb,
  weaknesses jsonb not null default '[]'::jsonb,
  priority_actions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.mock_inspection_questions (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  session_id uuid not null references public.mock_inspection_sessions(id) on delete cascade,
  question text not null,
  expected_evidence text[] not null default '{}',
  user_answer text,
  aria_feedback text,
  score numeric(5,2),
  evidence_gaps jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  answered_at timestamptz
);

-- =========================================================
-- RLS (using Cornerstone's get_my_home_id() pattern)
-- =========================================================

alter table public.aria_ai_runs enable row level security;
alter table public.aria_evidence_links enable row level security;
alter table public.aria_approval_events enable row level security;
alter table public.golden_thread_events enable row level security;
alter table public.aria_suggested_updates enable row level security;
alter table public.ofsted_readiness_snapshots enable row level security;
alter table public.aria_intelligence_signals enable row level security;
alter table public.child_voice_segments enable row level security;
alter table public.mock_inspection_sessions enable row level security;
alter table public.mock_inspection_questions enable row level security;

-- All policies use the DO $$ BEGIN ... EXCEPTION pattern to handle pre-existing policies

do $$ begin
  create policy "Tenant isolation" on public.aria_ai_runs
    using (home_id = public.get_my_home_id());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Tenant isolation" on public.aria_evidence_links
    using (home_id = public.get_my_home_id());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Tenant isolation" on public.aria_approval_events
    using (home_id = public.get_my_home_id());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Tenant isolation" on public.golden_thread_events
    using (home_id = public.get_my_home_id());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Tenant isolation" on public.aria_suggested_updates
    using (home_id = public.get_my_home_id());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Tenant isolation" on public.ofsted_readiness_snapshots
    using (home_id = public.get_my_home_id());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Tenant isolation" on public.aria_intelligence_signals
    using (home_id = public.get_my_home_id());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Tenant isolation" on public.child_voice_segments
    using (home_id = public.get_my_home_id());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Tenant isolation" on public.mock_inspection_sessions
    using (home_id = public.get_my_home_id());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Tenant isolation" on public.mock_inspection_questions
    using (home_id = public.get_my_home_id());
exception when duplicate_object then null;
end $$;
