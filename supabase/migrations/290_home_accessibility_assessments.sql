-- Home Accessibility Assessments
create table if not exists public.cs_home_accessibility_assessments (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  assessor_name text not null,
  assessor_id uuid,
  assessment_date date not null,
  accessibility_area text not null default 'communal_areas',
  compliance_level text not null default 'partially_accessible',
  adjustment_status text not null default 'not_required',
  need_type text not null default 'mobility',
  wheelchair_accessible boolean not null default false,
  ramp_installed boolean not null default false,
  grab_rails_fitted boolean not null default false,
  visual_aids_provided boolean not null default false,
  hearing_loop_available boolean not null default false,
  signage_accessible boolean not null default false,
  lighting_adequate boolean not null default false,
  emergency_egress_accessible boolean not null default false,
  cost_estimate numeric,
  child_consulted text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cs_home_accessibility_assessments enable row level security;

do $$ begin
  create policy "Tenant isolation" on public.cs_home_accessibility_assessments
    using (home_id = public.get_my_home_id());
exception when duplicate_object then null;
end $$;
