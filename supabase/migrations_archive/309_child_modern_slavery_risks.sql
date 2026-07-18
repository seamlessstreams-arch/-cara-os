-- Child Modern Slavery Risk
create table if not exists public.cs_child_modern_slavery_risks (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  child_name text not null,
  assessment_date date not null,
  risk_level text not null,
  exploitation_type text not null,
  nrm_referral_made boolean not null default false,
  nrm_decision text,
  police_notified boolean not null default false,
  social_worker_notified boolean not null default true,
  multi_agency_referral boolean not null default false,
  safety_plan_in_place boolean not null default false,
  specialist_service_involved boolean not null default false,
  independent_advocate_appointed boolean not null default false,
  missing_episodes_linked integer not null default 0,
  review_date date,
  assessor_name text not null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.cs_child_modern_slavery_risks enable row level security;

DO $$ BEGIN
  create policy "Tenant isolation" on public.cs_child_modern_slavery_risks
    using (home_id = public.get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null;
END $$;
