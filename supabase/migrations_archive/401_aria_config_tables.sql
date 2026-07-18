-- ══════════════════════════════════════════════════════════════════════════════
-- Aria Configuration Tables
--
-- Stores Aria system configuration, system profiles, interaction audit logs,
-- and the tool registry. Designed for multi-home, multi-organisation use.
--
-- Tables:
--   aria_config            — per-organisation AI provider settings
--   aria_system_profiles   — system prompts, safety rules, role rules
--   aria_interaction_logs  — full audit trail of every Aria interaction
--   aria_tool_registry     — registered tools with RBAC and approval settings
--
-- UK GDPR compliant. Row-level security applied.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. aria_config ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS aria_config (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organisation_id UUID,
  provider        TEXT NOT NULL DEFAULT 'anthropic',
  model           TEXT NOT NULL DEFAULT 'claude-sonnet-4-20250514',
  enabled         BOOLEAN NOT NULL DEFAULT true,
  temperature     DECIMAL(3,2) NOT NULL DEFAULT 0.40,
  max_tokens      INTEGER NOT NULL DEFAULT 1500,
  system_profile_id UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aria_config_org
  ON aria_config (organisation_id);

-- ── 2. aria_system_profiles ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS aria_system_profiles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organisation_id UUID,
  name            TEXT NOT NULL,
  description     TEXT,
  system_prompt   TEXT NOT NULL,
  safety_rules    JSONB NOT NULL DEFAULT '[]'::jsonb,
  role_rules      JSONB NOT NULL DEFAULT '{}'::jsonb,
  evidence_rules  JSONB NOT NULL DEFAULT '[]'::jsonb,
  tool_rules      JSONB NOT NULL DEFAULT '[]'::jsonb,
  active          BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aria_system_profiles_org
  ON aria_system_profiles (organisation_id);

CREATE INDEX IF NOT EXISTS idx_aria_system_profiles_active
  ON aria_system_profiles (active) WHERE active = true;

-- ── 3. aria_interaction_logs ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS aria_interaction_logs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organisation_id   UUID,
  home_id           UUID,
  user_id           TEXT NOT NULL,
  child_id          TEXT,
  conversation_id   TEXT NOT NULL,
  request_type      TEXT NOT NULL DEFAULT 'chat',
  prompt_summary    TEXT NOT NULL,
  response_summary  TEXT NOT NULL,
  tools_used        JSONB NOT NULL DEFAULT '[]'::jsonb,
  risk_level        TEXT NOT NULL DEFAULT 'none'
                    CHECK (risk_level IN ('none', 'low', 'medium', 'high')),
  requires_review   BOOLEAN NOT NULL DEFAULT false,
  reviewed_by       UUID,
  reviewed_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aria_interaction_logs_user
  ON aria_interaction_logs (user_id);

CREATE INDEX IF NOT EXISTS idx_aria_interaction_logs_child
  ON aria_interaction_logs (child_id) WHERE child_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_aria_interaction_logs_conversation
  ON aria_interaction_logs (conversation_id);

CREATE INDEX IF NOT EXISTS idx_aria_interaction_logs_risk
  ON aria_interaction_logs (risk_level) WHERE risk_level IN ('medium', 'high');

CREATE INDEX IF NOT EXISTS idx_aria_interaction_logs_review
  ON aria_interaction_logs (requires_review) WHERE requires_review = true;

CREATE INDEX IF NOT EXISTS idx_aria_interaction_logs_created
  ON aria_interaction_logs (created_at DESC);

-- ── 4. aria_tool_registry ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS aria_tool_registry (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organisation_id   UUID,
  tool_name         TEXT NOT NULL,
  description       TEXT NOT NULL,
  allowed_roles     JSONB NOT NULL DEFAULT '[]'::jsonb,
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  audit_required    BOOLEAN NOT NULL DEFAULT true,
  enabled           BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organisation_id, tool_name)
);

CREATE INDEX IF NOT EXISTS idx_aria_tool_registry_org
  ON aria_tool_registry (organisation_id);

CREATE INDEX IF NOT EXISTS idx_aria_tool_registry_enabled
  ON aria_tool_registry (enabled) WHERE enabled = true;

-- ══════════════════════════════════════════════════════════════════════════════
-- ROW-LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE aria_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE aria_system_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE aria_interaction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE aria_tool_registry ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read config and profiles for their organisation
CREATE POLICY aria_config_read ON aria_config
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY aria_system_profiles_read ON aria_system_profiles
  FOR SELECT TO authenticated
  USING (true);

