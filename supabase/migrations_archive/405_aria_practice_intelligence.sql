-- ══════════════════════════════════════════════════════════════════════════════
-- ARIA Practice Intelligence — data model (8 entities)
--
-- Mirrors src/lib/aria-practice/types.ts. The app runs on the in-memory store
-- today; these tables make the data model durable once Supabase is activated
-- (the DAL dual-mode layer routes reads/writes here when configured).
--
-- Tenant isolation via home_id = public.get_my_home_id() (the platform RLS
-- convention). Rows with a null home_id are hidden by RLS (safe default, no
-- cross-tenant leak). Guidance rules are non-sensitive deterministic config and
-- are globally readable.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. Practice assessments ───────────────────────────────────────────────────
create table if not exists public.cs_aria_practice_assessments (
  id uuid primary key default gen_random_uuid(),
  tenant_id text,
  child_id text,
  staff_id text,
  home_id uuid references public.homes(id),
  source_type text not null,
  source_id text,
  assessment_type text not null default 'practice_quality',
  status text not null default 'open',
  created_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  developmental_gap_score integer,
  child_lived_experience_score integer,
  protective_factor_score integer,
  relationship_depth_score integer,
  safeguarding_threshold_score integer,
  supervision_quality_score integer,
  workforce_wellbeing_score integer,
  overall_practice_quality_score integer,
  summary text,
  aria_advice jsonb not null default '[]'::jsonb,
  aria_flags jsonb not null default '[]'::jsonb,
  aria_recommendations jsonb not null default '[]'::jsonb,
  aria_questions jsonb not null default '[]'::jsonb,
  aria_draft_output jsonb,
  reviewer_id text,
  reviewed_at timestamptz,
  manager_decision text,
  manager_rationale text
);
create index if not exists idx_aria_assessments_home on public.cs_aria_practice_assessments(home_id);
create index if not exists idx_aria_assessments_child on public.cs_aria_practice_assessments(child_id);

