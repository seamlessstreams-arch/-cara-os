

-- ── cs_locality_risk_assessments ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_locality_risk_assessments (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id             UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
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
    USING (home_id = (select get_my_home_id()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_locality_risk_home
  ON cs_locality_risk_assessments(home_id, risk_level);
