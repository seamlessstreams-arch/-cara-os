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

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. ARIA AGENT RUNS
-- Tracks every ARIA generation or analysis run
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS aria_agent_runs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id   uuid NOT NULL,
  home_id           uuid NOT NULL,
  child_id          uuid,
  agent_id          text NOT NULL,
  agent_name        text NOT NULL,
  initiated_by      text NOT NULL,
  input_type        text NOT NULL,
  input_summary     text,
  output_type       text NOT NULL,
  status            text NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','pending_review','approved','rejected','committed','failed')),
  risk_tier         text NOT NULL DEFAULT 'low'
                    CHECK (risk_tier IN ('low','medium','high')),
  confidence_score  numeric(5,2),
  model_used        text,
  prompt_version    text,
  error_message     text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. ARIA EVIDENCE LINKS
-- Links ARIA outputs to source records
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS aria_evidence_links (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id   uuid NOT NULL,
  home_id           uuid NOT NULL,
  child_id          uuid,
  agent_run_id      uuid REFERENCES aria_agent_runs(id),
  report_id         uuid,
  report_section_id uuid,
  source_table      text NOT NULL,
  source_record_id  uuid NOT NULL,
  source_title      text,
  source_date       timestamptz,
  evidence_type     text NOT NULL,
  relevance_score   numeric(3,2) DEFAULT 1.0,
  quote_or_summary  text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. ARIA DRAFTS
-- Stores AI-created drafts before approval
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS aria_drafts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id     uuid NOT NULL,
  home_id             uuid NOT NULL,
  child_id            uuid,
  agent_run_id        uuid REFERENCES aria_agent_runs(id),
  draft_type          text NOT NULL,
  title               text NOT NULL,
  content_json        jsonb,
  content_markdown    text,
  status              text NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft','pending_review','approved','rejected','committed')),
  created_by          text NOT NULL,
  reviewed_by         text,
  approved_by         text,
  rejected_by         text,
  rejection_reason    text,
  manager_review_note text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  reviewed_at         timestamptz,
  approved_at         timestamptz,
  committed_at        timestamptz,
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. CHILD REPORTS
-- Stores generated reports for children
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS child_reports (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id          uuid NOT NULL,
  home_id                  uuid NOT NULL,
  child_id                 uuid NOT NULL,
  report_type              text NOT NULL,
  title                    text NOT NULL,
  audience                 text NOT NULL DEFAULT 'internal_manager',
  date_range_start         date,
  date_range_end           date,
  status                   text NOT NULL DEFAULT 'draft'
                           CHECK (status IN ('draft','pending_review','approved','rejected','locked','archived')),
  summary                  text,
  report_markdown          text,
  report_json              jsonb,
  generated_by_agent_run_id uuid REFERENCES aria_agent_runs(id),
  created_by               text NOT NULL,
  reviewed_by              text,
  approved_by              text,
  locked_by                text,
  approved_at              timestamptz,
  locked_at                timestamptz,
  version                  integer NOT NULL DEFAULT 1,
  parent_report_id         uuid REFERENCES child_reports(id),
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════════════════════
-- 5. CHILD REPORT SECTIONS
-- Structured report sections within a child report
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS child_report_sections (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id         uuid NOT NULL REFERENCES child_reports(id) ON DELETE CASCADE,
  section_key       text NOT NULL,
  section_title     text NOT NULL,
  section_content   text,
  section_order     integer NOT NULL DEFAULT 0,
  confidence_score  numeric(5,2),
  evidence_status   text NOT NULL DEFAULT 'not_enough_evidence'
                    CHECK (evidence_status IN ('evidence_supported','partial_evidence','manager_input_required','not_enough_evidence')),
  needs_manager_review boolean NOT NULL DEFAULT false,
  manager_note      text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════════════════════
-- 6. CHILD REPORT EVIDENCE
-- Links report sections to source evidence
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS child_report_evidence (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id         uuid NOT NULL REFERENCES child_reports(id) ON DELETE CASCADE,
  report_section_id uuid REFERENCES child_report_sections(id) ON DELETE CASCADE,
  source_table      text NOT NULL,
  source_record_id  uuid NOT NULL,
  source_title      text,
  source_date       timestamptz,
  evidence_summary  text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════════════════════
-- 7. CHILD REPORT ACTIONS
-- Suggested actions from reports
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS child_report_actions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id     uuid NOT NULL,
  home_id             uuid NOT NULL,
  child_id            uuid NOT NULL,
  report_id           uuid NOT NULL REFERENCES child_reports(id) ON DELETE CASCADE,
  action_title        text NOT NULL,
  action_description  text,
  priority            text NOT NULL DEFAULT 'medium'
                      CHECK (priority IN ('low','medium','high','urgent')),
  due_date            date,
  assigned_to         text,
  status              text NOT NULL DEFAULT 'suggested'
                      CHECK (status IN ('suggested','accepted','rejected','completed')),
  created_task_id     uuid,
  accepted_by         text,
  rejected_by         text,
  rejection_reason    text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════════════════════
-- 8. ARIA GOVERNANCE SETTINGS
-- Controls AI behaviour per organisation/home
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS aria_governance_settings (
  id                                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id                   uuid NOT NULL,
  home_id                           uuid,
  allow_ai_drafts                   boolean NOT NULL DEFAULT true,
  allow_high_risk_analysis          boolean NOT NULL DEFAULT true,
  require_manager_approval_high_risk boolean NOT NULL DEFAULT true,
  require_source_evidence           boolean NOT NULL DEFAULT true,
  allow_external_report_sending     boolean NOT NULL DEFAULT false,
  default_ai_tone                   text NOT NULL DEFAULT 'professional',
  retention_policy                  text NOT NULL DEFAULT '7_years',
  created_at                        timestamptz NOT NULL DEFAULT now(),
  updated_at                        timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organisation_id, home_id)
);

-- ══════════════════════════════════════════════════════════════════════════════
-- 9. ARIA PROMPT TEMPLATES
-- Controlled prompts and versions
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS aria_prompt_templates (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id       uuid,
  template_key          text NOT NULL,
  template_name         text NOT NULL,
  prompt_version        integer NOT NULL DEFAULT 1,
  system_prompt         text NOT NULL,
  user_prompt_template  text NOT NULL,
  output_schema_json    jsonb,
  is_active             boolean NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════════════════════
-- 10. REGULATION 45 EVIDENCE ITEMS
-- Reg 45 evidence bank
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS regulation45_evidence_items (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id       uuid NOT NULL,
  home_id               uuid NOT NULL,
  child_id              uuid,
  evidence_type         text NOT NULL,
  evidence_title        text NOT NULL,
  evidence_summary      text,
  source_table          text,
  source_record_id      uuid,
  linked_report_id      uuid REFERENCES child_reports(id),
  quality_standard      text,
  regulation_reference  text,
  impact_summary        text,
  created_by            text NOT NULL,
  reviewed_by           text,
  status                text NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','reviewed','approved')),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════════════════════
-- 11. ARIA AUDIT EVENTS
-- Detailed audit trail for ARIA actions
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS aria_audit_events (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id   uuid NOT NULL,
  home_id           uuid NOT NULL,
  child_id          uuid,
  actor_id          text NOT NULL,
  event_type        text NOT NULL,
  entity_type       text NOT NULL,
  entity_id         uuid,
  summary           text NOT NULL,
  metadata_json     jsonb,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ══════════════════════════════════════════════════════════════════════════════

CREATE INDEX idx_aria_agent_runs_home_status    ON aria_agent_runs(home_id, status);
CREATE INDEX idx_aria_agent_runs_child          ON aria_agent_runs(child_id);

CREATE INDEX idx_child_reports_home_child_status ON child_reports(home_id, child_id, status);
CREATE INDEX idx_child_reports_status            ON child_reports(status);

CREATE INDEX idx_child_report_sections_report   ON child_report_sections(report_id);

CREATE INDEX idx_child_report_evidence_report   ON child_report_evidence(report_id);

CREATE INDEX idx_child_report_actions_report_status ON child_report_actions(report_id, status);

CREATE INDEX idx_aria_evidence_links_agent_run  ON aria_evidence_links(agent_run_id);
CREATE INDEX idx_aria_evidence_links_report     ON aria_evidence_links(report_id);

CREATE INDEX idx_reg45_evidence_home_status     ON regulation45_evidence_items(home_id, status);

CREATE INDEX idx_aria_audit_events_home_type    ON aria_audit_events(home_id, event_type);
CREATE INDEX idx_aria_audit_events_entity       ON aria_audit_events(entity_type, entity_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- UPDATED_AT TRIGGERS
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TRIGGER trg_aria_agent_runs_updated_at
  BEFORE UPDATE ON aria_agent_runs
  FOR EACH ROW EXECUTE FUNCTION aria_set_updated_at();

CREATE TRIGGER trg_aria_drafts_updated_at
  BEFORE UPDATE ON aria_drafts
  FOR EACH ROW EXECUTE FUNCTION aria_set_updated_at();

CREATE TRIGGER trg_child_reports_updated_at
  BEFORE UPDATE ON child_reports
  FOR EACH ROW EXECUTE FUNCTION aria_set_updated_at();

CREATE TRIGGER trg_child_report_sections_updated_at
  BEFORE UPDATE ON child_report_sections
  FOR EACH ROW EXECUTE FUNCTION aria_set_updated_at();

CREATE TRIGGER trg_child_report_actions_updated_at
  BEFORE UPDATE ON child_report_actions
  FOR EACH ROW EXECUTE FUNCTION aria_set_updated_at();

CREATE TRIGGER trg_aria_governance_settings_updated_at
  BEFORE UPDATE ON aria_governance_settings
  FOR EACH ROW EXECUTE FUNCTION aria_set_updated_at();

CREATE TRIGGER trg_aria_prompt_templates_updated_at
  BEFORE UPDATE ON aria_prompt_templates
  FOR EACH ROW EXECUTE FUNCTION aria_set_updated_at();

CREATE TRIGGER trg_reg45_evidence_items_updated_at
  BEFORE UPDATE ON regulation45_evidence_items
  FOR EACH ROW EXECUTE FUNCTION aria_set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════════════════════

-- ── aria_agent_runs ─────────────────────────────────────────────────────────

ALTER TABLE aria_agent_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own home data"
  ON aria_agent_runs FOR SELECT
  USING (home_id = get_my_home_id());

CREATE POLICY "Users can insert own home data"
  ON aria_agent_runs FOR INSERT
  WITH CHECK (home_id = get_my_home_id());

CREATE POLICY "Users can update own home data"
  ON aria_agent_runs FOR UPDATE
  USING (home_id = get_my_home_id());

-- ── aria_evidence_links ─────────────────────────────────────────────────────

ALTER TABLE aria_evidence_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own home data"
  ON aria_evidence_links FOR SELECT
  USING (home_id = get_my_home_id());

CREATE POLICY "Users can insert own home data"
  ON aria_evidence_links FOR INSERT
  WITH CHECK (home_id = get_my_home_id());

CREATE POLICY "Users can update own home data"
  ON aria_evidence_links FOR UPDATE
  USING (home_id = get_my_home_id());

-- ── aria_drafts ─────────────────────────────────────────────────────────────

ALTER TABLE aria_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own home data"
  ON aria_drafts FOR SELECT
  USING (home_id = get_my_home_id());

CREATE POLICY "Users can insert own home data"
  ON aria_drafts FOR INSERT
  WITH CHECK (home_id = get_my_home_id());

CREATE POLICY "Users can update own home data"
  ON aria_drafts FOR UPDATE
  USING (home_id = get_my_home_id());

-- ── child_reports ───────────────────────────────────────────────────────────

ALTER TABLE child_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own home data"
  ON child_reports FOR SELECT
  USING (home_id = get_my_home_id());

CREATE POLICY "Users can insert own home data"
  ON child_reports FOR INSERT
  WITH CHECK (home_id = get_my_home_id());

CREATE POLICY "Users can update own home data"
  ON child_reports FOR UPDATE
  USING (home_id = get_my_home_id());

-- ── child_report_sections ───────────────────────────────────────────────────
-- Sections don't have home_id directly; access via parent report join.
-- Use a subquery policy to check the parent report's home_id.

ALTER TABLE child_report_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own home report sections"
  ON child_report_sections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM child_reports cr
      WHERE cr.id = child_report_sections.report_id
        AND cr.home_id = get_my_home_id()
    )
  );

CREATE POLICY "Users can insert own home report sections"
  ON child_report_sections FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM child_reports cr
      WHERE cr.id = child_report_sections.report_id
        AND cr.home_id = get_my_home_id()
    )
  );

CREATE POLICY "Users can update own home report sections"
  ON child_report_sections FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM child_reports cr
      WHERE cr.id = child_report_sections.report_id
        AND cr.home_id = get_my_home_id()
    )
  );

-- ── child_report_evidence ───────────────────────────────────────────────────
-- Evidence rows don't have home_id; access via parent report join.

ALTER TABLE child_report_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own home report evidence"
  ON child_report_evidence FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM child_reports cr
      WHERE cr.id = child_report_evidence.report_id
        AND cr.home_id = get_my_home_id()
    )
  );