-- ── 2. Developmental gaps ─────────────────────────────────────────────────────
create table if not exists public.cs_aria_developmental_gaps (
  id uuid primary key default gen_random_uuid(),
  tenant_id text,
  child_id text not null,
  home_id uuid references public.homes(id),
  source_type text,
  source_id text,
  domain text not null,
  expected_childhood_condition text,
  current_lived_reality text,
  gap_description text,
  severity text,
  evidence text,
  impact_on_child text,
  required_change text,
  linked_plan_id text,
  status text not null default 'open',
  created_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_aria_gaps_child on public.cs_aria_developmental_gaps(child_id);

-- ── 3. Protective factor reviews ──────────────────────────────────────────────
create table if not exists public.cs_aria_protective_factor_reviews (
  id uuid primary key default gen_random_uuid(),
  tenant_id text,
  child_id text not null,
  home_id uuid references public.homes(id),
  source_type text,
  source_id text,
  factor_description text,
  is_real boolean not null default false,
  is_reliable boolean not null default false,
  is_accessible boolean not null default false,
  is_effective boolean not null default false,
  is_lasting boolean not null default false,
  proximity_score integer,
  strength_score integer,
  durability_score integer,
  relational_quality_score integer,
  what_it_protects_from text,
  evidence_it_reduces_harm text,
  what_happens_if_removed text,
  aria_challenge text,
  risk_of_overstatement text,
  created_by text,
  created_at timestamptz default now()
);
create index if not exists idx_aria_protective_child on public.cs_aria_protective_factor_reviews(child_id);

-- ── 4. Relationship depth reviews ─────────────────────────────────────────────
create table if not exists public.cs_aria_relationship_depth_reviews (
  id uuid primary key default gen_random_uuid(),
  tenant_id text,
  child_id text not null,
  staff_id text,
  home_id uuid references public.homes(id),
  relationship_subject_type text,
  current_stage integer,
  stage_label text,
  evidence text,
  main_risk text,
  next_relational_step text,
  child_voice text,
  reviewed_by text,
  created_at timestamptz default now()
);
create index if not exists idx_aria_relationship_child on public.cs_aria_relationship_depth_reviews(child_id);

-- ── 5. Threshold consultations ────────────────────────────────────────────────
create table if not exists public.cs_aria_threshold_consultations (
  id uuid primary key default gen_random_uuid(),
  tenant_id text,
  child_id text not null,
  home_id uuid references public.homes(id),
  concern_type text,
  source_type text,
  source_id text,
  child_lived_experience text,
  evidence_and_harm_analysis text,
  family_functioning_parental_capacity text,
  threshold_and_escalation_analysis text,
  decision_rationale text,
  recommended_next_step text,
  reasonable_cause_to_suspect_significant_harm boolean,
  strategy_discussion_recommended boolean not null default false,
  lado_consultation_recommended boolean not null default false,
  emergency_action_recommended boolean not null default false,
  aria_summary text,
  manager_decision text,
  manager_rationale text,
  created_by text,
  created_at timestamptz default now()
);
create index if not exists idx_aria_threshold_child on public.cs_aria_threshold_consultations(child_id);

-- ── 6. Staff wellbeing signals ────────────────────────────────────────────────
create table if not exists public.cs_aria_staff_wellbeing_signals (
  id uuid primary key default gen_random_uuid(),
  tenant_id text,
  staff_id text not null,
  home_id uuid references public.homes(id),
  signal_type text,
  signal_source text,
  severity text,
  evidence text,
  support_recommendation text,
  manager_action text,
  resolved boolean not null default false,
  created_at timestamptz default now()
);
create index if not exists idx_aria_wellbeing_staff on public.cs_aria_staff_wellbeing_signals(staff_id);

-- ── 7. Practice flags ─────────────────────────────────────────────────────────
create table if not exists public.cs_aria_practice_flags (
  id uuid primary key default gen_random_uuid(),
  tenant_id text,
  child_id text,
  staff_id text,
  home_id uuid references public.homes(id),
  source_type text,
  source_id text,
  flag_type text not null,
  severity text,
  title text,
  description text,
  evidence text,
  recommended_action text,
  requires_manager_review boolean not null default false,
  requires_ri_review boolean not null default false,
  resolved boolean not null default false,
  created_at timestamptz default now(),
  resolved_at timestamptz,
  resolved_by text,
  resolution_rationale text
);
create index if not exists idx_aria_flags_home on public.cs_aria_practice_flags(home_id);
create index if not exists idx_aria_flags_child on public.cs_aria_practice_flags(child_id);
create index if not exists idx_aria_flags_resolved on public.cs_aria_practice_flags(resolved);

-- ── 8. Guidance rules (global config) ─────────────────────────────────────────
create table if not exists public.cs_aria_guidance_rules (
  id uuid primary key default gen_random_uuid(),
  rule_key text unique not null,
  title text,
  domain text,
  trigger_conditions jsonb not null default '{}'::jsonb,
  advice text,
  challenge_questions jsonb not null default '[]'::jsonb,
  recommended_actions jsonb not null default '[]'::jsonb,
  severity text,
  active boolean not null default true,
  created_at timestamptz default now()
);

-- ── Row Level Security ────────────────────────────────────────────────────────
-- Home-scoped tables: tenant isolation by home_id (null-home rows hidden — safe default).
alter table public.cs_aria_practice_assessments      enable row level security;
alter table public.cs_aria_developmental_gaps        enable row level security;
alter table public.cs_aria_protective_factor_reviews enable row level security;
alter table public.cs_aria_relationship_depth_reviews enable row level security;
alter table public.cs_aria_threshold_consultations   enable row level security;
alter table public.cs_aria_staff_wellbeing_signals   enable row level security;
alter table public.cs_aria_practice_flags            enable row level security;
alter table public.cs_aria_guidance_rules            enable row level security;

DO $$ BEGIN
  create policy "Tenant isolation" on public.cs_aria_practice_assessments using (home_id = public.get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  create policy "Tenant isolation" on public.cs_aria_developmental_gaps using (home_id = public.get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  create policy "Tenant isolation" on public.cs_aria_protective_factor_reviews using (home_id = public.get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  create policy "Tenant isolation" on public.cs_aria_relationship_depth_reviews using (home_id = public.get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  create policy "Tenant isolation" on public.cs_aria_threshold_consultations using (home_id = public.get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  create policy "Tenant isolation" on public.cs_aria_staff_wellbeing_signals using (home_id = public.get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  create policy "Tenant isolation" on public.cs_aria_practice_flags using (home_id = public.get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Guidance rules are non-sensitive deterministic config — globally readable.
DO $$ BEGIN
  create policy "Global read" on public.cs_aria_guidance_rules for select using (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
