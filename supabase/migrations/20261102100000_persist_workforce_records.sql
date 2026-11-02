-- CARA workforce intelligence — persist staff INDUCTION, QUALIFICATIONS and
-- PRACTICE OBSERVATIONS for the live tenant.
--
-- These three /api/v1/workforce/* routes read AND wrote the in-memory store, so
-- on live (where the store is wiped at module load) their writes were silently
-- lost and the reads always came back empty. Own tables, mirroring the
-- competency_profiles persist migration. home_id is uuid (matches the ~100
-- uuid home_id tables); RLS "Tenant isolation" via get_my_home_id() as defence
-- in depth (the app queries as service_role, which the grant covers).

create table if not exists induction_records (
  id                     text primary key default gen_random_uuid()::text,
  home_id                uuid,
  staff_id               text not null,
  start_date             text,
  target_completion_date text,
  buddy_id               text,
  line_manager_id        text,
  items                  jsonb not null default '[]',
  overall_status         text not null default 'not_started',
  probation_passed       boolean,
  probation_passed_at    text,
  notes                  text,
  created_by             text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

alter table induction_records enable row level security;
drop policy if exists "Tenant isolation" on induction_records;
create policy "Tenant isolation" on induction_records
  using (home_id = (select get_my_home_id())) with check (home_id = (select get_my_home_id()));
create index if not exists idx_induction_records_home  on induction_records(home_id);
create index if not exists idx_induction_records_staff on induction_records(staff_id);
grant select, insert, update, delete on induction_records to service_role;

create table if not exists qualification_records (
  id                     text primary key default gen_random_uuid()::text,
  home_id                uuid,
  staff_id               text not null,
  qualification_name     text not null,
  awarding_body          text,
  level                  text,
  mandatory              boolean not null default false,
  regulatory_requirement text,
  status                 text not null default 'not_started',
  started_at             text,
  completed_at           text,
  expiry_date            text,
  certificate_ref        text,
  evidence_document_id   text,
  notes                  text,
  created_by             text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

alter table qualification_records enable row level security;
drop policy if exists "Tenant isolation" on qualification_records;
create policy "Tenant isolation" on qualification_records
  using (home_id = (select get_my_home_id())) with check (home_id = (select get_my_home_id()));
create index if not exists idx_qualification_records_home   on qualification_records(home_id);
create index if not exists idx_qualification_records_staff  on qualification_records(staff_id);
create index if not exists idx_qualification_records_expiry on qualification_records(expiry_date);
grant select, insert, update, delete on qualification_records to service_role;

create table if not exists practice_observations (
  id                         text primary key default gen_random_uuid()::text,
  home_id                    uuid,
  staff_id                   text not null,
  observer_id                text not null,
  observation_date           text,
  context                    text,
  domains_observed           jsonb not null default '[]',
  narrative                  text,
  strengths_noted            jsonb not null default '[]',
  areas_for_development      jsonb not null default '[]',
  outcome                    text,
  score_adjustments          jsonb not null default '[]',
  linked_development_plan_id text,
  staff_response             text,
  signed_off_by_staff        boolean not null default false,
  signed_off_at              text,
  cara_summary               text,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);

alter table practice_observations enable row level security;
drop policy if exists "Tenant isolation" on practice_observations;
create policy "Tenant isolation" on practice_observations
  using (home_id = (select get_my_home_id())) with check (home_id = (select get_my_home_id()));
create index if not exists idx_practice_observations_home  on practice_observations(home_id);
create index if not exists idx_practice_observations_staff on practice_observations(staff_id);
grant select, insert, update, delete on practice_observations to service_role;
