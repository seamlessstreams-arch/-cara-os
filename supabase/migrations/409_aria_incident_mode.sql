-- ══════════════════════════════════════════════════════════════════════════════
-- ARIA Practice Assistant — Incident Mode & audit-safe recording (full data model)
--
-- Backs the in-memory collections behind ARIA Incident Mode (sessions, timeline,
-- recording reviews) and authors the remaining Practice Assistant tables
-- (prompt bank, workflow templates, restorative conversations, post-incident
-- reflections, manager alerts, practice audit log) so later slices write through
-- without further schema work. Write-through activates only when Supabase is
-- configured; until then the in-memory store holds the data.
--
-- AUDIT SAFETY: aria_recording_reviews preserves raw_text, ai_suggested_text and
-- final_accepted_text SEPARATELY — the original staff note can never be hidden
-- behind an AI rewrite. aria_audit_logs references entities by id and keeps
-- narrative out of the log (GDPR-light).
--
-- Home-scoped RLS via get_my_home_id(); the service-role key used by API routes
-- bypasses RLS. Distinct from migration 400's aria_ai_audit_logs (provider-level
-- AI telemetry) — aria_audit_logs here is the practice-action audit trail.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. incident_sessions ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS incident_sessions (
  id                    TEXT PRIMARY KEY,
  home_id               TEXT NOT NULL DEFAULT 'home_oak',
  child_id              TEXT NOT NULL,
  started_by_user_id    TEXT NOT NULL,
  started_at            TIMESTAMPTZ NOT NULL,
  ended_at              TIMESTAMPTZ,
  incident_type         TEXT NOT NULL,
  incident_status       TEXT NOT NULL DEFAULT 'active',      -- active | ended | record_created
  immediate_risk_level  TEXT NOT NULL DEFAULT 'medium',      -- low | medium | high
  manager_notified      BOOLEAN NOT NULL DEFAULT FALSE,
  manager_notified_at   TIMESTAMPTZ,
  ai_support_used       BOOLEAN NOT NULL DEFAULT TRUE,
  final_record_created  BOOLEAN NOT NULL DEFAULT FALSE,
  workflow_progress     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inc_sessions_home    ON incident_sessions (home_id, created_at);
CREATE INDEX IF NOT EXISTS idx_inc_sessions_child   ON incident_sessions (child_id, created_at);
CREATE INDEX IF NOT EXISTS idx_inc_sessions_user    ON incident_sessions (started_by_user_id);
CREATE INDEX IF NOT EXISTS idx_inc_sessions_status  ON incident_sessions (home_id, incident_status);

-- ── 2. incident_timeline_entries ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS incident_timeline_entries (
  id                   TEXT PRIMARY KEY,
  incident_session_id  TEXT NOT NULL,
  home_id              TEXT NOT NULL DEFAULT 'home_oak',
  child_id             TEXT NOT NULL,
  user_id              TEXT NOT NULL,
  entry_type           TEXT NOT NULL,                        -- observation | staff_action | child_voice | safety_update | manager_notification | restorative_action | deescalation_attempt | risk_change | other
  raw_text             TEXT NOT NULL,
  ai_rewritten_text    TEXT,
  accepted_text        TEXT,
  timestamp            TIMESTAMPTZ NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inc_timeline_session ON incident_timeline_entries (incident_session_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_inc_timeline_home    ON incident_timeline_entries (home_id, created_at);
CREATE INDEX IF NOT EXISTS idx_inc_timeline_child   ON incident_timeline_entries (child_id);

-- ── 3. aria_prompt_bank ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS aria_prompt_bank (
  id            TEXT PRIMARY KEY,
  category      TEXT NOT NULL,            -- co_regulation | deescalation | restorative | safeguarding | recording | child_voice | manager_oversight | staff_reflection | compliance | post_incident_learning
  title         TEXT,
  prompt_text   TEXT NOT NULL,
  incident_type TEXT,
  risk_level    TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_prompt_bank_cat ON aria_prompt_bank (category, is_active);

-- ── 4. aria_workflow_templates / steps / progress ──────────────────────────────
CREATE TABLE IF NOT EXISTS aria_workflow_templates (
  id            TEXT PRIMARY KEY,
  workflow_name TEXT NOT NULL,
  incident_type TEXT NOT NULL,
  description   TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS aria_workflow_steps (
  id                      TEXT PRIMARY KEY,
  workflow_template_id    TEXT NOT NULL,
  step_order              INTEGER NOT NULL DEFAULT 0,
  step_title              TEXT NOT NULL,
  step_description        TEXT,
  required                BOOLEAN NOT NULL DEFAULT TRUE,
  manager_review_required BOOLEAN NOT NULL DEFAULT FALSE,
  regulation_related      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wf_steps_template ON aria_workflow_steps (workflow_template_id, step_order);
CREATE TABLE IF NOT EXISTS incident_workflow_progress (
  id                   TEXT PRIMARY KEY,
  incident_session_id  TEXT NOT NULL,
  home_id              TEXT NOT NULL DEFAULT 'home_oak',
  workflow_step_id     TEXT NOT NULL,
  completed            BOOLEAN NOT NULL DEFAULT FALSE,
  completed_by_user_id TEXT,
  completed_at         TIMESTAMPTZ,
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wf_progress_session ON incident_workflow_progress (incident_session_id);

-- ── 5. aria_recording_reviews (raw + AI + final ALL preserved) ──────────────────
CREATE TABLE IF NOT EXISTS aria_recording_reviews (
  id                      TEXT PRIMARY KEY,
  home_id                 TEXT NOT NULL DEFAULT 'home_oak',
  child_id                TEXT NOT NULL,
  user_id                 TEXT NOT NULL,
  incident_session_id     TEXT,
  record_type             TEXT NOT NULL DEFAULT 'incident_report',
  raw_text                TEXT NOT NULL,
  ai_suggested_text       TEXT,
  final_accepted_text     TEXT NOT NULL,
  ai_quality_flags        JSONB NOT NULL DEFAULT '[]'::jsonb,
  staff_accepted          BOOLEAN NOT NULL DEFAULT FALSE,
  accepted_at             TIMESTAMPTZ,
  manager_review_required BOOLEAN NOT NULL DEFAULT TRUE,
  manager_reviewed_by     TEXT,
  manager_reviewed_at     TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rec_reviews_home    ON aria_recording_reviews (home_id, created_at);
CREATE INDEX IF NOT EXISTS idx_rec_reviews_child   ON aria_recording_reviews (child_id);
CREATE INDEX IF NOT EXISTS idx_rec_reviews_session ON aria_recording_reviews (incident_session_id);
CREATE INDEX IF NOT EXISTS idx_rec_reviews_manager ON aria_recording_reviews (home_id, manager_review_required) WHERE manager_reviewed_at IS NULL;

-- ── 6. restorative_conversations ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS restorative_conversations (
  id                      TEXT PRIMARY KEY,
  home_id                 TEXT NOT NULL DEFAULT 'home_oak',
  child_id                TEXT NOT NULL,
  incident_session_id     TEXT,
  completed_by_user_id    TEXT NOT NULL,
  conversation_date       DATE NOT NULL,
  child_ready_to_engage   BOOLEAN NOT NULL DEFAULT TRUE,
  child_voice             TEXT,
  what_happened           TEXT,
  who_was_affected        TEXT,
  what_helped             TEXT,
  what_made_it_worse      TEXT,
  repair_actions          TEXT,
  follow_up_required      BOOLEAN NOT NULL DEFAULT FALSE,
  ai_summary              TEXT,
  manager_review_required BOOLEAN NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_restorative_home  ON restorative_conversations (home_id, conversation_date);
CREATE INDEX IF NOT EXISTS idx_restorative_child ON restorative_conversations (child_id);

-- ── 7. post_incident_reflections ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_incident_reflections (
  id                      TEXT PRIMARY KEY,
  home_id                 TEXT NOT NULL DEFAULT 'home_oak',
  child_id                TEXT NOT NULL,
  incident_session_id     TEXT,
  completed_by_user_id    TEXT NOT NULL,
  antecedents             TEXT,
  early_warning_signs     TEXT,
  staff_response          TEXT,
  what_worked             TEXT,
  what_did_not_work       TEXT,
  child_needs_identified  TEXT,
  environmental_factors   TEXT,
  follow_up_actions       JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_reflective_summary   TEXT,
  manager_review_required BOOLEAN NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reflections_home  ON post_incident_reflections (home_id, created_at);
CREATE INDEX IF NOT EXISTS idx_reflections_child ON post_incident_reflections (child_id);

-- ── 8. aria_manager_alerts ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS aria_manager_alerts (
  id                   TEXT PRIMARY KEY,
  home_id              TEXT NOT NULL DEFAULT 'home_oak',
  child_id             TEXT,
  incident_session_id  TEXT,
  alert_type           TEXT NOT NULL,
  alert_title          TEXT NOT NULL,
  alert_description    TEXT,
  priority             TEXT NOT NULL DEFAULT 'medium',       -- low | medium | high | urgent
  status               TEXT NOT NULL DEFAULT 'open',         -- open | in_progress | resolved | dismissed
  assigned_to_user_id  TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at          TIMESTAMPTZ,
  resolved_by_user_id  TEXT
);
CREATE INDEX IF NOT EXISTS idx_mgr_alerts_home   ON aria_manager_alerts (home_id, status, priority);
CREATE INDEX IF NOT EXISTS idx_mgr_alerts_status ON aria_manager_alerts (status);

-- ── 9. aria_audit_logs (practice-action audit; narrative kept out) ──────────────
CREATE TABLE IF NOT EXISTS aria_audit_logs (
  id            TEXT PRIMARY KEY,
  home_id       TEXT NOT NULL DEFAULT 'home_oak',
  child_id      TEXT,
  user_id       TEXT NOT NULL,
  action_type   TEXT NOT NULL,            -- incident_started | timeline_entry_added | ai_prompt_generated | ai_record_rewrite_generated | ai_suggestion_accepted | ai_suggestion_rejected | manager_review_requested | manager_review_completed | alert_created | alert_resolved
  entity_type   TEXT,
  entity_id     TEXT,
  original_text TEXT,
  ai_output     TEXT,
  final_text    TEXT,
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_aria_audit_home   ON aria_audit_logs (home_id, created_at);
CREATE INDEX IF NOT EXISTS idx_aria_audit_user   ON aria_audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_aria_audit_entity ON aria_audit_logs (entity_type, entity_id);

-- ── 10. Row-level security (home-scoped; service role bypasses) ─────────────────
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'incident_sessions','incident_timeline_entries','aria_prompt_bank',
    'aria_workflow_templates','aria_workflow_steps','incident_workflow_progress',
    'aria_recording_reviews','restorative_conversations','post_incident_reflections',
    'aria_manager_alerts','aria_audit_logs'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- Home-scoped select/insert/update for tables carrying home_id
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'incident_sessions','incident_timeline_entries','incident_workflow_progress',
    'aria_recording_reviews','restorative_conversations','post_incident_reflections',
    'aria_manager_alerts','aria_audit_logs'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_select ON %I', t, t);
    EXECUTE format('CREATE POLICY %I_select ON %I FOR SELECT USING (home_id = get_my_home_id())', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_insert ON %I', t, t);
    EXECUTE format('CREATE POLICY %I_insert ON %I FOR INSERT WITH CHECK (home_id = get_my_home_id())', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_update ON %I', t, t);
    EXECUTE format('CREATE POLICY %I_update ON %I FOR UPDATE USING (home_id = get_my_home_id())', t, t);
  END LOOP;
END $$;

-- Prompt bank + workflow templates/steps are reference data: readable by all
-- authenticated users; writes via service role only (no insert/update policies).
DROP POLICY IF EXISTS aria_prompt_bank_select ON aria_prompt_bank;
CREATE POLICY aria_prompt_bank_select ON aria_prompt_bank FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS aria_workflow_templates_select ON aria_workflow_templates;
CREATE POLICY aria_workflow_templates_select ON aria_workflow_templates FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS aria_workflow_steps_select ON aria_workflow_steps;
CREATE POLICY aria_workflow_steps_select ON aria_workflow_steps FOR SELECT USING (TRUE);

COMMENT ON TABLE incident_sessions IS 'ARIA Incident Mode live sessions. AI suggests; staff decide; manager reviews; system audits.';
COMMENT ON TABLE aria_recording_reviews IS 'Audit-safe AI-assisted records: raw, AI-suggested and final versions are ALL preserved — the original is never hidden.';
COMMENT ON TABLE aria_audit_logs IS 'Practice-action audit trail for ARIA-assisted work (ids + metadata; narrative kept out of the log).';
