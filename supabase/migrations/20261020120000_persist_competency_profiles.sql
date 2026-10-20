-- CARA workforce intelligence — staff competency profiles (pathway stage + domain
-- readiness scoring). Own table, distinct from the generic-HR
-- cs_staff_competency_assessments. Persists /api/v1/workforce/competency-profiles for live.
create table if not exists competency_profiles (
  id                      text primary key default gen_random_uuid()::text,
  home_id                 uuid,
  staff_id                text not null,
  current_stage           text not null,
  target_stage            text,
  overall_readiness_score integer not null default 0,
  domain_scores           jsonb not null default '[]',
  strengths               jsonb not null default '[]',
  development_areas       jsonb not null default '[]',
  cara_narrative          text,
  last_assessed_at        text,
  next_review_date        text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

alter table competency_profiles enable row level security;
drop policy if exists "Tenant isolation" on competency_profiles;
create policy "Tenant isolation" on competency_profiles
  using (home_id = (select get_my_home_id())) with check (home_id = (select get_my_home_id()));

create index if not exists idx_competency_profiles_home  on competency_profiles(home_id);
create index if not exists idx_competency_profiles_staff on competency_profiles(staff_id);

grant select, insert, update, delete on competency_profiles to service_role;
