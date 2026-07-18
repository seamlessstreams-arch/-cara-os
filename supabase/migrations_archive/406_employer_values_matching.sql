-- ══════════════════════════════════════════════════════════════════════════════
-- Employer Values Profile & Values-Based Matching — durable persistence
--
-- Backs the in-memory collections `employerValuesProfiles` and
-- `candidateValuesProfiles`. The values-matching engine is a DECISION-SUPPORT
-- tool only — it never makes a hiring decision. Write-through happens at the
-- service boundary only when Supabase is configured (otherwise the in-memory
-- store holds the data — zero behaviour change). Home-scoped RLS; the
-- service-role key used by API routes bypasses RLS.
--
-- Tables:
--   employer_values_profiles   — what the home stands for (one per home)
--   candidate_values_profiles  — a candidate's values overlay (1:1 with a candidate)
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. employer_values_profiles ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employer_values_profiles (
  id                            TEXT PRIMARY KEY,
  home_id                       TEXT NOT NULL DEFAULT 'home_oak',
  organisation_name             TEXT NOT NULL DEFAULT '',
  home_name                     TEXT NOT NULL DEFAULT '',
  core_values                   JSONB NOT NULL DEFAULT '[]'::jsonb,
  care_approach                 TEXT NOT NULL DEFAULT '',
  leadership_style              TEXT NOT NULL DEFAULT '',
  therapeutic_model             TEXT NOT NULL DEFAULT '',
  pace_commitment               TEXT NOT NULL DEFAULT '',
  trauma_informed_expectations  TEXT NOT NULL DEFAULT '',
  safeguarding_culture          TEXT NOT NULL DEFAULT '',
  expected_behaviours           JSONB NOT NULL DEFAULT '[]'::jsonb,
  non_negotiables               JSONB NOT NULL DEFAULT '[]'::jsonb,
  what_makes_us_different       TEXT NOT NULL DEFAULT '',
  relational_practice_priority  TEXT NOT NULL DEFAULT 'high',  -- high | medium | low
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by                    TEXT
);
CREATE INDEX IF NOT EXISTS idx_employer_values_home ON employer_values_profiles (home_id);

-- ── 2. candidate_values_profiles ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS candidate_values_profiles (
  id                              TEXT PRIMARY KEY,
  candidate_id                    TEXT NOT NULL,
  home_id                         TEXT NOT NULL DEFAULT 'home_oak',
  candidate_name                  TEXT,
  values                          JSONB NOT NULL DEFAULT '[]'::jsonb,
  what_matters_in_employer        TEXT NOT NULL DEFAULT '',
  childrens_home_experience_years NUMERIC NOT NULL DEFAULT 0,
  preferred_role                  TEXT NOT NULL DEFAULT '',
  availability                    TEXT NOT NULL DEFAULT '',
  qualifications                  JSONB NOT NULL DEFAULT '[]'::jsonb,
  confidence_areas                JSONB NOT NULL DEFAULT '[]'::jsonb,
  development_areas               JSONB NOT NULL DEFAULT '[]'::jsonb,
  safeguarding_mindset            TEXT NOT NULL DEFAULT '',
  relational_indicators           JSONB NOT NULL DEFAULT '[]'::jsonb,
  scenario_answers                JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_candidate_values_home ON candidate_values_profiles (home_id);
CREATE INDEX IF NOT EXISTS idx_candidate_values_candidate ON candidate_values_profiles (candidate_id);

-- ── 3. Row-level security (home-scoped; service role bypasses) ─────────────────
ALTER TABLE employer_values_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_values_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS employer_values_select ON employer_values_profiles;
CREATE POLICY employer_values_select ON employer_values_profiles FOR SELECT USING (home_id = get_my_home_id());
DROP POLICY IF EXISTS employer_values_insert ON employer_values_profiles;
CREATE POLICY employer_values_insert ON employer_values_profiles FOR INSERT WITH CHECK (home_id = get_my_home_id());
DROP POLICY IF EXISTS employer_values_update ON employer_values_profiles;
CREATE POLICY employer_values_update ON employer_values_profiles FOR UPDATE USING (home_id = get_my_home_id());

DROP POLICY IF EXISTS candidate_values_select ON candidate_values_profiles;
CREATE POLICY candidate_values_select ON candidate_values_profiles FOR SELECT USING (home_id = get_my_home_id());
DROP POLICY IF EXISTS candidate_values_insert ON candidate_values_profiles;
CREATE POLICY candidate_values_insert ON candidate_values_profiles FOR INSERT WITH CHECK (home_id = get_my_home_id());
DROP POLICY IF EXISTS candidate_values_update ON candidate_values_profiles;
CREATE POLICY candidate_values_update ON candidate_values_profiles FOR UPDATE USING (home_id = get_my_home_id());

COMMENT ON TABLE employer_values_profiles IS 'What the home stands for — powers values-based candidate matching (decision-support only).';
COMMENT ON TABLE candidate_values_profiles IS 'A candidate values overlay (1:1 with a recruitment candidate) — input to the values-matching engine.';
