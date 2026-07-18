-- ══════════════════════════════════════════════════════════════════════════════
-- PRACTICE INTELLIGENCE & THERAPEUTIC CURRICULUM HUB
-- Extends ARIA Studio with therapeutic profiles, practice scans, session
-- templates, learning resources, oversight drafts, and workflow triggers.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Therapeutic Profiles ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS therapeutic_profiles (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id        uuid NOT NULL REFERENCES homes(id),
  child_id       uuid NOT NULL,
  status         text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','archived')),
  version        int  NOT NULL DEFAULT 1,

  -- Core formulation
  pre_placement_history      text,
  known_trauma_themes        jsonb DEFAULT '[]',
  attachment_presentation    text,
  emotional_regulation_needs jsonb DEFAULT '[]',
  known_triggers             jsonb DEFAULT '[]',
  known_soothing_strategies  jsonb DEFAULT '[]',
  relational_strengths       jsonb DEFAULT '[]',
  staff_relationships        jsonb DEFAULT '[]',
  family_contact_themes      jsonb DEFAULT '[]',
  education_themes           jsonb DEFAULT '[]',
  identity_culture_belonging jsonb DEFAULT '[]',
  communication_style        text,
  neurodiversity_considerations jsonb DEFAULT '[]',
  risk_themes                jsonb DEFAULT '[]',
  protective_factors         jsonb DEFAULT '[]',
  current_presentation       text,
  progress_over_time         jsonb DEFAULT '[]',
  child_voice_entries        jsonb DEFAULT '[]',
  what_staff_need_to_remember jsonb DEFAULT '[]',
  what_helps                 jsonb DEFAULT '[]',
  what_does_not_help         jsonb DEFAULT '[]',
  current_therapeutic_priorities jsonb DEFAULT '[]',

  -- Approval
  approved_by    uuid,
  approved_at    timestamptz,
  created_by     uuid NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_therapeutic_profiles_child ON therapeutic_profiles(child_id);
CREATE INDEX idx_therapeutic_profiles_home  ON therapeutic_profiles(home_id);

-- ── Practice Intelligence Scans ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS practice_intelligence_scans (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id       uuid NOT NULL REFERENCES homes(id),
  scan_type     text NOT NULL CHECK (scan_type IN ('daily','weekly','on_demand','triggered')),
  scan_date     date NOT NULL DEFAULT CURRENT_DATE,
  status        text NOT NULL DEFAULT 'completed',

  -- Results
  home_dynamics_summary    jsonb DEFAULT '{}',
  child_summaries          jsonb DEFAULT '[]',
  risk_patterns            jsonb DEFAULT '[]',
  practice_drift_alerts    jsonb DEFAULT '[]',
  training_need_alerts     jsonb DEFAULT '[]',
  oversight_prompts        jsonb DEFAULT '[]',
  suggested_plan_updates   jsonb DEFAULT '[]',
  suggested_keywork        jsonb DEFAULT '[]',
  suggested_reflective     jsonb DEFAULT '[]',
  relationship_mapping     jsonb DEFAULT '{}',
  rota_impact_analysis     jsonb DEFAULT '{}',
  staff_consistency        jsonb DEFAULT '{}',
  repeated_triggers        jsonb DEFAULT '[]',
  therapeutic_patterns     jsonb DEFAULT '[]',

  created_by   uuid,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pi_scans_home ON practice_intelligence_scans(home_id);
CREATE INDEX idx_pi_scans_date ON practice_intelligence_scans(scan_date);

-- ── Home Dynamics Reports ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS home_dynamics_reports (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id      uuid NOT NULL REFERENCES homes(id),
  report_type  text NOT NULL CHECK (report_type IN ('daily','weekly','monthly')),
  report_date  date NOT NULL DEFAULT CURRENT_DATE,
  period_start date NOT NULL,
  period_end   date NOT NULL,

  -- Content sections
  summary                text,
  emotional_climate      text,
  risk_level             text CHECK (risk_level IN ('low','medium','high','critical')),
  risk_score             int,
  metrics                jsonb DEFAULT '{}',
  child_highlights       jsonb DEFAULT '[]',
  staff_practice_notes   jsonb DEFAULT '[]',
  pattern_analysis       jsonb DEFAULT '[]',
  recommended_actions    jsonb DEFAULT '[]',
  manager_focus          jsonb DEFAULT '[]',

  created_by   uuid,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_hd_reports_home ON home_dynamics_reports(home_id);

-- ── Session Templates ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS session_templates (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id       uuid NOT NULL REFERENCES homes(id),
  session_type  text NOT NULL,
  title         text NOT NULL,
  framework     text,
  tone          text,
  target_age_range text,
  content       jsonb NOT NULL DEFAULT '{}',
  tags          jsonb DEFAULT '[]',
  is_published  boolean NOT NULL DEFAULT false,
  use_count     int NOT NULL DEFAULT 0,

  created_by    uuid NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_session_templates_home ON session_templates(home_id);
CREATE INDEX idx_session_templates_type ON session_templates(session_type);

-- ── Generated Sessions ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS generated_sessions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id        uuid NOT NULL REFERENCES homes(id),
  child_id       uuid,
  session_type   text NOT NULL,
  title          text NOT NULL,
  framework      text,
  tone           text,
  status         text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','delivered','recorded')),

  -- Full session content
  content        jsonb NOT NULL DEFAULT '{}',
  evidence_links jsonb DEFAULT '[]',
  quality_score  int,

  -- Delivery tracking
  scheduled_date date,
  delivered_at   timestamptz,
  delivered_by   uuid,
  recording_notes text,
  follow_up_actions jsonb DEFAULT '[]',
  plan_update_suggestions jsonb DEFAULT '[]',

  -- Approval
  approved_by    uuid,
  approved_at    timestamptz,
  created_by     uuid NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_generated_sessions_home  ON generated_sessions(home_id);
CREATE INDEX idx_generated_sessions_child ON generated_sessions(child_id);

-- ── Learning Resources ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS learning_resources (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id         uuid NOT NULL REFERENCES homes(id),
  resource_type   text NOT NULL,
  title           text NOT NULL,
  description     text,
  target_audience text NOT NULL DEFAULT 'staff' CHECK (target_audience IN ('staff','child','group','mixed')),
  format          text NOT NULL DEFAULT 'document',

  -- Content + preferences
  content         jsonb NOT NULL DEFAULT '{}',
  preferences     jsonb DEFAULT '{}',
  tags            jsonb DEFAULT '[]',
  framework       text,

  -- Accessibility
  reading_level   text,
  communication_needs jsonb DEFAULT '[]',
  neurodiversity_adaptations jsonb DEFAULT '[]',

  status          text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  use_count       int NOT NULL DEFAULT 0,

  created_by      uuid NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_learning_resources_home ON learning_resources(home_id);
CREATE INDEX idx_learning_resources_type ON learning_resources(resource_type);

-- ── Flashcard Sets ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS flashcard_sets (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id      uuid NOT NULL REFERENCES homes(id),
  title        text NOT NULL,
  topic        text NOT NULL,
  framework    text,
  cards        jsonb NOT NULL DEFAULT '[]',
  card_count   int NOT NULL DEFAULT 0,
  difficulty   text DEFAULT 'intermediate',
  target_audience text DEFAULT 'staff',

  created_by   uuid NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ── Quizzes ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS quizzes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id      uuid NOT NULL REFERENCES homes(id),
  title        text NOT NULL,
  topic        text NOT NULL,
  framework    text,
  questions    jsonb NOT NULL DEFAULT '[]',
  question_count int NOT NULL DEFAULT 0,
  pass_mark    int DEFAULT 80,
  target_audience text DEFAULT 'staff',

  created_by   uuid NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ── Questionnaires ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS questionnaires (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id      uuid NOT NULL REFERENCES homes(id),
  title        text NOT NULL,
  purpose      text NOT NULL,
  questions    jsonb NOT NULL DEFAULT '[]',
  scoring      jsonb DEFAULT '{}',
  target_audience text DEFAULT 'staff',

  created_by   uuid NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ── Management Oversight Drafts ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS management_oversight_drafts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id        uuid NOT NULL REFERENCES homes(id),
  oversight_type text NOT NULL,
  record_id      uuid,
  record_type    text,
  child_id       uuid,
  status         text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','reviewed','approved','committed')),

  -- Content
  content        jsonb NOT NULL DEFAULT '{}',
  evidence_links jsonb DEFAULT '[]',
  regulatory_refs jsonb DEFAULT '[]',
  quality_score  int,

  -- Approval
  approved_by    uuid,
  approved_at    timestamptz,
  committed_at   timestamptz,

  created_by     uuid NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_oversight_drafts_home ON management_oversight_drafts(home_id);
CREATE INDEX idx_oversight_drafts_type ON management_oversight_drafts(oversight_type);

-- ── Plan Update Suggestions ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS plan_update_suggestions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id       uuid NOT NULL REFERENCES homes(id),
  child_id      uuid,
  plan_type     text NOT NULL,
  trigger_source text NOT NULL,
  trigger_id    uuid,
  suggestion    text NOT NULL,
  rationale     text,
  evidence      jsonb DEFAULT '[]',
  priority      text DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','deferred')),

  reviewed_by   uuid,
  reviewed_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_plan_suggestions_child ON plan_update_suggestions(child_id);
CREATE INDEX idx_plan_suggestions_status ON plan_update_suggestions(status);

-- ── AI Evidence Links ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_evidence_links (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id        uuid NOT NULL REFERENCES homes(id),
  artifact_id    uuid NOT NULL,
  artifact_type  text NOT NULL,
  source_table   text NOT NULL,
  source_id      uuid NOT NULL,
  relevance      numeric(3,2) DEFAULT 0.5,
  citation_text  text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_evidence_artifact ON ai_evidence_links(artifact_id);
CREATE INDEX idx_ai_evidence_source   ON ai_evidence_links(source_id);

-- ── Framework Mappings ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS framework_mappings (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id        uuid NOT NULL REFERENCES homes(id),
  artifact_id    uuid,
  artifact_type  text,
  framework      text NOT NULL,
  regulation     text,
  quality_standard text,
  sccif_theme    text,
  evidence_text  text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_framework_mappings_artifact ON framework_mappings(artifact_id);

-- ── Child Learning Preferences ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS child_learning_preferences (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id        uuid NOT NULL REFERENCES homes(id),
  child_id       uuid NOT NULL,
  reading_level  text,
  learning_style text,
  communication_needs jsonb DEFAULT '[]',
  neurodiversity_notes jsonb DEFAULT '[]',
  preferred_format text,
  preferred_tone text,
  accessibility_notes text,
  updated_at     timestamptz NOT NULL DEFAULT now(),
  updated_by     uuid
);

CREATE UNIQUE INDEX idx_child_learning_prefs_unique ON child_learning_preferences(home_id, child_id);

-- ── Staff Competency Records ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS staff_competency_records (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id         uuid NOT NULL REFERENCES homes(id),
  staff_id        uuid NOT NULL,
  competency_area text NOT NULL,
  current_level   text DEFAULT 'developing' CHECK (current_level IN ('not_assessed','developing','competent','proficient','expert')),
  evidence        jsonb DEFAULT '[]',
  assessed_date   date,
  assessed_by     uuid,
  next_review     date,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_staff_competency_staff ON staff_competency_records(staff_id);

-- ── Workflow Triggers ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS practice_workflow_triggers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id         uuid NOT NULL REFERENCES homes(id),
  trigger_event   text NOT NULL,
  source_table    text NOT NULL,
  source_id       uuid NOT NULL,
  child_id        uuid,
  suggestions     jsonb NOT NULL DEFAULT '[]',
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','actioned','dismissed')),
  actioned_by     uuid,
  actioned_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_workflow_triggers_home   ON practice_workflow_triggers(home_id);
CREATE INDEX idx_workflow_triggers_status ON practice_workflow_triggers(status);
