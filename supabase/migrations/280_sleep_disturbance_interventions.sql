-- Sleep Disturbance Interventions
create table if not exists public.cs_sleep_disturbance_interventions (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  child_name text not null,
  child_id uuid,
  incident_date date not null,
  disturbance_type text not null default 'insomnia',
  intervention_type text not null default 'reassurance',
  severity_level text not null default 'mild',
  outcome_status text not null default 'resolved_same_night',
  child_settled_within_hour boolean not null default false,
  sleep_plan_in_place boolean not null default false,
  clinical_referral_made boolean not null default false,
  trauma_link_identified boolean not null default false,
  parent_carer_informed boolean not null default false,
  pattern_identified boolean not null default false,
  environment_adapted boolean not null default false,
  staff_debriefed boolean not null default false,
  staff_on_duty text,
  duration_minutes integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cs_sleep_disturbance_interventions enable row level security;

do $$ begin
  create policy "Tenant isolation" on public.cs_sleep_disturbance_interventions
    using (home_id = public.get_my_home_id());
exception when duplicate_object then null;
end $$;
