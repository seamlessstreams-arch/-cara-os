-- Staff NVQ/QCF Qualification Tracking
create table if not exists public.cs_staff_nvq_qualification_tracking (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  staff_name text not null,
  staff_id uuid,
  review_date date not null,
  qualification_level text not null default 'level_3',
  qualification_status text not null default 'not_started',
  qualification_type text not null default 'diploma_residential_childcare',
  registration_status text not null default 'not_registered',
  start_date date not null,
  expected_completion_date date,
  actual_completion_date date,
  reg32_compliant boolean not null default false,
  within_two_year_deadline boolean not null default false,
  assessor_assigned boolean not null default false,
  portfolio_progressing boolean not null default false,
  employer_funded boolean not null default false,
  study_time_allocated boolean not null default false,
  mentor_assigned boolean not null default false,
  registration_current boolean not null default false,
  training_provider text,
  assessor_name text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cs_staff_nvq_qualification_tracking enable row level security;

do $$ begin
  create policy "Tenant isolation" on public.cs_staff_nvq_qualification_tracking
    using (home_id = public.get_my_home_id());
exception when duplicate_object then null;
end $$;
