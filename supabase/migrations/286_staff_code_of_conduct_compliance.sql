-- Staff Code of Conduct Compliance
create table if not exists public.cs_staff_code_of_conduct_compliance (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  staff_name text not null,
  staff_id uuid,
  review_date date not null,
  compliance_area text not null default 'professional_conduct',
  compliance_status text not null default 'fully_compliant',
  review_type text not null default 'annual_acknowledgement',
  action_outcome text not null default 'no_action_needed',
  code_acknowledged boolean not null default false,
  training_completed boolean not null default false,
  supervision_discussed boolean not null default false,
  self_assessment_done boolean not null default false,
  breach_reported boolean not null default false,
  investigation_completed boolean not null default false,
  improvement_plan_agreed boolean not null default false,
  improvement_demonstrated boolean not null default false,
  reviewer_name text,
  breach_details text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cs_staff_code_of_conduct_compliance enable row level security;

do $$ begin
  create policy "Tenant isolation" on public.cs_staff_code_of_conduct_compliance
    using (home_id = public.get_my_home_id());
exception when duplicate_object then null;
end $$;
