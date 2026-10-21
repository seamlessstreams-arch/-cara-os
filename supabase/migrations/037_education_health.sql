

-- ── Health profiles ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_health_profiles (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                 uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_id                uuid NOT NULL UNIQUE,
  immunisation_status     text NOT NULL DEFAULT 'unknown'
                            CHECK (immunisation_status IN (
                              'up_to_date','partially_complete','unknown',
                              'declined','medical_exemption'
                            )),
  allergies               jsonb NOT NULL DEFAULT '[]'::jsonb,
  dietary_requirements    jsonb NOT NULL DEFAULT '[]'::jsonb,
  registered_gp           text NOT NULL DEFAULT '',
  registered_dentist      text NOT NULL DEFAULT '',
  registered_optician     text NOT NULL DEFAULT '',
  camhs_status            text NOT NULL DEFAULT 'none'
                            CHECK (camhs_status IN ('none','referred','active','discharged')),
  last_health_assessment  date,
  next_health_assessment  date,
  health_conditions       jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_health_home     ON cs_health_profiles(home_id);
CREATE INDEX IF NOT EXISTS idx_health_child    ON cs_health_profiles(child_id);

-- ── Wellbeing assessments (including SDQ) ───────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_wellbeing_assessments (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id               uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_id              uuid NOT NULL,
  assessment_date       date NOT NULL,
  assessment_type       text NOT NULL DEFAULT 'informal'
                          CHECK (assessment_type IN ('sdq','informal','professional')),
  sdq_scores            jsonb,
  overall_wellbeing     smallint NOT NULL CHECK (overall_wellbeing BETWEEN 1 AND 10),
  sleep_quality         smallint CHECK (sleep_quality BETWEEN 1 AND 5),
  appetite              smallint CHECK (appetite BETWEEN 1 AND 5),
  self_care             smallint CHECK (self_care BETWEEN 1 AND 5),
  notes                 text,
  assessed_by           uuid NOT NULL,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wellbeing_home   ON cs_wellbeing_assessments(home_id);
CREATE INDEX IF NOT EXISTS idx_wellbeing_child  ON cs_wellbeing_assessments(child_id);
CREATE INDEX IF NOT EXISTS idx_wellbeing_date   ON cs_wellbeing_assessments(assessment_date);
CREATE INDEX IF NOT EXISTS idx_wellbeing_type   ON cs_wellbeing_assessments(assessment_type);
ALTER TABLE cs_health_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_wellbeing_assessments  ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY health_profile_home_policy ON cs_health_profiles
    USING (home_id = (select get_my_home_id()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY wellbeing_home_policy ON cs_wellbeing_assessments
    USING (home_id = (select get_my_home_id()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
