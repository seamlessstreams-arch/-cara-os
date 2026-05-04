-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — PRODUCTION DATABASE SCHEMA
-- Supabase / PostgreSQL 15+
-- Version 1.0.0 — 2026-04-16
--
-- Run this migration to initialise the Cornerstone database.
-- Enables: RLS, UUID generation, realtime subscriptions.
-- ══════════════════════════════════════════════════════════════════════════════

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- for full-text search

-- ── Enums ─────────────────────────────────────────────────────────────────────

create type system_role as enum (
  'registered_manager', 'responsible_individual', 'deputy_manager',
  'team_leader', 'residential_care_worker', 'bank_staff', 'admin'
);

create type employment_type as enum ('permanent', 'part_time', 'bank', 'agency', 'volunteer');
create type employment_status as enum ('active', 'inactive', 'suspended', 'leaver');
create type task_priority as enum ('low', 'medium', 'high', 'urgent');
create type task_status as enum ('not_started', 'in_progress', 'blocked', 'completed', 'cancelled');

create type incident_type as enum (
  'safeguarding_concern', 'missing_from_care', 'physical_intervention', 'self_harm',
  'damage_to_property', 'complaint', 'medication_error', 'allegation',
  'police_involvement', 'hospital_attendance', 'behaviour_incident',
  'contextual_safeguarding', 'exploitation_concern', 'bullying', 'online_safety', 'other'
);

create type incident_severity as enum ('low', 'medium', 'high', 'critical');
create type shift_type as enum ('day', 'sleep_in', 'waking_night', 'short', 'handover', 'on_call', 'training_day');
create type leave_type as enum ('annual_leave', 'sick', 'compassionate', 'parental', 'unpaid', 'toil', 'training');
create type medication_type as enum ('regular', 'prn', 'controlled', 'topical', 'inhaler', 'injection', 'other');
create type administration_status as enum ('given', 'refused', 'withheld', 'not_available', 'self_administered', 'late', 'missed', 'scheduled');
create type compliance_status as enum ('compliant', 'expiring_soon', 'expired', 'not_started', 'in_progress');
create type document_category as enum ('policy', 'procedure', 'care_plan', 'risk_assessment', 'incident_report', 'training', 'hr', 'financial', 'legal', 'other');
create type expense_status as enum ('draft', 'submitted', 'approved', 'declined', 'paid');
create type recruitment_stage as enum ('application', 'shortlisted', 'interview_scheduled', 'interviewed', 'offer_made', 'pre_employment', 'started', 'withdrawn', 'rejected');
create type yp_status as enum ('current', 'planned', 'ended', 'emergency');
create type missing_risk_level as enum ('low', 'medium', 'high', 'critical');
create type chronology_category as enum ('placement', 'incident', 'missing', 'safeguarding', 'health', 'education', 'contact', 'legal', 'review', 'behaviour', 'other');
create type check_result as enum ('pass', 'fail', 'advisory');
create type check_status as enum ('due', 'completed', 'overdue', 'failed', 'waived');
create type vehicle_status as enum ('available', 'in_use', 'restricted', 'off_road', 'disposed');
create type aria_mode as enum ('write', 'review', 'oversee', 'assist');

-- ── Base helper ───────────────────────────────────────────────────────────────

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── Homes ─────────────────────────────────────────────────────────────────────

create table homes (
  id                        uuid primary key default uuid_generate_v4(),
  name                      text not null,
  address                   text not null,
  phone                     text,
  ofsted_urn                text unique,
  registered_manager_id     uuid,
  responsible_individual_id uuid,
  max_beds                  int not null default 3,
  current_occupancy         int not null default 0,
  last_inspection_date      date,
  last_inspection_grade     text,
  created_at                timestamptz not null default now()
);

-- ── Staff ─────────────────────────────────────────────────────────────────────

