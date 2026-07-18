-- Looked After Child Health Assessments
create table if not exists public.cs_lac_health_assessments (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  child_name text not null,
  child_id uuid,
  assessment_date date not null,
  assessment_type text not null,
  health_outcome text not null default 'actions_outstanding',
  compliance_status text not null default 'not_due',
  health_domain text not null,
  clinician_name text,
  clinic_location text,
  health_action_plan_created boolean not null default false,
  actions_completed boolean not null default false,
  child_attended boolean not null default false,
  child_views_captured boolean not null default false,
  carer_attended boolean not null default false,
  shared_with_social_worker boolean not null default false,
  next_assessment_due date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cs_lac_health_assessments enable row level security;

do $$ begin
  create policy "Tenant isolation" on public.cs_lac_health_assessments
    using (home_id = public.get_my_home_id());
exception when duplicate_object then null;
end $$;
