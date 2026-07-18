-- Staff Professional Boundary Reviews
create table if not exists public.cs_staff_professional_boundary_reviews (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  staff_name text not null,
  staff_id uuid,
  review_date date not null,
  boundary_area text not null default 'emotional_boundaries',
  review_outcome text not null default 'appropriate',
  review_status text not null default 'scheduled',
  risk_level text not null default 'none',
  training_completed boolean not null default false,
  supervision_discussed boolean not null default false,
  policy_acknowledged boolean not null default false,
  self_assessment_completed boolean not null default false,
  child_impact_assessed boolean not null default false,
  management_aware boolean not null default false,
  action_plan_created boolean not null default false,
  action_plan_completed boolean not null default false,
  reviewer_name text,
  investigation_notes text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cs_staff_professional_boundary_reviews enable row level security;

do $$ begin
  create policy "Tenant isolation" on public.cs_staff_professional_boundary_reviews
    using (home_id = public.get_my_home_id());
exception when duplicate_object then null;
end $$;
