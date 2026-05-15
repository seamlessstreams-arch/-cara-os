-- Child Gangs Affiliation Risk
create table if not exists public.cs_child_gangs_affiliation_risks (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  child_name text not null,
  assessment_date date not null,
  risk_level text not null,
  gang_involvement_indicators integer not null default 0,
  county_lines_risk boolean not null default false,
  nrm_referral_made boolean not null default false,
  police_notified boolean not null default false,
  social_worker_notified boolean not null default true,
  disruption_strategy text,
  multi_agency_meeting_held boolean not null default false,
  safety_plan_in_place boolean not null default false,
  exploitation_screening_completed boolean not null default false,
  missing_episodes_linked integer not null default 0,
  review_date date,
  assessor_name text not null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.cs_child_gangs_affiliation_risks enable row level security;

DO $$ BEGIN
  create policy "Tenant isolation" on public.cs_child_gangs_affiliation_risks
    using (home_id = public.get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null;
END $$;
