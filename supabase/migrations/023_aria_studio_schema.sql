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

-- ── aria_sources ───────────────────────────────────────────────────────────────
-- Indexes internal evidence that ARIA can use for generation.

create table if not exists aria_sources (
  id                   text primary key default ('src_' || replace(gen_random_uuid()::text, '-', '')),
  home_id              text not null,
  child_id             text,
  staff_id             text,
  linked_record_id     text,
  linked_record_type   text,
  source_type          aria_source_type not null,
  title                text not null,
  summary              text,
  content              text not null,
  extracted_text       text,
  source_date          date not null,
  category             text,
  tags                 jsonb not null default '[]',
  confidentiality_level text not null default 'standard' check (confidentiality_level in ('standard', 'sensitive', 'restricted')),
  approval_status      text not null default 'unverified' check (approval_status in ('approved', 'pending', 'unverified')),
  is_sensitive         boolean not null default false,
  created_by           text not null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  archived_at          timestamptz
);

create index if not exists aria_sources_home_idx on aria_sources (home_id);
create index if not exists aria_sources_child_idx on aria_sources (child_id) where child_id is not null;
create index if not exists aria_sources_type_idx on aria_sources (source_type);
create index if not exists aria_sources_date_idx on aria_sources (source_date desc);

-- ── aria_artifacts ─────────────────────────────────────────────────────────────
-- Stores all ARIA-generated outputs. All are drafts until committed.

create table if not exists aria_artifacts (
  id                         text primary key default ('art_' || replace(gen_random_uuid()::text, '-', '')),
  artifact_type              aria_artifact_type not null,
  title                      text not null,
  status                     aria_artifact_status not null default 'draft',
  child_id                   text,
  home_id                    text not null,
  staff_id                   text,
  incident_id                text,
  linked_record_id           text,
  linked_record_type         text,
  framework                  text not null default 'none',
  tone                       text not null default 'professional',
  creative_mode              text not null default 'balanced',
  generated_content          text not null default '',
  structured_content         jsonb,
  plain_text_content         text,
  quality_score              integer check (quality_score between 0 and 100),
  evidence_confidence_score  integer check (evidence_confidence_score between 0 and 100),
  safeguarding_level         text not null default 'none' check (safeguarding_level in ('none', 'low', 'medium', 'high')),
  regulation_relevance       jsonb not null default '[]',
  source_ids                 jsonb not null default '[]',
  created_by                 text not null,
  reviewed_by                text,
  approved_by                text,
  committed_by               text,
  rejected_by                text,
  created_at                 timestamptz not null default now(),
  submitted_for_review_at    timestamptz,
  reviewed_at                timestamptz,
  approved_at                timestamptz,
  committed_at               timestamptz,
  rejected_at                timestamptz,
  archived_at                timestamptz,
  version_number             integer not null default 1,
  filing_cabinet_path        text,
  official_record_id         text,
  child_voice_present        boolean not null default false,
  quality_checks_passed      boolean not null default false,
  amendment_reason           text
);

create index if not exists aria_artifacts_home_idx on aria_artifacts (home_id);
create index if not exists aria_artifacts_child_idx on aria_artifacts (child_id) where child_id is not null;
create index if not exists aria_artifacts_status_idx on aria_artifacts (status);
create index if not exists aria_artifacts_type_idx on aria_artifacts (artifact_type);
create index if not exists aria_artifacts_created_idx on aria_artifacts (created_at desc);
create index if not exists aria_artifacts_staff_idx on aria_artifacts (created_by);

-- ── aria_artifact_versions ─────────────────────────────────────────────────────
-- Full version history — original AI output preserved even after edits.

create table if not exists aria_artifact_versions (
  id                  text primary key default ('av_' || replace(gen_random_uuid()::text, '-', '')),
  artifact_id         text not null references aria_artifacts(id) on delete cascade,
  version_number      integer not null,
  title               text not null,
  content             text not null,
  structured_content  jsonb,
  change_summary      text not null default 'Initial generation',
  changed_by          text not null,
  changed_at          timestamptz not null default now(),
  previous_version_id text references aria_artifact_versions(id)
);

create index if not exists aria_artifact_versions_artifact_idx on aria_artifact_versions (artifact_id, version_number desc);

-- ── aria_artifact_reviews ──────────────────────────────────────────────────────

create table if not exists aria_artifact_reviews (
  id                text primary key default ('rev_' || replace(gen_random_uuid()::text, '-', '')),
  artifact_id       text not null references aria_artifacts(id) on delete cascade,
  reviewer_id       text not null,
  review_status     text not null check (review_status in ('approved', 'rejected', 'changes_requested')),
  review_comment    text,
  requested_changes text,
  created_at        timestamptz not null default now()
);

create index if not exists aria_artifact_reviews_artifact_idx on aria_artifact_reviews (artifact_id);

-- ── aria_artifact_actions ──────────────────────────────────────────────────────
-- Tasks created from artifacts — each links back to source artifact.