CREATE POLICY "Users can insert own home report evidence"
  ON child_report_evidence FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM child_reports cr
      WHERE cr.id = child_report_evidence.report_id
        AND cr.home_id = get_my_home_id()
    )
  );

CREATE POLICY "Users can update own home report evidence"
  ON child_report_evidence FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM child_reports cr
      WHERE cr.id = child_report_evidence.report_id
        AND cr.home_id = get_my_home_id()
    )
  );

-- ── child_report_actions ────────────────────────────────────────────────────

ALTER TABLE child_report_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own home data"
  ON child_report_actions FOR SELECT
  USING (home_id = get_my_home_id());

CREATE POLICY "Users can insert own home data"
  ON child_report_actions FOR INSERT
  WITH CHECK (home_id = get_my_home_id());

CREATE POLICY "Users can update own home data"
  ON child_report_actions FOR UPDATE
  USING (home_id = get_my_home_id());

-- ── aria_governance_settings ────────────────────────────────────────────────
-- home_id is nullable (org-wide defaults have NULL home_id).
-- Policy: allow if home_id matches OR home_id IS NULL (org-wide row).

ALTER TABLE aria_governance_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own home governance settings"
  ON aria_governance_settings FOR SELECT
  USING (home_id = get_my_home_id() OR home_id IS NULL);

