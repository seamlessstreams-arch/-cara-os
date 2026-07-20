-- ══════════════════════════════════════════════════════════════════════════════
-- Cara OS — LEAN LIVE BASELINE  (supersedes the 406-file historical chain)
--
-- One idempotent baseline for the tables a live tenant actually persists to
-- (the /data-persistence manifest + dual-mode DAL + auth/tenancy). Assembled and
-- verified by replaying the whole historical chain through a real Postgres
-- engine and keeping exactly the required tables + their dependency closure;
-- column parity against the full chain is 0-diff. The demo-feature migrations
-- (which never persisted and carried the duplicate-version / divergence bugs)
-- are archived under supabase/migrations_archive/, not applied.
-- ══════════════════════════════════════════════════════════════════════════════
-- No extensions required. All UUID defaults use gen_random_uuid(), which is
-- pg_catalog core (PostgreSQL >= 13) and immune to search_path. An earlier
-- revision used gen_random_uuid() from uuid-ossp — on real Supabase that
-- extension installs into the `extensions` schema, and `supabase db push`
-- applies migrations under a hardened search_path that does not include it,
-- so the unqualified call failed at apply time (SQLSTATE 42883). pg_trgm was
-- declared but never used by any index in this baseline.

-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — PRODUCTION DATABASE SCHEMA
-- Supabase / PostgreSQL 15+
-- Version 1.0.0 — 2026-04-16
--
-- Run this migration to initialise the Cornerstone database.
-- Enables: RLS, UUID generation, realtime subscriptions.
-- ══════════════════════════════════════════════════════════════════════════════

-- Extensions

 -- for full-text search

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
  id                        uuid primary key default gen_random_uuid(),
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
  id                        uuid primary key default gen_random_uuid(),
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
  id                      uuid primary key default gen_random_uuid(),
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
  id                      uuid primary key default gen_random_uuid(),
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
  id                              uuid primary key default gen_random_uuid(),
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

-- ── Tasks ─────────────────────────────────────────────────────────────────────

