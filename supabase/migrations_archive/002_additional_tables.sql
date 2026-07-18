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
  id                    uuid primary key default uuid_generate_v4(),
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

-- ── QA Audits ────────────────────────────────────────────────────────────────
-- Distinct from audit_log (which is change-tracking).
-- This table holds structured quality assurance audits.

create table qa_audits (
  id            uuid primary key default uuid_generate_v4(),
  home_id       uuid not null references homes(id) on delete cascade,
  title         text not null,
  category      audit_category not null,
  date          date,
  completed_by  uuid references staff_members(id),
  score         int check (score >= 0),
  max_score     int check (max_score > 0),
  status        audit_status not null default 'scheduled',
  findings      text not null default '',
  actions       text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid references staff_members(id),
  updated_by    uuid references staff_members(id)
);

create trigger qa_audits_updated_at before update on qa_audits
  for each row execute function set_updated_at();

create index idx_qa_audits_home on qa_audits(home_id);
create index idx_qa_audits_status on qa_audits(status);
create index idx_qa_audits_category on qa_audits(category);

-- ── Maintenance Items ─────────────────────────────────────────────────────────

create table maintenance_items (
  id            uuid primary key default uuid_generate_v4(),
  home_id       uuid not null references homes(id) on delete cascade,
  title         text not null,
  category      maintenance_category not null default 'general',
  priority      maintenance_priority not null default 'medium',
  status        maintenance_status not null default 'open',
  due_date      date,
  assigned_to   text,           -- free text (contractor name or staff name)
  notes         text not null default '',
  recurring     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid references staff_members(id),
  updated_by    uuid references staff_members(id)
);

create trigger maintenance_items_updated_at before update on maintenance_items
  for each row execute function set_updated_at();

create index idx_maintenance_home on maintenance_items(home_id);
create index idx_maintenance_status on maintenance_items(status);
create index idx_maintenance_priority on maintenance_items(priority);

-- ── Vacancies ─────────────────────────────────────────────────────────────────

create table vacancies (
  id                    uuid primary key default uuid_generate_v4(),
  home_id               uuid not null references homes(id) on delete cascade,
  title                 text not null,
  role_code             text not null,
  employment_type       employment_type not null default 'permanent',
  contract_type         text not null default 'full_time',
  salary_min            numeric(10,2),
  salary_max            numeric(10,2),
  hours                 numeric(5,2),
  shift_pattern         text,
  reports_to            uuid references staff_members(id),
  safeguarding_statement text not null default '',
  status                vacancy_status not null default 'draft',
  approval_status       vacancy_approval_status not null default 'pending',
  approved_by           uuid references staff_members(id),
  approved_at           timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references staff_members(id)
);

create trigger vacancies_updated_at before update on vacancies
  for each row execute function set_updated_at();

create index idx_vacancies_home on vacancies(home_id);
create index idx_vacancies_status on vacancies(status);

-- ── Candidate Profiles ────────────────────────────────────────────────────────

create table candidate_profiles (
  id                    uuid primary key default uuid_generate_v4(),
  home_id               uuid not null references homes(id) on delete cascade,
  vacancy_id            uuid references vacancies(id),
  first_name            text not null,
  last_name             text not null,
  preferred_name        text,
  email                 text not null,
  phone                 text,
  dob                   date,
  current_address       text,
  source                text,
  current_stage         text not null default 'application',
  compliance_status     compliance_check_status not null default 'pending',
  risk_level            candidate_risk_level not null default 'low',
  shortlisted           boolean not null default false,
  appointed             boolean not null default false,
  assigned_manager_id   uuid references staff_members(id),
  cv_url                text,
  application_form_url  text,
  cover_letter_url      text,
  adjustments_requested boolean not null default false,
  adjustments_notes     text,
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references staff_members(id)
);

create trigger candidate_profiles_updated_at before update on candidate_profiles
  for each row execute function set_updated_at();

create index idx_candidate_profiles_home on candidate_profiles(home_id);
create index idx_candidate_profiles_vacancy on candidate_profiles(vacancy_id);
create index idx_candidate_profiles_stage on candidate_profiles(current_stage);

-- ── Candidate Checks ─────────────────────────────────────────────────────────

