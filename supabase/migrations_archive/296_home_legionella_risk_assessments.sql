-- Home Legionella Risk Assessment
create table if not exists public.cs_home_legionella_risk_assessments (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  assessment_date date not null,
  assessor_name text not null,
  water_system_type text not null,
  risk_level text not null,
  temperature_compliant boolean not null default true,
  hot_water_temp_celsius numeric,
  cold_water_temp_celsius numeric,
  flushing_regime_compliant boolean not null default true,
  water_treatment_in_place boolean not null default false,
  legionella_test_completed boolean not null default false,
  legionella_test_result text,
  remedial_action_required boolean not null default false,
  remedial_action_details text,
  next_assessment_date date,
  compliance_status text not null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.cs_home_legionella_risk_assessments enable row level security;

DO $$ BEGIN
  create policy "Tenant isolation" on public.cs_home_legionella_risk_assessments
    using (home_id = public.get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null;
END $$;