create table staff_members (
  id                        uuid primary key default uuid_generate_v4(),
  home_id                   uuid not null references homes(id) on delete cascade,
  first_name                text not null,
  last_name                 text not null,
  full_name                 text generated always as (first_name || ' ' || last_name) stored,
  email                     text unique,
  phone                     text,
  role                      system_role not null,
  job_title                 text not null,
  employment_type           employment_type not null default 'permanent',
  employment_status         employment_status not null default 'active',
  start_date                date not null,
  end_date                  date,
  probation_end_date        date,
  contracted_hours          numeric(5,2) not null default 37.5,
  hourly_rate               numeric(8,2),
  annual_salary             numeric(10,2),
  payroll_id                text,
  dbs_number                text,
  dbs_issue_date            date,
  dbs_update_service        boolean not null default false,
  emergency_contact_name    text,
  emergency_contact_phone   text,
  next_supervision_due      date,
  next_appraisal_due        date,
  avatar_url                text,
  is_active                 boolean not null default true,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  created_by                uuid,
  updated_by                uuid
);

create trigger staff_members_updated_at before update on staff_members
  for each row execute function set_updated_at();

create index idx_staff_home on staff_members(home_id);
create index idx_staff_active on staff_members(is_active);

-- ── Young People ──────────────────────────────────────────────────────────────

create table young_people (
  id                      uuid primary key default uuid_generate_v4(),
  home_id                 uuid not null references homes(id) on delete cascade,
  first_name              text not null,
  last_name               text not null,
  preferred_name          text,
  date_of_birth           date not null,
  gender                  text,
  ethnicity               text,
  religion                text,
  placement_start         date not null,
  placement_end           date,
  placement_type          text,
  local_authority         text not null,
  social_worker_name      text,
  social_worker_phone     text,
  social_worker_email     text,
  iro_name                text,
  iro_phone               text,
  key_worker_id           uuid references staff_members(id),
  secondary_worker_id     uuid references staff_members(id),
  legal_status            text not null,
  risk_flags              text[] not null default '{}',
  dietary_requirements    text,
  allergies               text[] not null default '{}',
  gp_name                 text,
  gp_phone                text,
  school_name             text,
  school_contact          text,
  photo_url               text,
  status                  yp_status not null default 'current',
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  created_by              uuid,
  updated_by              uuid
);

create trigger young_people_updated_at before update on young_people
  for each row execute function set_updated_at();

create index idx_yp_home on young_people(home_id);
create index idx_yp_status on young_people(status);

-- ── Incidents ─────────────────────────────────────────────────────────────────

create table incidents (
  id                      uuid primary key default uuid_generate_v4(),
  home_id                 uuid not null references homes(id) on delete cascade,
  reference               text not null unique,
  type                    incident_type not null,
  severity                incident_severity not null,
  child_id                uuid not null references young_people(id),
  date                    date not null,
  time                    time,
  location                text,
  description             text not null,
  immediate_action        text not null,
  reported_by             uuid not null references staff_members(id),
  witnesses               uuid[] not null default '{}',
  body_map_required       boolean not null default false,
  body_map_completed      boolean not null default false,
  body_map_url            text,
  notifications           jsonb not null default '[]',
  requires_oversight      boolean not null default true,
  oversight_note          text,
  oversight_by            uuid references staff_members(id),
  oversight_at            timestamptz,
  status                  text not null default 'open' check (status in ('open', 'under_review', 'closed')),
  outcome                 text,
  lessons_learned         text,
  linked_task_ids         uuid[] not null default '{}',
  linked_document_ids     uuid[] not null default '{}',
  aria_oversight_used     boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  created_by              uuid,
  updated_by              uuid
);

create trigger incidents_updated_at before update on incidents
  for each row execute function set_updated_at();

create index idx_incidents_home on incidents(home_id);
create index idx_incidents_child on incidents(child_id);
create index idx_incidents_status on incidents(status);
create index idx_incidents_date on incidents(date desc);
create index idx_incidents_oversight on incidents(requires_oversight, oversight_by) where oversight_by is null;

