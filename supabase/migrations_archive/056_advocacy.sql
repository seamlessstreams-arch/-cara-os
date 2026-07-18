-- ═══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — 056 Advocacy & Children's Rights
-- Advocacy referrals, children's rights awareness and exercise tracking.
-- CHR 2015 Reg 7 (quality of care), Reg 14 (care planning),
-- Reg 45 (review of quality), Children Act 1989 s26 (advocacy).
-- Tables: cs_advocacy_referrals, cs_childrens_rights_records
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── cs_advocacy_referrals ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_advocacy_referrals (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id             UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id            UUID NOT NULL,
  child_name          TEXT NOT NULL,
  referral_date       DATE NOT NULL,
  referral_reason     TEXT NOT NULL,
  advocate_service    TEXT NOT NULL,
  advocate_name       TEXT,
  advocate_contact    TEXT,
  status              TEXT NOT NULL DEFAULT 'referred',
  allocated_date      DATE,
  first_visit_date    DATE,
  last_contact_date   DATE,
  outcome             TEXT,
  outcome_date        DATE,
  child_satisfied     BOOLEAN,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_advocacy_referrals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "advocacy_referrals_home" ON cs_advocacy_referrals
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_advocacy_referrals_home
  ON cs_advocacy_referrals(home_id, child_id);

CREATE INDEX IF NOT EXISTS idx_advocacy_referrals_status
  ON cs_advocacy_referrals(status, referral_date);

-- ── cs_childrens_rights_records ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_childrens_rights_records (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id             UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id            UUID NOT NULL,
  child_name          TEXT NOT NULL,
  record_date         DATE NOT NULL,
  recorded_by         TEXT NOT NULL,
  right_type          TEXT NOT NULL,
  child_informed      BOOLEAN NOT NULL DEFAULT FALSE,
  child_understands   BOOLEAN NOT NULL DEFAULT FALSE,
  child_exercised     BOOLEAN NOT NULL DEFAULT FALSE,
  support_provided    TEXT,
  barriers_identified TEXT,
  actions_taken       TEXT,
  review_date         DATE,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_childrens_rights_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "childrens_rights_records_home" ON cs_childrens_rights_records
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_childrens_rights_home
  ON cs_childrens_rights_records(home_id, child_id);

CREATE INDEX IF NOT EXISTS idx_childrens_rights_type
  ON cs_childrens_rights_records(right_type, record_date);