create table tasks (
  id                    uuid primary key default gen_random_uuid(),
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
  id                uuid primary key default gen_random_uuid(),
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

-- ── Medications ───────────────────────────────────────────────────────────────

create table medications (
  id                    uuid primary key default gen_random_uuid(),
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

-- ── Daily Log ─────────────────────────────────────────────────────────────────

create table daily_log_entries (
  id                    uuid primary key default gen_random_uuid(),
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
  id                    uuid primary key default gen_random_uuid(),
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
  id                uuid primary key default gen_random_uuid(),
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

-- ── Documents ─────────────────────────────────────────────────────────────────

create table documents (
  id                    uuid primary key default gen_random_uuid(),
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

-- ── Buildings & H&S ──────────────────────────────────────────────────────────

create table buildings (
  id                          uuid primary key default gen_random_uuid(),
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

-- ── Vehicles ──────────────────────────────────────────────────────────────────

create table vehicles (
  id                  uuid primary key default gen_random_uuid(),
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

-- ── Audit Log ─────────────────────────────────────────────────────────────────

create table audit_log (
  id              uuid primary key default gen_random_uuid(),
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

alter table tasks enable row level security;

alter table shifts enable row level security;

alter table medications enable row level security;

alter table daily_log_entries enable row level security;

alter table handovers enable row level security;

alter table training_records enable row level security;

alter table documents enable row level security;

alter table buildings enable row level security;

alter table vehicles enable row level security;

alter table audit_log enable row level security;

-- Service role bypasses RLS (for API routes using service key)
-- User-facing policies to be added per authentication strategy

-- ── Realtime subscriptions ────────────────────────────────────────────────────
-- Enable realtime for live dashboard updates

alter publication supabase_realtime add table incidents;

alter publication supabase_realtime add table tasks;

alter publication supabase_realtime add table missing_episodes;

-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — ADDITIONAL TABLES
-- Migration 002 — 2026-04-23
--
-- Adds tables not covered in migration 001:
--   care_forms, qa_audits, maintenance_items,
--   vacancies, candidate_profiles, candidate_checks,
--   candidate_references, employment_history_entries,
--   gap_explanations, candidate_interviews,
--   conditional_offers, recruitment_audit_entries
-- ══════════════════════════════════════════════════════════════════════════════

-- ── New enum types ─────────────────────────────────────────────────────────────

create type care_form_status as enum ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'archived');

create type care_form_type as enum (
  'risk_assessment', 'care_plan', 'pathway_plan', 'placement_plan',
  'behaviour_support_plan', 'health_action_plan', 'personal_education_plan',
  'return_interview', 'missing_from_care_form', 'body_map',
  'medication_consent', 'contact_record', 'review_meeting_notes',
  'health_safety_check', 'fire_drill', 'other'
);

create type audit_category as enum (
  'safeguarding', 'medication', 'records', 'staffing', 'environment',
  'care_quality', 'compliance', 'health_safety', 'finance', 'other'
);

create type audit_status as enum ('scheduled', 'in_progress', 'complete', 'overdue');

create type maintenance_priority as enum ('urgent', 'high', 'medium', 'low');

create type maintenance_status as enum ('open', 'scheduled', 'completed');

create type maintenance_category as enum (
  'hvac', 'fire_safety', 'plumbing', 'security', 'electrical', 'cleaning', 'general'
);

create type vacancy_status as enum ('draft', 'open', 'filled', 'withdrawn', 'paused');

create type vacancy_approval_status as enum ('pending', 'approved', 'rejected');

create type candidate_check_status as enum (
  'not_started', 'in_progress', 'submitted', 'received', 'verified', 'failed', 'waived'
);

create type candidate_risk_level as enum ('low', 'medium', 'high', 'blocked');

create type compliance_check_status as enum ('pending', 'in_progress', 'complete', 'concern');

create type reference_status as enum ('pending', 'requested', 'chased', 'received', 'satisfactory', 'unsatisfactory');

create type interview_recommendation as enum ('strong_yes', 'yes', 'no', 'strong_no', 'defer');

create type offer_status as enum ('draft', 'sent', 'accepted', 'declined', 'withdrawn', 'lapsed');

create type recruitment_event_type as enum (
  'stage_change', 'check_update', 'reference_update', 'interview_completed',
  'offer_sent', 'offer_accepted', 'final_clearance', 'concern_flagged',
  'override_applied', 'candidate_created', 'notes_updated'
);

-- ── Care Forms ────────────────────────────────────────────────────────────────

create table care_forms (
  id                    uuid primary key default gen_random_uuid(),
  home_id               uuid not null references homes(id) on delete cascade,
  title                 text not null,
  form_type             care_form_type not null,
  status                care_form_status not null default 'draft',
  linked_child_id       uuid references young_people(id),
  linked_staff_id       uuid references staff_members(id),
  linked_incident_id    uuid references incidents(id),
  linked_shift_id       uuid references shifts(id),
  linked_task_id        uuid references tasks(id),
  description           text not null default '',
  body                  jsonb not null default '{}',
  submitted_at          timestamptz,
  submitted_by          uuid references staff_members(id),
  reviewed_by           uuid references staff_members(id),
  reviewed_at           timestamptz,
  review_notes          text,
  approved_at           timestamptz,
  approved_by           uuid references staff_members(id),
  due_date              date,
  priority              task_priority not null default 'medium',
  tags                  text[] not null default '{}',
  aria_assist_used      boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references staff_members(id),
  updated_by            uuid references staff_members(id)
);

create trigger care_forms_updated_at before update on care_forms
  for each row execute function set_updated_at();

create index idx_care_forms_home on care_forms(home_id);

create index idx_care_forms_child on care_forms(linked_child_id);

create index idx_care_forms_status on care_forms(status);

create index idx_care_forms_type on care_forms(form_type);

-- ── Enable RLS on new tables ──────────────────────────────────────────────────

alter table care_forms enable row level security;

-- ── Realtime for new tables ───────────────────────────────────────────────────

alter publication supabase_realtime add table care_forms;

-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — ROW LEVEL SECURITY POLICIES
-- Migration 003 — 2026-04-23
--
-- All policies are home-scoped: staff can only read/write data belonging
-- to their home. The service role key (used by API routes) bypasses all RLS.
--
-- Strategy:
--   • SELECT: any authenticated staff at same home
--   • INSERT: any authenticated staff at same home
--   • UPDATE: any authenticated staff at same home (fine-grained control
--             is handled in application logic, not DB)
--   • DELETE: managers only (registered_manager, deputy_manager, responsible_individual)
--
-- auth.uid() resolves to the Supabase auth user id.
-- Staff rows store their Supabase auth id in a separate column (auth_user_id).
-- We maintain a fast lookup via get_staff_home_id() helper.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Add auth_user_id to staff_members ────────────────────────────────────────
-- Links Supabase Auth users to staff records

alter table staff_members add column if not exists auth_user_id uuid unique;

create index if not exists idx_staff_auth_user on staff_members(auth_user_id);

-- ── Helper: get the home_id for the current authenticated user ─────────────

create or replace function get_my_home_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select home_id
  from staff_members
  where auth_user_id = auth.uid()
  limit 1;
$$;

-- ── Helper: get the role for the current authenticated user ─────────────────

create or replace function get_my_role()
returns system_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from staff_members
  where auth_user_id = auth.uid()
  limit 1;
$$;

-- ── Helper: is current user a manager? ────────────────────────────────────

create or replace function is_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select role in ('registered_manager', 'deputy_manager', 'responsible_individual', 'team_leader')
  from staff_members
  where auth_user_id = auth.uid()
  limit 1;
$$;

-- ══════════════════════════════════════════════════════════════════════════════
-- HOMES
-- ══════════════════════════════════════════════════════════════════════════════

create policy "homes_read" on homes
  for select using (id = get_my_home_id());

-- ══════════════════════════════════════════════════════════════════════════════
-- STAFF MEMBERS
-- ══════════════════════════════════════════════════════════════════════════════

create policy "staff_read" on staff_members
  for select using (home_id = get_my_home_id());

create policy "staff_insert" on staff_members
  for insert with check (home_id = get_my_home_id() and is_manager());

create policy "staff_update" on staff_members
  for update using (home_id = get_my_home_id() and is_manager());

create policy "staff_delete" on staff_members
  for delete using (home_id = get_my_home_id() and get_my_role() = 'registered_manager');

-- ══════════════════════════════════════════════════════════════════════════════
-- YOUNG PEOPLE
-- ══════════════════════════════════════════════════════════════════════════════

create policy "young_people_read" on young_people
  for select using (home_id = get_my_home_id());

create policy "young_people_insert" on young_people
  for insert with check (home_id = get_my_home_id() and is_manager());

create policy "young_people_update" on young_people
  for update using (home_id = get_my_home_id());

create policy "young_people_delete" on young_people
  for delete using (home_id = get_my_home_id() and get_my_role() = 'registered_manager');

-- ══════════════════════════════════════════════════════════════════════════════
-- TASKS
-- ══════════════════════════════════════════════════════════════════════════════

create policy "tasks_read" on tasks
  for select using (home_id = get_my_home_id());

create policy "tasks_insert" on tasks
  for insert with check (home_id = get_my_home_id());

create policy "tasks_update" on tasks
  for update using (home_id = get_my_home_id());

create policy "tasks_delete" on tasks
  for delete using (home_id = get_my_home_id() and is_manager());

-- ══════════════════════════════════════════════════════════════════════════════
-- INCIDENTS
-- ══════════════════════════════════════════════════════════════════════════════

create policy "incidents_read" on incidents
  for select using (home_id = get_my_home_id());

create policy "incidents_insert" on incidents
  for insert with check (home_id = get_my_home_id());

create policy "incidents_update" on incidents
  for update using (home_id = get_my_home_id());

create policy "incidents_delete" on incidents
  for delete using (home_id = get_my_home_id() and get_my_role() = 'registered_manager');

-- ══════════════════════════════════════════════════════════════════════════════
-- MISSING EPISODES
-- ══════════════════════════════════════════════════════════════════════════════

create policy "missing_episodes_read" on missing_episodes
  for select using (home_id = get_my_home_id());

create policy "missing_episodes_insert" on missing_episodes
  for insert with check (home_id = get_my_home_id());

create policy "missing_episodes_update" on missing_episodes
  for update using (home_id = get_my_home_id() and is_manager());

-- chronology is immutable — no update/delete (audit integrity)

-- ══════════════════════════════════════════════════════════════════════════════
-- SHIFTS
-- ══════════════════════════════════════════════════════════════════════════════

create policy "shifts_read" on shifts
  for select using (home_id = get_my_home_id());

create policy "shifts_insert" on shifts
  for insert with check (home_id = get_my_home_id() and is_manager());

create policy "shifts_update" on shifts
  for update using (home_id = get_my_home_id() and is_manager());

-- ══════════════════════════════════════════════════════════════════════════════
-- MEDICATIONS
-- ══════════════════════════════════════════════════════════════════════════════

create policy "medications_read" on medications
  for select using (home_id = get_my_home_id());

create policy "medications_insert" on medications
  for insert with check (home_id = get_my_home_id() and is_manager());

create policy "medications_update" on medications
  for update using (home_id = get_my_home_id() and is_manager());

-- ══════════════════════════════════════════════════════════════════════════════
-- DAILY LOG
-- ══════════════════════════════════════════════════════════════════════════════

create policy "daily_log_read" on daily_log_entries
  for select using (home_id = get_my_home_id());

create policy "daily_log_insert" on daily_log_entries
  for insert with check (home_id = get_my_home_id());

create policy "daily_log_update" on daily_log_entries
  for update using (home_id = get_my_home_id() and is_manager());

-- ══════════════════════════════════════════════════════════════════════════════
-- HANDOVERS
-- ══════════════════════════════════════════════════════════════════════════════

create policy "handovers_read" on handovers
  for select using (home_id = get_my_home_id());

create policy "handovers_insert" on handovers
  for insert with check (home_id = get_my_home_id());

-- ══════════════════════════════════════════════════════════════════════════════
-- TRAINING
-- ══════════════════════════════════════════════════════════════════════════════

create policy "training_read" on training_records
  for select using (home_id = get_my_home_id());

create policy "training_insert" on training_records
  for insert with check (home_id = get_my_home_id() and is_manager());

create policy "training_update" on training_records
  for update using (home_id = get_my_home_id() and is_manager());

-- ══════════════════════════════════════════════════════════════════════════════
-- DOCUMENTS
-- ══════════════════════════════════════════════════════════════════════════════

create policy "documents_read" on documents
  for select using (home_id = get_my_home_id());

create policy "documents_insert" on documents
  for insert with check (home_id = get_my_home_id() and is_manager());

create policy "documents_update" on documents
  for update using (home_id = get_my_home_id() and is_manager());

-- ══════════════════════════════════════════════════════════════════════════════
-- BUILDINGS & VEHICLES
-- ══════════════════════════════════════════════════════════════════════════════

create policy "buildings_read" on buildings
  for select using (home_id = get_my_home_id());

create policy "vehicles_read" on vehicles
  for select using (home_id = get_my_home_id());

-- ══════════════════════════════════════════════════════════════════════════════
-- AUDIT LOG
-- ══════════════════════════════════════════════════════════════════════════════

create policy "audit_log_read" on audit_log
  for select using (home_id = get_my_home_id() and is_manager());

-- ══════════════════════════════════════════════════════════════════════════════
-- CARE FORMS
-- ══════════════════════════════════════════════════════════════════════════════

create policy "care_forms_read" on care_forms
  for select using (home_id = get_my_home_id());

create policy "care_forms_insert" on care_forms
  for insert with check (home_id = get_my_home_id());

create policy "care_forms_update" on care_forms
  for update using (home_id = get_my_home_id());

-- ── updated_at trigger for oversight_reviews ─────────────────────────────────

create or replace function set_updated_at_oversight_reviews()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ── updated_at trigger for voice_summaries ──────────────────────────────────

create or replace function set_updated_at_voice_summaries()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — HR INTELLIGENCE, SAFEGUARDING & WORKFORCE ASSURANCE
-- Migration 012: comprehensive schema sized for the full 25-section module.
--
-- Phase 1 (this migration) creates every table the spec requires. The Phase 1
-- code release wires up: hr_staff_profiles, hr_cases, hr_case_actions,
-- hr_case_chronology, hr_audit_log, hr_oversight_reviews, hr_tasks, and the
-- ARIA HR Process Guardian (hr_process_guardian_reviews +
-- hr_process_guardian_audit_log). The remaining tables are created here so
-- Phase 2 and Phase 3 features land without re-migrating.
--
-- All tables are RLS-enabled. Service role has full access; authenticated
-- users have read-only access scoped by application logic. Per-home and
-- per-staff scoping is expected to be enforced by the application layer
-- using the role / permission matrix in src/lib/hr/permissions.ts.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Common updated_at trigger function (shared) ──────────────────────────────
create or replace function set_updated_at_hr()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — ARIA UNIVERSAL LAYER
-- Migration 013: aria_requests, aria_outputs, aria_approvals, aria_audit_events,
--                aria_transcriptions, aria_task_links
--
-- The universal Aria layer sits underneath every Aria-driven feature. The
-- domain-specific tables (oversight_reviews, voice_summaries, hr_process_
-- guardian_reviews, hr_letters) keep their own state, but every Aria request,
-- response, transcription and approval also writes here, so audit logs and
-- inspection reports can be assembled from one place.
--
-- All tables are RLS-enabled and append-only where audit integrity matters.
-- Service role has full access. Authenticated users can read their own
-- drafts and any record where the application layer grants visibility via
-- src/lib/aria/aria-permissions.ts.
-- ══════════════════════════════════════════════════════════════════════════════

create or replace function set_updated_at_aria()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE INTELLIGENCE LAYER — USER-LEVEL RLS POLICIES
-- Migration 016
--
-- Replaces the blanket service_role policies on intelligence tables with
-- proper home-scoped policies. Uses get_my_home_id() from migration 003.
--
-- Strategy:
--   • SELECT: authenticated staff at same home
--   • INSERT: authenticated staff at same home
--   • UPDATE: authenticated staff at same home
--   • DELETE: managers only (via role check)
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Helper: check if current user is a manager ────────────────────────────
CREATE OR REPLACE FUNCTION is_manager()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff_members
    WHERE auth_user_id = auth.uid()
      AND role IN ('registered_manager', 'deputy_manager', 'responsible_individual')
  );
$$;

-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — CARE EVENTS SCHEMA
-- Migration 018 — 2026-05-08
--
-- Implements the Care Event routing system: the central mechanism by which
-- a single staff entry automatically and safely updates all connected records,
-- dashboards, reports and evidence banks.
--
-- Tables:
--   care_events           — source event record (the staff entry)
--   care_event_routes     — routing results (one row per linked area updated)
--   care_event_jobs       — background job queue for heavy processing
--   care_event_audit_log  — append-only audit trail for all actions
--
-- Unique constraints prevent idempotency violations.
-- All tables are home-scoped and RLS-protected.
-- Indexes support fast dashboard queries.
--
-- ROLLBACK: drop tables in reverse order (audit_log, jobs, routes, events)
--           after backing up any production data.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Enums ─────────────────────────────────────────────────────────────────────

create type care_event_status as enum (
  'draft',
  'submitted',
  'routing',
  'routed',
  'manager_review_required',
  'returned',
  'verified',
  'locked',
  'routing_failed'
);

create type care_event_category as enum (
  'general',
  'behaviour',
  'health',
  'medication',
  'education',
  'family_contact',
  'professional_contact',
  'safeguarding',
  'missing_episode',
  'physical_intervention',
  'restraint',
  'complaint',
  'activity',
  'wellbeing',
  'sleep',
  'food',
  'finance',
  'other'
);

create type route_type as enum (
  'daily_log',
  'child_daily_summary',
  'incident',
  'missing_episode',
  'physical_intervention',
  'health_record',
  'medication_record',
  'education_record',
  'family_contact_record',
  'professional_contact_record',
  'complaint_record',
  'safeguarding_record',
  'risk_assessment_task',
  'behaviour_plan_task',
  'followup_task',
  'management_oversight',
  'reg40_triage',
  'reg44_evidence',
  'reg45_evidence',
  'annex_a_evidence',
  'filing_cabinet',
  'saved_time'
);

create type route_status as enum (
  'pending',
  'processing',
  'completed',
  'failed',
  'skipped',
  'retry_required'
);

create type job_type as enum (
  'reg45_summary_update',
  'annex_a_snapshot_update',
  'inspection_readiness_update',
  'pattern_analysis',
  'pdf_generation',
  'evidence_pack_export',
  'filing_cabinet_index_rebuild',
  'saved_time_metrics'
);

create type job_status as enum (
  'pending',
  'processing',
  'completed',
  'failed',
  'retry_required'
);

create type audit_action as enum (
  'care_event_created',
  'care_event_submitted',
  'care_event_routed',
  'care_event_route_failed',
  'care_event_route_retried',
  'care_event_verified',
  'care_event_returned',
  'care_event_amended',
  'care_event_locked',
  'evidence_prompt_completed',
  'manager_review_completed',
  'reg45_evidence_suggested',
  'reg45_evidence_accepted',
  'reg45_evidence_rejected',
  'annex_a_evidence_suggested',
  'annex_a_snapshot_generated',
  'export_generated',
  'permission_denied',
  'validation_failed'
);

-- ── Updated-at triggers ───────────────────────────────────────────────────────

-- Reuse the trigger function from migration 001 if it exists, otherwise create it
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ══════════════════════════════════════════════════════════════════════════════
-- STAFF MEMBERS — auth_user_id lookup index (already in 003, ensure exists)
-- ══════════════════════════════════════════════════════════════════════════════

create index if not exists idx_staff_auth_user
  on staff_members(auth_user_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- ARIA REPORTS & INTELLIGENCE ENGINE
-- Migration 021 — 2026-05-12
--
-- Adds: ARIA agent run tracking, evidence linking, AI draft management,
-- child reports with structured sections, report actions, governance
-- settings, prompt templates, Reg 45 evidence bank, and audit trail.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Updated-at trigger function ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION aria_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Updated-at triggers ───────────────────────────────────────────────────────

create or replace function update_branding_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ══════════════════════════════════════════════════════════════════════════════
-- ARIA UNIVERSAL TABLES
-- Migration 022 — 2026-05-12
--
-- Adds tables for the universal Aria command layer: request tracking, output
-- drafts, approval decisions, transcription records, context links, and
-- command usage metrics. These complement the earlier domain-specific ARIA
-- tables (007, 013, 014, 019, 021).
-- ══════════════════════════════════════════════════════════════════════════════

-- Reuse the updated_at trigger from 021 if available, otherwise create.
CREATE OR REPLACE FUNCTION aria_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — INSPECTION HISTORY SCHEMA
-- Migration 022 — 2026-05-08
--
-- Creates the ofsted_inspections table for recording Ofsted inspection history,
-- including grade, inspector details, action counts, and report references.
--
-- This replaces the static INSPECTION_HISTORY array previously hard-coded in
-- the inspection page component.
--
-- ROLLBACK: DROP TABLE IF EXISTS ofsted_inspections;
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Enums ─────────────────────────────────────────────────────────────────────

do $$ begin
  create type ofsted_grade as enum (
    'Outstanding',
    'Good',
    'Requires improvement',
    'Inadequate'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type inspection_type as enum (
    'Full inspection',
    'Short notice',
    'Focused visit',
    'Monitoring visit'
  );
exception when duplicate_object then null; end $$;

-- ── updated_at trigger ────────────────────────────────────────────────────────

create or replace function update_ofsted_inspections_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ══════════════════════════════════════════════════════════════════════════════
-- Migration 023: Add aria_assist_used columns to remaining record tables
--
-- Extends the ARIA audit trail to handovers and key work sessions. These
-- columns allow the AriaUsageBadge component to show whether ARIA was used
-- to assist with creating or improving a record.
--
-- Existing columns:
--   - incidents.aria_oversight_used (added in migration 022)
--   - daily_log_entries.aria_assist_used (added in migration 022)
--   - supervisions.aria_assist_used (added in migration 022)
--   - care_forms.aria_assist_used (added in migration 022)
-- ══════════════════════════════════════════════════════════════════════════════

-- Handovers: track when ARIA was used to draft handover content
ALTER TABLE IF EXISTS handovers
  ADD COLUMN IF NOT EXISTS aria_assist_used BOOLEAN DEFAULT FALSE;

-- Create index for efficient ARIA-assisted record queries
CREATE INDEX IF NOT EXISTS idx_handovers_aria ON handovers (aria_assist_used) WHERE aria_assist_used = TRUE;

-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — ARIA STUDIO SCHEMA (migration 023)
-- Creates tables for the ARIA Studio generative intelligence workspace.
-- All AI-generated content lives here as "draft" until human-approved.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Enums ─────────────────────────────────────────────────────────────────────

do $$ begin
  create type aria_artifact_status as enum (
    'draft', 'in_review', 'changes_requested', 'approved',
    'rejected', 'committed', 'archived', 'deleted_recoverable'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type aria_artifact_type as enum (
    'keywork_session', 'direct_work_session', 'child_friendly_worksheet',
    'child_friendly_explanation', 'staff_training', 'quiz', 'flashcards',
    'reflective_practice_prompt', 'management_oversight', 'incident_learning_review',
    'risk_review', 'safeguarding_review', 'child_plan', 'placement_plan_update',
    'care_plan_update', 'reg45_summary', 'annex_a_update', 'ofsted_readiness_summary',
    'ri_briefing', 'social_worker_update', 'parent_professional_letter',
    'team_meeting_discussion', 'supervision_prompt', 'audio_briefing_script',
    'video_briefing_script', 'slide_deck_outline', 'mind_map', 'timeline',
    'visual_formulation', 'action_plan', 'reflective_workbook', 'scenario_simulation'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type aria_source_type as enum (
    'daily_log', 'incident', 'keywork', 'direct_work', 'risk_assessment',
    'placement_plan', 'care_plan', 'missing_from_care', 'education', 'health',
    'medication', 'complaint', 'supervision', 'team_meeting', 'staff_training',
    'reg45', 'annex_a', 'ofsted_evidence', 'policy', 'uploaded_document',
    'task', 'rota', 'handover', 'safeguarding', 'management_oversight'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type aria_evidence_level as enum (
    'high', 'medium', 'low', 'unverified', 'contradicted', 'missing'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type aria_gap_type as enum (
    'missing_child_voice', 'outdated_risk_assessment', 'missing_management_oversight',
    'missing_return_home_conversation', 'missing_debrief', 'missing_plan_update',
    'overdue_action', 'weak_reg45_evidence', 'weak_annex_a_evidence',
    'missing_supervision_follow_up', 'missing_training_response',
    'missing_safeguarding_follow_up', 'missing_review_date', 'incomplete_recording'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type aria_audit_action as enum (
    'source_indexed', 'artifact_generated', 'artifact_edited', 'artifact_submitted',
    'artifact_reviewed', 'changes_requested', 'artifact_approved', 'artifact_rejected',
    'artifact_committed', 'artifact_archived', 'artifact_deleted', 'artifact_recovered',
    'task_created', 'quality_check_completed', 'safeguarding_alert_created',
    'evidence_gap_detected', 'contradiction_detected'
  );
exception when duplicate_object then null; end $$;

-- ── updated_at triggers ────────────────────────────────────────────────────────

create or replace function update_aria_sources_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- =========================================================
-- ENUMS
-- =========================================================

do $$ begin
  create type aria_role_mode as enum (
    'practitioner',
    'senior',
    'deputy_manager',
    'registered_manager',
    'responsible_individual',
    'operations',
    'director',
    'commissioner',
    'ofsted_mock'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type aria_output_status as enum (
    'draft',
    'requires_review',
    'approved',
    'rejected',
    'superseded',
    'archived'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type aria_risk_level as enum ('low', 'medium', 'high', 'critical');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type aria_signal_type as enum (
    'risk_drift',
    'missing_evidence',
    'quality_gap',
    'child_voice_gap',
    'management_oversight_gap',
    'placement_stability',
    'staff_development',
    'safeguarding_theme',
    'therapeutic_opportunity',
    'regulatory_gap',
    'business_risk'
  );
exception when duplicate_object then null;
end $$;

-- ── Audit Log ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  severity TEXT DEFAULT 'info',
  user_id TEXT NOT NULL,
  user_role TEXT,
  home_id TEXT,
  child_id TEXT,
  resource_type TEXT,
  resource_id TEXT,
  resource_name TEXT,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_home ON audit_log(home_id);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Audit log — append-only for authenticated, read for managers (handled at app level)
CREATE POLICY audit_log_insert ON audit_log
  FOR INSERT WITH CHECK (true);

-- ══════════════════════════════════════════════════════════════════════════════
-- Workforce Safe Access — durable persistence for the workforce engine (Phases 5/7)
--
-- Tables for the in-memory collections added by Smart Sign-In presence verification
-- (Phase 5) and Safe Staffing & Emergency (Phase 7). Write-through happens at the
-- service boundary only when Supabase is configured (otherwise the in-memory store
-- holds the data — zero behaviour change). Home-scoped RLS; the service-role key used
-- by API routes bypasses RLS.
--
-- PRIVACY: sign_in_verifications stores method + outcome + a COARSE band only —
-- there is deliberately NO latitude/longitude column. Emergency broadcasts carry no
-- sensitive detail (enforced in the application layer).
--
-- Tables:
--   sign_in_verifications  — presence checks at clock-in (no coordinates)
--   emergency_alerts       — emergency alerts + responders + resolution
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. sign_in_verifications ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sign_in_verifications (
  id          TEXT PRIMARY KEY,
  staff_id    TEXT NOT NULL,
  shift_id    TEXT,
  home_id     TEXT NOT NULL DEFAULT 'home_oak',
  method      TEXT NOT NULL,                  -- kiosk | geofence | manual
  verified    BOOLEAN NOT NULL DEFAULT FALSE,
  band        TEXT,                           -- on_site | nearby | off_site | null
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- NOTE: intentionally no latitude/longitude — coordinates are never stored.
);

CREATE INDEX IF NOT EXISTS idx_sign_in_verifs_home ON sign_in_verifications (home_id, created_at);

CREATE INDEX IF NOT EXISTS idx_sign_in_verifs_staff ON sign_in_verifications (staff_id);

CREATE INDEX IF NOT EXISTS idx_sign_in_verifs_shift ON sign_in_verifications (shift_id);

-- ── 2. emergency_alerts ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS emergency_alerts (
  id                    TEXT PRIMARY KEY,
  home_id               TEXT NOT NULL DEFAULT 'home_oak',
  type                  TEXT NOT NULL,        -- medical|fire|security|evacuation|missing|other
  raised_by             TEXT NOT NULL,
  raised_by_name        TEXT NOT NULL,
  location              TEXT,
  note                  TEXT,
  status                TEXT NOT NULL DEFAULT 'active',  -- active | resolved
  responders            JSONB NOT NULL DEFAULT '[]'::jsonb,
  broadcast_message_id  TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at           TIMESTAMPTZ,
  resolved_by           TEXT
);

CREATE INDEX IF NOT EXISTS idx_emergency_alerts_home ON emergency_alerts (home_id, status);

CREATE INDEX IF NOT EXISTS idx_emergency_alerts_active ON emergency_alerts (home_id) WHERE status = 'active';

-- ── 3. Row-level security (home-scoped; service role bypasses) ─────────────────
ALTER TABLE sign_in_verifications ENABLE ROW LEVEL SECURITY;

ALTER TABLE emergency_alerts      ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sign_in_verifs_select ON sign_in_verifications;

DROP POLICY IF EXISTS sign_in_verifs_insert ON sign_in_verifications;

DROP POLICY IF EXISTS emergency_alerts_select ON emergency_alerts;

DROP POLICY IF EXISTS emergency_alerts_insert ON emergency_alerts;

DROP POLICY IF EXISTS emergency_alerts_update ON emergency_alerts;

COMMENT ON TABLE sign_in_verifications IS 'Sign-in presence checks (Phase 5) — method/outcome/band only; coordinates are never stored.';

COMMENT ON TABLE emergency_alerts IS 'Emergency alerts (Phase 7) — broadcasts carry no sensitive detail (enforced in app).';

-- ══════════════════════════════════════════════════════════════════════════════
-- Reflective Supervision records — durable persistence (workforce MVP slice 3)
--
-- Backs the in-memory `reflectiveSupervisions` collection. A richer, reflective
-- supervision record (wellbeing, workload, safeguarding, relationships, reflective
-- & PACE practice, boundaries, training needs, confidence, manager feedback,
-- actions, follow-up). Distinct from the existing cs_supervision_sessions table —
-- additive, not a replacement. Home-scoped RLS; service-role bypasses.
--
-- Wellbeing/confidence scores are SUPPORT indicators, never a clinical or
-- performance judgement (enforced in the application layer & UI wording).
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS reflective_supervisions (
  id                           TEXT PRIMARY KEY,
  home_id                      TEXT NOT NULL DEFAULT 'home_oak',
  staff_id                     TEXT NOT NULL,
  staff_name                   TEXT,
  supervisor_id                TEXT NOT NULL,
  supervisor_name              TEXT,
  date                         DATE NOT NULL,
  type                         TEXT NOT NULL DEFAULT '1:1',
  emotional_wellbeing          TEXT NOT NULL DEFAULT '',
  wellbeing_score              INTEGER NOT NULL DEFAULT 3,   -- 1–5 support indicator
  workload                     TEXT NOT NULL DEFAULT '',
  safeguarding_concerns        TEXT NOT NULL DEFAULT '',
  relationships_with_children  TEXT NOT NULL DEFAULT '',
  reflective_practice          TEXT NOT NULL DEFAULT '',
  pace_examples                TEXT NOT NULL DEFAULT '',
  professional_boundaries      TEXT NOT NULL DEFAULT '',
  training_needs               JSONB NOT NULL DEFAULT '[]'::jsonb,
  confidence_level             INTEGER NOT NULL DEFAULT 3,   -- 1–5 support indicator
  manager_feedback             TEXT NOT NULL DEFAULT '',
  actions                      JSONB NOT NULL DEFAULT '[]'::jsonb,
  follow_up_date               DATE,
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reflective_sup_home ON reflective_supervisions (home_id, date);

CREATE INDEX IF NOT EXISTS idx_reflective_sup_staff ON reflective_supervisions (staff_id, date);

ALTER TABLE reflective_supervisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reflective_sup_select ON reflective_supervisions;

DROP POLICY IF EXISTS reflective_sup_insert ON reflective_supervisions;

DROP POLICY IF EXISTS reflective_sup_update ON reflective_supervisions;

COMMENT ON TABLE reflective_supervisions IS 'Reflective supervision records (slice 3). Wellbeing/confidence are support indicators, not diagnoses.';

create table if not exists cara_ai_runs (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null,
  user_id uuid,
  child_id uuid,
  module text not null,
  prompt_type text,
  input_context jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  safety_flags jsonb not null default '[]'::jsonb,
  model_used text,
  human_review_required boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists cara_guardrail_events (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null,
  user_id uuid,
  child_id uuid,
  module text not null,
  risk_type text not null,
  severity text not null,
  flagged_text text,
  action_taken text not null,
  created_at timestamptz not null default now()
);

comment on table cara_guardrail_events is 'Each guardrail flag raised on generated content, with severity and the action taken (rewritten / flagged_for_review / blocked_pending_review).';

-- ══════════════════════════════════════════════════════════════════════════════
-- 412 — CARA STUDIO UNIFIED OUTPUTS (write-through target)
--
-- The application persists every Cara Studio generation into ONE table that
-- mirrors the in-memory `caraStudioOutputs` collection, so the review centre
-- and child workspaces read identically in both modes. The per-type tables
-- from migration 411 remain for future normalisation.
--
-- NOTE: id is TEXT and uses the application id (cso_…) so manager-review
-- updates address the same row the create wrote. Additive only; RLS
-- home-scoped like everything else.
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists cara_studio_outputs (
  id text primary key,
  home_id uuid not null,
  module text not null,
  child_id text,
  title text not null,
  output jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  manager_review_status text not null default 'not_reviewed',
  manager_review_reasons jsonb not null default '[]'::jsonb,
  guardrail_severity text,
  guardrail_flags jsonb not null default '[]'::jsonb,
  llm_used boolean not null default false,
  created_by text not null,
  reviewed_by text,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- The application enforces this too: nobody approves their own output.
  constraint cara_outputs_no_self_review check (reviewed_by is null or reviewed_by <> created_by)
);

create index if not exists cara_studio_outputs_child_idx on cara_studio_outputs (child_id);

create index if not exists cara_studio_outputs_review_idx on cara_studio_outputs (manager_review_status) where manager_review_status = 'review_required';

alter table cara_studio_outputs enable row level security;

drop policy if exists "Tenant isolation" on cara_studio_outputs;

create policy "Tenant isolation" on cara_studio_outputs
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());

comment on table cara_studio_outputs is
  'Unified write-through target for every Cara Studio generation (sessions, curriculum, materials, conversations, incident learning, adaptations, debriefs) with guardrail + manager-review state. Text PK = application id so updates address the created row.';

-- ══════════════════════════════════════════════════════════════════════════════
-- Cara — Migration 414 — Platform owner ("Cara HQ")
-- Pain Point Resolutions Ltd (trading as Cara)
--
-- 🔴 SAFEGUARDING BOUNDARY: platform admins operate on METADATA only (counts,
-- usage, billing, health). NO policy in this migration grants access to
-- children's record content (young_people, incidents, daily_log_entries, …).
-- break_glass_grants records intent; it does NOT itself open data — record-level
-- support access requires the separate DPO-approved process.
--
-- Conventions (matching 412/413): application ids are TEXT ("org_…", "bg_…")
-- so demo-mode write-through rows can be addressed by the same id later.
-- Adapted to this schema: tenancy anchor is `homes` (001); there is no
-- profiles/current_org() here — platform policies are ADDITIVE on top of the
-- existing home-scoped policies in 003 and remove nothing.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Customers (organisations) ────────────────────────────────────────────────
create table if not exists organisations (
  id                    text primary key,
  name                  text not null,
  plan                  text not null default 'pilot'
                          check (plan in ('pilot','essentials','professional','group')),
  status                text not null default 'active'
                          check (status in ('active','suspended','churned')),
  primary_contact_name  text,
  primary_contact_email text,
  first_home_name       text,
  created_by            uuid references auth.users(id),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

drop trigger if exists organisations_updated_at on organisations;

create trigger organisations_updated_at
  before update on organisations
  for each row execute function set_updated_at();

-- Existing single-org deployments keep working: nullable link only.
alter table homes add column if not exists org_id text references organisations(id);

-- ── Platform admins (Cara company staff) ─────────────────────────────────────
create table if not exists platform_admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  full_name  text not null,
  created_at timestamptz not null default now()
);

create or replace function is_platform_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from platform_admins where user_id = auth.uid());
$$;

-- ── Usage metering (append-only activity log) ────────────────────────────────
create table if not exists usage_events (
  id         bigint generated always as identity primary key,
  at         timestamptz not null default now(),
  org_id     text references organisations(id) on delete set null,
  user_label text,
  kind       text not null,
  meta       jsonb not null default '{}'
);

create index if not exists idx_usage_org_at on usage_events(org_id, at);

create index if not exists idx_usage_kind_at on usage_events(kind, at);

-- ── AI usage & cost metering (margin watching, not billing) ──────────────────
create table if not exists ai_usage (
  id            bigint generated always as identity primary key,
  at            timestamptz not null default now(),
  org_id        text references organisations(id) on delete set null,
  feature       text not null,
  model         text,
  tokens_input  integer not null default 0,
  tokens_output integer not null default 0,
  cost_gbp      numeric(10,4) not null default 0,
  estimated     boolean not null default true
);

create index if not exists idx_ai_org_at on ai_usage(org_id, at);

create index if not exists idx_ai_feature_at on ai_usage(feature, at);

-- ── Break-glass grants (auditable intent; never opens data by itself) ────────
create table if not exists break_glass_grants (
  id          text primary key,
  admin_label text not null,
  admin_id    uuid references auth.users(id),
  org_id      text not null references organisations(id) on delete cascade,
  reason      text not null,
  granted_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  revoked_at  timestamptz
);

create index if not exists idx_bg_org on break_glass_grants(org_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table organisations      enable row level security;

alter table platform_admins    enable row level security;

alter table usage_events       enable row level security;

alter table ai_usage           enable row level security;

alter table break_glass_grants enable row level security;

drop policy if exists hq_admins_select on platform_admins;

create policy hq_admins_select on platform_admins
  for select using ( is_platform_admin() );

drop policy if exists hq_orgs_select on organisations;

create policy hq_orgs_select on organisations
  for select using ( is_platform_admin() );

drop policy if exists hq_orgs_write on organisations;

create policy hq_orgs_write on organisations
  for all using ( is_platform_admin() ) with check ( is_platform_admin() );

drop policy if exists hq_usage_select on usage_events;

create policy hq_usage_select on usage_events
  for select using ( is_platform_admin() or is_manager() );

drop policy if exists hq_usage_insert on usage_events;

create policy hq_usage_insert on usage_events
  for insert with check ( is_platform_admin() );

drop policy if exists hq_ai_select on ai_usage;

create policy hq_ai_select on ai_usage
  for select using ( is_platform_admin() );

drop policy if exists hq_bg_all on break_glass_grants;

create policy hq_bg_all on break_glass_grants
  for all using ( is_platform_admin() ) with check ( is_platform_admin() );

-- ADDITIVE metadata read on homes for platform admins (policies are OR'd —
-- this adds visibility of home names/counts and removes nothing from staff).
drop policy if exists homes_platform_admin_read on homes;

create policy homes_platform_admin_read on homes
  for select using ( is_platform_admin() );

-- ══════════════════════════════════════════════════════════════════════════════
-- 416 — CALENDAR EVENTS (write-through target)
--
-- Durable home for the calendar's ONE editable collection: planned meetings and
-- appointments. Everything else on the calendar is PROJECTED live from existing
-- tables (tasks, appointments, supervisions, lac_reviews, family time, training,
-- interviews, shifts) and is never copied here — capture once, surface
-- everywhere. Hot columns for range queries; attendees + linked tasks travel in
-- jsonb. TEXT primary key carries the application id (cal_…) so updates address
-- the row the insert created. Additive only; home-scoped RLS (413 pattern).
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists calendar_events (
  id text primary key,
  home_id uuid not null,
  title text not null,
  description text,
  event_type text not null default 'meeting',
  starts_at timestamptz not null,
  ends_at timestamptz,
  all_day boolean not null default false,
  location text,
  child_id text,
  organiser_id text,
  attendees jsonb not null default '[]',
  linked_task_ids jsonb not null default '[]',
  reminder_minutes_before integer,
  reminder_sent boolean not null default false,
  invite_sent boolean not null default false,
  status text not null default 'scheduled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists calendar_events_starts_idx on calendar_events (starts_at);

create index if not exists calendar_events_child_idx on calendar_events (child_id);

create index if not exists calendar_events_status_idx on calendar_events (status);

alter table calendar_events enable row level security;

drop policy if exists "Tenant isolation" on calendar_events;

create policy "Tenant isolation" on calendar_events
  using (home_id = get_my_home_id())
  with check (home_id = get_my_home_id());

comment on table calendar_events is
  'Write-through target for planned meetings/appointments (the calendar''s only editable collection). All other calendar items are projected live from their source tables and never duplicated here. TEXT PK = application id (cal_…).';

-- ══════════════════════════════════════════════════════════════════════════════
-- 417 — CALENDAR RECURRENCE (additive columns)
--
-- Adds repeat rules to calendar_events (migration 416). The recurrence rule
-- lives in jsonb ({freq, interval, until, count}); occurrences are expanded
-- live by the projection engine and never materialised as rows.
-- last_reminded_occurrence dedupes per-occurrence reminders. Additive only.
-- ══════════════════════════════════════════════════════════════════════════════

alter table calendar_events add column if not exists recurrence jsonb;

alter table calendar_events add column if not exists last_reminded_occurrence text;

comment on column calendar_events.recurrence is
  'Repeat rule {freq: daily|weekly|fortnightly|monthly, interval, until, count}; null = one-off. Occurrences are expanded live, never stored as rows.';

comment on column calendar_events.last_reminded_occurrence is
  'YYYY-MM-DD of the most recent occurrence a reminder fired for (recurring dedupe).';

-- 424: 'super_admin' as a real system_role value
--
-- The HQ gate (src/lib/hq/hq-service.ts) grants platform-owner access only to
-- a staff session whose role is 'super_admin', and the app's role model
-- (auth-guard's AppRole, CROSS_HOME_ROLES) already includes it — but the
-- system_role enum created in migration 001 never did. On a live database that
-- makes the master-admin seat impossible to create: the staff_members insert is
-- rejected by the enum, so /hq (customer + home provisioning) is unreachable
-- for everyone, in every activated deployment.
--
-- ADD VALUE IF NOT EXISTS is idempotent and safe to re-run. Deliberately the
-- ONLY statement here: Postgres forbids USING a new enum value inside the same
-- transaction that added it, so the bootstrap SQL that creates the actual
-- super_admin staff row lives in docs/ACTIVATION.md and runs afterwards.
alter type system_role add value if not exists 'super_admin';

ALTER TABLE incidents ADD COLUMN IF NOT EXISTS cara_oversight_used boolean DEFAULT false NOT NULL;;

ALTER TABLE care_forms ADD COLUMN IF NOT EXISTS cara_assist_used boolean DEFAULT false NOT NULL;;

ALTER TABLE cara_ai_runs ADD COLUMN IF NOT EXISTS requested_by uuid;;

ALTER TABLE cara_ai_runs ADD COLUMN IF NOT EXISTS role_mode aria_role_mode DEFAULT 'practitioner'::aria_role_mode NOT NULL;;

ALTER TABLE cara_ai_runs ADD COLUMN IF NOT EXISTS feature_key text;;

ALTER TABLE cara_ai_runs ADD COLUMN IF NOT EXISTS prompt_hash text;;

ALTER TABLE cara_ai_runs ADD COLUMN IF NOT EXISTS model text;;

ALTER TABLE cara_ai_runs ADD COLUMN IF NOT EXISTS input_summary text;;

ALTER TABLE cara_ai_runs ADD COLUMN IF NOT EXISTS output_summary text;;

ALTER TABLE cara_ai_runs ADD COLUMN IF NOT EXISTS output_json jsonb DEFAULT '{}'::jsonb NOT NULL;;

ALTER TABLE cara_ai_runs ADD COLUMN IF NOT EXISTS status aria_output_status DEFAULT 'draft'::aria_output_status NOT NULL;;

ALTER TABLE cara_ai_runs ADD COLUMN IF NOT EXISTS confidence numeric(5,2) DEFAULT 0 NOT NULL;;

ALTER TABLE cara_ai_runs ADD COLUMN IF NOT EXISTS requires_human_approval boolean DEFAULT true NOT NULL;;

ALTER TABLE cara_ai_runs ADD COLUMN IF NOT EXISTS human_approved_by uuid;;

ALTER TABLE cara_ai_runs ADD COLUMN IF NOT EXISTS human_approved_at timestamp with time zone;;

ALTER TABLE cara_ai_runs ADD COLUMN IF NOT EXISTS rejection_reason text;;

ALTER TABLE cara_ai_runs ADD COLUMN IF NOT EXISTS evidence_count integer DEFAULT 0 NOT NULL;;

ALTER TABLE cara_ai_runs ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now() NOT NULL;;

ALTER TABLE handovers ADD COLUMN IF NOT EXISTS cara_assist_used boolean DEFAULT false;;

ALTER TABLE cara_ai_runs ENABLE ROW LEVEL SECURITY;;

CREATE POLICY "Tenant isolation" ON cara_ai_runs FOR all TO public USING ((home_id = get_my_home_id()));;

ALTER TABLE cara_guardrail_events ENABLE ROW LEVEL SECURITY;;
