-- ═══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — 055 Policies & Procedures Register
-- Policy governance, staff acknowledgements, review history.
-- CHR 2015 Reg 38 (policies and procedures), Reg 13 (leadership & management).
-- Tables: cs_policies, cs_policy_acknowledgements, cs_policy_review_history
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── cs_policies ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_policies (
  id                          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                     UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  policy_name                 TEXT NOT NULL,
  policy_reference            TEXT,
  category                    TEXT NOT NULL,
  regulation_reference        TEXT,
  description                 TEXT NOT NULL DEFAULT '',
  version                     TEXT NOT NULL DEFAULT '1.0',
  status                      TEXT NOT NULL DEFAULT 'active',
  owner                       TEXT NOT NULL,
  approved_by                 TEXT,
  approval_date               DATE,
  effective_date              DATE NOT NULL,
  review_date                 DATE NOT NULL,
  last_reviewed_date          DATE,
  reviewed_by                 TEXT,
  review_frequency            TEXT NOT NULL DEFAULT 'annual',
  document_url                TEXT,
  staff_acknowledgement_required BOOLEAN NOT NULL DEFAULT TRUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_policies ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "policies_home" ON cs_policies
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_policies_home
  ON cs_policies(home_id, category);

CREATE INDEX IF NOT EXISTS idx_policies_status
  ON cs_policies(status, review_date);

-- ── cs_policy_acknowledgements ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_policy_acknowledgements (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id           UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  policy_id         UUID NOT NULL REFERENCES cs_policies(id) ON DELETE CASCADE,
  staff_id          UUID NOT NULL,
  staff_name        TEXT NOT NULL,
  acknowledged_date DATE NOT NULL,
  acknowledged      BOOLEAN NOT NULL DEFAULT TRUE,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_policy_acknowledgements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "policy_acknowledgements_home" ON cs_policy_acknowledgements
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_policy_acknowledgements_policy
  ON cs_policy_acknowledgements(policy_id, staff_id);

CREATE INDEX IF NOT EXISTS idx_policy_acknowledgements_home
  ON cs_policy_acknowledgements(home_id);

-- ── cs_policy_review_history ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_policy_review_history (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id           UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  policy_id         UUID NOT NULL REFERENCES cs_policies(id) ON DELETE CASCADE,
  review_date       DATE NOT NULL,
  reviewed_by       TEXT NOT NULL,
  previous_version  TEXT,
  new_version       TEXT,
  changes_summary   TEXT NOT NULL DEFAULT '',
  outcome           TEXT NOT NULL DEFAULT 'no_changes',
  next_review_date  DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_policy_review_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "policy_review_history_home" ON cs_policy_review_history
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_policy_review_history_policy
  ON cs_policy_review_history(policy_id, review_date);

CREATE INDEX IF NOT EXISTS idx_policy_review_history_home
  ON cs_policy_review_history(home_id);
