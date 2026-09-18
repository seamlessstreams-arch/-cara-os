-- ══════════════════════════════════════════════════════════════════════════════
-- Restore the tables that API routes query DIRECTLY — bypassing the dual-mode
-- dal — which the July lean baseline therefore left behind.
--
-- WHY. 54 routes call createServerClient().from("<table>") behind an
-- `if (!isSupabaseEnabled()) return empty` guard. In demo the query never
-- runs; on the first live tenant it answers 503 "storage is not set up in this
-- environment" (storage-error.ts). Their tables were never in the persistence
-- manifest, which is what the July baseline was assembled from. The 29 Aug
-- ratchet (check-storage-migrations.js) enrolled them as known-broken.
--
-- HOW THIS FILE WAS BUILT — not by hand. The archived migrations were replayed
-- through a real Postgres (PGlite 17) on top of the live baseline; a statement
-- is emitted only if it (a) executed successfully and (b) targets one of the
-- tables below. INSERTs (demo seed) are never emitted. The aria_→cara_ rebrand
-- is applied to the tables whose code was renamed but whose SQL was not. RLS
-- policies replay in archive order (015 → 016 → 421 → 423) so the hardened
-- versions win. Then VERIFIED on a fresh Postgres: applies as one script with
-- no error; 25/25 tables present; RLS enabled on 25/25; column parity with the
-- replay reference 0-diff; no policy with USING (true) visible to PUBLIC.
--
-- RESTORED (25): cara_outputs, cara_requests, cara_transcriptions, child_outcome_snapshots, child_progress_entries, child_progress_goals, child_voice_entries, early_access_requests, incident_learning_reviews, inspection_evidence_items, manager_attention_items, oversight_actions, oversight_audit_log, oversight_reviews, provider_home_summaries, reg44_actions, reg44_visits, reg45_reviews, scheduled_occurrences, smart_record_links, staff_competence_records, staff_profiles, task_templates, voice_summaries, voice_summary_audit_log
--
-- Six of those have RLS enabled and no policies — reachable by the service
-- role only, which is how their routes read them: cara_requests,
-- cara_transcriptions, early_access_requests, scheduled_occurrences,
-- staff_profiles, task_templates.
--
-- DELIBERATELY NOT RESTORED, and why (the routes needing these keep 503ing):
--   · cara_rota_alerts, cara_write_to_child, cara_insights, cs_missing_episodes,
--     cara_context_links — their archived DDL has foreign keys to `staff` /
--     `cs_homes`, tables from an earlier schema generation that never reached
--     production (live has staff_members / homes). cara_context_links is also
--     defined twice in the archive with different columns; the code reads the
--     second shape. Rewriting those FKs would be authoring, not restoring.
--   · cara_sessions, cara_messages, cara_routes, cara_orchestration_approvals,
--     cara_orchestration_evidence, cara_safety_reviews, cara_cost_logs,
--     cara_user_feedback — 373_aria_orchestration.sql creates them inside one
--     DO $$ block and never enables RLS. They hold AI transcripts that name
--     children; they are not going live without row security.
--   · cara_feedback — created without RLS.
--   · cara_task_links — carries a "Users can view task links" policy with
--     USING (true) and no TO clause, i.e. readable by anon. 423 missed it.
--   · 48 further tables (mostly api/cara/*) have NO CREATE TABLE under any name
--     in any migration, archived or not. They need a code decision.
--
-- KNOWN CODE DRIFT the restore does not fix (one-line route fixes, separate):
--   · intelligence/reg44: filters reg44_visits on `status`; column is
--     `report_status`. Unfiltered list works; ?status= errors.
--   · intelligence/oversight: orders provider_home_summaries by `summary_date`;
--     the columns are `period_start` / `period_end`. That route stays broken
--     until it is changed.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── from 010_management_oversight_engine.sql ──
-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — ARIA MANAGEMENT OVERSIGHT ENGINE SCHEMA
-- Migration 010: oversight_reviews, oversight_actions, oversight_audit_log
--
-- Purpose: persist Aria-suggested management oversight drafts for completed
-- care records, the suggested follow-up actions they generate, and a tamper-
-- evident audit trail of every manager decision (approve / edit / reject /
-- request_rewrite). Every oversight starts as "draft" and only a human can
-- approve it.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── oversight_reviews ────────────────────────────────────────────────────────

create table if not exists oversight_reviews (
  id                          text primary key,
  record_id                   text not null,
  record_type                 text not null check (record_type in (
                                'daily_log','shift_debrief','incident_report',
                                'missing_from_care','disclosure','safeguarding',
                                'medication','key_work','education','health',
                                'complaint','consequence_restorative',
                                'room_search','family_time'
                              )),
  child_id                    text,
  home_id                     text,

  status                      text not null default 'draft' check (status in (
                                'draft','approved','rejected','rewrite_requested'
                              )),

  oversight_draft             text not null,
  ofsted_summary              text not null,

  quality_score               integer not null check (quality_score between 0 and 100),
  risk_level                  text not null check (risk_level in ('low','medium','high','critical')),
  practice_judgement          text not null check (practice_judgement in (
                                'strong','adequate','unclear','requires_improvement'
                              )),

  child_voice_visible         boolean not null,
  plan_links_visible          boolean not null,
  plan_links                  jsonb not null default '[]',

  requires_manager_escalation boolean not null default false,
  escalation_reason           text,

  missing_evidence            jsonb not null default '[]',
  strengths                   jsonb not null default '[]',
  regulatory_links            jsonb not null default '[]',

  aria_confidence             numeric(3, 2) not null check (aria_confidence between 0 and 1),
  llm_used                    boolean not null default false,
  engine_version              text not null,

  rejection_reason            text,
  rewrite_instructions        text,

  approved_by                 text,
  approved_at                 timestamptz,
  rejected_by                 text,
  rejected_at                 timestamptz,

  generated_at                timestamptz not null default now(),
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);
-- ── oversight_actions ────────────────────────────────────────────────────────
-- Suggested follow-up actions attached to an oversight review. The manager
-- can promote any of these into a real task in the wider Cornerstone task
-- system; until then they live here.

create table if not exists oversight_actions (
  id              text primary key,
  review_id       text not null references oversight_reviews(id) on delete cascade,
  title           text not null,
  description     text not null,
  priority        text not null check (priority in ('urgent','high','medium','low')),
  due_days        integer not null,
  assigned_role   text not null,
  approved        boolean not null default false,
  approved_by     text,
  approved_at     timestamptz,
  promoted_task_id text,
  created_at      timestamptz not null default now()
);
-- ── oversight_audit_log ──────────────────────────────────────────────────────
-- Tamper-evident record of every event in a review's lifecycle. Append-only
-- by RLS policy. Inspectors can rely on this trail.

create table if not exists oversight_audit_log (
  id            text primary key,
  review_id     text not null references oversight_reviews(id) on delete cascade,
  actor_user_id text,
  actor_role    text,
  event_type    text not null check (event_type in (
                  'draft_generated','viewed','edited','approved','rejected',
                  'rewrite_requested','action_promoted'
                )),
  event_detail  jsonb not null default '{}',
  created_at    timestamptz not null default now()
);

-- ── from 011_voice_of_child_summariser.sql ──
-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — ARIA VOICE OF THE CHILD SUMMARISER SCHEMA
-- Migration 011: voice_summaries, voice_summary_audit_log
--
-- Purpose: persist Aria-suggested voice-of-the-child summaries that aggregate
-- a child's voice across multiple records (daily logs, key work, 1:1s,
-- complaints, RHIs, family time, etc.) along with a tamper-evident audit
-- trail of every manager decision.
--
-- Companion to migration 010 (Management Oversight Engine). Same compliance
-- posture: drafts are not final until a human approves; every state change
-- is audit-logged.
--
-- Regulatory basis: UNCRC Articles 12 + 13, Children Act 1989 s.22(4),
-- Children's Homes Regs 2015 Reg 7 + Reg 11 (Quality Standard 1), SCCIF
-- Children's Experience.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── voice_summaries ──────────────────────────────────────────────────────────

create table if not exists voice_summaries (
  id                              text primary key,
  child_id                        text not null,
  child_pseudonym                 text,
  home_id                         text,

  status                          text not null default 'draft' check (status in (
                                    'draft','approved','rejected','rewrite_requested'
                                  )),

  narrative_draft                 text not null,
  ofsted_summary                  text not null,

  themes_present                  jsonb not null default '[]',
  themes_absent                   jsonb not null default '[]',
  direct_quotes                   jsonb not null default '[]',
  paraphrased_expressions         jsonb not null default '[]',

  what_child_appears_to_want      jsonb not null default '[]',
  what_child_appears_to_need      jsonb not null default '[]',
  what_child_appears_to_fear      jsonb not null default '[]',
  rights_or_wishes_unmet          jsonb not null default '[]',

  per_record_contributions        jsonb not null default '[]',
  overall_voice_capture_quality   text not null check (overall_voice_capture_quality in (
                                    'strong','adequate','weak','absent'
                                  )),

  suggested_actions               jsonb not null default '[]',
  regulatory_links                jsonb not null default '[]',

  records_considered              integer not null check (records_considered >= 0),
  period_start                    date,
  period_end                      date,

  aria_confidence                 numeric(3, 2) not null check (aria_confidence between 0 and 1),
  llm_used                        boolean not null default false,
  engine_version                  text not null,

  rejection_reason                text,
  rewrite_instructions            text,

  approved_by                     text,
  approved_at                     timestamptz,
  rejected_by                     text,
  rejected_at                     timestamptz,

  generated_at                    timestamptz not null default now(),
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now()
);
-- ── voice_summary_audit_log ─────────────────────────────────────────────────
-- Append-only audit trail of every event in a summary's lifecycle.

create table if not exists voice_summary_audit_log (
  id            text primary key,
  summary_id    text not null references voice_summaries(id) on delete cascade,
  actor_user_id text,
  actor_role    text,
  event_type    text not null check (event_type in (
                  'draft_generated','viewed','edited','approved','rejected',
                  'rewrite_requested','shared_with_child'
                )),
  event_detail  jsonb not null default '{}',
  created_at    timestamptz not null default now()
);

-- ── from 013_aria_universal_layer.sql ──
-- ── cara_requests ────────────────────────────────────────────────────────────
-- Every Aria invocation writes one row here. This is the front door.

create table if not exists cara_requests (
  id                  text primary key,
  organisation_id     text,
  home_id             text,
  child_id            text,
  staff_id            text,
  source_module       text,
  source_record_type  text,
  source_record_id    text,
  command_id          text not null,
  user_id             text not null,
  user_role           text,
  input_text          text,
  input_metadata      jsonb not null default '{}',
  status              text not null default 'created' check (status in (
                        'created','context_built','provider_called','provider_failed',
                        'permission_denied','complete'
                      )),
  llm_used            boolean not null default false,
  provider_id         text,
  model_id            text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
-- ── cara_outputs ─────────────────────────────────────────────────────────────
-- The draft generated by Aria for the request, plus the manager's edits.

create table if not exists cara_outputs (
  id                      text primary key,
  request_id              text not null references cara_requests(id) on delete cascade,
  generated_text          text not null,
  structured_output       jsonb not null default '{}',
  edited_text             text,
  approval_required       boolean,
  status                  text not null default 'draft' check (status in (
                            'draft','edited','submitted_for_approval','approved',
                            'committed','rejected','archived'
                          )),
  confidence              text not null default 'medium' check (confidence in ('low','medium','high')),
  approved_by             text,
  approved_at             timestamptz,
  rejected_by             text,
  rejected_at             timestamptz,
  rejection_reason        text,
  committed_record_type   text,
  committed_record_id     text,
  redacted_context_summary text,
  context_record_ids      jsonb not null default '[]',
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
-- ── cara_transcriptions ──────────────────────────────────────────────────────
-- Voice dictation transcripts. Audio is discarded after transcription unless
-- a lawful audio-storage pattern is configured at deployment.

create table if not exists cara_transcriptions (
  id              text primary key,
  user_id         text not null,
  organisation_id text,
  home_id         text,
  source_module   text,
  source_field    text,
  duration_ms     integer,
  bytes           integer,
  mime_type       text,
  transcript_text text not null,
  provider_id     text,
  model_id        text,
  status          text not null default 'complete' check (status in ('complete','failed')),
  error_detail    text,
  inserted_into_field boolean not null default false,
  used_in_request_id text references cara_requests(id) on delete set null,
  created_at      timestamptz not null default now()
);

-- ── from 015_intelligence_layer_schema.sql ──
-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE INTELLIGENCE LAYER — SCHEMA
-- Migration 015
--
-- Tables for 10 intelligence modules:
--   1. Manager Control Centre (attention items)
--   2. Ofsted Evidence Room (evidence items, links, packs)
--   3. Child Progress & Outcomes Engine (goals, entries, snapshots)
--   4. Regulation 44 / 45 Quality Assurance (visits, actions, reviews)
--   5. Incident-to-Learning Loop (learning reviews)
--   6. Cross-System Smart Linking (record links)
--   7. Staff Competence Passport (competencies, restrictions)
--   8. Voice of the Child Portal (entries)
--   9. RI / Provider Oversight Dashboard (home summaries)
--  10. Intelligence audit log (unified)
--
-- All tables follow existing Cornerstone patterns:
--   - UUID primary keys
--   - home_id for per-home scoping
--   - created_by / created_at / updated_at
--   - RLS enabled, service role full access
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. Manager attention items ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS manager_attention_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id         uuid NOT NULL,
  title           text NOT NULL,
  category        text NOT NULL,
  urgency         text NOT NULL DEFAULT 'medium'
                    CHECK (urgency IN ('low','medium','high','critical')),
  child_id        uuid,
  staff_id        uuid,
  source_record_type text NOT NULL,
  source_record_id   uuid,
  reason          text,
  suggested_action text,
  due_date        date,
  status          text NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open','in_progress','reviewed','escalated','closed')),
  assigned_to     uuid,
  reviewed_by     uuid,
  reviewed_at     timestamptz,
  escalated_to    text,
  escalated_at    timestamptz,
  aria_draft_id   uuid,
  created_by      uuid,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
-- ── 2. Ofsted Evidence Room ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS inspection_evidence_items (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id             uuid NOT NULL,
  child_id            uuid,
  staff_id            uuid,
  source_type         text NOT NULL,
  source_id           uuid,
  title               text NOT NULL,
  summary             text,
  evidence_category   text NOT NULL,
  judgement_area       text,
  regulation_reference text,
  confidence_score    numeric,
  evidence_date       date,
  created_by          uuid,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
-- ── 3. Child Progress & Outcomes ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS child_progress_goals (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id          uuid NOT NULL,
  home_id           uuid NOT NULL,
  goal_area         text NOT NULL,
  title             text NOT NULL,
  description       text,
  starting_point    text,
  desired_outcome   text,
  plan_actions      text,
  responsible_people text[],
  status            text NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active','achieved','paused','closed')),
  target_date       date,
  created_by        uuid,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS child_progress_entries (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id              uuid NOT NULL,
  home_id               uuid NOT NULL,
  goal_id               uuid REFERENCES child_progress_goals(id),
  entry_date            date NOT NULL,
  area                  text NOT NULL,
  what_happened         text NOT NULL,
  impact_on_child       text,
  evidence_source_type  text,
  evidence_source_id    uuid,
  manager_analysis      text,
  aria_suggested_analysis text,
  approved_by           uuid,
  approved_at           timestamptz,
  created_by            uuid,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS child_outcome_snapshots (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id                uuid NOT NULL,
  home_id                 uuid NOT NULL,
  snapshot_date           date NOT NULL,
  education_score         integer,
  health_score            integer,
  emotional_wellbeing_score integer,
  safety_score            integer,
  relationships_score     integer,
  independence_score      integer,
  engagement_score        integer,
  summary                 text,
  created_by              uuid,
  created_at              timestamptz NOT NULL DEFAULT now()
);
-- ── 4. Regulation 44 / 45 ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reg44_visits (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                 uuid NOT NULL,
  visit_date              date NOT NULL,
  visitor_name            text NOT NULL,
  report_status           text NOT NULL DEFAULT 'draft'
                            CHECK (report_status IN ('draft','submitted','reviewed','closed')),
  summary                 text,
  strengths               text,
  concerns                text,
  children_views_summary  text,
  staff_views_summary     text,
  manager_response        text,
  ri_response             text,
  created_by              uuid,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS reg44_actions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id          uuid NOT NULL REFERENCES reg44_visits(id),
  home_id           uuid NOT NULL,
  title             text NOT NULL,
  description       text,
  priority          text NOT NULL DEFAULT 'medium'
                      CHECK (priority IN ('low','medium','high','urgent')),
  assigned_to       uuid,
  due_date          date,
  status            text NOT NULL DEFAULT 'open'
                      CHECK (status IN ('open','in_progress','completed','overdue','cancelled')),
  manager_response  text,
  completed_at      timestamptz,
  evidence_item_id  uuid,
  created_by        uuid,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS reg45_reviews (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                     uuid NOT NULL,
  period_start                date NOT NULL,
  period_end                  date NOT NULL,
  status                      text NOT NULL DEFAULT 'draft'
                                CHECK (status IN ('draft','in_progress','submitted','approved','published')),
  quality_of_care_summary     text,
  children_experiences_summary text,
  outcomes_summary            text,
  safeguarding_summary        text,
  leadership_summary          text,
  strengths                   text,
  weaknesses                  text,
  improvement_actions         text,
  children_views              text,
  parents_views               text,
  placing_authority_views     text,
  staff_views                 text,
  generated_by                uuid,
  approved_by                 uuid,
  approved_at                 timestamptz,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);
-- ── 5. Incident-to-Learning Loop ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS incident_learning_reviews (
  id                              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id                     uuid NOT NULL,
  home_id                         uuid NOT NULL,
  child_id                        uuid,
  review_status                   text NOT NULL DEFAULT 'required'
                                    CHECK (review_status IN ('required','in_progress','completed','not_required')),
  manager_oversight               text,
  aria_suggested_analysis         text,
  trigger_analysis                text,
  what_worked                     text,
  what_did_not_work               text,
  impact_on_child                 text,
  staff_debrief_required          boolean NOT NULL DEFAULT false,
  child_keywork_required          boolean NOT NULL DEFAULT false,
  risk_assessment_review_required boolean,
  placement_plan_review_required  boolean NOT NULL DEFAULT false,
  notification_review_required    boolean NOT NULL DEFAULT false,
  learning_summary                text,
  actions_created                 boolean NOT NULL DEFAULT false,
  approved_by                     uuid,
  approved_at                     timestamptz,
  created_by                      uuid,
  created_at                      timestamptz NOT NULL DEFAULT now(),
  updated_at                      timestamptz NOT NULL DEFAULT now()
);
-- ── 7. Smart record links ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS smart_record_links (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id         uuid NOT NULL,
  source_type     text NOT NULL,
  source_id       uuid NOT NULL,
  target_type     text NOT NULL,
  target_id       uuid NOT NULL,
  relationship    text NOT NULL,
  suggested_by    text NOT NULL DEFAULT 'system',
  approved_by     uuid,
  approved_at     timestamptz,
  created_by      uuid,
  created_at      timestamptz NOT NULL DEFAULT now()
);
-- ── 8. Staff competence passport ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS staff_competence_records (
  id                            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id                      uuid NOT NULL,
  home_id                       uuid NOT NULL,
  safer_recruitment_complete    boolean NOT NULL DEFAULT false,
  dbs_status                    text NOT NULL DEFAULT 'not_started'
                                  CHECK (dbs_status IN ('not_started','applied','current','due_renewal','expired')),
  dbs_date                      date,
  dbs_update_service            boolean NOT NULL DEFAULT false,
  references_received           boolean NOT NULL DEFAULT false,
  reference_count               integer NOT NULL DEFAULT 0,
  right_to_work                 boolean NOT NULL DEFAULT false,
  induction_complete            boolean NOT NULL DEFAULT false,
  induction_date                date,
  probation_status              text NOT NULL DEFAULT 'not_started'
                                  CHECK (probation_status IN ('not_started','in_progress','passed','extended','failed')),
  probation_end_date            date,
  level3_status                 text NOT NULL DEFAULT 'not_started'
                                  CHECK (level3_status IN ('not_started','enrolled','in_progress','achieved','exempt')),
  mandatory_training_complete   boolean NOT NULL DEFAULT false,
  safeguarding_training_date    date,
  medication_competency         boolean NOT NULL DEFAULT false,
  medication_competency_date    date,
  physical_intervention_trained boolean NOT NULL DEFAULT false,
  physical_intervention_date    date,
  last_supervision_date         date,
  supervision_frequency_weeks   integer NOT NULL DEFAULT 6,
  last_appraisal_date           date,
  can_lead_shift                boolean NOT NULL DEFAULT false,
  can_administer_medication     boolean NOT NULL DEFAULT false,
  can_lone_work                 boolean NOT NULL DEFAULT false,
  can_supervise_others          boolean NOT NULL DEFAULT false,
  restrictions                  text[],
  compliments                   text[],
  performance_concerns          text[],
  role_competencies             jsonb NOT NULL DEFAULT '{}',
  created_by                    uuid,
  created_at                    timestamptz NOT NULL DEFAULT now(),
  updated_at                    timestamptz NOT NULL DEFAULT now()
);
-- ── 9. Voice of the Child ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS child_voice_entries (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id            uuid NOT NULL,
  home_id             uuid NOT NULL,
  entry_date          date NOT NULL,
  category            text NOT NULL,
  child_words         text,
  summary             text,
  action_taken        text,
  staff_response      text,
  manager_review      text,
  linked_record_type  text,
  linked_record_id    uuid,
  created_by          uuid,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
-- ── 10. Provider oversight summaries ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS provider_home_summaries (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                     uuid NOT NULL,
  period_start                date NOT NULL,
  period_end                  date NOT NULL,
  inspection_readiness_score  integer,
  open_risks_count            integer NOT NULL DEFAULT 0,
  serious_incidents_count     integer NOT NULL DEFAULT 0,
  safeguarding_themes         text[],
  reg44_status                text,
  reg45_status                text,
  overdue_actions_count       integer NOT NULL DEFAULT 0,
  supervision_compliance_pct  numeric,
  training_compliance_pct     numeric,
  recruitment_compliance_pct  numeric,
  complaints_open             integer NOT NULL DEFAULT 0,
  missing_episodes            integer NOT NULL DEFAULT 0,
  placement_stability_pct     numeric,
  manager_oversight_pct       numeric,
  aria_risk_flags             text[],
  ri_oversight_notes          text,
  ri_reviewed_at              timestamptz,
  ri_reviewed_by              uuid,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

-- ── from 022_aria_universal_tables.sql ──
-- ══════════════════════════════════════════════════════════════════════════════
-- 1. ARIA REQUESTS
-- Every Aria command invocation creates a request row.
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cara_requests (
  id                  text PRIMARY KEY,
  organisation_id     uuid,
  home_id             uuid,
  child_id            uuid,
  staff_id            uuid,
  source_module       text,
  source_record_type  text,
  source_record_id    text,
  command_id          text NOT NULL,
  user_id             text NOT NULL,
  user_role           text NOT NULL,
  input_text          text,
  input_metadata      jsonb DEFAULT '{}',
  status              text NOT NULL DEFAULT 'pending'
                      CHECK (status IN (
                        'pending','context_built','complete','provider_failed','cancelled'
                      )),
  llm_used            boolean NOT NULL DEFAULT false,
  provider_id         text,
  model_id            text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
-- ══════════════════════════════════════════════════════════════════════════════
-- 2. ARIA OUTPUTS
-- The generated draft and its lifecycle through approval and commit.
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cara_outputs (
  id                     text PRIMARY KEY,
  request_id             text REFERENCES cara_requests(id),
  generated_text         text NOT NULL,
  structured_output      jsonb DEFAULT '{}',
  edited_text            text,
  status                 text NOT NULL DEFAULT 'draft'
                         CHECK (status IN (
                           'draft','edited','submitted_for_approval','approved',
                           'committed','rejected','archived'
                         )),
  approval_required      boolean,
  confidence             text NOT NULL DEFAULT 'medium'
                         CHECK (confidence IN ('low','medium','high')),
  redacted_context_summary text,
  context_record_ids     text[] DEFAULT '{}',
  approved_by            text,
  approved_at            timestamptz,
  rejected_by            text,
  rejected_at            timestamptz,
  rejection_reason       text,
  committed_record_type  text,
  committed_record_id    text,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);
-- ══════════════════════════════════════════════════════════════════════════════
-- 4. ARIA TRANSCRIPTIONS
-- Record of every voice transcription request.
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cara_transcriptions (
  id              text PRIMARY KEY,
  organisation_id uuid,
  home_id         uuid,
  user_id         text NOT NULL,
  user_role       text NOT NULL,
  source_module   text,
  source_field    text,
  file_name       text,
  mime_type       text,
  file_size_bytes integer,
  duration_ms     integer,
  transcript      text,
  llm_used        boolean NOT NULL DEFAULT false,
  provider_id     text,
  model_id        text,
  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','complete','failed')),
  error_message   text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ── from 376_quality_ecology_permissions.sql ──
-- ══════════════════════════════════════════════════════════════════════════════
-- Migration 376: Quality Ecology & Permissions System Tables
--
-- Core tables for:
--   1. Staff profiles with RBAC roles and home assignments
--   2. Task templates (scheduled form definitions)
--   3. Scheduled occurrences (lifecycle-tracked form instances)
--   4. Record amendments (immutable addendums to locked records)
--   5. QA samples and reviews
--   6. Audit log (immutable event trail)
--   7. Delegated scopes and temporary grants
--   8. Escalation events
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Staff Profiles (extends auth.users) ────────────────────────────────────

CREATE TABLE IF NOT EXISTS staff_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'rsw',
  organisation_id TEXT NOT NULL DEFAULT 'org-1',
  home_ids TEXT[] DEFAULT '{}',
  assigned_child_ids TEXT[] DEFAULT '{}',
  employment_status TEXT NOT NULL DEFAULT 'active',
  shift_active BOOLEAN DEFAULT true,
  safeguarding_need_to_know TEXT[] DEFAULT '{}',
  display_name TEXT,
  job_title TEXT,
  start_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
-- ── Task Templates ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  version INTEGER DEFAULT 1,

  -- Schedule
  schedule_frequency TEXT NOT NULL,
  schedule_days INTEGER[] DEFAULT '{}',
  schedule_dates INTEGER[] DEFAULT '{}',
  schedule_time TEXT,
  event_triggers TEXT[] DEFAULT '{}',

  -- Roles
  completion_roles TEXT[] DEFAULT '{}',
  check_role TEXT,
  approval_role TEXT,
  approval_level INTEGER DEFAULT 0,

  -- Timing
  due_time_minutes INTEGER,
  grace_period_minutes INTEGER DEFAULT 30,
  reminder_minutes_before INTEGER DEFAULT 15,

  -- Escalation
  first_escalation_minutes INTEGER DEFAULT 60,
  first_escalation_to TEXT DEFAULT 'team_leader',
  second_escalation_minutes INTEGER,
  second_escalation_to TEXT,
  critical_escalation_after_missed INTEGER,

  -- Quality
  requires_evidence BOOLEAN DEFAULT false,
  requires_child_voice BOOLEAN DEFAULT false,
  requires_manager_review BOOLEAN DEFAULT false,
  qa_required BOOLEAN DEFAULT false,
  qa_sample_percentage INTEGER DEFAULT 10,
  aria_review_required BOOLEAN DEFAULT false,

  -- Filing
  filing_location TEXT,
  evidence_tags TEXT[] DEFAULT '{}',
  regulation_links TEXT[] DEFAULT '{}',
  quality_standard_links TEXT[] DEFAULT '{}',
  feeds_annex_a BOOLEAN DEFAULT false,
  feeds_reg44 BOOLEAN DEFAULT false,
  feeds_reg45 BOOLEAN DEFAULT false,
  ofsted_category TEXT,

  -- Configuration
  sensitivity TEXT DEFAULT 'internal',
  self_approval_allowed BOOLEAN DEFAULT false,
  locks_after_approval BOOLEAN DEFAULT true,
  retention_category TEXT DEFAULT '6_years',

  -- Status
  active BOOLEAN DEFAULT true,
  home_ids TEXT[] DEFAULT '{}',
  child_specific BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
-- ── Scheduled Occurrences ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS scheduled_occurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES task_templates(id),
  template_name TEXT NOT NULL,

  -- Assignment
  assigned_to TEXT,
  assigned_at TIMESTAMPTZ,
  home_id TEXT NOT NULL,
  child_id TEXT,

  -- Timing
  due_date DATE NOT NULL,
  due_time TEXT,
  grace_expires_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ DEFAULT now(),

  -- Status
  status TEXT NOT NULL DEFAULT 'scheduled',
  status_history JSONB DEFAULT '[]',

  -- Completion
  completed_by TEXT,
  completed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,

  -- Checking
  checked_by TEXT,
  checked_at TIMESTAMPTZ,
  check_outcome TEXT,
  check_notes TEXT,

  -- Return
  returned_at TIMESTAMPTZ,
  return_reason TEXT,
  returned_by TEXT,
  resubmitted_at TIMESTAMPTZ,
  resubmission_count INTEGER DEFAULT 0,

  -- Approval
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  approval_level INTEGER DEFAULT 0,

  -- QA
  qa_required BOOLEAN DEFAULT false,
  qa_sampled_by TEXT,
  qa_sampled_at TIMESTAMPTZ,
  qa_score INTEGER,
  qa_findings TEXT,

  -- Filing
  locked_at TIMESTAMPTZ,
  filed_at TIMESTAMPTZ,
  filing_location TEXT,
  evidence_tags TEXT[] DEFAULT '{}',

  -- Escalation
  escalation_level INTEGER DEFAULT 0,
  escalated_at TIMESTAMPTZ,
  escalated_to TEXT,
  escalation_reason TEXT,

  -- Aria
  aria_reviewed BOOLEAN DEFAULT false,
  aria_quality_score INTEGER,
  aria_suggestions JSONB DEFAULT '[]',

  -- Content (for locking)
  content_hash TEXT,
  form_data JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── from 407_early_access_requests.sql ──
-- ══════════════════════════════════════════════════════════════════════════════
-- Early Access / Contact form submissions — durable persistence
--
-- Backs the public website's early-access / "book a conversation" form
-- (POST /api/v1/early-access). The API route writes via the service-role client
-- (which bypasses RLS); submissions are also held in the in-memory store so the
-- demo never loses one. RLS is enabled so the anon key cannot read submissions.
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS early_access_requests (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  organisation     TEXT,
  role             TEXT,
  email            TEXT NOT NULL,
  number_of_homes  TEXT,
  looking_for      TEXT,
  source           TEXT NOT NULL DEFAULT 'website',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- ── Row-level security ───────────────────────────────────────────────────────

alter table oversight_reviews   enable row level security;
alter table oversight_actions   enable row level security;
alter table oversight_audit_log enable row level security;
-- ── Row-level security ──────────────────────────────────────────────────────

alter table voice_summaries          enable row level security;
alter table voice_summary_audit_log  enable row level security;
ALTER TABLE manager_attention_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_evidence_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_progress_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_progress_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_outcome_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE reg44_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE reg44_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reg45_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_learning_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_record_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_competence_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_voice_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_home_summaries ENABLE ROW LEVEL SECURITY;
-- ══════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE cara_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE cara_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cara_transcriptions ENABLE ROW LEVEL SECURITY;
-- ── RLS Policies ───────────────────────────────────────────────────────────

ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_occurrences ENABLE ROW LEVEL SECURITY;
-- RLS on: no public policies, so only the service-role key (used by the API
-- route) can read or write. Submissions are never exposed to the anon client.
ALTER TABLE early_access_requests ENABLE ROW LEVEL SECURITY;
create index if not exists idx_oversight_reviews_record on oversight_reviews(record_id);
create index if not exists idx_oversight_reviews_child  on oversight_reviews(child_id);
create index if not exists idx_oversight_reviews_home   on oversight_reviews(home_id);
create index if not exists idx_oversight_reviews_status on oversight_reviews(status);
create index if not exists idx_oversight_reviews_risk   on oversight_reviews(risk_level);
create index if not exists idx_oversight_actions_review on oversight_actions(review_id);
create index if not exists idx_oversight_audit_review on oversight_audit_log(review_id);
create index if not exists idx_oversight_audit_actor  on oversight_audit_log(actor_user_id);
create index if not exists idx_oversight_audit_type   on oversight_audit_log(event_type);
create index if not exists idx_voice_summaries_child   on voice_summaries(child_id);
create index if not exists idx_voice_summaries_home    on voice_summaries(home_id);
create index if not exists idx_voice_summaries_status  on voice_summaries(status);
create index if not exists idx_voice_summaries_period  on voice_summaries(period_start, period_end);
create index if not exists idx_voice_audit_summary on voice_summary_audit_log(summary_id);
create index if not exists idx_voice_audit_actor   on voice_summary_audit_log(actor_user_id);
create index if not exists idx_voice_audit_type    on voice_summary_audit_log(event_type);
create index if not exists idx_aria_requests_command on cara_requests(command_id);
create index if not exists idx_aria_requests_user on cara_requests(user_id);
create index if not exists idx_aria_requests_home on cara_requests(home_id);
create index if not exists idx_aria_requests_child on cara_requests(child_id);
create index if not exists idx_aria_requests_status on cara_requests(status);
create index if not exists idx_aria_requests_source on cara_requests(source_module, source_record_id);
create index if not exists idx_aria_outputs_request on cara_outputs(request_id);
create index if not exists idx_aria_outputs_status on cara_outputs(status);
create index if not exists idx_aria_transcriptions_user on cara_transcriptions(user_id);
create index if not exists idx_aria_transcriptions_request on cara_transcriptions(used_in_request_id);
-- ── Indices ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_mai_home_status ON manager_attention_items(home_id, status);
CREATE INDEX IF NOT EXISTS idx_mai_urgency ON manager_attention_items(urgency);
CREATE INDEX IF NOT EXISTS idx_iei_home_category ON inspection_evidence_items(home_id, evidence_category);
CREATE INDEX IF NOT EXISTS idx_iei_child ON inspection_evidence_items(child_id);
CREATE INDEX IF NOT EXISTS idx_cpg_child ON child_progress_goals(child_id);
CREATE INDEX IF NOT EXISTS idx_cpe_child ON child_progress_entries(child_id);
CREATE INDEX IF NOT EXISTS idx_cos_child ON child_outcome_snapshots(child_id);
CREATE INDEX IF NOT EXISTS idx_r44v_home ON reg44_visits(home_id);
CREATE INDEX IF NOT EXISTS idx_r44a_visit ON reg44_actions(visit_id);
CREATE INDEX IF NOT EXISTS idx_r45r_home ON reg45_reviews(home_id);
CREATE INDEX IF NOT EXISTS idx_ilr_incident ON incident_learning_reviews(incident_id);
CREATE INDEX IF NOT EXISTS idx_srl_source ON smart_record_links(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_srl_target ON smart_record_links(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_scr_staff ON staff_competence_records(staff_id);
CREATE INDEX IF NOT EXISTS idx_cve_child ON child_voice_entries(child_id);
CREATE INDEX IF NOT EXISTS idx_phs_home ON provider_home_summaries(home_id);

-- ── from 016_intelligence_rls_policies.sql ──
-- Unique constraint for upsert
CREATE UNIQUE INDEX IF NOT EXISTS idx_scr_staff_home ON staff_competence_records(staff_id, home_id);
-- ══════════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ══════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_aria_requests_org       ON cara_requests(organisation_id);
CREATE INDEX IF NOT EXISTS idx_aria_requests_home      ON cara_requests(home_id);
CREATE INDEX IF NOT EXISTS idx_aria_requests_child     ON cara_requests(child_id);
CREATE INDEX IF NOT EXISTS idx_aria_requests_user      ON cara_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_aria_requests_command   ON cara_requests(command_id);
CREATE INDEX IF NOT EXISTS idx_aria_requests_module    ON cara_requests(source_module);
CREATE INDEX IF NOT EXISTS idx_aria_requests_status    ON cara_requests(status);
CREATE INDEX IF NOT EXISTS idx_aria_requests_created   ON cara_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_aria_outputs_request    ON cara_outputs(request_id);
CREATE INDEX IF NOT EXISTS idx_aria_outputs_status     ON cara_outputs(status);
CREATE INDEX IF NOT EXISTS idx_aria_transcriptions_user ON cara_transcriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_user_id ON staff_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_role ON staff_profiles(role);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_home_ids ON staff_profiles USING GIN(home_ids);
CREATE INDEX IF NOT EXISTS idx_task_templates_active ON task_templates(active);
CREATE INDEX IF NOT EXISTS idx_task_templates_category ON task_templates(category);
CREATE INDEX IF NOT EXISTS idx_task_templates_frequency ON task_templates(schedule_frequency);
CREATE INDEX IF NOT EXISTS idx_sched_occ_status ON scheduled_occurrences(status);
CREATE INDEX IF NOT EXISTS idx_sched_occ_home ON scheduled_occurrences(home_id);
CREATE INDEX IF NOT EXISTS idx_sched_occ_template ON scheduled_occurrences(template_id);
CREATE INDEX IF NOT EXISTS idx_sched_occ_due ON scheduled_occurrences(due_date);
CREATE INDEX IF NOT EXISTS idx_sched_occ_assigned ON scheduled_occurrences(assigned_to);
CREATE INDEX IF NOT EXISTS idx_sched_occ_completed_by ON scheduled_occurrences(completed_by);
CREATE INDEX IF NOT EXISTS idx_early_access_created ON early_access_requests (created_at);
drop trigger if exists trg_oversight_reviews_updated_at on oversight_reviews;
DROP TRIGGER IF EXISTS trg_oversight_reviews_updated_at ON oversight_reviews;
create trigger trg_oversight_reviews_updated_at
  before update on oversight_reviews
  for each row
  execute function set_updated_at_oversight_reviews();
drop trigger if exists trg_voice_summaries_updated_at on voice_summaries;
DROP TRIGGER IF EXISTS trg_voice_summaries_updated_at ON voice_summaries;
create trigger trg_voice_summaries_updated_at
  before update on voice_summaries
  for each row
  execute function set_updated_at_voice_summaries();
drop trigger if exists trg_aria_requests_updated_at on cara_requests;
DROP TRIGGER IF EXISTS trg_aria_requests_updated_at ON cara_requests;
create trigger trg_aria_requests_updated_at
  before update on cara_requests
  for each row execute function set_updated_at_aria();
drop trigger if exists trg_aria_outputs_updated_at on cara_outputs;
DROP TRIGGER IF EXISTS trg_aria_outputs_updated_at ON cara_outputs;
create trigger trg_aria_outputs_updated_at
  before update on cara_outputs
  for each row execute function set_updated_at_aria();
-- ══════════════════════════════════════════════════════════════════════════════
-- UPDATED_AT TRIGGERS
-- ══════════════════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS trg_aria_requests_updated_at ON cara_requests;
DROP TRIGGER IF EXISTS trg_aria_requests_updated_at ON cara_requests;
CREATE TRIGGER trg_aria_requests_updated_at
  BEFORE UPDATE ON cara_requests
  FOR EACH ROW EXECUTE FUNCTION aria_set_updated_at();
DROP TRIGGER IF EXISTS trg_aria_outputs_updated_at ON cara_outputs;
DROP TRIGGER IF EXISTS trg_aria_outputs_updated_at ON cara_outputs;
CREATE TRIGGER trg_aria_outputs_updated_at
  BEFORE UPDATE ON cara_outputs
  FOR EACH ROW EXECUTE FUNCTION aria_set_updated_at();
-- Service role: full access (used by the API route).
create policy "service_role_full_access_oversight_reviews"
  on oversight_reviews for all to service_role using (true) with check (true);
create policy "service_role_full_access_oversight_actions"
  on oversight_actions for all to service_role using (true) with check (true);
create policy "service_role_full_access_oversight_audit_log"
  on oversight_audit_log for all to service_role using (true) with check (true);
-- Authenticated users: read-only on reviews and actions (further scoping by
-- home_id is expected to be enforced via the application layer / per-home
-- RLS policies attached at deployment time).
create policy "authenticated_read_oversight_reviews"
  on oversight_reviews for select to authenticated using (true);
create policy "authenticated_read_oversight_actions"
  on oversight_actions for select to authenticated using (true);
create policy "authenticated_read_oversight_audit_log"
  on oversight_audit_log for select to authenticated using (true);
create policy "service_role_full_access_voice_summaries"
  on voice_summaries for all to service_role using (true) with check (true);
create policy "service_role_full_access_voice_summary_audit_log"
  on voice_summary_audit_log for all to service_role using (true) with check (true);
-- Authenticated users: read-only (further per-home scoping is expected to be
-- enforced via the application layer).
create policy "authenticated_read_voice_summaries"
  on voice_summaries for select to authenticated using (true);
create policy "authenticated_read_voice_summary_audit_log"
  on voice_summary_audit_log for select to authenticated using (true);
CREATE POLICY "service_role_full_access" ON manager_attention_items
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON inspection_evidence_items
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON child_progress_goals
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON child_progress_entries
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON child_outcome_snapshots
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON reg44_visits
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON reg44_actions
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON reg45_reviews
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON incident_learning_reviews
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON smart_record_links
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON staff_competence_records
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON child_voice_entries
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access" ON provider_home_summaries
  FOR ALL USING (true) WITH CHECK (true);
-- ══════════════════════════════════════════════════════════════════════════════
-- MANAGER ATTENTION ITEMS
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "service_role_full_access" ON manager_attention_items;
CREATE POLICY "staff_read_own_home" ON manager_attention_items
  FOR SELECT USING (home_id = get_my_home_id());
CREATE POLICY "staff_insert_own_home" ON manager_attention_items
  FOR INSERT WITH CHECK (home_id = get_my_home_id());
CREATE POLICY "staff_update_own_home" ON manager_attention_items
  FOR UPDATE USING (home_id = get_my_home_id());
CREATE POLICY "managers_delete" ON manager_attention_items
  FOR DELETE USING (home_id = get_my_home_id() AND is_manager());
-- ══════════════════════════════════════════════════════════════════════════════
-- INSPECTION EVIDENCE ITEMS
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "service_role_full_access" ON inspection_evidence_items;
CREATE POLICY "staff_read_own_home" ON inspection_evidence_items
  FOR SELECT USING (home_id = get_my_home_id());
CREATE POLICY "staff_insert_own_home" ON inspection_evidence_items
  FOR INSERT WITH CHECK (home_id = get_my_home_id());
CREATE POLICY "staff_update_own_home" ON inspection_evidence_items
  FOR UPDATE USING (home_id = get_my_home_id());
CREATE POLICY "managers_delete" ON inspection_evidence_items
  FOR DELETE USING (home_id = get_my_home_id() AND is_manager());
-- ══════════════════════════════════════════════════════════════════════════════
-- CHILD PROGRESS GOALS
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "service_role_full_access" ON child_progress_goals;
CREATE POLICY "staff_read_own_home" ON child_progress_goals
  FOR SELECT USING (home_id = get_my_home_id());
CREATE POLICY "staff_insert_own_home" ON child_progress_goals
  FOR INSERT WITH CHECK (home_id = get_my_home_id());
CREATE POLICY "staff_update_own_home" ON child_progress_goals
  FOR UPDATE USING (home_id = get_my_home_id());
CREATE POLICY "managers_delete" ON child_progress_goals
  FOR DELETE USING (home_id = get_my_home_id() AND is_manager());
-- ══════════════════════════════════════════════════════════════════════════════
-- CHILD PROGRESS ENTRIES
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "service_role_full_access" ON child_progress_entries;
CREATE POLICY "staff_read_own_home" ON child_progress_entries
  FOR SELECT USING (home_id = get_my_home_id());
CREATE POLICY "staff_insert_own_home" ON child_progress_entries
  FOR INSERT WITH CHECK (home_id = get_my_home_id());
CREATE POLICY "staff_update_own_home" ON child_progress_entries
  FOR UPDATE USING (home_id = get_my_home_id());
CREATE POLICY "managers_delete" ON child_progress_entries
  FOR DELETE USING (home_id = get_my_home_id() AND is_manager());
-- ══════════════════════════════════════════════════════════════════════════════
-- CHILD OUTCOME SNAPSHOTS
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "service_role_full_access" ON child_outcome_snapshots;
CREATE POLICY "staff_read_own_home" ON child_outcome_snapshots
  FOR SELECT USING (home_id = get_my_home_id());
CREATE POLICY "staff_insert_own_home" ON child_outcome_snapshots
  FOR INSERT WITH CHECK (home_id = get_my_home_id());
CREATE POLICY "managers_delete" ON child_outcome_snapshots
  FOR DELETE USING (home_id = get_my_home_id() AND is_manager());
-- ══════════════════════════════════════════════════════════════════════════════
-- REG 44 VISITS
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "service_role_full_access" ON reg44_visits;
CREATE POLICY "staff_read_own_home" ON reg44_visits
  FOR SELECT USING (home_id = get_my_home_id());
CREATE POLICY "staff_insert_own_home" ON reg44_visits
  FOR INSERT WITH CHECK (home_id = get_my_home_id());
CREATE POLICY "staff_update_own_home" ON reg44_visits
  FOR UPDATE USING (home_id = get_my_home_id());
CREATE POLICY "managers_delete" ON reg44_visits
  FOR DELETE USING (home_id = get_my_home_id() AND is_manager());
-- ══════════════════════════════════════════════════════════════════════════════
-- REG 44 ACTIONS
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "service_role_full_access" ON reg44_actions;
CREATE POLICY "staff_read_own_home" ON reg44_actions
  FOR SELECT USING (home_id = get_my_home_id());
CREATE POLICY "staff_insert_own_home" ON reg44_actions
  FOR INSERT WITH CHECK (home_id = get_my_home_id());
CREATE POLICY "staff_update_own_home" ON reg44_actions
  FOR UPDATE USING (home_id = get_my_home_id());
CREATE POLICY "managers_delete" ON reg44_actions
  FOR DELETE USING (home_id = get_my_home_id() AND is_manager());
-- ══════════════════════════════════════════════════════════════════════════════
-- REG 45 REVIEWS
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "service_role_full_access" ON reg45_reviews;
CREATE POLICY "staff_read_own_home" ON reg45_reviews
  FOR SELECT USING (home_id = get_my_home_id());
CREATE POLICY "staff_insert_own_home" ON reg45_reviews
  FOR INSERT WITH CHECK (home_id = get_my_home_id());
CREATE POLICY "staff_update_own_home" ON reg45_reviews
  FOR UPDATE USING (home_id = get_my_home_id());
CREATE POLICY "managers_delete" ON reg45_reviews
  FOR DELETE USING (home_id = get_my_home_id() AND is_manager());
-- ══════════════════════════════════════════════════════════════════════════════
-- INCIDENT LEARNING REVIEWS
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "service_role_full_access" ON incident_learning_reviews;
CREATE POLICY "staff_read_own_home" ON incident_learning_reviews
  FOR SELECT USING (home_id = get_my_home_id());
CREATE POLICY "staff_insert_own_home" ON incident_learning_reviews
  FOR INSERT WITH CHECK (home_id = get_my_home_id());
CREATE POLICY "staff_update_own_home" ON incident_learning_reviews
  FOR UPDATE USING (home_id = get_my_home_id());
CREATE POLICY "managers_delete" ON incident_learning_reviews
  FOR DELETE USING (home_id = get_my_home_id() AND is_manager());
-- ══════════════════════════════════════════════════════════════════════════════
-- SMART RECORD LINKS
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "service_role_full_access" ON smart_record_links;
CREATE POLICY "staff_read_own_home" ON smart_record_links
  FOR SELECT USING (home_id = get_my_home_id());
CREATE POLICY "staff_insert_own_home" ON smart_record_links
  FOR INSERT WITH CHECK (home_id = get_my_home_id());
CREATE POLICY "managers_delete" ON smart_record_links
  FOR DELETE USING (home_id = get_my_home_id() AND is_manager());
-- ══════════════════════════════════════════════════════════════════════════════
-- STAFF COMPETENCE RECORDS
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "service_role_full_access" ON staff_competence_records;
CREATE POLICY "staff_read_own_home" ON staff_competence_records
  FOR SELECT USING (home_id = get_my_home_id());
CREATE POLICY "staff_insert_own_home" ON staff_competence_records
  FOR INSERT WITH CHECK (home_id = get_my_home_id());
CREATE POLICY "staff_update_own_home" ON staff_competence_records
  FOR UPDATE USING (home_id = get_my_home_id());
CREATE POLICY "managers_delete" ON staff_competence_records
  FOR DELETE USING (home_id = get_my_home_id() AND is_manager());
-- ══════════════════════════════════════════════════════════════════════════════
-- CHILD VOICE ENTRIES
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "service_role_full_access" ON child_voice_entries;
CREATE POLICY "staff_read_own_home" ON child_voice_entries
  FOR SELECT USING (home_id = get_my_home_id());
CREATE POLICY "staff_insert_own_home" ON child_voice_entries
  FOR INSERT WITH CHECK (home_id = get_my_home_id());
CREATE POLICY "staff_update_own_home" ON child_voice_entries
  FOR UPDATE USING (home_id = get_my_home_id());
CREATE POLICY "managers_delete" ON child_voice_entries
  FOR DELETE USING (home_id = get_my_home_id() AND is_manager());
-- ══════════════════════════════════════════════════════════════════════════════
-- PROVIDER HOME SUMMARIES
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "service_role_full_access" ON provider_home_summaries;
CREATE POLICY "staff_read_own_home" ON provider_home_summaries
  FOR SELECT USING (home_id = get_my_home_id());
CREATE POLICY "managers_insert" ON provider_home_summaries
  FOR INSERT WITH CHECK (home_id = get_my_home_id() AND is_manager());
CREATE POLICY "managers_update" ON provider_home_summaries
  FOR UPDATE USING (home_id = get_my_home_id() AND is_manager());
CREATE POLICY "managers_delete" ON provider_home_summaries
  FOR DELETE USING (home_id = get_my_home_id() AND is_manager());
CREATE POLICY "Users can insert own outputs"
  ON cara_outputs FOR INSERT
  WITH CHECK (true);

-- ── from 421_rls_scope_child_data_policies.sql ──
-- ════════════════════════════════════════════════════════════════════════════
-- 421 — Security: scope child-data RLS policies to the caller's home
--
-- From an authentication/authorization review. Migrations 010 and 011 created
-- read policies on child-data tables as `to authenticated using (true)` — i.e.
-- ANY authenticated user, in ANY home, could read EVERY home's oversight reviews
-- (child_id + oversight drafts + safeguarding/missing-from-care records) and
-- voice-of-the-child summaries via the Supabase Data API. The original comments
-- noted home scoping was "expected to be enforced via the application layer" —
-- which does not happen, so this migration enforces it at the database instead
-- (defence in depth: RLS holds even if a route forgets the check).
--
-- It replaces those 5 `using (true)` policies with home-scoped equivalents built
-- on the existing get_my_home_id() helper (003_rls_policies.sql). The parent
-- tables carry home_id directly; the child/audit tables are scoped through their
-- FK to the parent. The service_role policies are intentionally left untouched —
-- the server (service key) legitimately bypasses RLS for trusted writes.
--
-- ⚠️  REVIEW BEFORE APPLYING TO PRODUCTION — this was authored without access to
--     a live Supabase and has NOT been executed. In particular verify:
--       • get_my_home_id() returns uuid; these tables declare `home_id text`, so
--         the comparison casts the function result to text (`::text`). Confirm the
--         stored home_id values are the uuid strings of staff_members.home_id
--         (not slugs like 'home_oak'); if the schema standardises home_id types,
--         drop the cast.
--
--         ANSWERED by static review (still unexecuted). The cast is correct:
--           - 003_rls_policies.sql:28  get_my_home_id() returns uuid, selecting
--             staff_members.home_id, which 001 declares `uuid not null`;
--           - 010:25 / 011:25 declare `home_id text` (and nullable);
--           - the writer sends a uuid STRING: homeId() in src/lib/supabase/
--             care-records.ts returns SUPABASE_HOME_ID ?? the seeded home uuid
--             'a0000000-0000-0000-0000-000000000001' (004_seed_data.sql:15).
--         So text = uuid::text matches. Two live landmines remain, both silent:
--           - if SUPABASE_HOME_ID is ever set to a slug, every policy here
--             matches zero rows and the home locks itself out — it fails closed,
--             but as "no data", not as an error;
--           - home_id is nullable, so any row written without one is invisible
--             to every authenticated reader for the same reason.
--       • Run in a staging project and confirm a same-home user still reads their
--         own rows while a cross-home user reads none.
--
-- NOT fixed here (need per-table review — different shapes / generated policy
-- names): the dynamic `execute format(... using (true) ...)` policies in
-- 013_aria_universal_layer.sql and 014_aria_suggestions.sql, and the tables
-- created without RLS enabled in 019, 020, 024, 025, 026, 027.
--
-- SUPERSEDED by 423_rls_close_public_exposure.sql, which closes both by dynamic
-- predicate over pg_class/pg_policies instead of per-table review — and found
-- the list above was an undercount: 102 tables across 17 migrations had no RLS,
-- and ~44 more carried an unrestricted policy misleadingly named
-- "service_role_full_access". 423 leaves the scoped policies below untouched.
-- ════════════════════════════════════════════════════════════════════════════

-- ── Parent tables (home_id is a direct column) ──────────────────────────────

drop policy if exists "authenticated_read_oversight_reviews" on oversight_reviews;
create policy "authenticated_read_oversight_reviews"
  on oversight_reviews for select to authenticated
  using (home_id = get_my_home_id()::text);
drop policy if exists "authenticated_read_voice_summaries" on voice_summaries;
create policy "authenticated_read_voice_summaries"
  on voice_summaries for select to authenticated
  using (home_id = get_my_home_id()::text);
-- ── Child / audit tables (scoped through their FK to the parent's home) ──────

drop policy if exists "authenticated_read_oversight_actions" on oversight_actions;
create policy "authenticated_read_oversight_actions"
  on oversight_actions for select to authenticated
  using (
    review_id in (select id from oversight_reviews where home_id = get_my_home_id()::text)
  );
drop policy if exists "authenticated_read_oversight_audit_log" on oversight_audit_log;
create policy "authenticated_read_oversight_audit_log"
  on oversight_audit_log for select to authenticated
  using (
    review_id in (select id from oversight_reviews where home_id = get_my_home_id()::text)
  );
drop policy if exists "authenticated_read_voice_summary_audit_log" on voice_summary_audit_log;
create policy "authenticated_read_voice_summary_audit_log"
  on voice_summary_audit_log for select to authenticated
  using (
    summary_id in (select id from voice_summaries where home_id = get_my_home_id()::text)
  );
