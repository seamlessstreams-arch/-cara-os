-- Health Screening & Immunisation tracking
-- CHR 2015 Reg 10 (health), Reg 7 (children's wishes)

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_health_screening_immunisation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  screening_type text NOT NULL DEFAULT 'other',
  screening_outcome text NOT NULL DEFAULT 'all_clear',
  immunisation_status text NOT NULL DEFAULT 'not_assessed',
  health_risk text NOT NULL DEFAULT 'low',
  screening_date date NOT NULL DEFAULT CURRENT_DATE,
  child_name text NOT NULL,
  child_id uuid,
  conducted_by text NOT NULL,
  child_consented boolean,
  age_appropriate_explanation boolean,
  parent_informed boolean,
  gp_notified boolean,
  follow_up_arranged boolean,
  referral_made boolean,
  care_plan_reflects boolean,
  social_worker_informed boolean,
  school_aware boolean,
  records_updated boolean,
  confidentiality_maintained boolean,
  recorded_promptly boolean,
  issues_found jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_health_screening_immunisation ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Home isolation" ON cs_health_screening_immunisation;
CREATE POLICY "Home isolation" ON cs_health_screening_immunisation
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_health_screening_immunisation_home
  ON cs_health_screening_immunisation(home_id);

EXCEPTION WHEN others THEN RAISE NOTICE 'cs_health_screening_immunisation migration: %', SQLERRM;
END $$;
