-- ══════════════════════════════════════════════════════════════════════════════
-- 418 — PACE INTELLIGENCE (Cara Intelligence · trauma-informed practice)
--
-- Durable home for the PACE practice engine: analysis results, recommendations,
-- staff reflections, supervision insights, training progress, and child-specific
-- PACE profiles ("what works for this child"). Cara advises/drafts/recognises;
-- humans decide — these tables store recognition + suggestions + an audit trail,
-- never automated decisions. Additive only; home-scoped RLS (413 pattern).
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists pace_analysis_results (
  id text primary key,
  home_id uuid not null,
  child_id text,
  staff_id text,
  record_id text,
  context text not null,
  score integer not null default 0,
  band text,
  flags jsonb not null default '[]',
  elements jsonb not null default '[]',
  recommendations jsonb not null default '[]',
  manager_review_required boolean not null default false,
  professional_judgement_required boolean not null default false,
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pace_recommendations (
  id text primary key,
  home_id uuid not null,
  analysis_id text,
  child_id text,
  staff_id text,
  priority text not null default 'soon',
  area text not null,
  recommendation text not null,
  rationale text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pace_staff_reflections (
  id text primary key,
  home_id uuid not null,
  staff_id text not null,
  record_id text,
  context text,
  reflection jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pace_supervision_insights (
  id text primary key,
  home_id uuid not null,
  staff_id text not null,
  records_reviewed integer not null default 0,
  average_score integer not null default 0,
  strengths jsonb not null default '[]',
  patterns jsonb not null default '[]',
  supervision_questions jsonb not null default '[]',
  learning_goals jsonb not null default '[]',
  reflective_exercises jsonb not null default '[]',
  manager_review_recommended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pace_training_progress (
  id text primary key,
  home_id uuid not null,
  staff_id text not null,
  module_id text not null,
  status text not null default 'not_started',
  reflection_note text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists child_pace_profiles (
  child_id text primary key,
  home_id uuid not null,
  known_triggers jsonb not null default '[]',
  calming_approaches jsonb not null default '[]',
  trusted_adults jsonb not null default '[]',
  phrases_that_help jsonb not null default '[]',
  phrases_that_escalate jsonb not null default '[]',
  sensory_needs jsonb not null default '[]',
  repair_approaches jsonb not null default '[]',
  preferred_debrief_style text,
  trauma_informed_strategies jsonb not null default '[]',
  risk_linked_escalation_rules jsonb not null default '[]',
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pace_analysis_child_idx on pace_analysis_results (child_id);
create index if not exists pace_analysis_staff_idx on pace_analysis_results (staff_id);
create index if not exists pace_analysis_context_idx on pace_analysis_results (context);
create index if not exists pace_recommendations_status_idx on pace_recommendations (status);
create index if not exists pace_supervision_staff_idx on pace_supervision_insights (staff_id);
create index if not exists pace_training_staff_idx on pace_training_progress (staff_id);

-- Home-scoped RLS (additive; mirrors the 413 tenant-isolation pattern).
do $$
declare t text;
begin
  foreach t in array array[
    'pace_analysis_results','pace_recommendations','pace_staff_reflections',
    'pace_supervision_insights','pace_training_progress','child_pace_profiles'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "Tenant isolation" on %I', t);
    execute format(
      'create policy "Tenant isolation" on %I for all using (home_id = get_my_home_id()) with check (home_id = get_my_home_id())',
      t
    );
  end loop;
end $$;