CREATE POLICY "Users can insert own home governance settings"
  ON aria_governance_settings FOR INSERT
  WITH CHECK (home_id = get_my_home_id() OR home_id IS NULL);

CREATE POLICY "Users can update own home governance settings"
  ON aria_governance_settings FOR UPDATE
  USING (home_id = get_my_home_id() OR home_id IS NULL);

-- ── aria_prompt_templates ───────────────────────────────────────────────────
-- Prompt templates are global (organisation_id is nullable, no home_id).
-- All authenticated users can read; only org-level admins manage them.
-- For now, allow all authenticated users full access.

ALTER TABLE aria_prompt_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view prompt templates"
  ON aria_prompt_templates FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert prompt templates"
  ON aria_prompt_templates FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update prompt templates"
  ON aria_prompt_templates FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- ── regulation45_evidence_items ─────────────────────────────────────────────

ALTER TABLE regulation45_evidence_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own home data"
  ON regulation45_evidence_items FOR SELECT
  USING (home_id = get_my_home_id());

CREATE POLICY "Users can insert own home data"
  ON regulation45_evidence_items FOR INSERT
  WITH CHECK (home_id = get_my_home_id());

CREATE POLICY "Users can update own home data"
  ON regulation45_evidence_items FOR UPDATE
  USING (home_id = get_my_home_id());

