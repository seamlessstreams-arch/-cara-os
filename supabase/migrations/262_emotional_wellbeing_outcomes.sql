-- Emotional Wellbeing Outcome Tracking
create table if not exists public.cs_emotional_wellbeing_outcomes (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  child_name text not null,
  child_id uuid,
  assessment_date date not null,
  outcome_measure text not null,
  raw_score numeric not null default 0,
  clinical_band text not null default 'normal',
  trend_direction text not null default 'insufficient_data',
  assessment_context text not null default 'routine_review',
  previous_score numeric,
  clinician_name text,
  child_self_reported boolean not null default false,
  discussed_with_child boolean not null default false,
  informed_care_plan boolean not null default false,
  referral_made boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cs_emotional_wellbeing_outcomes enable row level security;

do $$ begin
  create policy "Tenant isolation" on public.cs_emotional_wellbeing_outcomes
    using (home_id = public.get_my_home_id());
exception when duplicate_object then null;
end $$;
