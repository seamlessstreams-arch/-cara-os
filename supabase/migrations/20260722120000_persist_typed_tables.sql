-- ─────────────────────────────────────────────────────────────────────────
-- Persistence repair: 29 tables the typed DAL writes to but the lean baseline
-- dropped. Without them every write 500s (no fallback) and the record is lost.
-- Generated from Database["public"]["Tables"] in src/lib/supabase/types.ts —
-- the exact contract the compiled code inserts against. Columns nullable except
-- id (defensive: a write must never fail on an omitted field); id is text to
-- accept both uuid and app-generated prefixed ids. RLS on; tenant policy where
-- home_id exists (the app uses service_role and bypasses RLS).
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists annex_a_evidence_queue (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  care_event_id text,
  annex_a_section text,
  suggested_text text,
  status text,
  manager_decision text,
  manager_notes text,
  manager_id text,
  decided_at text,
  approved_text text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table annex_a_evidence_queue enable row level security;
create index if not exists idx_annex_a_evidence_queue_home on annex_a_evidence_queue(home_id);
drop policy if exists "Tenant isolation" on annex_a_evidence_queue;
create policy "Tenant isolation" on annex_a_evidence_queue
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());

create table if not exists building_checks (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  building_id text,
  area text,
  check_type text,
  check_date text,
  due_date text,
  responsible_person text,
  status text,
  result text,
  risk_level text,
  notes text,
  action_required text,
  action_due text,
  manager_oversight boolean,
  linked_maintenance_id text,
  evidence_urls jsonb,
  created_at timestamptz default now()
);
alter table building_checks enable row level security;
create index if not exists idx_building_checks_home on building_checks(home_id);
drop policy if exists "Tenant isolation" on building_checks;
create policy "Tenant isolation" on building_checks
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());

create table if not exists candidate_checks (
  id text primary key default gen_random_uuid()::text,
  candidate_id text,
  check_type text,
  status text,
  required boolean,
  owner_id text,
  due_date text,
  requested_at text,
  received_at text,
  verified_at text,
  verified_by text,
  concern_flag boolean,
  concern_summary text,
  override_used boolean,
  override_reason text,
  overridden_by text,
  overridden_at text,
  certificate_number text,
  document_type text,
  document_expiry text,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table candidate_checks enable row level security;

create table if not exists candidate_profiles (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  vacancy_id text,
  first_name text,
  last_name text,
  preferred_name text,
  email text,
  phone text,
  dob text,
  current_address text,
  source text,
  current_stage text,
  compliance_status text,
  risk_level text,
  shortlisted boolean,
  appointed boolean,
  assigned_manager_id text,
  cv_url text,
  application_form_url text,
  cover_letter_url text,
  adjustments_requested boolean,
  adjustments_notes text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text
);
alter table candidate_profiles enable row level security;
create index if not exists idx_candidate_profiles_home on candidate_profiles(home_id);
drop policy if exists "Tenant isolation" on candidate_profiles;
create policy "Tenant isolation" on candidate_profiles
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());

create table if not exists candidate_references (
  id text primary key default gen_random_uuid()::text,
  candidate_id text,
  referee_name text,
  referee_role text,
  organisation_name text,
  email text,
  phone text,
  relationship_to_candidate text,
  is_most_recent_employer boolean,
  requested_at text,
  chased_at text,
  received_at text,
  structured_response jsonb,
  verbal_verification_completed boolean,
  verbal_verified_by text,
  verbal_verified_at text,
  discrepancy_flag boolean,
  discrepancy_notes text,
  reliability_rating numeric,
  status text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table candidate_references enable row level security;

create table if not exists cara_interactions (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  staff_id text,
  mode text,
  style text,
  page_context text,
  record_type text,
  prompt_tokens numeric,
  completion_tokens numeric,
  response_accepted boolean,
  response_edited boolean,
  linked_entity_id text,
  linked_entity_type text,
  created_at timestamptz default now()
);
alter table cara_interactions enable row level security;
create index if not exists idx_cara_interactions_home on cara_interactions(home_id);
drop policy if exists "Tenant isolation" on cara_interactions;
create policy "Tenant isolation" on cara_interactions
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());