-- ── aria_audit_events ───────────────────────────────────────────────────────

ALTER TABLE aria_audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own home data"
  ON aria_audit_events FOR SELECT
  USING (home_id = get_my_home_id());

CREATE POLICY "Users can insert own home data"
  ON aria_audit_events FOR INSERT
  WITH CHECK (home_id = get_my_home_id());

CREATE POLICY "Users can update own home data"
  ON aria_audit_events FOR UPDATE
  USING (home_id = get_my_home_id());

-- ══════════════════════════════════════════════════════════════════════════════
-- SEED DATA — DEFAULT PROMPT TEMPLATES
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO aria_prompt_templates (template_key, template_name, system_prompt, user_prompt_template, output_schema_json)
VALUES

-- ── Weekly Child Report ─────────────────────────────────────────────────────
(
  'weekly_child_report',
  'Weekly Child Report',
  'You are ARIA, an AI assistant embedded in Cornerstone, a management platform for UK children''s residential homes regulated by Ofsted. You write professional, evidence-based weekly reports about children and young people in care.

Your reports must:
- Use a warm but professional tone appropriate for registered managers and social workers.
- Reference specific dated evidence from daily logs, incidents, keywork sessions, and observations.
- Highlight progress, concerns, and patterns observed during the reporting period.
- Note any safeguarding concerns, missing episodes, or significant incidents.
- Include the child''s voice where captured in the evidence.
- Align with Children''s Homes Regulations 2015 and the Quality Standards.
- Flag sections where evidence is insufficient and manager input is needed.
- Never fabricate or assume information not present in the source data.',

  'Generate a weekly report for {{child_name}} covering the period {{date_range_start}} to {{date_range_end}}.

Source data provided:
- Daily log entries: {{daily_logs}}
- Incidents: {{incidents}}
- Keywork sessions: {{keywork_sessions}}
- Risk assessments: {{risk_assessments}}
- Placement plan goals: {{placement_goals}}
- Missing episodes: {{missing_episodes}}
- Medication records: {{medication_records}}

Structure the report with the following sections:
1. Overview and General Presentation
2. Behaviour and Emotional Wellbeing
3. Education and Activities
4. Health and Medication
5. Relationships and Contact
6. Safeguarding and Risk
7. Progress Against Placement Plan
8. Child''s Voice
9. Concerns and Recommended Actions

For each section, cite the specific evidence used and flag confidence level.',

  '{"type":"object","properties":{"sections":{"type":"array","items":{"type":"object","properties":{"section_key":{"type":"string"},"section_title":{"type":"string"},"content":{"type":"string"},"confidence_score":{"type":"number"},"evidence_status":{"type":"string"},"evidence_refs":{"type":"array","items":{"type":"string"}}}}}}}'
),