-- ── Missing from Care ─────────────────────────────────────────────────────────

create table missing_episodes (
  id                              uuid primary key default uuid_generate_v4(),
  home_id                         uuid not null references homes(id) on delete cascade,
  reference                       text not null unique,
  child_id                        uuid not null references young_people(id),
  date_missing                    date not null,
  time_missing                    time,
  date_returned                   date,
  time_returned                   time,
  duration_hours                  numeric(6,2),
  risk_level                      missing_risk_level not null,
  location_last_seen              text not null,
  return_location                 text,
  reported_to_police              boolean not null default false,
  police_reference                text,
  reported_to_la                  boolean not null default false,
  la_notified_at                  timestamptz,
  return_interview_completed      boolean not null default false,
  return_interview_by             uuid references staff_members(id),
  return_interview_date           date,
  return_interview_notes          text,
  contextual_safeguarding_risk    boolean not null default false,
  linked_incident_id              uuid references incidents(id),
  pattern_notes                   text,
  status                          text not null default 'active' check (status in ('active', 'returned', 'closed')),
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now(),
  created_by                      uuid
);

create index idx_missing_child on missing_episodes(child_id);
create index idx_missing_status on missing_episodes(status);

-- ── Chronology ────────────────────────────────────────────────────────────────

create table chronology_entries (
  id                    uuid primary key default uuid_generate_v4(),
  home_id               uuid not null references homes(id) on delete cascade,
  child_id              uuid not null references young_people(id),
  date                  date not null,
  time                  time,
  category              chronology_category not null,
  title                 text not null,
  description           text not null,
  significance          text not null default 'routine' check (significance in ('routine', 'significant', 'critical')),
  recorded_by           uuid not null references staff_members(id),
  linked_incident_id    uuid references incidents(id),
  created_at            timestamptz not null default now()
);

create index idx_chronology_child on chronology_entries(child_id, date desc);

-- ── Tasks ─────────────────────────────────────────────────────────────────────

create table tasks (
  id                    uuid primary key default uuid_generate_v4(),
  home_id               uuid not null references homes(id) on delete cascade,
  title                 text not null,
  description           text not null default '',
  category              text not null,
  priority              task_priority not null default 'medium',
  status                task_status not null default 'not_started',
  assigned_to           uuid references staff_members(id),
  assigned_role         system_role,
  due_date              date,
  start_date            date,
  completed_at          timestamptz,
  completed_by          uuid references staff_members(id),
  estimated_minutes     int,
  actual_minutes        int,
  recurring             boolean not null default false,
  recurring_schedule    text check (recurring_schedule in ('daily', 'weekly', 'fortnightly', 'monthly')),
  requires_sign_off     boolean not null default false,
  signed_off_by         uuid references staff_members(id),
  signed_off_at         timestamptz,
  evidence_note         text,
  evidence_files        text[] not null default '{}',
  escalated             boolean not null default false,
  escalated_to          uuid references staff_members(id),
  escalated_at          timestamptz,
  escalation_reason     text,
  linked_child_id       uuid references young_people(id),
  linked_incident_id    uuid references incidents(id),
  linked_document_id    uuid,
  parent_task_id        uuid references tasks(id),
  tags                  text[] not null default '{}',
  auto_generated        boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid,
  updated_by            uuid
);

create trigger tasks_updated_at before update on tasks
  for each row execute function set_updated_at();

create index idx_tasks_home on tasks(home_id);
create index idx_tasks_assigned on tasks(assigned_to);
create index idx_tasks_status on tasks(status);
create index idx_tasks_due on tasks(due_date);
create index idx_tasks_priority on tasks(priority);

-- ── Shifts / Rota ─────────────────────────────────────────────────────────────

