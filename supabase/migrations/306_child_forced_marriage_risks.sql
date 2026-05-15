-- Child Forced Marriage Risk
create table if not exists public.cs_child_forced_marriage_risks (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  child_name text not null,
  assessment_date date not null,
  risk_level text not null,
  risk_indicators_count integer not null default 0,
  fmpo_in_place boolean not null default false,
  police_notified boolean not null default false,
  social_worker_notified boolean not null default true,
  forced_marriage_unit_contacted boolean not null default false,
  multi_agency_referral boolean not null default false,
  safety_plan_in_place boolean not null default false,
  passport_secured boolean not null default false,
  travel_restrictions boolean not null default false,
  specialist_service_involved boolean not null default false,
  review_date date,
  assessor_name text not null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.cs_child_forced_marriage_risks enable row level security;

DO $$ BEGIN
  create policy "Tenant isolation" on public.cs_child_forced_marriage_risks
    using (home_id = public.get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null;
END $$;
