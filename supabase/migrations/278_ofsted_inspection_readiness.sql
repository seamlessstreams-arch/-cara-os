-- Ofsted Inspection Readiness
create table if not exists public.cs_ofsted_inspection_readiness (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  assessor_name text not null,
  assessor_id uuid,
  assessment_date date not null,
  readiness_area text not null default 'overall_experiences_progress',
  readiness_rating text not null default 'not_assessed',
  evidence_status text not null default 'evidence_missing',
  inspection_type text not null default 'full_inspection',
  evidence_documented boolean not null default false,
  staff_prepared boolean not null default false,
  children_consulted boolean not null default false,
  environment_ready boolean not null default false,
  policies_up_to_date boolean not null default false,
  records_accessible boolean not null default false,
  improvement_actions_identified boolean not null default false,
  improvement_actions_completed boolean not null default false,
  manager_self_evaluation_done boolean not null default false,
  regulatory_requirements_met boolean not null default false,
  previous_recommendations_addressed boolean not null default false,
  mock_inspection_completed boolean not null default false,
  key_findings text,
  improvement_plan_notes text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cs_ofsted_inspection_readiness enable row level security;

do $$ begin
  create policy "Tenant isolation" on public.cs_ofsted_inspection_readiness
    using (home_id = public.get_my_home_id());
exception when duplicate_object then null;
end $$;
