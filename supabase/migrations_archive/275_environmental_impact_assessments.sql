-- Environmental Impact Assessments
create table if not exists public.cs_environmental_impact_assessments (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  assessment_date date not null,
  assessment_area text not null,
  performance_rating text not null default 'satisfactory',
  improvement_status text not null default 'not_started',
  measurement_period text not null default 'quarterly',
  assessor_name text not null,
  baseline_value numeric,
  current_value numeric,
  target_value numeric,
  children_involved boolean not null default false,
  staff_trained boolean not null default false,
  cost_saving_identified boolean not null default false,
  action_plan_created boolean not null default false,
  progress_monitored boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cs_environmental_impact_assessments enable row level security;

do $$ begin
  create policy "Tenant isolation" on public.cs_environmental_impact_assessments
    using (home_id = public.get_my_home_id());
exception when duplicate_object then null;
end $$;
