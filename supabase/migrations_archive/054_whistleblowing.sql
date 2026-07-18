-- ═══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — 054 Whistleblowing
-- Whistleblowing disclosures, investigation tracking, policy compliance.
-- CHR 2015 Reg 41 (whistleblowing), Public Interest Disclosure Act 1998.
-- Tables: cs_whistleblowing_reports, cs_whistleblowing_policy_reviews
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── cs_whistleblowing_reports ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_whistleblowing_reports (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                 UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  reporter_id             UUID,
  reporter_name           TEXT,
  reporter_role           TEXT,
  is_anonymous            BOOLEAN NOT NULL DEFAULT FALSE,
  disclosure_date         DATE NOT NULL,
  received_by             TEXT NOT NULL,
  category                TEXT NOT NULL,
  description             TEXT NOT NULL,
  persons_involved        JSONB NOT NULL DEFAULT '[]',
  evidence_provided       TEXT,
  location                TEXT,
  risk_level              TEXT NOT NULL DEFAULT 'medium',
  status                  TEXT NOT NULL DEFAULT 'received',
  acknowledged_date       DATE,
  acknowledged_by         TEXT,
  investigating_officer   TEXT,
  investigation_start_date DATE,
  investigation_end_date  DATE,
  outcome                 TEXT,
  outcome_details         TEXT,
  actions_taken           JSONB NOT NULL DEFAULT '[]',
  referred_to             TEXT,
  referral_date           DATE,
  referral_reference      TEXT,
  whistleblower_protected BOOLEAN NOT NULL DEFAULT TRUE,
  detriment_reported      BOOLEAN NOT NULL DEFAULT FALSE,
  detriment_details       TEXT,
  follow_up_date          DATE,
  follow_up_completed     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_whistleblowing_reports ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "whistleblowing_reports_home" ON cs_whistleblowing_reports
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_whistleblowing_reports_home
  ON cs_whistleblowing_reports(home_id, category);

CREATE INDEX IF NOT EXISTS idx_whistleblowing_reports_status
  ON cs_whistleblowing_reports(status, risk_level);

-- ── cs_whistleblowing_policy_reviews ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_whistleblowing_policy_reviews (
  id                        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                   UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  review_date               DATE NOT NULL,
  reviewed_by               TEXT NOT NULL,
  policy_accessible         BOOLEAN NOT NULL DEFAULT TRUE,
  policy_displayed          BOOLEAN NOT NULL DEFAULT TRUE,
  staff_trained_count       INT NOT NULL DEFAULT 0,
  total_staff_count         INT NOT NULL DEFAULT 0,
  external_contacts_displayed BOOLEAN NOT NULL DEFAULT TRUE,
  children_informed         BOOLEAN NOT NULL DEFAULT FALSE,
  review_notes              TEXT,
  next_review_date          DATE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_whistleblowing_policy_reviews ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "whistleblowing_policy_reviews_home" ON cs_whistleblowing_policy_reviews
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_whistleblowing_policy_reviews_home
  ON cs_whistleblowing_policy_reviews(home_id, review_date);
