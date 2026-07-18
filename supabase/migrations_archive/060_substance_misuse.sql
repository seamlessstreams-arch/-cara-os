-- ═══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — 060 Substance Misuse
-- Substance assessments, incident tracking, intervention planning.
-- CHR 2015 Reg 12 (protection from harm), Reg 34 (notifications).
-- Tables: cs_substance_assessments, cs_substance_incidents
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── cs_substance_assessments ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_substance_assessments (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id               UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id              UUID NOT NULL,
  child_name            TEXT NOT NULL,
  assessment_date       DATE NOT NULL,
  assessed_by           TEXT NOT NULL,
  substance_type        TEXT NOT NULL,
  risk_level            TEXT NOT NULL DEFAULT 'low',
  frequency             TEXT NOT NULL DEFAULT 'unknown',
  context               TEXT,
  impact_on_health      TEXT,
  impact_on_behaviour   TEXT,
  impact_on_education   TEXT,
  referral_made         BOOLEAN NOT NULL DEFAULT FALSE,
  referral_to           TEXT,
  referral_date         DATE,
  intervention_plan     TEXT,
  next_assessment_date  DATE,
  status                TEXT NOT NULL DEFAULT 'active',
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_substance_assessments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "substance_assessments_home" ON cs_substance_assessments
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_substance_assessments_home
  ON cs_substance_assessments(home_id, child_id);

CREATE INDEX IF NOT EXISTS idx_substance_assessments_risk
  ON cs_substance_assessments(risk_level, status);

-- ── cs_substance_incidents ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_substance_incidents (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                 UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id                UUID NOT NULL,
  child_name              TEXT NOT NULL,
  incident_date           DATE NOT NULL,
  reported_by             TEXT NOT NULL,
  substance_type          TEXT NOT NULL,
  incident_type           TEXT NOT NULL,
  description             TEXT NOT NULL DEFAULT '',
  location                TEXT,
  immediate_action        TEXT NOT NULL DEFAULT '',
  medical_attention       BOOLEAN NOT NULL DEFAULT FALSE,
  police_involved         BOOLEAN NOT NULL DEFAULT FALSE,
  social_worker_notified  BOOLEAN NOT NULL DEFAULT FALSE,
  parent_notified         BOOLEAN NOT NULL DEFAULT FALSE,
  ofsted_notified         BOOLEAN NOT NULL DEFAULT FALSE,
  follow_up_actions       JSONB DEFAULT '[]',
  follow_up_date          DATE,
  follow_up_completed     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_substance_incidents ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "substance_incidents_home" ON cs_substance_incidents
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_substance_incidents_home
  ON cs_substance_incidents(home_id, child_id);

CREATE INDEX IF NOT EXISTS idx_substance_incidents_type
  ON cs_substance_incidents(incident_type, incident_date);