create table if not exists care_event_audit_log (
  id text primary key default gen_random_uuid()::text,
  care_event_id text,
  home_id uuid,
  action text,
  actor_id text,
  detail jsonb,
  performed_at text
);
alter table care_event_audit_log enable row level security;
create index if not exists idx_care_event_audit_log_home on care_event_audit_log(home_id);
drop policy if exists "Tenant isolation" on care_event_audit_log;
create policy "Tenant isolation" on care_event_audit_log
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());

create table if not exists care_event_jobs (
  id text primary key default gen_random_uuid()::text,
  care_event_id text,
  home_id uuid,
  job_type text,
  status text,
  payload jsonb,
  result jsonb,
  error_message text,
  attempts numeric,
  max_attempts numeric,
  run_after text,
  started_at text,
  completed_at text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table care_event_jobs enable row level security;
create index if not exists idx_care_event_jobs_home on care_event_jobs(home_id);
drop policy if exists "Tenant isolation" on care_event_jobs;
create policy "Tenant isolation" on care_event_jobs
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());

create table if not exists care_event_routes (
  id text primary key default gen_random_uuid()::text,
  care_event_id text,
  home_id uuid,
  route_type text,
  status text,
  linked_record_id text,
  linked_record_type text,
  error_message text,
  retry_count numeric,
  last_attempted_at text,
  completed_at text,
  created_at timestamptz default now()
);
alter table care_event_routes enable row level security;
create index if not exists idx_care_event_routes_home on care_event_routes(home_id);
drop policy if exists "Tenant isolation" on care_event_routes;
create policy "Tenant isolation" on care_event_routes
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());

create table if not exists care_events (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  staff_id text,
  child_ids jsonb,
  shift_id text,
  category text,
  status text,
  title text,
  body text,
  evidence_prompts_completed boolean,
  routing_preview jsonb,
  routes_completed numeric,
  routes_failed numeric,
  requires_manager_review boolean,
  requires_reg40_triage boolean,
  contributes_to_reg45 boolean,
  contributes_to_annex_a boolean,
  manager_review_by text,
  manager_review_at text,
  manager_review_notes text,
  verified_at text,
  verified_by text,
  locked_at text,
  locked_by text,
  returned_at text,
  returned_by text,
  return_reason text,
  version numeric,
  previous_version_id text,
  amendment_reason text,
  amended_at text,
  amended_by text,
  cara_suggested_category text,
  cara_suggested_routes jsonb,
  cara_suggested_summary text,
  submitted_at text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table care_events enable row level security;
create index if not exists idx_care_events_home on care_events(home_id);
drop policy if exists "Tenant isolation" on care_events;
create policy "Tenant isolation" on care_events
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());

create table if not exists child_daily_summaries (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  child_id text,
  summary_date text,
  care_event_ids jsonb,
  mood_overall text,
  sleep_quality text,
  food_intake text,
  key_events text,
  positives text,
  concerns text,
  staff_notes text,
  education_attended boolean,
  medication_administered boolean,
  review_required boolean,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table child_daily_summaries enable row level security;
create index if not exists idx_child_daily_summaries_home on child_daily_summaries(home_id);
drop policy if exists "Tenant isolation" on child_daily_summaries;
create policy "Tenant isolation" on child_daily_summaries
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());

create table if not exists chronology_entries (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  child_id text,
  date text,
  time text,
  category text,
  title text,
  description text,
  significance text,
  recorded_by text,
  linked_incident_id text,
  created_at timestamptz default now()
);
alter table chronology_entries enable row level security;
create index if not exists idx_chronology_entries_home on chronology_entries(home_id);
drop policy if exists "Tenant isolation" on chronology_entries;
create policy "Tenant isolation" on chronology_entries
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());

create table if not exists document_read_receipts (
  id text primary key default gen_random_uuid()::text,
  document_id text,
  staff_id text,
  read_at text,
  signed_at text
);
alter table document_read_receipts enable row level security;

