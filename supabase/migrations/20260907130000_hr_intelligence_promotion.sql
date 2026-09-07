-- ═══════════════════════════════════════════════════════════════════════════
-- HR INTELLIGENCE PROMOTION — the HR case/letters/guardian schema, made live.
--
-- Promoted from migrations_archive/012_hr_intelligence_schema.sql (the 8
-- tables the code queries; 012's other 9 stay archived, unused). Two columns
-- added from the code's contract (hr_audit_log.outcome, guardian reviews'
-- cara_confidence). The archive's CHECK constraints are dropped — its
-- hr_letters vocabulary was pre-rebrand ('aria_draft') while the code writes
-- 'cara_draft', so a raw promotion would have rejected every letter insert.
-- Judgement/observation defaults are STRIPPED (recruitment-check booleans,
-- 'pending' check statuses, risk_level 'amber', safeguarding_status
-- 'not_safeguarding', significance 'routine', reference counts): a column
-- default must not answer a judgement — absence stays absent.
--
-- Conventions per persist_typed_tables. APPLIED MANUALLY after merge
-- (fifth pending live migration).
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists hr_staff_profiles (
  -- 012 keys this table by staff_id (one profile per staff member)
  staff_id text primary key,
  home_id uuid,
  employment_type text,
  start_date date,
  end_date date,
  contract_hours numeric,
  contract_type text,
  approved_for_unsupervised boolean,
  approved_at timestamptz,
  approved_by text,
  approval_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table hr_staff_profiles enable row level security;
create index if not exists idx_hr_staff_profiles_home on hr_staff_profiles(home_id);
drop policy if exists "Tenant isolation" on hr_staff_profiles;
create policy "Tenant isolation" on hr_staff_profiles
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());
create index if not exists idx_hr_staff_profiles_staff_id on hr_staff_profiles(staff_id);

create table if not exists hr_safer_recruitment (
  id text primary key default gen_random_uuid()::text,
  staff_id text,
  home_id uuid,
  application_form_complete boolean,
  employment_history_full boolean,
  gaps_explored boolean,
  gaps_explanation text,
  identity_check_status text,
  right_to_work_status text,
  enhanced_dbs_status text,
  enhanced_dbs_number text,
  enhanced_dbs_issued date,
  enhanced_dbs_renewal_due date,
  barred_list_check_status text,
  barred_list_complete_at timestamptz,
  references_received_count integer,
  references_verified_count integer,
  interview_notes_present boolean,
  values_based_interview_done boolean,
  qualification_check_done boolean,
  health_declaration_complete boolean,
  recruitment_risk_assessment text,
  induction_plan_present boolean,
  manager_sign_off boolean,
  manager_signed_off_by text,
  manager_signed_off_at timestamptz,
  senior_risk_acceptance boolean,
  senior_risk_acceptance_text text,
  senior_risk_acceptance_by text,
  senior_risk_acceptance_at timestamptz,
  status text default 'in_progress',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table hr_safer_recruitment enable row level security;
create index if not exists idx_hr_safer_recruitment_home on hr_safer_recruitment(home_id);
drop policy if exists "Tenant isolation" on hr_safer_recruitment;
create policy "Tenant isolation" on hr_safer_recruitment
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());
create index if not exists idx_hr_safer_recruitment_staff_id on hr_safer_recruitment(staff_id);

create table if not exists hr_cases (
  id text primary key default gen_random_uuid()::text,
  staff_id text,
  home_id uuid,
  case_type text,
  case_owner text,
  concern_summary text,
  risk_level text,
  safeguarding_status text,
  child_impact_status text,
  status text default 'open',
  opened_at timestamptz default now(),
  closed_at timestamptz,
  closure_summary text,
  learning_actions jsonb default '[]'::jsonb,
  policy_links jsonb default '[]'::jsonb,
  regulation_links jsonb default '[]'::jsonb,
  rationale_for_closure text,
  ri_oversight_required boolean,
  ri_oversight_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table hr_cases enable row level security;
create index if not exists idx_hr_cases_home on hr_cases(home_id);
drop policy if exists "Tenant isolation" on hr_cases;
create policy "Tenant isolation" on hr_cases
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());
create index if not exists idx_hr_cases_staff_id on hr_cases(staff_id);