create table shifts (
  id                uuid primary key default uuid_generate_v4(),
  home_id           uuid not null references homes(id) on delete cascade,
  staff_id          uuid references staff_members(id),
  date              date not null,
  shift_type        shift_type not null,
  start_time        time not null,
  end_time          time not null,
  break_minutes     int not null default 0,
  actual_start      time,
  actual_end        time,
  clock_in_at       timestamptz,
  clock_out_at      timestamptz,
  overtime_minutes  int not null default 0,
  notes             text,
  status            text not null default 'scheduled' check (status in ('scheduled', 'confirmed', 'in_progress', 'completed', 'no_show', 'cancelled')),
  is_open_shift     boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid
);

create index idx_shifts_home_date on shifts(home_id, date);
create index idx_shifts_staff on shifts(staff_id);
create index idx_shifts_open on shifts(is_open_shift) where is_open_shift = true;

-- ── Leave Requests ────────────────────────────────────────────────────────────

create table leave_requests (
  id                          uuid primary key default uuid_generate_v4(),
  home_id                     uuid not null references homes(id) on delete cascade,
  staff_id                    uuid not null references staff_members(id),
  leave_type                  leave_type not null,
  start_date                  date not null,
  end_date                    date not null,
  total_days                  numeric(5,2) not null,
  reason                      text,
  status                      text not null default 'pending' check (status in ('pending', 'approved', 'declined', 'cancelled')),
  approved_by                 uuid references staff_members(id),
  approved_at                 timestamptz,
  return_to_work_required     boolean not null default false,
  return_to_work_completed    boolean not null default false,
  return_to_work_date         date,
  return_to_work_by           uuid references staff_members(id),
  return_to_work_notes        text,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  created_by                  uuid
);

-- ── Medications ───────────────────────────────────────────────────────────────

create table medications (
  id                    uuid primary key default uuid_generate_v4(),
  home_id               uuid not null references homes(id) on delete cascade,
  child_id              uuid not null references young_people(id),
  name                  text not null,
  type                  medication_type not null,
  dosage                text not null,
  frequency             text not null,
  route                 text not null,
  prescriber            text not null,
  pharmacy              text,
  start_date            date not null,
  end_date              date,
  is_active             boolean not null default true,
  stock_count           int,
  stock_last_checked    date,
  side_effects          text,
  special_instructions  text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid
);

create index idx_medications_child on medications(child_id);
create index idx_medications_active on medications(is_active);

create table medication_administrations (
  id                uuid primary key default uuid_generate_v4(),
  home_id           uuid not null references homes(id) on delete cascade,
  medication_id     uuid not null references medications(id),
  child_id          uuid not null references young_people(id),
  scheduled_time    timestamptz not null,
  actual_time       timestamptz,
  status            administration_status not null default 'scheduled',
  administered_by   uuid references staff_members(id),
  witnessed_by      uuid references staff_members(id),
  dose_given        text,
  reason_not_given  text,
  notes             text,
  prn_reason        text,
  prn_effectiveness text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid
);

create index idx_mar_medication on medication_administrations(medication_id);
create index idx_mar_child on medication_administrations(child_id);
create index idx_mar_scheduled on medication_administrations(scheduled_time);
create index idx_mar_exceptions on medication_administrations(status) where status in ('refused', 'late', 'missed');

-- ── Daily Log ─────────────────────────────────────────────────────────────────

create table daily_log_entries (
  id                    uuid primary key default uuid_generate_v4(),
  home_id               uuid not null references homes(id) on delete cascade,
  child_id              uuid not null references young_people(id),
  date                  date not null,
  time                  time,
  entry_type            text not null check (entry_type in ('general', 'behaviour', 'health', 'education', 'contact', 'activity', 'mood', 'sleep', 'food')),
  content               text not null,
  mood_score            int check (mood_score between 1 and 10),
  staff_id              uuid not null references staff_members(id),
  linked_incident_id    uuid references incidents(id),
  is_significant        boolean not null default false,
  auto_generated        boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid
);

create index idx_daily_log_child_date on daily_log_entries(child_id, date desc);
create index idx_daily_log_home_date on daily_log_entries(home_id, date desc);

