-- ═══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — 052 Contextual Safeguarding & Exploitation
-- Exploitation screenings, locality risk assessments.
-- Reg 12 (protection from harm), Reg 13 (leadership & management),
-- Reg 34 (safeguarding), SCCIF Helped & Protected.
-- Tables: cs_exploitation_screenings, cs_locality_risk_assessments
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── cs_exploitation_screenings ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_exploitation_screenings (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                 UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id                UUID NOT NULL,
  child_name              TEXT NOT NULL,
  screening_date          DATE NOT NULL DEFAULT CURRENT_DATE,
  screened_by             TEXT NOT NULL,
  screening_type          TEXT NOT NULL,
  risk_level              TEXT NOT NULL DEFAULT 'no_concern',
  indicators_identified   JSONB NOT NULL DEFAULT '[]',
  protective_factors      JSONB NOT NULL DEFAULT '[]',
  location_risks          JSONB NOT NULL DEFAULT '[]',
  peer_associations       JSONB NOT NULL DEFAULT '[]',
  online_risks_identified BOOLEAN NOT NULL DEFAULT FALSE,
  referral_made           BOOLEAN NOT NULL DEFAULT FALSE,
  referral_to             TEXT,
  referral_date           DATE,
  safety_plan_in_place    BOOLEAN NOT NULL DEFAULT FALSE,
  safety_plan_review_date DATE,
  next_screening_date     DATE,
  status                  TEXT NOT NULL DEFAULT 'completed',
  notes                   TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_exploitation_screenings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "exploitation_screenings_home" ON cs_exploitation_screenings
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_exploitation_screenings_home
  ON cs_exploitation_screenings(home_id, child_id);

CREATE INDEX IF NOT EXISTS idx_exploitation_screenings_risk
  ON cs_exploitation_screenings(risk_level, screening_type);

-- ── cs_locality_risk_assessments ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_locality_risk_assessments (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id             UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  location_name       TEXT NOT NULL,
  location_type       TEXT NOT NULL,
  risk_type           TEXT NOT NULL,
  risk_level          TEXT NOT NULL DEFAULT 'low',
  description         TEXT NOT NULL DEFAULT '',
  mitigation_measures JSONB NOT NULL DEFAULT '[]',
  last_reviewed_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  reviewed_by         TEXT NOT NULL,
  next_review_date    DATE,
  status              TEXT NOT NULL DEFAULT 'active',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_locality_risk_assessments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "locality_risk_assessments_home" ON cs_locality_risk_assessments
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_locality_risk_home
  ON cs_locality_risk_assessments(home_id, risk_level);
