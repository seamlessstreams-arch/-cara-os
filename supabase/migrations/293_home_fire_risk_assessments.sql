-- Home Fire Risk Assessments
create table if not exists public.cs_home_fire_risk_assessments (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  assessor_name text not null,
  assessor_id uuid,
  assessment_date date not null,
  risk_rating text not null default 'medium',
  assessment_area text not null default 'means_of_escape',
  compliance_status text not null default 'compliant',
  action_priority text not null default 'routine',
  escape_routes_clear boolean not null default false,
  fire_doors_functional boolean not null default false,
  detection_system_tested boolean not null default false,
  extinguishers_serviced boolean not null default false,
  evacuation_plan_current boolean not null default false,
  staff_fire_trained boolean not null default false,
  fire_drills_completed boolean not null default false,
  compartmentation_intact boolean not null default false,
  emergency_lighting_tested boolean not null default false,
  signage_adequate boolean not null default false,
  electrical_safety_tested boolean not null default false,
  peep_in_place boolean not null default false,
  next_review_date date,
  action_details text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cs_home_fire_risk_assessments enable row level security;

do $$ begin
  create policy "Tenant isolation" on public.cs_home_fire_risk_assessments
    using (home_id = public.get_my_home_id());
exception when duplicate_object then null;
end $$;