-- ── Child Review Report ─────────────────────────────────────────────────────
(
  'child_review_report',
  'Child Review Report',
  'You are ARIA, an AI assistant for UK children''s residential homes. You prepare structured review reports that support Looked After Child (LAC) reviews, Regulation 44 visits, and internal care reviews.

Your reports must:
- Present a holistic view of the child''s progress across all areas of their life.
- Be evidence-based with clear references to source records.
- Include the child''s own views and wishes where captured.
- Assess progress against placement plan objectives.
- Identify emerging themes, risks, and protective factors.
- Be suitable for sharing with multi-agency professionals including social workers, IROs, and CAMHS.
- Use professional language accessible to all stakeholders.
- Comply with Children''s Homes Regulations 2015.',

  'Generate a child review report for {{child_name}} covering {{date_range_start}} to {{date_range_end}}.

Source data provided:
- Daily logs: {{daily_logs}}
- Incidents and safeguarding: {{incidents}}
- Keywork session records: {{keywork_sessions}}
- Placement plan: {{placement_plan}}
- Risk assessments: {{risk_assessments}}
- Health records: {{health_records}}
- Education updates: {{education_updates}}
- Contact records: {{contact_records}}
- Previous review actions: {{previous_actions}}

Structure the report with:
1. Summary of Period
2. Placement Stability and Relationships
3. Emotional Wellbeing and Behaviour
4. Physical Health
5. Education, Training and Employment
6. Identity, Culture and Belonging
7. Family and Social Relationships
8. Self-Care and Independence
9. Safeguarding and Risk
10. Progress Against Previous Actions
11. Child''s Voice and Wishes
12. Recommendations and Actions

Cite evidence for each section and flag gaps.',

  '{"type":"object","properties":{"sections":{"type":"array","items":{"type":"object","properties":{"section_key":{"type":"string"},"section_title":{"type":"string"},"content":{"type":"string"},"confidence_score":{"type":"number"},"evidence_status":{"type":"string"},"evidence_refs":{"type":"array","items":{"type":"string"}}}}}}}'
),

