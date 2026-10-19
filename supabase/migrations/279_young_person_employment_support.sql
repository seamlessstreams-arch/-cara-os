-- Young Person Employment Support
create table if not exists public.cs_young_person_employment_support (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id),
  child_name text not null,
  child_id uuid,
  support_date date not null,
  support_type text not null default 'career_guidance',
  employment_status text not null default 'not_in_employment',
  readiness_level text not null default 'not_ready',
  progress_status text not null default 'not_started',
  cv_completed boolean not null default false,
  interview_practice_done boolean not null default false,
  work_experience_arranged boolean not null default false,
  employer_engaged boolean not null default false,
  child_motivated boolean not null default false,
  financial_literacy_covered boolean not null default false,
  travel_training_completed boolean not null default false,
  workplace_rights_covered boolean not null default false,
  support_worker text,
  employer_name text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cs_young_person_employment_support enable row level security;

do $$ begin
  create policy "Tenant isolation" on public.cs_young_person_employment_support
    using (home_id = public.get_my_home_id());
exception when duplicate_object then null;
end $$;