-- ── Handovers ─────────────────────────────────────────────────────────────────

create table handovers (
  id                    uuid primary key default uuid_generate_v4(),
  home_id               uuid not null references homes(id) on delete cascade,
  shift_date            date not null,
  shift_from            text not null,
  shift_to              text not null,
  handover_time         time,
  completed_at          timestamptz,
  outgoing_staff        uuid[] not null default '{}',
  incoming_staff        uuid[] not null default '{}',
  created_by            uuid not null references staff_members(id),
  signed_off_by         uuid references staff_members(id),
  child_updates         jsonb not null default '[]',
  general_notes         text not null default '',
  flags                 text[] not null default '{}',
  linked_incident_ids   uuid[] not null default '{}',
  created_at            timestamptz not null default now()
);

create index idx_handovers_home_date on handovers(home_id, shift_date desc);

-- ── Training ──────────────────────────────────────────────────────────────────

create table training_records (
  id                uuid primary key default uuid_generate_v4(),
  home_id           uuid not null references homes(id) on delete cascade,
  staff_id          uuid not null references staff_members(id),
  course_name       text not null,
  category          text not null,
  provider          text,
  completed_date    date,
  expiry_date       date,
  certificate_url   text,
  status            compliance_status not null default 'not_started',
  is_mandatory      boolean not null default true,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid
);

create index idx_training_staff on training_records(staff_id);
create index idx_training_status on training_records(status);
create index idx_training_expiry on training_records(expiry_date);

-- ── Supervisions ──────────────────────────────────────────────────────────────

create table supervisions (
  id                    uuid primary key default uuid_generate_v4(),
  home_id               uuid not null references homes(id) on delete cascade,
  staff_id              uuid not null references staff_members(id),
  supervisor_id         uuid not null references staff_members(id),
  type                  text not null,
  scheduled_date        date not null,
  actual_date           date,
  duration_minutes      int,
  status                text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  discussion_points     text not null default '',
  actions_agreed        jsonb not null default '[]',
  wellbeing_score       int check (wellbeing_score between 1 and 10),
  staff_signature       boolean not null default false,
  supervisor_signature  boolean not null default false,
  next_date             date,
  linked_document_id    uuid,
  aria_assist_used      boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid
);

-- ── Documents ─────────────────────────────────────────────────────────────────

create table documents (
  id                    uuid primary key default uuid_generate_v4(),
  home_id               uuid not null references homes(id) on delete cascade,
  title                 text not null,
  category              document_category not null,
  description           text,
  file_url              text not null,
  file_name             text not null,
  file_size             bigint not null default 0,
  mime_type             text,
  version               int not null default 1,
  previous_version_id   uuid references documents(id),
  requires_read_sign    boolean not null default false,
  linked_child_id       uuid references young_people(id),
  linked_staff_id       uuid references staff_members(id),
  linked_incident_id    uuid references incidents(id),
  expiry_date           date,
  tags                  text[] not null default '{}',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid
);

create table document_read_receipts (
  id            uuid primary key default uuid_generate_v4(),
  document_id   uuid not null references documents(id) on delete cascade,
  staff_id      uuid not null references staff_members(id),
  read_at       timestamptz not null default now(),
  signed_at     timestamptz,
  unique(document_id, staff_id)
);

-- ── Expenses ──────────────────────────────────────────────────────────────────

create table expenses (
  id              uuid primary key default uuid_generate_v4(),
  home_id         uuid not null references homes(id) on delete cascade,
  submitted_by    uuid not null references staff_members(id),
  category        text not null,
  description     text not null,
  amount          numeric(10,2) not null,
  receipt_url     text,
  date            date not null,
  status          expense_status not null default 'draft',
  approved_by     uuid references staff_members(id),
  approved_at     timestamptz,
  linked_child_id uuid references young_people(id),
  payment_method  text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid
);

-- ── Buildings & H&S ──────────────────────────────────────────────────────────

