-- ══════════════════════════════════════════════════════════════════════════════
-- 411 — CARA STUDIO (learning-design engine)
--
-- Child learning profiles, curriculum maps, session plans, interactive
-- materials, conversation blueprints, incident-to-learning conversions, the
-- resource library, AI run logs and guardrail events.
--
-- Additive only. RLS on every table, home-scoped via get_my_home_id() — the
-- same tenancy helper the rest of the schema uses (see migration 409). Where
-- a row is child-specific, home scoping is derived through the child's home;
-- to keep policies self-contained each table carries home_id directly and the
-- application writes it from the child record (TODO when activating Supabase:
-- enforce with a trigger join against young_people if that table is present).
--
-- Approval rules: staff create drafts; only registered managers / deputies
-- approve, and never their own outputs (creator <> approver enforced here).
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists cara_child_learning_profiles (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null,
  child_id uuid not null,
  created_by uuid,
  updated_by uuid,
  age integer,
  developmental_age_notes text,
  communication_needs text,
  send_needs text,
  learning_style jsonb not null default '{}'::jsonb,
  attention_profile text,
  sensory_profile text,
  emotional_triggers text,
  calming_strategies text,
  trauma_considerations text,
  cultural_identity_notes text,
  literacy_level text,
  preferred_activities text,
  avoided_topics text,
  trusted_adults text,
  known_strengths text,
  current_goals text,
  risk_themes jsonb not null default '[]'::jsonb,
  placement_plan_links jsonb not null default '[]'::jsonb,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cara_curriculum_maps (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null,
  child_id uuid not null,
  title text not null,
  description text,
  curriculum_domains jsonb not null default '[]'::jsonb,
  priority_needs jsonb not null default '[]'::jsonb,
  weekly_focus jsonb not null default '[]'::jsonb,
  intended_outcomes jsonb not null default '[]'::jsonb,
  review_cycle text,
  status text not null default 'draft',
  created_by uuid,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cara_curriculum_no_self_approval check (approved_by is null or approved_by <> created_by)
);

create table if not exists cara_session_plans (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null,
  child_id uuid,
  curriculum_map_id uuid references cara_curriculum_maps(id),
  title text not null,
  session_type text,
  theme text,
  duration_minutes integer,
  emotional_intensity text,
  staff_confidence_level text,
  child_readiness_level text,
  aims jsonb not null default '[]'::jsonb,
  resources_needed jsonb not null default '[]'::jsonb,
  session_steps jsonb not null default '[]'::jsonb,
  staff_script text,
  child_friendly_summary text,
  adaptation_notes jsonb not null default '[]'::jsonb,
  regulation_plan text,
  opening_prompt text,
  closing_prompt text,
  follow_up_actions jsonb not null default '[]'::jsonb,
  review_questions jsonb not null default '[]'::jsonb,
  created_by uuid,
  status text not null default 'draft',
  manager_review_status text not null default 'not_reviewed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cara_interactive_materials (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null,
  child_id uuid,
  session_plan_id uuid references cara_session_plans(id),
  material_type text not null,
  title text,
  content jsonb not null default '{}'::jsonb,
  printable_text text,
  audio_script text,
  visual_prompt text,
  difficulty_level text,
  send_adaptations jsonb not null default '[]'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cara_conversation_blueprints (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null,
  child_id uuid,
  title text,
  conversation_goal text,
  risk_level text,
  emotional_tone text,
  opening_lines jsonb not null default '[]'::jsonb,
  curiosity_questions jsonb not null default '[]'::jsonb,
  validation_statements jsonb not null default '[]'::jsonb,
  reflective_prompts jsonb not null default '[]'::jsonb,
  safety_questions jsonb not null default '[]'::jsonb,
  repair_prompts jsonb not null default '[]'::jsonb,
  avoid_phrases jsonb not null default '[]'::jsonb,
  staff_regulation_reminders jsonb not null default '[]'::jsonb,
  closing_lines jsonb not null default '[]'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists cara_incident_learning_conversions (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null,
  child_id uuid,
  incident_id uuid,
  incident_summary text,
  learning_theme text,
  non_shaming_reframe text,
  child_friendly_explanation text,
  staff_conversation_plan text,
  session_plan_id uuid references cara_session_plans(id),
  materials_created jsonb not null default '[]'::jsonb,
  safeguarding_considerations text,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists cara_resource_library (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null,
  title text not null,
  resource_type text,
  domain text,
  age_range text,
  send_tags jsonb not null default '[]'::jsonb,
  trauma_tags jsonb not null default '[]'::jsonb,
  content text,
  structured_content jsonb not null default '{}'::jsonb,
  source text,
  source_type text not null default 'internal',
  approved boolean not null default false,
  approved_by uuid,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cara_library_no_self_approval check (approved_by is null or approved_by <> created_by)
);

create table if not exists cara_ai_runs (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null,
  user_id uuid,
  child_id uuid,
  module text not null,
  prompt_type text,
  input_context jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  safety_flags jsonb not null default '[]'::jsonb,
  model_used text,
  human_review_required boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists cara_guardrail_events (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null,
  user_id uuid,
  child_id uuid,
  module text not null,
  risk_type text not null,
  severity text not null,
  flagged_text text,
  action_taken text not null,
  created_at timestamptz not null default now()
);

-- ── RLS: authenticated only, home-scoped; child content never public ─────────
do $$
declare t text;
begin
  foreach t in array array[
    'cara_child_learning_profiles','cara_curriculum_maps','cara_session_plans',
    'cara_interactive_materials','cara_conversation_blueprints',
    'cara_incident_learning_conversions','cara_resource_library',
    'cara_ai_runs','cara_guardrail_events'
  ] loop
    execute format('alter table %I enable row level security', t);
    -- Read/write inside your own home only (get_my_home_id() = the platform's
    -- tenancy function; organisation-level scoping joins through homes when
    -- the organisation schema is activated — see migration 409 comments).
    execute format('drop policy if exists "Tenant isolation" on %I', t);
    execute format('create policy "Tenant isolation" on %I using (home_id = get_my_home_id()) with check (home_id = get_my_home_id())', t);
  end loop;
end $$;

comment on table cara_ai_runs is 'Every Cara Studio generation: who, which child, which module, flags, model, and whether human review is required. The audit trail behind "AI suggests, staff decide, manager reviews, system audits".';
comment on table cara_guardrail_events is 'Each guardrail flag raised on generated content, with severity and the action taken (rewritten / flagged_for_review / blocked_pending_review).';
comment on table cara_resource_library is 'Approved-first resource store for future RAG: Cara prefers approved internal resources; unmatched generations are marked as AI drafts requiring professional review.';