-- ── Social Worker Update ────────────────────────────────────────────────────
(
  'social_worker_update',
  'Social Worker Update',
  'You are ARIA, an AI assistant for UK children''s residential homes. You produce concise, professional updates for allocated social workers about children in placement.

Your updates must:
- Be clear, factual, and appropriately concise for busy social work professionals.
- Highlight key events, progress, and concerns since the last update.
- Note any safeguarding matters, missing episodes, or health concerns.
- Include the young person''s views where available.
- Flag any actions needed from the social worker or placing authority.
- Maintain a respectful, partnership-oriented tone.
- Not include internal operational details irrelevant to the social worker.',

  'Generate a social worker update for {{child_name}} covering {{date_range_start}} to {{date_range_end}}, addressed to their allocated social worker.

Source data provided:
- Daily logs: {{daily_logs}}
- Incidents: {{incidents}}
- Keywork sessions: {{keywork_sessions}}
- Missing episodes: {{missing_episodes}}
- Health updates: {{health_updates}}
- Education updates: {{education_updates}}
- Contact records: {{contact_records}}

Structure the update with:
1. General Presentation and Wellbeing
2. Key Events This Period
3. Education Update
4. Health Update
5. Contact and Relationships
6. Safeguarding Matters (if any)
7. Young Person''s Views
8. Requested Actions

Keep language professional and partnership-focused.',

  '{"type":"object","properties":{"sections":{"type":"array","items":{"type":"object","properties":{"section_key":{"type":"string"},"section_title":{"type":"string"},"content":{"type":"string"},"confidence_score":{"type":"number"},"evidence_status":{"type":"string"},"evidence_refs":{"type":"array","items":{"type":"string"}}}}}}}'
),

-- ── Risk Review Report ──────────────────────────────────────────────────────
(
  'risk_review_report',
  'Risk Review Report',
  'You are ARIA, an AI assistant for UK children''s residential homes. You produce structured risk review reports that assess current risk levels and recommend management strategies.

Your reports must:
- Analyse patterns in incidents, behaviours, and safeguarding concerns.
- Cross-reference current risk assessments with recent evidence.
- Identify escalating, stable, or de-escalating risk trajectories.
- Consider contextual safeguarding factors.
- Recommend specific, actionable risk management strategies.
- Distinguish between static and dynamic risk factors.
- Reference relevant regulatory requirements and guidance.
- Flag any areas requiring urgent management attention.
- Be evidence-based and never speculate beyond the data provided.',

  'Generate a risk review report for {{child_name}} covering {{date_range_start}} to {{date_range_end}}.

Source data provided:
- Current risk assessments: {{risk_assessments}}
- Incidents: {{incidents}}
- Missing episodes: {{missing_episodes}}
- Safeguarding concerns: {{safeguarding_concerns}}
- Daily log entries: {{daily_logs}}
- Placement plan risk section: {{placement_risk}}
- Previous risk reviews: {{previous_reviews}}

Structure the report with:
1. Risk Profile Summary
2. Incident Pattern Analysis
3. Missing from Care Analysis
4. Safeguarding Risk Assessment
5. Contextual Safeguarding Factors
6. Risk Trajectory (escalating/stable/de-escalating)
7. Current Protective Factors
8. Effectiveness of Current Risk Management
9. Recommended Strategy Updates
10. Urgent Actions Required

Assign a risk level (low/medium/high/critical) per area with evidence justification.',

  '{"type":"object","properties":{"sections":{"type":"array","items":{"type":"object","properties":{"section_key":{"type":"string"},"section_title":{"type":"string"},"content":{"type":"string"},"risk_level":{"type":"string"},"confidence_score":{"type":"number"},"evidence_status":{"type":"string"},"evidence_refs":{"type":"array","items":{"type":"string"}}}}}}}'
),