create table buildings (
  id                          uuid primary key default uuid_generate_v4(),
  home_id                     uuid not null references homes(id) on delete cascade,
  name                        text not null,
  type                        text not null default 'residential',
  address                     text,
  areas                       text[] not null default '{}',
  gas_cert_expiry             date,
  electrical_cert_expiry      date,
  fire_risk_assessment_date   date,
  epc_rating                  text,
  last_full_inspection        date,
  next_inspection_due         date,
  status                      text not null default 'operational' check (status in ('operational', 'restricted', 'closed')),
  created_at                  timestamptz not null default now()
);

create table building_checks (
  id                      uuid primary key default uuid_generate_v4(),
  home_id                 uuid not null references homes(id) on delete cascade,
  building_id             uuid not null references buildings(id),
  area                    text not null,
  check_type              text not null,
  check_date              date not null,
  due_date                date,
  responsible_person      uuid references staff_members(id),
  status                  check_status not null default 'due',
  result                  check_result,
  risk_level              text check (risk_level in ('low', 'medium', 'high', 'critical')),
  notes                   text,
  action_required         text,
  action_due              date,
  manager_oversight       boolean not null default false,
  linked_maintenance_id   uuid,
  evidence_urls           text[] not null default '{}',
  created_at              timestamptz not null default now()
);

create index idx_building_checks_home on building_checks(home_id);
create index idx_building_checks_due on building_checks(due_date);
create index idx_building_checks_status on building_checks(status);

-- ── Vehicles ──────────────────────────────────────────────────────────────────

create table vehicles (
  id                  uuid primary key default uuid_generate_v4(),
  home_id             uuid not null references homes(id) on delete cascade,
  registration        text not null unique,
  make                text not null,
  model               text not null,
  colour              text,
  year                int,
  seats               int not null default 5,
  mot_expiry          date,
  insurance_expiry    date,
  tax_expiry          date,
  last_service        date,
  next_service_due    date,
  mileage             int not null default 0,
  status              vehicle_status not null default 'available',
  breakdown_cover     text,
  breakdown_ref       text,
  notes               text,
  created_at          timestamptz not null default now()
);

create table vehicle_checks (
  id              uuid primary key default uuid_generate_v4(),
  home_id         uuid not null references homes(id) on delete cascade,
  vehicle_id      uuid not null references vehicles(id),
  check_type      text not null default 'daily_safety',
  check_date      date not null,
  driver          uuid references staff_members(id),
  tyres           check_result,
  lights          check_result,
  brakes          check_result,
  mirrors         check_result,
  fluids          check_result,
  wipers          check_result,
  cleanliness     check_result,
  mileage_start   int,
  mileage_end     int,
  fuel_level      text,
  overall_result  check_result not null,
  defects         text,
  notes           text,
  created_at      timestamptz not null default now()
);

create index idx_vehicle_checks_vehicle on vehicle_checks(vehicle_id, check_date desc);

-- ── Candidates ────────────────────────────────────────────────────────────────

create table candidates (
  id                    uuid primary key default uuid_generate_v4(),
  home_id               uuid not null references homes(id) on delete cascade,
  first_name            text not null,
  last_name             text not null,
  email                 text not null,
  phone                 text,
  role_applied          text not null,
  stage                 recruitment_stage not null default 'application',
  source                text,
  cv_url                text,
  interview_date        date,
  interview_notes       text,
  reference_1_name      text,
  reference_1_status    text check (reference_1_status in ('pending', 'received', 'satisfactory', 'unsatisfactory')),
  reference_2_name      text,
  reference_2_status    text check (reference_2_status in ('pending', 'received', 'satisfactory', 'unsatisfactory')),
  dbs_submitted         boolean not null default false,
  dbs_received          boolean not null default false,
  offer_date            date,
  start_date            date,
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid
);

-- ── Aria Interactions ─────────────────────────────────────────────────────────