create table if not exists expenses (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  submitted_by text,
  category text,
  description text,
  amount numeric,
  receipt_url text,
  date text,
  status text,
  approved_by text,
  approved_at text,
  linked_child_id text,
  payment_method text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text
);
alter table expenses enable row level security;
create index if not exists idx_expenses_home on expenses(home_id);
drop policy if exists "Tenant isolation" on expenses;
create policy "Tenant isolation" on expenses
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());

create table if not exists filing_cabinet_items (
  id text primary key default gen_random_uuid()::text,
  care_event_id text,
  home_id uuid,
  child_ids jsonb,
  category text,
  title text,
  summary text,
  file_date text,
  status text,
  verified_at text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table filing_cabinet_items enable row level security;
create index if not exists idx_filing_cabinet_items_home on filing_cabinet_items(home_id);
drop policy if exists "Tenant isolation" on filing_cabinet_items;
create policy "Tenant isolation" on filing_cabinet_items
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());

create table if not exists generic_records (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  record_type text,
  data jsonb,
  child_id text,
  staff_id text,
  created_by text,
  updated_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table generic_records enable row level security;
create index if not exists idx_generic_records_home on generic_records(home_id);
drop policy if exists "Tenant isolation" on generic_records;
create policy "Tenant isolation" on generic_records
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());

create table if not exists leave_requests (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  staff_id text,
  leave_type text,
  start_date text,
  end_date text,
  total_days numeric,
  reason text,
  status text,
  approved_by text,
  approved_at text,
  return_to_work_required boolean,
  return_to_work_completed boolean,
  return_to_work_date text,
  return_to_work_by text,
  return_to_work_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text
);
alter table leave_requests enable row level security;
create index if not exists idx_leave_requests_home on leave_requests(home_id);
drop policy if exists "Tenant isolation" on leave_requests;
create policy "Tenant isolation" on leave_requests
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());

create table if not exists maintenance_items (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  title text,
  category text,
  priority text,
  status text,
  due_date text,
  assigned_to text,
  notes text,
  recurring boolean,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  updated_by text
);
alter table maintenance_items enable row level security;
create index if not exists idx_maintenance_items_home on maintenance_items(home_id);
drop policy if exists "Tenant isolation" on maintenance_items;
create policy "Tenant isolation" on maintenance_items
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());

create table if not exists management_oversight_tasks (
  id text primary key default gen_random_uuid()::text,
  care_event_id text,
  home_id uuid,
  child_ids jsonb,
  category text,
  priority text,
  title text,
  summary text,
  status text,
  assigned_to text,
  due_date text,
  completed_at text,
  completed_by text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table management_oversight_tasks enable row level security;
create index if not exists idx_management_oversight_tasks_home on management_oversight_tasks(home_id);
drop policy if exists "Tenant isolation" on management_oversight_tasks;
create policy "Tenant isolation" on management_oversight_tasks
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());

create table if not exists medication_administrations (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  medication_id text,
  child_id text,
  scheduled_time text,
  actual_time text,
  status text,
  administered_by text,
  witnessed_by text,
  dose_given text,
  reason_not_given text,
  notes text,
  prn_reason text,
  prn_effectiveness text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text
);
alter table medication_administrations enable row level security;
create index if not exists idx_medication_administrations_home on medication_administrations(home_id);
drop policy if exists "Tenant isolation" on medication_administrations;
create policy "Tenant isolation" on medication_administrations
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());

create table if not exists notifications (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  recipient_id text,
  title text,
  body text,
  type text,
  priority text,
  read boolean,
  read_at text,
  action_url text,
  entity_type text,
  entity_id text,
  created_at timestamptz default now()
);
alter table notifications enable row level security;
create index if not exists idx_notifications_home on notifications(home_id);
drop policy if exists "Tenant isolation" on notifications;
create policy "Tenant isolation" on notifications
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());

create table if not exists qa_audits (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  title text,
  category text,
  date text,
  completed_by text,
  score numeric,
  max_score numeric,
  status text,
  findings text,
  actions text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text,
  updated_by text
);
alter table qa_audits enable row level security;
create index if not exists idx_qa_audits_home on qa_audits(home_id);
drop policy if exists "Tenant isolation" on qa_audits;
create policy "Tenant isolation" on qa_audits
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());

