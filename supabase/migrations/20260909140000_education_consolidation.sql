-- ═══════════════════════════════════════════════════════════════════════════
-- EDUCATION CONSOLIDATION (6 of 6) — the education capture surface goes live.
--
-- NOT a dal-projection consolidation like the prior five. The brief's
-- name-match (store.educationRecords → cs_education_records) is a MODEL
-- mismatch: store.educationRecords is an education EVENT LOG (suspensions,
-- managed moves, PEP meetings — the off-rolling scrutiny triggers), while
-- cs_education_records is a per-child status PROFILE. No projection bridges
-- them, and the event log's only live-shaped writer is the care-events
-- processor, which is sync-over-store BY DESIGN — so no event table is
-- promoted (dal.educationRecords keeps its documented demo-only boundary).
--
-- What this DOES: promote the four tables the education CAPTURE SERVICES
-- actually write, so both services type cleanly and neither 500s on live.
--   education-service.ts        → cs_education_records (the profile — its
--                                  operations/education route 500s on live
--                                  TODAY because the table is missing),
--                                  cs_attendance_entries, cs_activities
--   education-attendance-tracking-service.ts → cs_education_attendance_tracking
--
-- Every judgement/observation default stripped: sessions attended/possible
-- 2/2 (a phantom perfect-attendance day), exclusion_count 0, pupil_premium
-- false, is_current true (a new row must not silently supersede the real
-- current profile), CURRENT_DATE (UTC-day class), the notified/arranged
-- FALSE flags, the '[]' list claims. FKs and CHECKs dropped per live
-- convention (no embedded selects read these).
--
-- APPLIED MANUALLY after merge (eleventh pending live migration).
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists cs_education_records (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  child_id text,
  education_status text,
  school_name text,
  year_group text,
  sen_status text,
  pupil_premium_plus boolean,
  virtual_school_contact text,
  designated_teacher text,
  pep_date date,
  next_pep_date date,
  attendance_percentage numeric(5,2),
  exclusion_count integer,
  achievements jsonb,
  concerns jsonb,
  is_current boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table cs_education_records enable row level security;
create index if not exists idx_cs_education_records_home on cs_education_records(home_id);
drop policy if exists "Tenant isolation" on cs_education_records;
create policy "Tenant isolation" on cs_education_records
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());
create index if not exists idx_cs_education_records_child on cs_education_records(child_id);
create index if not exists idx_cs_education_records_current on cs_education_records(is_current);

create table if not exists cs_attendance_entries (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  child_id text,
  education_record_id text,
  date date,
  mark text,
  session text,
  notes text,
  recorded_by text,
  created_at timestamptz not null default now()
);

alter table cs_attendance_entries enable row level security;
create index if not exists idx_cs_attendance_entries_home on cs_attendance_entries(home_id);
drop policy if exists "Tenant isolation" on cs_attendance_entries;
create policy "Tenant isolation" on cs_attendance_entries
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());
create index if not exists idx_cs_attendance_entries_child on cs_attendance_entries(child_id);
create index if not exists idx_cs_attendance_entries_record on cs_attendance_entries(education_record_id);
create index if not exists idx_cs_attendance_entries_date on cs_attendance_entries(date);

create table if not exists cs_activities (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  child_id text,
  activity_name text,
  category text,
  date date,
  duration_minutes integer,
  location text,
  description text,
  child_feedback text,
  child_enjoyed boolean,
  skills_developed jsonb,
  staff_member text,
  created_at timestamptz not null default now()
);

alter table cs_activities enable row level security;
create index if not exists idx_cs_activities_home on cs_activities(home_id);
drop policy if exists "Tenant isolation" on cs_activities;
create policy "Tenant isolation" on cs_activities
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());
create index if not exists idx_cs_activities_child on cs_activities(child_id);
create index if not exists idx_cs_activities_date on cs_activities(date);

create table if not exists cs_education_attendance_tracking (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  attendance_status text,
  absence_reason text,
  school_engagement text,
  education_setting text,
  attendance_date date,
  child_name text,
  child_id text,
  recorded_by text,
  school_contacted boolean,
  reason_documented boolean,
  return_plan_in_place boolean,
  pep_up_to_date boolean,
  virtual_school_informed boolean,
  social_worker_informed boolean,
  child_views_sought boolean,
  alternative_education_arranged boolean,
  homework_supported boolean,
  achievement_celebrated boolean,
  parent_informed boolean,
  recorded_promptly boolean,
  issues_found jsonb,
  actions_taken jsonb,
  sessions_attended integer,
  sessions_possible integer,
  next_review_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table cs_education_attendance_tracking enable row level security;
create index if not exists idx_cs_edu_attendance_home on cs_education_attendance_tracking(home_id);
drop policy if exists "Tenant isolation" on cs_education_attendance_tracking;
create policy "Tenant isolation" on cs_education_attendance_tracking
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());
create index if not exists idx_cs_edu_attendance_child on cs_education_attendance_tracking(child_id);
create index if not exists idx_cs_edu_attendance_date on cs_education_attendance_tracking(attendance_date);
