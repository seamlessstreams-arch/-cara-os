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

-- ── 1. Staff profiles ────────────────────────────────────────────────────────
-- Lightweight HR profile keyed against existing staff records. The HR module
-- holds HR-specific fields; canonical name/role lives in the existing staff
-- table.

create table if not exists hr_staff_profiles (
  staff_id              text primary key,
  home_id               text,
  employment_type       text not null check (employment_type in (
                          'permanent','bank','temporary','agency','volunteer','student_placement'
                        )),
  start_date            date,
  end_date              date,
  contract_hours        numeric(5, 2),
  contract_type         text,
  approved_for_unsupervised boolean not null default false,
  approved_at           timestamptz,
  approved_by           text,
  approval_notes        text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

drop trigger if exists trg_hr_staff_profiles_updated_at on hr_staff_profiles;
create trigger trg_hr_staff_profiles_updated_at
  before update on hr_staff_profiles
  for each row execute function set_updated_at_hr();

-- ── 2. Safer recruitment ─────────────────────────────────────────────────────

create table if not exists hr_safer_recruitment (
  id                          text primary key,
  staff_id                    text not null,
  home_id                     text,
  application_form_complete   boolean not null default false,
  employment_history_full     boolean not null default false,
  gaps_explored               boolean not null default false,
  gaps_explanation            text,
  identity_check_status       text default 'pending' check (identity_check_status in ('pending','complete','failed')),
  right_to_work_status        text default 'pending' check (right_to_work_status in ('pending','complete','expired','failed')),
  enhanced_dbs_status         text default 'pending' check (enhanced_dbs_status in ('pending','submitted','clear','flagged','expired')),
  enhanced_dbs_number         text,
  enhanced_dbs_issued         date,
  enhanced_dbs_renewal_due    date,
  barred_list_check_status    text default 'pending' check (barred_list_check_status in ('pending','complete','failed','not_required')),
  barred_list_complete_at     timestamptz,
  references_received_count   integer not null default 0,
  references_verified_count   integer not null default 0,
  interview_notes_present     boolean not null default false,
  values_based_interview_done boolean not null default false,
  qualification_check_done    boolean not null default false,
  health_declaration_complete boolean not null default false,
  recruitment_risk_assessment text,
  induction_plan_present      boolean not null default false,
  manager_sign_off            boolean not null default false,
  manager_signed_off_by       text,
  manager_signed_off_at       timestamptz,
  senior_risk_acceptance      boolean not null default false,
  senior_risk_acceptance_text text,
  senior_risk_acceptance_by   text,
  senior_risk_acceptance_at   timestamptz,
  status                      text not null default 'in_progress' check (status in ('in_progress','complete','blocked','withdrawn')),
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index if not exists idx_hr_safer_recruitment_staff on hr_safer_recruitment(staff_id);
create index if not exists idx_hr_safer_recruitment_status on hr_safer_recruitment(status);
drop trigger if exists trg_hr_safer_recruitment_updated_at on hr_safer_recruitment;
create trigger trg_hr_safer_recruitment_updated_at
  before update on hr_safer_recruitment
  for each row execute function set_updated_at_hr();

-- ── 3. HR cases (the core employee-relations table) ──────────────────────────

create table if not exists hr_cases (
  id                          text primary key,
  staff_id                    text not null,
  home_id                     text,
  case_type                   text not null check (case_type in (
                                'disciplinary','grievance','capability','sickness_absence','probation',
                                'conduct','gross_misconduct','bullying_harassment','whistleblowing',
                                'suspension','safeguarding_allegation','professional_boundaries',
                                'medication_error','poor_recording','staff_conflict','union_involvement',
                                'appeal','informal_concern','restorative'
                              )),
  case_owner                  text,
  concern_summary             text not null,
  risk_level                  text not null default 'amber' check (risk_level in ('green','amber','red','black')),
  safeguarding_status         text not null default 'not_safeguarding' check (safeguarding_status in (
                                'not_safeguarding','possible_safeguarding','safeguarding_open',
                                'lado_consulted','lado_substantiated','lado_unsubstantiated',
                                'lado_unfounded','lado_malicious'
                              )),
  child_impact_status         text not null default 'unknown' check (child_impact_status in (
                                'no_impact','possible_impact','direct_impact','unknown'
                              )),
  status                      text not null default 'open' check (status in (
                                'open','investigation','suspended','meeting_scheduled','outcome_pending',
                                'awaiting_appeal','closed','withdrawn'
                              )),
  opened_at                   timestamptz not null default now(),
  closed_at                   timestamptz,
  closure_summary             text,
  learning_actions            jsonb not null default '[]',
  policy_links                jsonb not null default '[]',
  regulation_links            jsonb not null default '[]',
  rationale_for_closure       text,
  ri_oversight_required       boolean not null default false,
  ri_oversight_completed_at   timestamptz,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index if not exists idx_hr_cases_staff on hr_cases(staff_id);
create index if not exists idx_hr_cases_home on hr_cases(home_id);
create index if not exists idx_hr_cases_type on hr_cases(case_type);
create index if not exists idx_hr_cases_status on hr_cases(status);
create index if not exists idx_hr_cases_safeguarding on hr_cases(safeguarding_status);
drop trigger if exists trg_hr_cases_updated_at on hr_cases;
create trigger trg_hr_cases_updated_at
  before update on hr_cases
  for each row execute function set_updated_at_hr();

-- ── 4. Case actions, chronology, evidence, decisions ─────────────────────────

create table if not exists hr_case_actions (
  id            text primary key,
  case_id       text not null references hr_cases(id) on delete cascade,
  action_type   text not null check (action_type in (
                  'note','meeting','letter_drafted','letter_sent','evidence_added',
                  'witness_statement','investigation_step','suspension_decision',
                  'lado_referral','ofsted_notification','la_notification',
                  'union_communication','outcome_decision','appeal_lodged','appeal_outcome',
                  'risk_assessment_update','restriction_imposed','restriction_lifted'
                )),
  title         text not null,
  detail        text,
  performed_by  text not null,
  performed_at  timestamptz not null default now(),
  attachments   jsonb not null default '[]',
  created_at    timestamptz not null default now()
);

create index if not exists idx_hr_case_actions_case on hr_case_actions(case_id);
create index if not exists idx_hr_case_actions_at on hr_case_actions(performed_at);

create table if not exists hr_case_chronology (
  id              text primary key,
  case_id         text not null references hr_cases(id) on delete cascade,
  occurred_at     timestamptz not null,
  entry_type      text not null check (entry_type in (
                    'concern_raised','immediate_action','child_safeguarded','manager_informed',
                    'ri_informed','lado_considered','lado_referred','staff_informed',
                    'evidence_gathered','meeting_held','letter_issued','decision_made',
                    'appeal_received','appeal_outcome','learning_action','closure'
                  )),
  summary         text not null,
  significance    text not null default 'routine' check (significance in ('routine','significant','critical')),
  recorded_by     text not null,
  source_action_id text references hr_case_actions(id) on delete set null,
  created_at      timestamptz not null default now()
);

create index if not exists idx_hr_chronology_case on hr_case_chronology(case_id);
create index if not exists idx_hr_chronology_at on hr_case_chronology(occurred_at);

-- ── 5. Letters and document drafts ───────────────────────────────────────────

create table if not exists hr_letters (
  id              text primary key,
  case_id         text references hr_cases(id) on delete cascade,
  staff_id        text not null,
  letter_type     text not null check (letter_type in (
                    'investigation_invite','witness_invite','disciplinary_invite',
                    'grievance_invite','suspension','suspension_review','no_further_action',
                    'informal_concern','written_warning','final_written_warning','dismissal',
                    'appeal_invite','appeal_outcome','probation_review','probation_extension',
                    'probation_confirmation','failed_probation','sickness_meeting',
                    'welfare_meeting','occupational_health_referral','return_to_work_outcome',
                    'capability_meeting','performance_improvement_plan','mediation_invite',
                    'whistleblowing_acknowledgement','safeguarding_allegation_holding'
                  )),
  status          text not null default 'aria_draft' check (status in (
                    'aria_draft','manager_review','approved','sent','withdrawn'
                  )),
  draft_body      text not null,
  approved_body   text,
  approved_by     text,
  approved_at     timestamptz,
  sent_at         timestamptz,
  guardian_review_id text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_hr_letters_case on hr_letters(case_id);
create index if not exists idx_hr_letters_staff on hr_letters(staff_id);
create index if not exists idx_hr_letters_status on hr_letters(status);
drop trigger if exists trg_hr_letters_updated_at on hr_letters;
create trigger trg_hr_letters_updated_at
  before update on hr_letters
  for each row execute function set_updated_at_hr();

-- ── 6. ARIA HR Process Guardian reviews ─────────────────────────────────────
-- Same pattern as oversight_reviews and voice_summaries from migrations 010
-- and 011. Drafts only; manager decision is audit-logged.

create table if not exists hr_process_guardian_reviews (
  id                              text primary key,
  case_id                         text references hr_cases(id) on delete set null,
  staff_id                        text,
  home_id                         text,
  draft_subject                   text not null,
  draft_action_type               text not null check (draft_action_type in (
                                    'investigation_invite','witness_invite','disciplinary_invite',
                                    'grievance_invite','suspension','suspension_review',
                                    'written_warning','final_written_warning','dismissal',
                                    'appeal_outcome','probation_outcome','sickness_meeting',
                                    'capability_meeting','no_further_action',
                                    'safeguarding_allegation_response','generic_hr_action'
                                  )),
  draft_body                      text not null,

  status                          text not null default 'draft' check (status in (
                                    'draft','approved','rejected','rewrite_requested'
                                  )),
  fairness_score                  integer not null check (fairness_score between 0 and 100),
  fairness_judgement              text not null check (fairness_judgement in (
                                    'safe_to_approve','review_recommended','do_not_approve_yet'
                                  )),

  acas_alignment                  jsonb not null default '{}',
  safeguarding_alignment          jsonb not null default '{}',
  discrimination_risk             jsonb not null default '{}',
  proportionality                 jsonb not null default '{}',
  rights_check                    jsonb not null default '{}',
  evidence_quality                jsonb not null default '{}',
  wording_risk                    jsonb not null default '{}',
  prejudgment_signals             jsonb not null default '[]',

  flags                           jsonb not null default '[]',
  suggested_safer_wording         text,
  suggested_actions               jsonb not null default '[]',
  regulatory_links                jsonb not null default '[]',

  rejection_reason                text,
  rewrite_instructions            text,
  approved_by                     text,
  approved_at                     timestamptz,
  rejected_by                     text,
  rejected_at                     timestamptz,

  aria_confidence                 numeric(3, 2) not null check (aria_confidence between 0 and 1),
  llm_used                        boolean not null default false,
  engine_version                  text not null,

  generated_at                    timestamptz not null default now(),
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now()
);

create index if not exists idx_hr_pgr_case on hr_process_guardian_reviews(case_id);
create index if not exists idx_hr_pgr_staff on hr_process_guardian_reviews(staff_id);
create index if not exists idx_hr_pgr_status on hr_process_guardian_reviews(status);
create index if not exists idx_hr_pgr_judgement on hr_process_guardian_reviews(fairness_judgement);
drop trigger if exists trg_hr_pgr_updated_at on hr_process_guardian_reviews;
create trigger trg_hr_pgr_updated_at
  before update on hr_process_guardian_reviews
  for each row execute function set_updated_at_hr();

create table if not exists hr_process_guardian_audit_log (
  id            text primary key,
  review_id     text not null references hr_process_guardian_reviews(id) on delete cascade,
  actor_user_id text,
  actor_role    text,
  event_type    text not null check (event_type in (
                  'draft_generated','viewed','edited','approved','rejected','rewrite_requested'
                )),
  event_detail  jsonb not null default '{}',
  created_at    timestamptz not null default now()
);

create index if not exists idx_hr_pgr_audit_review on hr_process_guardian_audit_log(review_id);

-- ── 7. RM/RI oversight reviews on HR matters ────────────────────────────────
-- Distinct from hr_process_guardian_reviews. The Process Guardian reviews
-- a draft action; this table records the manager's full oversight on a
-- closed or significant case.

create table if not exists hr_oversight_reviews (
  id                              text primary key,
  case_id                         text not null references hr_cases(id) on delete cascade,
  reviewer_user_id                text not null,
  reviewer_role                   text not null,
  what_happened                   text not null,
  child_impact                    text,
  fairness_reflection             text,
  action_taken                    text,
  learning                        text,
  what_will_change                text,
  responsible_person              text,
  review_date                     date,
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now()
);

create index if not exists idx_hr_oversight_case on hr_oversight_reviews(case_id);
drop trigger if exists trg_hr_oversight_updated_at on hr_oversight_reviews;
create trigger trg_hr_oversight_updated_at
  before update on hr_oversight_reviews
  for each row execute function set_updated_at_hr();

-- ── 8. Probation pathway ─────────────────────────────────────────────────────

create table if not exists hr_probation (
  id                              text primary key,
  staff_id                        text not null,
  start_date                      date not null,
  end_date_target                 date not null,
  three_month_review              jsonb not null default '{}',
  six_month_review                jsonb not null default '{}',
  induction_complete              boolean not null default false,
  shadow_shifts_complete          boolean not null default false,
  training_competencies           jsonb not null default '{}',
  medication_competency           text default 'not_assessed' check (medication_competency in ('not_assessed','developing','competent','not_yet_competent')),
  recording_competency            text default 'not_assessed' check (recording_competency in ('not_assessed','developing','competent','not_yet_competent')),
  safeguarding_competency         text default 'not_assessed' check (safeguarding_competency in ('not_assessed','developing','competent','not_yet_competent')),
  behaviour_support_competency    text default 'not_assessed' check (behaviour_support_competency in ('not_assessed','developing','competent','not_yet_competent')),
  understanding_of_plans          text default 'not_assessed' check (understanding_of_plans in ('not_assessed','developing','competent','not_yet_competent')),
  supervision_evidence_count      integer not null default 0,
  concerns                        jsonb not null default '[]',
  support_offered                 jsonb not null default '[]',
  outcome                         text default 'in_progress' check (outcome in (
                                    'in_progress','confirmed','extended','failed'
                                  )),
  outcome_decided_at              timestamptz,
  outcome_decided_by              text,
  outcome_rationale               text,
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now()
);

create index if not exists idx_hr_probation_staff on hr_probation(staff_id);
create index if not exists idx_hr_probation_outcome on hr_probation(outcome);
drop trigger if exists trg_hr_probation_updated_at on hr_probation;
create trigger trg_hr_probation_updated_at
  before update on hr_probation
  for each row execute function set_updated_at_hr();

-- ── 9. Sickness episodes ─────────────────────────────────────────────────────

create table if not exists hr_sickness_episodes (
  id                              text primary key,
  staff_id                        text not null,
  start_date                      date not null,
  end_date                        date,
  reason_category                 text,
  fit_note_received               boolean not null default false,
  return_to_work_completed        boolean not null default false,
  return_to_work_date             date,
  triggers_breached               jsonb not null default '[]',
  stress_risk_assessment_done     boolean not null default false,
  occupational_health_referred    boolean not null default false,
  welfare_meeting_held            boolean not null default false,
  disability_related              boolean not null default false,
  pregnancy_related               boolean not null default false,
  reasonable_adjustments          jsonb not null default '[]',
  long_term                       boolean not null default false,
  phased_return                   boolean not null default false,
  capability_invoked              boolean not null default false,
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now()
);

create index if not exists idx_hr_sickness_staff on hr_sickness_episodes(staff_id);
create index if not exists idx_hr_sickness_open on hr_sickness_episodes(end_date) where end_date is null;
drop trigger if exists trg_hr_sickness_updated_at on hr_sickness_episodes;
create trigger trg_hr_sickness_updated_at
  before update on hr_sickness_episodes
  for each row execute function set_updated_at_hr();

-- ── 10. Supervision themes (intelligence) ────────────────────────────────────

create table if not exists hr_supervision_themes (
  id                              text primary key,
  staff_id                        text not null,
  theme                           text not null check (theme in (
                                    'poor_recording','lateness','low_confidence','weak_boundaries',
                                    'over_familiarity','poor_reflection','staff_conflict','burnout',
                                    'emotional_fatigue','training_need','concern_with_specific_child',
                                    'lack_of_professional_curiosity','other'
                                  )),
  first_observed_at               timestamptz not null,
  most_recent_observed_at         timestamptz not null,
  occurrence_count                integer not null default 1,
  source_supervision_ids          jsonb not null default '[]',
  status                          text not null default 'active' check (status in ('active','resolved','escalated')),
  resolved_at                     timestamptz,
  resolution_summary              text,
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now()
);

create index if not exists idx_hr_supervision_themes_staff on hr_supervision_themes(staff_id);
create index if not exists idx_hr_supervision_themes_theme on hr_supervision_themes(theme);
drop trigger if exists trg_hr_supervision_themes_updated_at on hr_supervision_themes;
create trigger trg_hr_supervision_themes_updated_at
  before update on hr_supervision_themes
  for each row execute function set_updated_at_hr();

-- ── 11. Agency staff compliance ──────────────────────────────────────────────

create table if not exists hr_agency_compliance (
  id                              text primary key,
  agency_worker_name              text not null,
  agency_name                     text not null,
  agency_worker_ref               text,
  identity_verified               boolean not null default false,
  dbs_confirmed                   boolean not null default false,
  dbs_number                      text,
  barred_list_confirmed           boolean not null default false,
  right_to_work_confirmed         boolean not null default false,
  references_received             boolean not null default false,
  training_evidence_received      boolean not null default false,
  experience_summary              text,
  induction_complete              boolean not null default false,
  familiarisation_with_plans      boolean not null default false,
  restrictions                    jsonb not null default '[]',
  manager_approved                boolean not null default false,
  manager_approved_by             text,
  manager_approved_at             timestamptz,
  blocked_from_future_shifts      boolean not null default false,
  block_reason                    text,
  blocked_by                      text,
  blocked_at                      timestamptz,
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now()
);

create table if not exists hr_agency_shift_feedback (
  id                              text primary key,
  agency_compliance_id            text not null references hr_agency_compliance(id) on delete cascade,
  shift_date                      date not null,
  punctuality                     text check (punctuality in ('excellent','good','poor','no_show')),
  engagement                      text check (engagement in ('excellent','good','adequate','poor')),
  recording_quality               text check (recording_quality in ('excellent','good','adequate','poor','not_completed')),
  followed_plans                  text check (followed_plans in ('fully','partially','not_observed','no')),
  professionalism                 text check (professionalism in ('excellent','good','adequate','concerning')),
  concerns                        jsonb not null default '[]',
  use_again                       boolean,
  recorded_by                     text not null,
  created_at                      timestamptz not null default now()
);

create index if not exists idx_hr_agency_compliance_blocked on hr_agency_compliance(blocked_from_future_shifts);
create index if not exists idx_hr_agency_feedback_compliance on hr_agency_shift_feedback(agency_compliance_id);
drop trigger if exists trg_hr_agency_compliance_updated_at on hr_agency_compliance;
create trigger trg_hr_agency_compliance_updated_at
  before update on hr_agency_compliance
  for each row execute function set_updated_at_hr();

-- ── 12. Exit interviews ──────────────────────────────────────────────────────

create table if not exists hr_exit_interviews (
  id                              text primary key,
  staff_id                        text not null,
  leaving_date                    date not null,
  reason_for_leaving              text,
  safeguarding_concerns_raised    boolean not null default false,
  culture_concerns_raised         boolean not null default false,
  management_concerns_raised      boolean not null default false,
  workload_concerns_raised        boolean not null default false,
  pay_concerns_raised             boolean not null default false,
  rota_concerns_raised            boolean not null default false,
  bullying_harassment_raised      boolean not null default false,
  unresolved_issues               text,
  final_debrief_completed         boolean not null default false,
  property_returned               boolean not null default false,
  system_access_removed           boolean not null default false,
  recorded_by                     text,
  created_at                      timestamptz not null default now()
);

create index if not exists idx_hr_exit_interviews_staff on hr_exit_interviews(staff_id);

-- ── 13. Tasks and reminders ──────────────────────────────────────────────────

create table if not exists hr_tasks (
  id                              text primary key,
  case_id                         text references hr_cases(id) on delete cascade,
  staff_id                        text,
  task_type                       text not null check (task_type in (
                                    'probation_review','supervision','appraisal','dbs_renewal',
                                    'training_renewal','investigation_deadline','suspension_review',
                                    'sickness_review','lado_follow_up','appeal_deadline',
                                    'letter_approval','evidence_upload','ri_review','other'
                                  )),
  title                           text not null,
  detail                          text,
  due_date                        date,
  assigned_to                     text,
  status                          text not null default 'open' check (status in ('open','in_progress','complete','cancelled')),
  completed_at                    timestamptz,
  completed_by                    text,
  created_by                      text,
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now()
);

create index if not exists idx_hr_tasks_due on hr_tasks(due_date);
create index if not exists idx_hr_tasks_status on hr_tasks(status);
create index if not exists idx_hr_tasks_assigned on hr_tasks(assigned_to);
drop trigger if exists trg_hr_tasks_updated_at on hr_tasks;
create trigger trg_hr_tasks_updated_at
  before update on hr_tasks
  for each row execute function set_updated_at_hr();

-- ── 14. Audit log (every view, edit, export, delete) ────────────────────────

create table if not exists hr_audit_log (
  id              text primary key,
  entity_type     text not null,
  entity_id       text not null,
  actor_user_id   text not null,
  actor_role      text,
  event_type      text not null check (event_type in (
                    'created','viewed','edited','exported','deleted','approved','rejected',
                    'sent','signed_off','escalated','restricted_access','rights_assertion'
                  )),
  event_detail    jsonb not null default '{}',
  ip_address      text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_hr_audit_entity on hr_audit_log(entity_type, entity_id);
create index if not exists idx_hr_audit_actor on hr_audit_log(actor_user_id);
create index if not exists idx_hr_audit_event on hr_audit_log(event_type);
create index if not exists idx_hr_audit_created on hr_audit_log(created_at);

-- ══════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- Service role: full access. Authenticated users: read-only by default. The
-- application layer (src/lib/hr/permissions.ts) is responsible for narrowing
-- visibility per role and per home / per staff member. Adding stricter RLS
-- policies that consume claims from auth.jwt() is recommended once the role
-- mapping is finalised in production.
-- ══════════════════════════════════════════════════════════════════════════════

do $$
declare t text;
begin
  for t in select unnest(array[
    'hr_staff_profiles','hr_safer_recruitment','hr_cases','hr_case_actions',
    'hr_case_chronology','hr_letters','hr_process_guardian_reviews',
    'hr_process_guardian_audit_log','hr_oversight_reviews','hr_probation',
    'hr_sickness_episodes','hr_supervision_themes','hr_agency_compliance',
    'hr_agency_shift_feedback','hr_exit_interviews','hr_tasks','hr_audit_log'
  ]) loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy %I on %I for all to service_role using (true) with check (true)',
      'service_role_full_access_' || t, t
    );
    execute format(
      'create policy %I on %I for select to authenticated using (true)',
      'authenticated_read_' || t, t
    );
  end loop;
exception when duplicate_object then
  -- Re-running migration: policies already exist, no-op.
  null;
end $$;

-- ══════════════════════════════════════════════════════════════════════════════
-- COMMENTS for inspectors and future maintainers
-- ══════════════════════════════════════════════════════════════════════════════

comment on table hr_cases is 'Core HR case record. Status flow: open -> investigation/meeting_scheduled/suspended -> outcome_pending -> awaiting_appeal? -> closed. Every state change should be reflected in hr_case_actions and hr_case_chronology.';
comment on table hr_process_guardian_reviews is 'ARIA HR Process Guardian draft analyses of HR actions. Drafts only. Manager decision is audit-logged in hr_process_guardian_audit_log.';
comment on table hr_audit_log is 'Append-only HR audit trail. Inspector-ready evidence of access, decisions, exports and deletions.';
comment on column hr_cases.safeguarding_status is 'Safeguarding pathway state. lado_consulted means LADO advice was sought and recorded; the four lado_* outcome states reflect LADO conclusions.';
comment on column hr_cases.child_impact_status is 'Child impact lens applied to every HR case as required by section 9 of the spec.';
