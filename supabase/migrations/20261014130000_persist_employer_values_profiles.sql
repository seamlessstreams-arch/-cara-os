-- ════════════════════════════════════════════════════════════════════════════
-- Persistence: employer_values_profiles (the home's values profile).
--
-- The values-based recruitment matching engine reads the home's values profile
-- (core values, care approach, therapeutic model, non-negotiables …) to SUPPORT
-- recruitment judgement. dal.employerValuesProfiles was store-only, so on a live
-- tenant every reader (vacancy-setup-pack, values-match, candidate-portal,
-- interview-pack, manager-assistant) got an empty profile and an edit saved by
-- the employer-values route vanished with the serverless instance.
--
-- Schema mirrors the archived 406_employer_values_matching design, with home_id
-- reconciled from text/'home_oak' to a nullable uuid matching get_my_home_id()
-- and the live homes table. One profile per home (id defaults to 'evp_oak').
-- The coupled candidate_values_profiles has no live write path, so it is left
-- honest-empty and not promoted here.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists employer_values_profiles (
  id                            text primary key,
  home_id                       uuid,
  organisation_name             text not null default '',
  home_name                     text not null default '',
  core_values                   jsonb not null default '[]',
  care_approach                 text not null default '',
  leadership_style              text not null default '',
  therapeutic_model             text not null default '',
  pace_commitment               text not null default '',
  trauma_informed_expectations  text not null default '',
  safeguarding_culture          text not null default '',
  expected_behaviours           jsonb not null default '[]',
  non_negotiables               jsonb not null default '[]',
  what_makes_us_different        text not null default '',
  relational_practice_priority  text not null default 'high',
  updated_at                    timestamptz not null default now(),
  updated_by                    text
);

alter table employer_values_profiles enable row level security;

create index if not exists idx_employer_values_profiles_home on employer_values_profiles(home_id);

drop policy if exists "Tenant isolation" on employer_values_profiles;
create policy "Tenant isolation" on employer_values_profiles
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());

-- Manual applies on this Supabase project do not inherit default privileges, and
-- the Data API does not auto-reload — grant service_role explicitly and signal a
-- schema reload (a project restart is still required on this Cloud project).
grant select, insert, update, delete on table employer_values_profiles to service_role;
notify pgrst, 'reload schema';