create table if not exists reg40_tasks (
  id text primary key default gen_random_uuid()::text,
  care_event_id text,
  home_id uuid,
  category text,
  severity text,
  title text,
  description text,
  status text,
  triage_decision text,
  triage_notes text,
  triaged_by text,
  triaged_at text,
  notification_sent boolean,
  notification_sent_at text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table reg40_tasks enable row level security;
create index if not exists idx_reg40_tasks_home on reg40_tasks(home_id);
drop policy if exists "Tenant isolation" on reg40_tasks;
create policy "Tenant isolation" on reg40_tasks
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());

create table if not exists reg45_evidence_queue (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  care_event_id text,
  suggested_section text,
  suggested_text text,
  status text,
  manager_decision text,
  manager_notes text,
  manager_id text,
  decided_at text,
  approved_text text,
  source_summary text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table reg45_evidence_queue enable row level security;
create index if not exists idx_reg45_evidence_queue_home on reg45_evidence_queue(home_id);
drop policy if exists "Tenant isolation" on reg45_evidence_queue;
create policy "Tenant isolation" on reg45_evidence_queue
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());

create table if not exists saved_time_metrics (
  id text primary key default gen_random_uuid()::text,
  care_event_id text,
  home_id uuid,
  staff_id text,
  routes_count numeric,
  estimated_minutes_saved numeric,
  created_at timestamptz default now()
);
alter table saved_time_metrics enable row level security;
create index if not exists idx_saved_time_metrics_home on saved_time_metrics(home_id);
drop policy if exists "Tenant isolation" on saved_time_metrics;
create policy "Tenant isolation" on saved_time_metrics
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());

create table if not exists supervisions (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  staff_id text,
  supervisor_id text,
  type text,
  scheduled_date text,
  actual_date text,
  duration_minutes numeric,
  status text,
  discussion_points text,
  actions_agreed jsonb,
  wellbeing_score numeric,
  staff_signature boolean,
  supervisor_signature boolean,
  next_date text,
  linked_document_id text,
  cara_assist_used boolean,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text
);
alter table supervisions enable row level security;
create index if not exists idx_supervisions_home on supervisions(home_id);
drop policy if exists "Tenant isolation" on supervisions;
create policy "Tenant isolation" on supervisions
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());

create table if not exists time_saved_entries (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  staff_id text,
  action_type text,
  minutes_saved numeric,
  description text,
  created_at timestamptz default now()
);
alter table time_saved_entries enable row level security;
create index if not exists idx_time_saved_entries_home on time_saved_entries(home_id);
drop policy if exists "Tenant isolation" on time_saved_entries;
create policy "Tenant isolation" on time_saved_entries
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());

create table if not exists vacancies (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  title text,
  role_code text,
  employment_type text,
  contract_type text,
  salary_min numeric,
  salary_max numeric,
  hours numeric,
  shift_pattern text,
  reports_to text,
  safeguarding_statement text,
  status text,
  approval_status text,
  approved_by text,
  approved_at text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text
);
alter table vacancies enable row level security;
create index if not exists idx_vacancies_home on vacancies(home_id);
drop policy if exists "Tenant isolation" on vacancies;
create policy "Tenant isolation" on vacancies
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());

create table if not exists vehicle_checks (
  id text primary key default gen_random_uuid()::text,
  home_id uuid,
  vehicle_id text,
  check_type text,
  check_date text,
  driver text,
  tyres text,
  lights text,
  brakes text,
  mirrors text,
  fluids text,
  wipers text,
  cleanliness text,
  mileage_start numeric,
  mileage_end numeric,
  fuel_level text,
  overall_result text,
  defects text,
  notes text,
  created_at timestamptz default now()
);
alter table vehicle_checks enable row level security;
create index if not exists idx_vehicle_checks_home on vehicle_checks(home_id);
drop policy if exists "Tenant isolation" on vehicle_checks;
create policy "Tenant isolation" on vehicle_checks
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());
