-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — SENSORY PROFILES
-- CHR 2015 Reg 6 (quality and purpose of care — meeting individual needs),
-- Reg 14 (healthcare — sensory and therapeutic needs),
-- Reg 15 (staffing — understanding sensory needs).
-- Tables: cs_sensory_profiles
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cs_sensory_profiles (
  id                           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                      uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name                   text NOT NULL,
  child_id                     uuid NOT NULL,
  sensory_domain               text NOT NULL,
  sensitivity_level            text NOT NULL DEFAULT 'typical',
  triggers                     jsonb NOT NULL DEFAULT '[]',
  calming_strategies           jsonb NOT NULL DEFAULT '[]',
  adaptations                  jsonb NOT NULL DEFAULT '[]',
  adaptation_details           text,
  profile_status               text NOT NULL DEFAULT 'initial_assessment',
  assessed_by                  text NOT NULL,
  assessed_date                date NOT NULL,
  next_review_date             date,
  occupational_therapist_input boolean NOT NULL DEFAULT false,
  staff_trained                boolean NOT NULL DEFAULT false,
  child_views                  text,
  notes                        text,
  created_at                   timestamptz NOT NULL DEFAULT now(),
  updated_at                   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sensory_home     ON cs_sensory_profiles(home_id);
CREATE INDEX IF NOT EXISTS idx_sensory_child    ON cs_sensory_profiles(child_id);
CREATE INDEX IF NOT EXISTS idx_sensory_domain   ON cs_sensory_profiles(sensory_domain);
CREATE INDEX IF NOT EXISTS idx_sensory_level    ON cs_sensory_profiles(sensitivity_level);
CREATE INDEX IF NOT EXISTS idx_sensory_status   ON cs_sensory_profiles(profile_status);

ALTER TABLE cs_sensory_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own sensory profiles"
    ON cs_sensory_profiles FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