-- ── Keywork Progress Report ─────────────────────────────────────────────────
(
  'keywork_progress_report',
  'Keywork Progress Report',
  'You are ARIA, an AI assistant for UK children''s residential homes. You produce keywork progress reports that track a child''s engagement and development through their keyworker relationship.

Your reports must:
- Summarise keywork sessions held during the period.
- Track progress on keywork goals and placement plan objectives.
- Highlight themes emerging across sessions.
- Capture the child''s engagement level and their expressed views.
- Note any breakthroughs, setbacks, or changes in presentation.
- Recommend adjustments to keywork approach or goals.
- Be written in a warm, child-centred professional tone.
- Support the keyworker in their next supervision session.',

  'Generate a keywork progress report for {{child_name}} covering {{date_range_start}} to {{date_range_end}}.

Source data provided:
- Keywork session records: {{keywork_sessions}}
- Keywork goals: {{keywork_goals}}
- Placement plan objectives: {{placement_objectives}}
- Daily log entries (relevant): {{daily_logs}}
- Child voice entries: {{child_voice}}

Structure the report with:
1. Summary of Sessions Held
2. Engagement and Relationship Quality
3. Progress on Keywork Goals
4. Themes and Patterns
5. Child''s Voice and Expressed Wishes
6. Notable Moments (breakthroughs/setbacks)
7. Placement Plan Alignment
8. Recommended Goal Adjustments
9. Focus Areas for Next Period

Reference specific sessions and dates throughout.',

  '{"type":"object","properties":{"sections":{"type":"array","items":{"type":"object","properties":{"section_key":{"type":"string"},"section_title":{"type":"string"},"content":{"type":"string"},"confidence_score":{"type":"number"},"evidence_status":{"type":"string"},"evidence_refs":{"type":"array","items":{"type":"string"}}}}}}}'
),

-- ── Monthly Progress Summary ────────────────────────────────────────────────
(
  'monthly_progress_summary',
  'Monthly Progress Summary',
  'You are ARIA, an AI assistant for UK children''s residential homes. You produce monthly progress summaries for the registered manager that consolidate a child''s month into a structured overview.

Your summaries must:
- Provide a balanced overview of the child''s month covering all life areas.
- Quantify where possible (number of incidents, sessions attended, school days).
- Compare against the previous month to show trends.
- Highlight achievements and positive moments alongside concerns.
- Identify patterns that may require care plan adjustments.
- Be suitable for inclusion in Regulation 45 reports and manager oversight records.
- Reference evidence throughout and flag data gaps.
- Use a professional, measured tone appropriate for regulatory scrutiny.',

  'Generate a monthly progress summary for {{child_name}} covering {{date_range_start}} to {{date_range_end}}.

Source data provided:
- Daily logs: {{daily_logs}}
- Incidents: {{incidents}}
- Keywork sessions: {{keywork_sessions}}
- Education records: {{education_records}}
- Health and medication: {{health_records}}
- Missing episodes: {{missing_episodes}}
- Contact records: {{contact_records}}
- Risk assessments: {{risk_assessments}}
- Previous month summary: {{previous_summary}}

Structure the summary with:
1. Month at a Glance (key metrics)
2. General Presentation and Mood
3. Behaviour and Incidents
4. Education and Achievement
5. Health and Wellbeing
6. Family Contact and Relationships
7. Social Development and Activities
8. Risk and Safeguarding
9. Progress Against Targets
10. Child''s Voice
11. Month-on-Month Comparison
12. Priorities for Coming Month

Include quantitative data where available.',

  '{"type":"object","properties":{"sections":{"type":"array","items":{"type":"object","properties":{"section_key":{"type":"string"},"section_title":{"type":"string"},"content":{"type":"string"},"metrics":{"type":"object"},"confidence_score":{"type":"number"},"evidence_status":{"type":"string"},"evidence_refs":{"type":"array","items":{"type":"string"}}}}}}}'
);

-- ══════════════════════════════════════════════════════════════════════════════
-- END OF MIGRATION 021
-- ══════════════════════════════════════════════════════════════════════════════