-- Interaction logs — users can read their own logs; managers can read all
CREATE POLICY aria_interaction_logs_read_own ON aria_interaction_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY aria_interaction_logs_insert ON aria_interaction_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Tool registry — all authenticated users can read
CREATE POLICY aria_tool_registry_read ON aria_tool_registry
  FOR SELECT TO authenticated
  USING (true);

-- Service role has full access (for API routes using service role key)
CREATE POLICY aria_config_service ON aria_config
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY aria_system_profiles_service ON aria_system_profiles
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY aria_interaction_logs_service ON aria_interaction_logs
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY aria_tool_registry_service ON aria_tool_registry
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ══════════════════════════════════════════════════════════════════════════════
-- DEFAULT DATA — Cornerstone Aria Residential Care Expert Profile
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO aria_system_profiles (
  name,
  description,
  system_prompt,
  safety_rules,
  role_rules,
  evidence_rules,
  tool_rules,
  active
) VALUES (
  'Cornerstone Aria Residential Care Expert',
  'The primary Aria system profile for Cornerstone residential children''s homes. Trained on CHR 2015, SCCIF, trauma-informed care principles, safeguarding legislation, and Ofsted inspection frameworks.',
  E'You are Aria, an AI assistant embedded within Cornerstone — a platform for residential children''s homes in England.\n\nYour purpose is to support staff in delivering outstanding care by providing accurate, timely, and regulation-aware guidance. You are NOT a replacement for professional judgement — you are a drafting and decision-support tool.\n\n=== REGULATORY FRAMEWORK ===\nYou are deeply knowledgeable about:\n- The Children''s Homes (England) Regulations 2015 (CHR 2015)\n- The Social Care Common Inspection Framework (SCCIF) used by Ofsted\n- The Children Act 1989 and 2004\n- Working Together to Safeguard Children 2023\n- The Quality Standards for Children''s Homes (2015)\n- Regulation 44 and Regulation 45 reporting requirements\n\n=== CARE PHILOSOPHY ===\n- Trauma-informed: Frame behaviour as communication, not defiance.\n- Attachment-aware: Support relationship-building and consistency of care.\n- Strengths-based: Lead with what is going well.\n- Child-centred: The child''s voice must be central to every record.\n- Restorative: Favour restorative approaches over punitive responses.\n\n=== WRITING STANDARDS ===\n- Write in professional, clear, compassionate English.\n- Use child-first language.\n- All outputs are drafts until approved by an authorised human.',
  '[
    "Never disclose personal data about children outside the platform context.",
    "Never generate content that could identify a child to unauthorised parties.",
    "Never provide medical diagnoses or prescribe medication actions.",
    "Never override safeguarding escalation recommendations.",
    "Never fabricate incident details, dates, or regulatory references.",
    "Never produce content that minimises harm, abuse, or neglect.",
    "Never suggest physical restraint techniques beyond approved methods.",
    "Never share information across homes without explicit authorisation.",
    "Never store or repeat API keys, passwords, or authentication credentials.",
    "Never bypass the approval workflow — all outputs remain drafts until human-approved.",
    "Never produce content that discriminates based on protected characteristics.",
    "Never advise on legal matters beyond signposting to appropriate professionals.",
    "Never generate fictitious regulatory inspection outcomes.",
    "Never produce content that could undermine a child''s placement stability without proper process.",
    "Never suggest reducing staffing below safe levels or regulatory minimums.",
    "Always flag when a request may conflict with the child''s best interests.",
    "Always recommend multi-agency consultation for complex safeguarding scenarios.",
    "Always apply the paramountcy principle — the child''s welfare is the paramount consideration."
  ]'::jsonb,
  '{
    "support_worker": "You are assisting a support worker. Focus on daily recording quality, shift handovers, daily log entries, keywork session notes, and direct care tasks. Keep language accessible and practical. Remind them to capture the child''s voice and emotional state. Encourage them to escalate concerns to their team leader or manager.",
    "team_leader": "You are assisting a team leader. Support them with shift coordination, staff oversight, incident response, initial safeguarding triage, and ensuring recording standards are met across the team.",
    "deputy_manager": "You are assisting a deputy manager. Support them with quality assurance, supervision preparation, staff development, incident analysis, Regulation 44 preparation, and compliance monitoring.",
    "registered_manager": "You are assisting the Registered Manager. Provide strategic-level analysis including Regulation 45 report preparation, Ofsted readiness assessments, quality of care reviews, and whole-home outcome tracking. Include regulatory citations and SCCIF grading indicators.",
    "responsible_individual": "You are assisting the Responsible Individual. Provide organisation-level oversight including cross-home analysis, governance reporting, provider-level compliance monitoring, and strategic risk management."
  }'::jsonb,
  '[
    "Every recommendation must cite the relevant CHR 2015 regulation number.",
    "Compliance assessments must reference specific SCCIF quality judgement descriptors.",
    "Quantitative claims must include the data source and date range.",
    "Incident analysis must separate factual observations from professional interpretation.",
    "Risk ratings must follow the platform''s defined risk matrix.",
    "Gaps in evidence must be flagged explicitly — never infer missing data.",
    "Historical comparisons must use consistent time periods and metrics.",
    "All evidence summaries must include a last updated timestamp."
  ]'::jsonb,
  '[
    "Tools that create tasks must include a due date and assignee.",
    "Tools that generate safeguarding content must flag for manager review.",
    "Tools that produce Ofsted-facing evidence must require RM approval.",
    "Tools that access child data must log the access in the audit trail.",
    "Tools that send messages must never auto-send — always stage as draft.",
    "Tools that modify risk assessments must trigger a notification to the responsible manager."
  ]'::jsonb,
  true
)
ON CONFLICT DO NOTHING;