create table aria_interactions (
  id                uuid primary key default uuid_generate_v4(),
  home_id           uuid not null references homes(id) on delete cascade,
  staff_id          uuid not null references staff_members(id),
  mode              aria_mode not null,
  style             text not null,
  page_context      text,
  record_type       text,
  prompt_tokens     int,
  completion_tokens int,
  response_accepted boolean,
  response_edited   boolean,
  linked_entity_id  uuid,
  linked_entity_type text,
  created_at        timestamptz not null default now()
);

create index idx_aria_staff on aria_interactions(staff_id);
create index idx_aria_home on aria_interactions(home_id);

-- ── Time Saved ────────────────────────────────────────────────────────────────

create table time_saved_entries (
  id            uuid primary key default uuid_generate_v4(),
  home_id       uuid not null references homes(id) on delete cascade,
  staff_id      uuid not null references staff_members(id),
  action_type   text not null,
  minutes_saved int not null,
  description   text,
  created_at    timestamptz not null default now()
);

create index idx_time_saved_staff on time_saved_entries(staff_id, created_at desc);
create index idx_time_saved_home on time_saved_entries(home_id, created_at desc);

-- ── Notifications ─────────────────────────────────────────────────────────────

create table notifications (
  id              uuid primary key default uuid_generate_v4(),
  home_id         uuid not null references homes(id) on delete cascade,
  recipient_id    uuid not null references staff_members(id),
  title           text not null,
  body            text not null,
  type            text not null,
  priority        text not null default 'normal',
  read            boolean not null default false,
  read_at         timestamptz,
  action_url      text,
  entity_type     text,
  entity_id       uuid,
  created_at      timestamptz not null default now()
);

create index idx_notifications_recipient on notifications(recipient_id, read);

-- ── Audit Log ─────────────────────────────────────────────────────────────────

create table audit_log (
  id              uuid primary key default uuid_generate_v4(),
  home_id         uuid not null references homes(id) on delete cascade,
  entity_type     text not null,
  entity_id       uuid not null,
  action          text not null check (action in ('create', 'update', 'delete', 'sign_off', 'escalate', 'complete', 'view', 'oversight')),
  changes         jsonb,
  performed_by    uuid references staff_members(id),
  performed_at    timestamptz not null default now(),
  ip_address      text,
  user_agent      text
);

create index idx_audit_entity on audit_log(entity_type, entity_id);
create index idx_audit_user on audit_log(performed_by);
create index idx_audit_home on audit_log(home_id, performed_at desc);

-- ── Row Level Security ────────────────────────────────────────────────────────
-- Enable RLS on all user-facing tables
-- Home isolation: staff can only see data for their home

alter table homes enable row level security;
alter table staff_members enable row level security;
alter table young_people enable row level security;
alter table incidents enable row level security;
alter table missing_episodes enable row level security;
alter table chronology_entries enable row level security;
alter table tasks enable row level security;
alter table shifts enable row level security;
alter table leave_requests enable row level security;
alter table medications enable row level security;
alter table medication_administrations enable row level security;
alter table daily_log_entries enable row level security;
alter table handovers enable row level security;
alter table training_records enable row level security;
alter table supervisions enable row level security;
alter table documents enable row level security;
alter table expenses enable row level security;
alter table buildings enable row level security;
alter table building_checks enable row level security;
alter table vehicles enable row level security;
alter table vehicle_checks enable row level security;
alter table notifications enable row level security;
alter table audit_log enable row level security;
alter table aria_interactions enable row level security;
alter table time_saved_entries enable row level security;

-- Service role bypasses RLS (for API routes using service key)
-- User-facing policies to be added per authentication strategy

-- ── Realtime subscriptions ────────────────────────────────────────────────────
-- Enable realtime for live dashboard updates

alter publication supabase_realtime add table incidents;
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table missing_episodes;
alter publication supabase_realtime add table medication_administrations;
alter publication supabase_realtime add table building_checks;
alter publication supabase_realtime add table vehicle_checks;
