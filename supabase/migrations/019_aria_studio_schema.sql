-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — Migration 019: ARIA Studio Schema
--
-- Complete data model for ARIA Studio — the therapeutic care intelligence
-- studio. 18 tables covering: sources, artifacts, evidence linking, version
-- history, reviews, actions, audit logging, care knowledge graph, evidence
-- assessments, gap detection, contradiction detection, safeguarding patterns,
-- home dynamics, early warnings, formulations, decision support, and quality
-- checks.
--
-- Tenant isolation is via home_id (FK → homes). No separate tenant column.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. aria_studio_sources ────────────────────────────────────────────────────
-- Internal evidence that ARIA can use for grounded generation.

CREATE TABLE IF NOT EXISTS aria_studio_sources (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id              uuid        NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_id             uuid        REFERENCES young_people(id) ON DELETE SET NULL,
  staff_id             uuid        REFERENCES staff_members(id) ON DELETE SET NULL,
  linked_record_id     uuid,
  linked_record_type   text,
  source_type          text        NOT NULL,
  title                text,
  summary              text,
  content              text,
  extracted_text       text,
  source_date          timestamptz,
  category             text,
  tags                 jsonb       NOT NULL DEFAULT '[]',
  confidentiality_level text       NOT NULL DEFAULT 'standard',
  approval_status      text        NOT NULL DEFAULT 'approved',
  is_sensitive         boolean     NOT NULL DEFAULT false,
  created_by           text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  archived_at          timestamptz
);

COMMENT ON TABLE aria_studio_sources IS
  'Internal evidence records that ARIA Studio uses for grounded, evidence-based generation. Each source links to an existing Cornerstone record.';

CREATE INDEX idx_aria_sources_home      ON aria_studio_sources (home_id);
CREATE INDEX idx_aria_sources_child     ON aria_studio_sources (child_id);
CREATE INDEX idx_aria_sources_type      ON aria_studio_sources (source_type);
CREATE INDEX idx_aria_sources_home_type ON aria_studio_sources (home_id, source_type);
CREATE INDEX idx_aria_sources_home_child ON aria_studio_sources (home_id, child_id);

-- ── 2. aria_studio_artifacts ──────────────────────────────────────────────────
-- Generated outputs: drafts through to committed official records.

CREATE TABLE IF NOT EXISTS aria_studio_artifacts (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                 uuid        NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  artifact_type           text        NOT NULL,
  title                   text        NOT NULL,
  status                  text        NOT NULL DEFAULT 'draft',
  child_id                uuid        REFERENCES young_people(id) ON DELETE SET NULL,
  staff_id                uuid        REFERENCES staff_members(id) ON DELETE SET NULL,
  incident_id             uuid,
  linked_record_id        uuid,
  linked_record_type      text,
  framework               text,
  tone                    text        NOT NULL DEFAULT 'balanced',
  creative_mode           text        NOT NULL DEFAULT 'balanced',
  generated_content       text,
  structured_content      jsonb,
  plain_text_content      text,
  quality_score           integer,
  evidence_confidence_score integer,
  safeguarding_level      text        NOT NULL DEFAULT 'none',
  regulation_relevance    jsonb       NOT NULL DEFAULT '[]',
  created_by              text        NOT NULL,
  reviewed_by             text,
  approved_by             text,
  committed_by            text,
  rejected_by             text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  submitted_for_review_at timestamptz,
  reviewed_at             timestamptz,
  approved_at             timestamptz,
  committed_at            timestamptz,
  rejected_at             timestamptz,
  archived_at             timestamptz,
  version_number          integer     NOT NULL DEFAULT 1,
  filing_cabinet_path     text,
  official_record_id      uuid
);

COMMENT ON TABLE aria_studio_artifacts IS
  'AI-generated outputs from ARIA Studio. Follows draft → review → approve → commit lifecycle. Only committed artifacts become part of the official record.';

CREATE INDEX idx_aria_artifacts_home        ON aria_studio_artifacts (home_id);
CREATE INDEX idx_aria_artifacts_child       ON aria_studio_artifacts (child_id);
CREATE INDEX idx_aria_artifacts_status      ON aria_studio_artifacts (status);
CREATE INDEX idx_aria_artifacts_type        ON aria_studio_artifacts (artifact_type);
CREATE INDEX idx_aria_artifacts_home_status ON aria_studio_artifacts (home_id, status);
CREATE INDEX idx_aria_artifacts_home_type   ON aria_studio_artifacts (home_id, artifact_type);
CREATE INDEX idx_aria_artifacts_created_by  ON aria_studio_artifacts (created_by);