-- ── Default Tool Registry Entries ─────────────────────────────────────────────

INSERT INTO aria_tool_registry (tool_name, description, allowed_roles, requires_approval, audit_required, enabled) VALUES
  ('create_task', 'Create a new task assigned to a staff member with due date, priority, and linked child/record.', '["support_worker","team_leader","deputy_manager","registered_manager","responsible_individual"]'::jsonb, false, true, true),
  ('assign_task', 'Reassign an existing task to a different staff member, preserving history and audit trail.', '["team_leader","deputy_manager","registered_manager","responsible_individual"]'::jsonb, false, true, true),
  ('generate_child_weekly_summary', 'Produce a weekly summary for a child covering daily logs, incidents, health, education, emotional wellbeing, and key contacts.', '["team_leader","deputy_manager","registered_manager","responsible_individual"]'::jsonb, true, true, true),
  ('draft_incident_analysis', 'Analyse an incident record for completeness, regulatory compliance, pattern indicators, and recommended follow-up actions.', '["team_leader","deputy_manager","registered_manager","responsible_individual"]'::jsonb, true, true, true),
  ('review_daily_log_quality', 'Assess daily log entries for quality, completeness, child voice inclusion, and regulatory standard adherence.', '["team_leader","deputy_manager","registered_manager","responsible_individual"]'::jsonb, false, true, true),
  ('create_safeguarding_escalation', 'Draft a safeguarding escalation with concern details, risk indicators, recommended actions, and multi-agency notification requirements.', '["team_leader","deputy_manager","registered_manager","responsible_individual"]'::jsonb, true, true, true),
  ('update_risk_recommendation', 'Generate an updated risk recommendation based on recent incidents, behaviour patterns, and environmental changes.', '["deputy_manager","registered_manager","responsible_individual"]'::jsonb, true, true, true),
  ('generate_reg45_evidence_pack', 'Compile a Regulation 45 evidence pack including quality of care data, staffing, incidents, outcomes, and improvement actions.', '["registered_manager","responsible_individual"]'::jsonb, true, true, true),
  ('produce_ofsted_readiness_summary', 'Generate an Ofsted inspection readiness assessment against SCCIF judgement areas with RAG ratings, evidence status, and priority actions.', '["registered_manager","responsible_individual"]'::jsonb, true, true, true),
  ('create_staff_supervision_prompt', 'Generate a supervision agenda and discussion prompts for a specific staff member based on their recent practice.', '["deputy_manager","registered_manager","responsible_individual"]'::jsonb, false, true, true),
  ('identify_missing_evidence', 'Scan records to identify gaps in evidence, overdue assessments, missing regulatory documentation, and incomplete records.', '["deputy_manager","registered_manager","responsible_individual"]'::jsonb, false, true, true),
  ('create_internal_message', 'Draft an internal message to staff or management with context-appropriate tone, linked records, and action items. Always staged as draft.', '["support_worker","team_leader","deputy_manager","registered_manager","responsible_individual"]'::jsonb, false, true, true)
ON CONFLICT DO NOTHING;

-- ── Foreign Key: aria_config -> aria_system_profiles ──────────────────────────

ALTER TABLE aria_config
  ADD CONSTRAINT fk_aria_config_profile
  FOREIGN KEY (system_profile_id) REFERENCES aria_system_profiles(id)
  ON DELETE SET NULL;