create table if not exists aria_artifact_actions (
  id                  text primary key default ('aac_' || replace(gen_random_uuid()::text, '-', '')),
  artifact_id         text not null references aria_artifacts(id) on delete cascade,
  task_id             text,
  action_title        text not null,
  action_description  text,
  assigned_to         text,
  due_date            date,
  priority            text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  status              text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'overdue')),
  escalation_level    integer not null default 0,
  created_by          text not null,
  created_at          timestamptz not null default now(),
  completed_at        timestamptz,
  reviewed_at         timestamptz
);

create index if not exists aria_artifact_actions_artifact_idx on aria_artifact_actions (artifact_id);
create index if not exists aria_artifact_actions_status_idx on aria_artifact_actions (status);

-- ── aria_quality_checks ────────────────────────────────────────────────────────
-- Run before approval — every check must pass or override recorded.

create table if not exists aria_quality_checks (
  id                         text primary key default ('qc_' || replace(gen_random_uuid()::text, '-', '')),
  artifact_id                text not null references aria_artifacts(id) on delete cascade,
  evidence_cited             boolean not null default false,
  child_voice_considered     boolean not null default false,
  risk_considered            boolean not null default false,
  safeguarding_considered    boolean not null default false,
  regulation_considered      boolean not null default false,
  actions_clear              boolean not null default false,
  owner_assigned             boolean not null default false,
  review_date_set            boolean not null default false,
  human_approval_complete    boolean not null default false,
  sensitive_language_reviewed boolean not null default false,
  no_unsupported_claims      boolean not null default false,
  no_ai_style_filler         boolean not null default false,
  dignity_language_passed    boolean not null default false,
  overall_passed             boolean not null default false,
  issues                     jsonb not null default '[]',
  created_at                 timestamptz not null default now()
);

create index if not exists aria_quality_checks_artifact_idx on aria_quality_checks (artifact_id);

-- ── aria_gaps ──────────────────────────────────────────────────────────────────
-- Evidence gaps and recording quality issues detected by ARIA.

create table if not exists aria_gaps (
  id                   text primary key default ('gap_' || replace(gen_random_uuid()::text, '-', '')),
  home_id              text not null,
  child_id             text,
  staff_id             text,
  gap_type             aria_gap_type not null,
  severity             text not null default 'medium' check (severity in ('low', 'medium', 'high', 'critical')),
  title                text not null,
  description          text not null,
  recommended_action   text not null,
  linked_record_id     text,
  linked_record_type   text,
  status               text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'acknowledged')),
  assigned_to          text,
  due_date             date,
  created_at           timestamptz not null default now(),
  resolved_at          timestamptz
);

create index if not exists aria_gaps_home_idx on aria_gaps (home_id);
create index if not exists aria_gaps_child_idx on aria_gaps (child_id) where child_id is not null;
create index if not exists aria_gaps_status_idx on aria_gaps (status);
create index if not exists aria_gaps_severity_idx on aria_gaps (severity);

-- ── aria_studio_audit_log ──────────────────────────────────────────────────────
-- Every ARIA action is logged — generation, approval, commit, rejection.

create table if not exists aria_studio_audit_log (
  id               text primary key default ('aal_' || replace(gen_random_uuid()::text, '-', '')),
  home_id          text not null,
  actor_id         text not null,
  action_type      aria_audit_action not null,
  artifact_id      text references aria_artifacts(id),
  source_ids       jsonb not null default '[]',
  prompt_summary   text,
  model_provider   text,
  model_name       text,
  before_state     jsonb,
  after_state      jsonb,
  ip_address       text,
  created_at       timestamptz not null default now()
);

create index if not exists aria_studio_audit_home_idx on aria_studio_audit_log (home_id, created_at desc);
create index if not exists aria_studio_audit_artifact_idx on aria_studio_audit_log (artifact_id) where artifact_id is not null;
create index if not exists aria_studio_audit_actor_idx on aria_studio_audit_log (actor_id);

-- ── updated_at triggers ────────────────────────────────────────────────────────

create or replace function update_aria_sources_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists update_aria_sources_updated_at on aria_sources;
create trigger update_aria_sources_updated_at
  before update on aria_sources
  for each row execute function update_aria_sources_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────────────

alter table aria_sources enable row level security;
alter table aria_artifacts enable row level security;
alter table aria_artifact_versions enable row level security;
alter table aria_artifact_reviews enable row level security;
alter table aria_artifact_actions enable row level security;
alter table aria_quality_checks enable row level security;
alter table aria_gaps enable row level security;
alter table aria_studio_audit_log enable row level security;

-- Authenticated users can read sources for their home
create policy if not exists "aria_sources_select" on aria_sources
  for select to authenticated using (true);

-- Authenticated users can read artifacts for their home
create policy if not exists "aria_artifacts_select" on aria_artifacts
  for select to authenticated using (true);

-- Service role can do everything
create policy if not exists "aria_sources_service" on aria_sources
  for all to service_role using (true);
create policy if not exists "aria_artifacts_service" on aria_artifacts
  for all to service_role using (true);