-- ── 3. aria_studio_artifact_sources ───────────────────────────────────────────
-- Links every generated artifact to the evidence used.

CREATE TABLE IF NOT EXISTS aria_studio_artifact_sources (
  id                uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id       uuid    NOT NULL REFERENCES aria_studio_artifacts(id) ON DELETE CASCADE,
  source_id         uuid    NOT NULL REFERENCES aria_studio_sources(id) ON DELETE CASCADE,
  relevance_reason  text,
  confidence_level  text    NOT NULL DEFAULT 'medium',
  confidence_score  integer,
  source_strength   text,
  is_primary_evidence boolean NOT NULL DEFAULT false,
  is_child_voice    boolean NOT NULL DEFAULT false,
  is_contradicted   boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE aria_studio_artifact_sources IS
  'Evidence provenance — links every ARIA artifact to the specific sources used in its generation.';

CREATE INDEX idx_aria_art_src_artifact ON aria_studio_artifact_sources (artifact_id);
CREATE INDEX idx_aria_art_src_source   ON aria_studio_artifact_sources (source_id);

-- ── 4. aria_studio_artifact_versions ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS aria_studio_artifact_versions (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id         uuid        NOT NULL REFERENCES aria_studio_artifacts(id) ON DELETE CASCADE,
  version_number      integer     NOT NULL,
  title               text,
  content             text,
  structured_content  jsonb,
  change_summary      text,
  changed_by          text        NOT NULL,
  changed_at          timestamptz NOT NULL DEFAULT now(),
  previous_version_id uuid
);

COMMENT ON TABLE aria_studio_artifact_versions IS
  'Full version history for every artifact. Committed records preserve all prior versions.';

CREATE INDEX idx_aria_versions_artifact ON aria_studio_artifact_versions (artifact_id);

-- ── 5. aria_studio_artifact_reviews ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS aria_studio_artifact_reviews (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id      uuid        NOT NULL REFERENCES aria_studio_artifacts(id) ON DELETE CASCADE,
  reviewer_id      text        NOT NULL,
  review_status    text        NOT NULL,
  review_comment   text,
  requested_changes text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE aria_studio_artifact_reviews IS
  'Review comments and decisions for ARIA artifacts in the approval workflow.';

CREATE INDEX idx_aria_reviews_artifact ON aria_studio_artifact_reviews (artifact_id);

-- ── 6. aria_studio_artifact_actions ───────────────────────────────────────────
-- Tasks created from artifacts.

CREATE TABLE IF NOT EXISTS aria_studio_artifact_actions (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id        uuid        NOT NULL REFERENCES aria_studio_artifacts(id) ON DELETE CASCADE,
  task_id            uuid,
  action_title       text        NOT NULL,
  action_description text,
  assigned_to        text,
  due_date           timestamptz,
  priority           text        NOT NULL DEFAULT 'medium',
  status             text        NOT NULL DEFAULT 'open',
  escalation_level   text        NOT NULL DEFAULT 'none',
  created_by         text        NOT NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  completed_at       timestamptz,
  reviewed_at        timestamptz
);

COMMENT ON TABLE aria_studio_artifact_actions IS
  'Linked tasks and actions generated from ARIA artifacts. Supports escalation tracking.';

CREATE INDEX idx_aria_actions_artifact ON aria_studio_artifact_actions (artifact_id);
CREATE INDEX idx_aria_actions_status   ON aria_studio_artifact_actions (status);

-- ── 7. aria_studio_audit_log ──────────────────────────────────────────────────
-- Every AI action is logged — immutable append-only.

CREATE TABLE IF NOT EXISTS aria_studio_audit_log (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id           uuid        NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  actor_id          text        NOT NULL,
  action_type       text        NOT NULL,
  artifact_id       uuid,
  source_ids        jsonb       NOT NULL DEFAULT '[]',
  prompt_summary    text,
  model_provider    text,
  model_name        text,
  request_metadata  jsonb,
  response_metadata jsonb,
  before_state      jsonb,
  after_state       jsonb,
  ip_address        text,
  user_agent        text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE aria_studio_audit_log IS
  'Immutable audit trail for every ARIA Studio action. Append-only — no updates or deletes.';

CREATE INDEX idx_aria_audit_home      ON aria_studio_audit_log (home_id);
CREATE INDEX IF NOT EXISTS idx_aria_audit_actor     ON aria_studio_audit_log (actor_id);
CREATE INDEX idx_aria_audit_artifact  ON aria_studio_audit_log (artifact_id);
CREATE INDEX idx_aria_audit_action    ON aria_studio_audit_log (action_type);
CREATE INDEX IF NOT EXISTS idx_aria_audit_created   ON aria_studio_audit_log (created_at);

-- ── 8. aria_studio_care_graph_nodes ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS aria_studio_care_graph_nodes (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id            uuid        NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  node_type          text        NOT NULL,
  linked_record_id   uuid,
  linked_record_type text,
  label              text        NOT NULL,
  summary            text,
  metadata           jsonb       NOT NULL DEFAULT '{}',
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE aria_studio_care_graph_nodes IS
  'Care knowledge graph nodes. Links children, staff, incidents, risks, triggers, plans, and outcomes.';

CREATE INDEX idx_aria_graph_nodes_home   ON aria_studio_care_graph_nodes (home_id);
CREATE INDEX idx_aria_graph_nodes_type   ON aria_studio_care_graph_nodes (node_type);
CREATE INDEX idx_aria_graph_nodes_record ON aria_studio_care_graph_nodes (linked_record_id);

-- ── 9. aria_studio_care_graph_edges ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS aria_studio_care_graph_edges (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  from_node_id      uuid        NOT NULL REFERENCES aria_studio_care_graph_nodes(id) ON DELETE CASCADE,
  to_node_id        uuid        NOT NULL REFERENCES aria_studio_care_graph_nodes(id) ON DELETE CASCADE,
  relationship_type text        NOT NULL,
  strength          integer,
  evidence_source_id uuid,
  confidence_score  integer,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE aria_studio_care_graph_edges IS
  'Care knowledge graph edges. Models relationships: caused_by, reduces_risk_of, evidenced_by, etc.';

CREATE INDEX idx_aria_graph_edges_from ON aria_studio_care_graph_edges (from_node_id);
CREATE INDEX idx_aria_graph_edges_to   ON aria_studio_care_graph_edges (to_node_id);

-- ── 10. aria_studio_evidence_assessments ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS aria_studio_evidence_assessments (
  id                       uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id                uuid    NOT NULL REFERENCES aria_studio_sources(id) ON DELETE CASCADE,
  relevance_score          integer,
  recency_score            integer,
  reliability_score        integer,
  approval_score           integer,
  corroboration_score      integer,
  child_voice_score        integer,
  contradiction_score      integer,
  overall_confidence_score integer,
  evidence_level           text    NOT NULL DEFAULT 'medium',
  assessment_notes         text,
  created_at               timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE aria_studio_evidence_assessments IS
  'Evidence quality scoring. Every source is scored for relevance, recency, reliability, corroboration and child voice presence.';

CREATE INDEX idx_aria_evidence_source ON aria_studio_evidence_assessments (source_id);

-- ── 11. aria_studio_gaps ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS aria_studio_gaps (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id            uuid        NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_id           uuid        REFERENCES young_people(id) ON DELETE SET NULL,
  staff_id           uuid        REFERENCES staff_members(id) ON DELETE SET NULL,
  gap_type           text        NOT NULL,
  severity           text        NOT NULL DEFAULT 'medium',
  title              text        NOT NULL,
  description        text,
  recommended_action text,
  linked_record_id   uuid,
  linked_record_type text,
  status             text        NOT NULL DEFAULT 'open',
  assigned_to        text,
  due_date           timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  resolved_at        timestamptz
);

COMMENT ON TABLE aria_studio_gaps IS
  'Detected evidence gaps — missing child voice, overdue plans, weak Reg 45 evidence, etc.';

CREATE INDEX idx_aria_gaps_home   ON aria_studio_gaps (home_id);
CREATE INDEX idx_aria_gaps_child  ON aria_studio_gaps (child_id);
CREATE INDEX idx_aria_gaps_status ON aria_studio_gaps (status);
CREATE INDEX idx_aria_gaps_type   ON aria_studio_gaps (gap_type);

-- ── 12. aria_studio_contradictions ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS aria_studio_contradictions (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                  uuid        NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_id                 uuid        REFERENCES young_people(id) ON DELETE SET NULL,
  source_a_id              uuid        REFERENCES aria_studio_sources(id) ON DELETE SET NULL,
  source_b_id              uuid        REFERENCES aria_studio_sources(id) ON DELETE SET NULL,
  contradiction_type       text        NOT NULL,
  description              text,
  severity                 text        NOT NULL DEFAULT 'medium',
  recommended_review_action text,
  status                   text        NOT NULL DEFAULT 'open',
  reviewed_by              text,
  reviewed_at              timestamptz,
  created_at               timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE aria_studio_contradictions IS
  'Detected inconsistencies between records. Flagged for human review — not treated as fact.';

CREATE INDEX idx_aria_contradictions_home   ON aria_studio_contradictions (home_id);
CREATE INDEX idx_aria_contradictions_status ON aria_studio_contradictions (status);

-- ── 13. aria_studio_safeguarding_patterns ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS aria_studio_safeguarding_patterns (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id              uuid        NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_id             uuid        REFERENCES young_people(id) ON DELETE SET NULL,
  pattern_type         text        NOT NULL,
  risk_level           text        NOT NULL DEFAULT 'medium',
  title                text        NOT NULL,
  description          text,
  indicators           jsonb       NOT NULL DEFAULT '[]',
  evidence_source_ids  jsonb       NOT NULL DEFAULT '[]',
  recommended_actions  jsonb       NOT NULL DEFAULT '[]',
  status               text        NOT NULL DEFAULT 'open',
  created_at           timestamptz NOT NULL DEFAULT now(),
  reviewed_at          timestamptz,
  resolved_at          timestamptz
);

COMMENT ON TABLE aria_studio_safeguarding_patterns IS
  'Safeguarding pattern detection. Uses careful language: possible indicator, requires review, may suggest.';

CREATE INDEX idx_aria_safeguarding_home   ON aria_studio_safeguarding_patterns (home_id);
CREATE INDEX idx_aria_safeguarding_child  ON aria_studio_safeguarding_patterns (child_id);
CREATE INDEX idx_aria_safeguarding_status ON aria_studio_safeguarding_patterns (status);

-- ── 14. aria_studio_home_dynamics ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS aria_studio_home_dynamics (
  id                        uuid   PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                   uuid   NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  snapshot_date             date   NOT NULL,
  summary                   text,
  emotional_climate         text,
  incident_count            integer NOT NULL DEFAULT 0,
  missing_episode_count     integer NOT NULL DEFAULT 0,
  restraint_count           integer NOT NULL DEFAULT 0,
  complaint_count           integer NOT NULL DEFAULT 0,
  staff_absence_count       integer NOT NULL DEFAULT 0,
  agency_staff_count        integer NOT NULL DEFAULT 0,
  education_concerns_count  integer NOT NULL DEFAULT 0,
  safeguarding_alerts_count integer NOT NULL DEFAULT 0,
  overdue_actions_count     integer NOT NULL DEFAULT 0,
  risk_level                text   NOT NULL DEFAULT 'stable',
  recommended_manager_focus text,
  data                      jsonb  NOT NULL DEFAULT '{}',
  created_at                timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE aria_studio_home_dynamics IS
  'Whole-home intelligence snapshots. Captures emotional climate, incident trends, staffing, compliance state.';

CREATE INDEX idx_aria_dynamics_home ON aria_studio_home_dynamics (home_id);
CREATE INDEX idx_aria_dynamics_date ON aria_studio_home_dynamics (snapshot_date);

-- ── 15. aria_studio_early_warnings ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS aria_studio_early_warnings (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id            uuid        NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_id           uuid        REFERENCES young_people(id) ON DELETE SET NULL,
  staff_id           uuid        REFERENCES staff_members(id) ON DELETE SET NULL,
  warning_type       text        NOT NULL,
  risk_level         text        NOT NULL DEFAULT 'medium',
  title              text        NOT NULL,
  description        text,
  indicators         jsonb       NOT NULL DEFAULT '[]',
  confidence_score   integer,
  recommended_action text,
  status             text        NOT NULL DEFAULT 'open',
  created_at         timestamptz NOT NULL DEFAULT now(),
  reviewed_at        timestamptz,
  resolved_at        timestamptz
);

COMMENT ON TABLE aria_studio_early_warnings IS
  'Predictive early warnings. Uses careful language: may be increasing, indicators suggest, manager review recommended.';

CREATE INDEX idx_aria_warnings_home   ON aria_studio_early_warnings (home_id);
CREATE INDEX idx_aria_warnings_child  ON aria_studio_early_warnings (child_id);
CREATE INDEX idx_aria_warnings_status ON aria_studio_early_warnings (status);

-- ── 16. aria_studio_formulations ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS aria_studio_formulations (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                  uuid        NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_id                 uuid        NOT NULL REFERENCES young_people(id) ON DELETE CASCADE,
  title                    text        NOT NULL,
  presenting_behaviour     text,
  possible_unmet_need      text,
  trauma_link              text,
  attachment_considerations text,
  triggers                 jsonb       NOT NULL DEFAULT '[]',
  protective_factors       jsonb       NOT NULL DEFAULT '[]',
  relational_strengths     jsonb       NOT NULL DEFAULT '[]',
  staff_response_patterns  jsonb       NOT NULL DEFAULT '[]',
  what_helps               text,
  what_escalates           text,
  therapeutic_hypothesis   text,
  recommended_intervention text,
  review_date              date,
  evidence_source_ids      jsonb       NOT NULL DEFAULT '[]',
  created_by               text        NOT NULL,
  approved_by              text,
  created_at               timestamptz NOT NULL DEFAULT now(),
  approved_at              timestamptz
);

COMMENT ON TABLE aria_studio_formulations IS
  'Therapeutic formulations — professional hypotheses, not diagnoses. Links behaviour to unmet need via trauma-informed thinking.';

CREATE INDEX idx_aria_formulations_home  ON aria_studio_formulations (home_id);
CREATE INDEX idx_aria_formulations_child ON aria_studio_formulations (child_id);

-- ── 17. aria_studio_decision_support ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS aria_studio_decision_support (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id               uuid        NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  decision_context      text        NOT NULL,
  child_id              uuid        REFERENCES young_people(id) ON DELETE SET NULL,
  staff_id              uuid        REFERENCES staff_members(id) ON DELETE SET NULL,
  known_facts           jsonb       NOT NULL DEFAULT '[]',
  unknowns              jsonb       NOT NULL DEFAULT '[]',
  risks                 jsonb       NOT NULL DEFAULT '[]',
  options               jsonb       NOT NULL DEFAULT '[]',
  pros_cons             jsonb       NOT NULL DEFAULT '[]',
  child_impact          text,
  staff_impact          text,
  compliance_impact     text,
  recommended_next_steps jsonb      NOT NULL DEFAULT '[]',
  evidence_needed       jsonb       NOT NULL DEFAULT '[]',
  decision_made_by      text,
  decision_recorded_at  timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE aria_studio_decision_support IS
  'Professional reasoning support. Helps managers think — does not make the decision.';

CREATE INDEX idx_aria_decisions_home  ON aria_studio_decision_support (home_id);
CREATE INDEX idx_aria_decisions_child ON aria_studio_decision_support (child_id);

-- ── 18. aria_studio_quality_checks ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS aria_studio_quality_checks (
  id                         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id                uuid    NOT NULL REFERENCES aria_studio_artifacts(id) ON DELETE CASCADE,
  evidence_cited             boolean NOT NULL DEFAULT false,
  child_voice_considered     boolean NOT NULL DEFAULT false,
  risk_considered            boolean NOT NULL DEFAULT false,
  safeguarding_considered    boolean NOT NULL DEFAULT false,
  regulation_considered      boolean NOT NULL DEFAULT false,
  actions_clear              boolean NOT NULL DEFAULT false,
  owner_assigned             boolean NOT NULL DEFAULT false,
  review_date_set            boolean NOT NULL DEFAULT false,
  human_approval_complete    boolean NOT NULL DEFAULT false,
  sensitive_language_reviewed boolean NOT NULL DEFAULT false,
  no_unsupported_claims      boolean NOT NULL DEFAULT false,
  no_ai_style_filler         boolean NOT NULL DEFAULT false,
  dignity_language_passed    boolean NOT NULL DEFAULT false,
  overall_passed             boolean NOT NULL DEFAULT false,
  issues                     jsonb   NOT NULL DEFAULT '[]',
  created_at                 timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE aria_studio_quality_checks IS
  'Quality gate before approval. Checks evidence, child voice, risk, safeguarding, dignity language, and AI filler.';

CREATE INDEX idx_aria_quality_artifact ON aria_studio_quality_checks (artifact_id);