create table candidate_checks (
  id                uuid primary key default uuid_generate_v4(),
  candidate_id      uuid not null references candidate_profiles(id) on delete cascade,
  check_type        text not null,
  status            candidate_check_status not null default 'not_started',
  required          boolean not null default true,
  owner_id          uuid references staff_members(id),
  due_date          date,
  requested_at      timestamptz,
  received_at       timestamptz,
  verified_at       timestamptz,
  verified_by       uuid references staff_members(id),
  concern_flag      boolean not null default false,
  concern_summary   text,
  override_used     boolean not null default false,
  override_reason   text,
  overridden_by     uuid references staff_members(id),
  overridden_at     timestamptz,
  certificate_number text,
  document_type     text,
  document_expiry   date,
  metadata          jsonb not null default '{}',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger candidate_checks_updated_at before update on candidate_checks
  for each row execute function set_updated_at();

create index idx_candidate_checks_candidate on candidate_checks(candidate_id);
create index idx_candidate_checks_status on candidate_checks(status);

-- ── Candidate References ──────────────────────────────────────────────────────

create table candidate_references (
  id                            uuid primary key default uuid_generate_v4(),
  candidate_id                  uuid not null references candidate_profiles(id) on delete cascade,
  referee_name                  text not null,
  referee_role                  text,
  organisation_name             text,
  email                         text,
  phone                         text,
  relationship_to_candidate     text,
  is_most_recent_employer       boolean not null default false,
  requested_at                  timestamptz,
  chased_at                     timestamptz,
  received_at                   timestamptz,
  structured_response           jsonb,
  verbal_verification_completed boolean not null default false,
  verbal_verified_by            uuid references staff_members(id),
  verbal_verified_at            timestamptz,
  discrepancy_flag              boolean not null default false,
  discrepancy_notes             text,
  reliability_rating            int check (reliability_rating between 1 and 5),
  status                        reference_status not null default 'pending',
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now()
);

create trigger candidate_references_updated_at before update on candidate_references
  for each row execute function set_updated_at();

create index idx_candidate_references_candidate on candidate_references(candidate_id);

-- ── Employment History ────────────────────────────────────────────────────────

create table employment_history_entries (
  id                        uuid primary key default uuid_generate_v4(),
  candidate_id              uuid not null references candidate_profiles(id) on delete cascade,
  employer_name             text not null,
  role_title                text not null,
  start_date                date not null,
  end_date                  date,
  reason_for_leaving        text,
  is_most_recent_relevant   boolean not null default false,
  verified                  boolean not null default false,
  verified_by               uuid references staff_members(id),
  verified_at               timestamptz,
  notes                     text,
  created_at                timestamptz not null default now()
);

create index idx_employment_history_candidate on employment_history_entries(candidate_id);

-- ── Gap Explanations ──────────────────────────────────────────────────────────

create table gap_explanations (
  id              uuid primary key default uuid_generate_v4(),
  candidate_id    uuid not null references candidate_profiles(id) on delete cascade,
  gap_start       date not null,
  gap_end         date not null,
  gap_days        int not null,
  explanation_text text not null,
  status          text not null default 'pending' check (status in ('pending', 'accepted', 'requires_clarification', 'red_flag')),
  reviewed_by     uuid references staff_members(id),
  reviewed_at     timestamptz,
  notes           text,
  created_at      timestamptz not null default now()
);

create index idx_gap_explanations_candidate on gap_explanations(candidate_id);

-- ── Candidate Interviews ──────────────────────────────────────────────────────

create table candidate_interviews (
  id                          uuid primary key default uuid_generate_v4(),
  candidate_id                uuid not null references candidate_profiles(id) on delete cascade,
  vacancy_id                  uuid references vacancies(id),
  interview_type              text not null default 'panel',
  scheduled_at                timestamptz not null,
  location                    text,
  mode                        text not null default 'in_person' check (mode in ('in_person', 'video', 'phone')),
  panel                       jsonb not null default '[]',
  completed_at                timestamptz,
  recommendation              interview_recommendation,
  safeguarding_question_asked boolean not null default false,
  motivation_question_asked   boolean not null default false,
  rationale                   text,
  signed_off_by               uuid references staff_members(id),
  signed_off_at               timestamptz,
  scores                      jsonb not null default '[]',
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create trigger candidate_interviews_updated_at before update on candidate_interviews
  for each row execute function set_updated_at();

create index idx_candidate_interviews_candidate on candidate_interviews(candidate_id);

-- ── Conditional Offers ────────────────────────────────────────────────────────

create table conditional_offers (
  id                          uuid primary key default uuid_generate_v4(),
  candidate_id                uuid not null references candidate_profiles(id) on delete cascade,
  status                      offer_status not null default 'draft',
  conditional_offer_sent_at   timestamptz,
  proposed_start_date         date,
  salary                      numeric(10,2),
  hours                       numeric(5,2),
  probation_months            int not null default 6,
  conditions                  text[] not null default '{}',
  exceptional_start           boolean not null default false,
  exceptional_start_approved_by uuid references staff_members(id),
  exceptional_start_rationale text,
  exceptional_start_risk_mitigation text,
  final_clearance_completed_at timestamptz,
  final_clearance_by          uuid references staff_members(id),
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create trigger conditional_offers_updated_at before update on conditional_offers
  for each row execute function set_updated_at();

create index idx_conditional_offers_candidate on conditional_offers(candidate_id);

-- ── Recruitment Audit Entries ─────────────────────────────────────────────────

create table recruitment_audit_entries (
  id              uuid primary key default uuid_generate_v4(),
  candidate_id    uuid not null references candidate_profiles(id) on delete cascade,
  vacancy_id      uuid references vacancies(id),
  actor_id        uuid references staff_members(id),
  event_type      recruitment_event_type not null,
  entity_type     text,
  entity_id       uuid,
  before_state    jsonb,
  after_state     jsonb,
  notes           text,
  created_at      timestamptz not null default now()
);

create index idx_recruitment_audit_candidate on recruitment_audit_entries(candidate_id);
create index idx_recruitment_audit_actor on recruitment_audit_entries(actor_id);

-- ── Enable RLS on new tables ──────────────────────────────────────────────────

alter table care_forms enable row level security;
alter table qa_audits enable row level security;
alter table maintenance_items enable row level security;
alter table vacancies enable row level security;
alter table candidate_profiles enable row level security;
alter table candidate_checks enable row level security;
alter table candidate_references enable row level security;
alter table employment_history_entries enable row level security;
alter table gap_explanations enable row level security;
alter table candidate_interviews enable row level security;
alter table conditional_offers enable row level security;
alter table recruitment_audit_entries enable row level security;

-- ── Realtime for new tables ───────────────────────────────────────────────────

alter publication supabase_realtime add table care_forms;
alter publication supabase_realtime add table maintenance_items;