create policy if not exists "aria_artifact_versions_service" on aria_artifact_versions
  for all to service_role using (true);
create policy if not exists "aria_artifact_reviews_service" on aria_artifact_reviews
  for all to service_role using (true);
create policy if not exists "aria_artifact_actions_service" on aria_artifact_actions
  for all to service_role using (true);
create policy if not exists "aria_quality_checks_service" on aria_quality_checks
  for all to service_role using (true);
create policy if not exists "aria_gaps_service" on aria_gaps
  for all to service_role using (true);
create policy if not exists "aria_studio_audit_service" on aria_studio_audit_log
  for all to service_role using (true);

-- ── Seed data ──────────────────────────────────────────────────────────────────
-- Three example artifacts to demonstrate the system.

insert into aria_artifacts (
  id, artifact_type, title, status, child_id, home_id,
  framework, tone, creative_mode,
  generated_content, quality_score, evidence_confidence_score,
  safeguarding_level, regulation_relevance, source_ids,
  created_by, version_number, child_voice_present, quality_checks_passed
) values
(
  'art_demo_001',
  'keywork_session',
  'Keywork session — managing school transitions (Alex)',
  'approved',
  'yp_alex',
  'a0000000-0000-0000-0000-000000000001',
  'pace',
  'warm',
  'therapeutic',
  '## Keywork Session Plan

**Child:** Alex | **Date:** May 2026 | **Framework:** PACE

### Purpose
To explore Alex''s feelings about the upcoming school transition and build a shared plan for managing the change.

### Evidence used
Three recent daily log entries note Alex becoming withdrawn before school days. A risk assessment flags education engagement as a current concern.

### Child voice currently known
Alex has said: "I don''t want to go to a new school." This was recorded during the last keywork session.

### Therapeutic rationale
Using PACE, we aim to hold Alex''s anxiety with curiosity rather than reassurance, helping him feel understood before problem-solving begins.

### Suggested opening
"I know school changes can feel really big. I''m wondering what the hardest bit feels like for you?"

### Scaling question
"If 10 is feeling totally ready and 1 is feeling really scared, where are you today?"

### Follow-up actions
- Arrange a visit to the new school with a familiar staff member
- Update care plan section on education
- Review with manager

**This is an ARIA draft. A human must review and approve before use.**',
  88,
  75,
  'none',
  '[]',
  '[]',
  'staff_darren',
  1,
  true,
  true
),
(
  'art_demo_002',
  'management_oversight',
  'Management oversight — peer conflict pattern (October–November)',
  'committed',
  null,
  'a0000000-0000-0000-0000-000000000001',
  'safeguarding_led',
  'professional',
  'inspection_ready',
  '## Management Oversight Note

**Period:** October–November 2026 | **Framework:** Safeguarding-led

### Evidence reviewed
Seven incident records, two risk assessment reviews, and the monthly home dynamics summary were used to prepare this oversight.

### Child impact analysis
Three children have been involved in peer conflicts this period. Incidents cluster around unsettled evenings and shifts with reduced familiar staffing.

### Risk analysis
Risk of escalation is assessed as medium. There are no current safeguarding referrals but patterns warrant monitoring.

### Regulatory relevance
Two incidents may require consideration for Regulation 40. Reg 45 evidence has been updated.

### Management decisions and actions
1. Staffing consistency review — Action: HR lead — Due: 2 weeks
2. Peer support plan review for all affected young people — Due: 10 days
3. Risk assessments to be updated — Due: 7 days

**Approved by registered manager. Committed to official record.**',
  95,
  88,
  'low',
  '["reg40", "reg45"]',
  '[]',
  'staff_manager',
  1,
  false,
  true
),
(
  'art_demo_003',
  'risk_review',
  'Risk review — missing from care indicators (Maya)',
  'draft',
  'yp_maya',
  'a0000000-0000-0000-0000-000000000001',
  'safeguarding_led',
  'professional',
  'conservative',
  '## Risk Review — Missing From Care

**Child:** Maya | **Date:** May 2026

**ARIA draft — requires human review before any action is taken.**

### Current risk summary
Maya has had two missing episodes in the past four weeks. Both returns were within three hours. Return home conversations were completed.

### Recent indicators
- Increased secrecy around phone use (noted in 4 daily logs)
- Reluctance to attend education (3 days missed this week)
- Emotional presentation described as "flat" by night staff

### Protective factors
- Strong relationship with key worker
- Consistent engagement with therapeutic sessions
- Supportive family contact

### Possible escalation signs to watch
- Overnight missing episodes
- New adults appearing in contact
- Unexplained money or gifts
- Withdrawal from trusted adults

### Recommended actions (for manager review)
1. Update risk assessment — required within 5 days
2. CSE screening review — consider request
3. Next return home conversation to include exploitation screening questions
4. Update key worker plan

**This is an ARIA-generated draft. A manager must review and approve all content before any action is taken.**',
  0,
  55,
  'high',
  '["reg45", "annex_a"]',
  '[]',
  'staff_anna',
  1,
  false,
  false
)
on conflict (id) do nothing;
