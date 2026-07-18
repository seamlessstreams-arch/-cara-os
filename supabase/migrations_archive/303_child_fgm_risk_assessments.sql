-- Child FGM Risk Assessment
create table if not exists public.cs_child_fgm_risk_assessments (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  child_name text not null,
  assessment_date date not null,
  risk_level text not null,
  risk_indicators_count integer not null default 0,
  mandatory_report_made boolean not null default false,
  police_notified boolean not null default false,
  social_worker_notified boolean not null default true,
  fgm_protection_order boolean not null default false,
  multi_agency_referral boolean not null default false,
  safety_plan_in_place boolean not null default false,
  cultural_sensitivity_considered boolean not null default true,
  specialist_service_involved boolean not null default false,
  specialist_service_name text,
  review_date date,
  assessor_name text not null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.cs_child_fgm_risk_assessments enable row level security;

DO $$ BEGIN
  create policy "Tenant isolation" on public.cs_child_fgm_risk_assessments
    using (home_id = public.get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null;
END $$;