-- hr_case_actions is read ONLY through the embedded select
-- `hr_cases.select("*, hr_case_actions(*), …")` — embeds resolve through real
-- FK constraints, so this unit keeps them (the one deviation from the no-FK
-- convention, and the reason the two child tables reference hr_cases).
create table if not exists hr_case_actions (
  id text primary key default gen_random_uuid()::text,
  case_id text references hr_cases(id) on delete cascade,
  action_type text,
  title text,
  detail text,
  performed_by text,
  performed_at timestamptz,
  attachments jsonb,
  created_at timestamptz not null default now()
);

alter table hr_case_actions enable row level security;
create index if not exists idx_hr_case_actions_case_id on hr_case_actions(case_id);

create table if not exists hr_case_chronology (
  id text primary key default gen_random_uuid()::text,
  case_id text references hr_cases(id) on delete cascade,
  occurred_at timestamptz,
  entry_type text,
  summary text,
  significance text,
  recorded_by text,
  source_action_id text,
  created_at timestamptz not null default now()
);

alter table hr_case_chronology enable row level security;
create index if not exists idx_hr_case_chronology_case_id on hr_case_chronology(case_id);

create table if not exists hr_letters (
  id text primary key default gen_random_uuid()::text,
  case_id text,
  staff_id text,
  letter_type text,
  status text,
  draft_body text,
  approved_body text,
  approved_by text,
  approved_at timestamptz,
  sent_at timestamptz,
  guardian_review_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table hr_letters enable row level security;
create index if not exists idx_hr_letters_staff_id on hr_letters(staff_id);
create index if not exists idx_hr_letters_case_id on hr_letters(case_id);

create table if not exists hr_process_guardian_reviews (
  id text primary key default gen_random_uuid()::text,
  case_id text,
  staff_id text,
  home_id uuid,
  draft_subject text,
  draft_action_type text,
  draft_body text,
  status text default 'draft',
  fairness_score integer,
  fairness_judgement text,
  acas_alignment jsonb default '{}'::jsonb,
  safeguarding_alignment jsonb default '{}'::jsonb,
  discrimination_risk jsonb default '{}'::jsonb,
  proportionality jsonb default '{}'::jsonb,
  rights_check jsonb default '{}'::jsonb,
  evidence_quality jsonb default '{}'::jsonb,
  wording_risk jsonb default '{}'::jsonb,
  prejudgment_signals jsonb default '[]'::jsonb,
  flags jsonb default '[]'::jsonb,
  suggested_safer_wording text,
  suggested_actions jsonb default '[]'::jsonb,
  regulatory_links jsonb default '[]'::jsonb,
  rejection_reason text,
  rewrite_instructions text,
  approved_by text,
  approved_at timestamptz,
  rejected_by text,
  rejected_at timestamptz,
  aria_confidence numeric,
  llm_used boolean,
  engine_version text,
  generated_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cara_confidence numeric
);

alter table hr_process_guardian_reviews enable row level security;
create index if not exists idx_hr_process_guardian_reviews_home on hr_process_guardian_reviews(home_id);
drop policy if exists "Tenant isolation" on hr_process_guardian_reviews;
create policy "Tenant isolation" on hr_process_guardian_reviews
  using (home_id = get_my_home_id()) with check (home_id = get_my_home_id());
create index if not exists idx_hr_process_guardian_reviews_staff_id on hr_process_guardian_reviews(staff_id);
create index if not exists idx_hr_process_guardian_reviews_case_id on hr_process_guardian_reviews(case_id);

create table if not exists hr_process_guardian_audit_log (
  id text primary key default gen_random_uuid()::text,
  review_id text,
  actor_user_id text,
  actor_role text,
  event_type text,
  event_detail jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table hr_process_guardian_audit_log enable row level security;

create table if not exists hr_audit_log (
  id text primary key default gen_random_uuid()::text,
  entity_type text,
  entity_id text,
  actor_user_id text,
  actor_role text,
  event_type text,
  event_detail jsonb default '{}'::jsonb,
  ip_address text,
  created_at timestamptz not null default now(),
  outcome text
);

alter table hr_audit_log enable row level security;
