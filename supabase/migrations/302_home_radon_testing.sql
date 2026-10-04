-- Home Radon Testing
create table if not exists public.cs_home_radon_testing (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  test_date date not null,
  tester_name text not null,
  test_location text not null,
  test_duration_days integer not null default 90,
  radon_level_bq_m3 numeric not null default 0,
  above_action_level boolean not null default false,
  above_target_level boolean not null default false,
  mitigation_required boolean not null default false,
  mitigation_type text,
  mitigation_installed boolean not null default false,
  post_mitigation_level numeric,
  retest_date date,
  compliance_status text not null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.cs_home_radon_testing enable row level security;

DO $$ BEGIN
  create policy "Tenant isolation" on public.cs_home_radon_testing
    using (home_id = public.get_my_home_id());
EXCEPTION WHEN duplicate_object THEN null;
END $$;
