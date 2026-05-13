-- ═══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — 059 Cultural Identity & Diversity
-- Identity profiles, cultural actions, diversity support tracking.
-- CHR 2015 Reg 7 (quality of care — promoting identity),
-- Reg 11 (positive relationships), Equality Act 2010,
-- SCCIF Well-Led quality standard.
-- Tables: cs_identity_profiles, cs_identity_actions
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── cs_identity_profiles ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_identity_profiles (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                 UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id                UUID NOT NULL,
  child_name              TEXT NOT NULL,
  ethnicity               TEXT,
  religion                TEXT,
  first_language          TEXT,
  additional_languages    JSONB DEFAULT '[]',
  cultural_needs          TEXT NOT NULL DEFAULT '',
  dietary_requirements    TEXT NOT NULL DEFAULT '',
  religious_practices     TEXT NOT NULL DEFAULT '',
  identity_needs          TEXT NOT NULL DEFAULT '',
  hair_skin_care_needs    TEXT NOT NULL DEFAULT '',
  clothing_preferences    TEXT NOT NULL DEFAULT '',
  festivals_celebrated    JSONB DEFAULT '[]',
  community_links         JSONB DEFAULT '[]',
  child_views_on_identity TEXT,
  support_plan            TEXT NOT NULL DEFAULT '',
  last_reviewed_date      DATE,
  reviewed_by             TEXT,
  next_review_date        DATE,
  status                  TEXT NOT NULL DEFAULT 'active',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_identity_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "identity_profiles_home" ON cs_identity_profiles
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_identity_profiles_home
  ON cs_identity_profiles(home_id, child_id);

CREATE INDEX IF NOT EXISTS idx_identity_profiles_status
  ON cs_identity_profiles(status);

-- ── cs_identity_actions ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_identity_actions (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id             UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id            UUID NOT NULL,
  child_name          TEXT NOT NULL,
  action_date         DATE NOT NULL,
  recorded_by         TEXT NOT NULL,
  action_type         TEXT NOT NULL,
  description         TEXT NOT NULL DEFAULT '',
  outcome             TEXT,
  child_feedback      TEXT,
  child_satisfaction  TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_identity_actions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "identity_actions_home" ON cs_identity_actions
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_identity_actions_home
  ON cs_identity_actions(home_id, child_id);

CREATE INDEX IF NOT EXISTS idx_identity_actions_type
  ON cs_identity_actions(action_type, action_date);
