-- ═══════════════════════════════════════════════════════════════════════════════
-- ARIA STUDIO — Governed AI Content Creation
--
-- Tables for profile snapshots, generations, commit tracking, and audit trail.
-- All tables have RLS enabled and org-scoped policies.
-- ═══════════════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ── Profiles ─────────────────────────────────────────────────────────────────

create table if not exists public.aria_studio_profiles (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  home_id uuid not null,
  child_id uuid not null,
  profile_version integer not null default 1,
  profile_json jsonb not null,
  evidence_refs jsonb not null default '[]'::jsonb,
  risk_flags text[] not null default '{}',
  strengths text[] not null default '{}',
  needs text[] not null default '{}',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days'
);

create index if not exists aria_studio_profiles_child_idx
on public.aria_studio_profiles(child_id, created_at desc);

-- ── Generations ──────────────────────────────────────────────────────────────

create table if not exists public.aria_studio_generations (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  home_id uuid not null,
  child_id uuid,
  profile_id uuid references public.aria_studio_profiles(id) on delete set null,
  generation_type text not null check (
    generation_type in (
      'KEYWORK_SESSION',
      'DIRECT_WORK_SESSION',
      'LIFE_STORY_SESSION',
      'MISSING_RETURN_HOME_SUPPORT',
      'STAFF_BRIEFING',
      'FLASHCARDS',
      'YOUNG_PERSON_EXPLAINER',
      'BEHAVIOUR_SUPPORT_IDEAS',
      'PLACEMENT_PLAN_DRAFT',
      'RISK_ASSESSMENT_DRAFT',
      'CARE_PLAN_DRAFT',
      'STAFF_MICRO_TRAINING',
      'TEAM_MEETING_PACK',
      'REG44_EVIDENCE_PREP',
      'REG45_EVIDENCE_PREP',
      'EDUCATION_SUPPORT_SESSION',
      'INDEPENDENCE_SESSION',
      'FAMILY_TIME_PREPARATION',
      'EMOTIONAL_REGULATION_SESSION',
      'RELATIONSHIP_REPAIR_SESSION',
      'MANAGER_OVERSIGHT_PROMPTS'
    )
  ),
  title text not null,
  brief text not null,
  tone text not null default 'warm_professional',
  audience text not null default 'staff',
  status text not null default 'DRAFT' check (
    status in ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'COMMITTED', 'ARCHIVED')
  ),
  output_json jsonb not null,
  safety_json jsonb not null default '{}'::jsonb,
  evidence_refs jsonb not null default '[]'::jsonb,
  model text,
  created_by uuid not null references auth.users(id),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  committed_by uuid references auth.users(id),
  committed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists aria_studio_generations_child_idx
on public.aria_studio_generations(child_id, created_at desc);

create index if not exists aria_studio_generations_status_idx
on public.aria_studio_generations(status, created_at desc);

-- ── Commit Links ─────────────────────────────────────────────────────────────

create table if not exists public.aria_studio_commit_links (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid not null references public.aria_studio_generations(id) on delete cascade,
  organisation_id uuid not null,
  home_id uuid not null,
  child_id uuid,
  committed_to_type text not null,
  committed_to_id uuid,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

-- ── Audit Events ─────────────────────────────────────────────────────────────

create table if not exists public.aria_studio_audit_events (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null,
  home_id uuid,
  child_id uuid,
  generation_id uuid references public.aria_studio_generations(id) on delete set null,
  event_type text not null,
  event_json jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- ── Row Level Security ───────────────────────────────────────────────────────

alter table public.aria_studio_profiles enable row level security;
alter table public.aria_studio_generations enable row level security;
alter table public.aria_studio_commit_links enable row level security;
alter table public.aria_studio_audit_events enable row level security;

-- Helper function (idempotent create-or-replace)
create or replace function public.current_user_organisation_id()
returns uuid
language sql
stable
security definer
as $$
  select organisation_id
  from public.user_profiles
  where user_id = auth.uid()
  limit 1;
$$;

-- Profiles
create policy "aria studio profiles org read"
on public.aria_studio_profiles for select to authenticated
using (organisation_id = public.current_user_organisation_id());

create policy "aria studio profiles org insert"
on public.aria_studio_profiles for insert to authenticated
with check (organisation_id = public.current_user_organisation_id());

-- Generations
create policy "aria studio generations org read"
on public.aria_studio_generations for select to authenticated
using (organisation_id = public.current_user_organisation_id());

create policy "aria studio generations org insert"
on public.aria_studio_generations for insert to authenticated
with check (organisation_id = public.current_user_organisation_id());

create policy "aria studio generations org update"
on public.aria_studio_generations for update to authenticated
using (organisation_id = public.current_user_organisation_id())
with check (organisation_id = public.current_user_organisation_id());

-- Commit Links
create policy "aria studio commit links org read"
on public.aria_studio_commit_links for select to authenticated
using (organisation_id = public.current_user_organisation_id());

create policy "aria studio commit links org insert"
on public.aria_studio_commit_links for insert to authenticated
with check (organisation_id = public.current_user_organisation_id());

-- Audit Events
create policy "aria studio audit org read"
on public.aria_studio_audit_events for select to authenticated
using (organisation_id = public.current_user_organisation_id());

create policy "aria studio audit org insert"
on public.aria_studio_audit_events for insert to authenticated
with check (organisation_id = public.current_user_organisation_id());
