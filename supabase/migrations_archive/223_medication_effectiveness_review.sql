-- 223: Medication Effectiveness Review
-- CHR 2015 Reg 23 (health — medication management), Reg 12 (health and wellbeing — ongoing monitoring)

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_medication_effectiveness_review (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id      uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  medication_category text NOT NULL DEFAULT 'other',
  effectiveness_rating text NOT NULL DEFAULT 'effective',
  adherence_level text NOT NULL DEFAULT 'full_adherence',
  review_compliance text NOT NULL DEFAULT 'fully_compliant',
  review_date  date NOT NULL DEFAULT now(),
  child_name   text NOT NULL DEFAULT '',
  child_id     uuid REFERENCES children(id) ON DELETE SET NULL,
  reviewed_by  text NOT NULL DEFAULT '',
  child_views_sought boolean,
  side_effects_monitored boolean,
  prescriber_consulted boolean,
  gp_informed boolean,
  dosage_appropriate boolean,
  consent_current boolean,
  care_plan_reflects boolean,
  social_worker_informed boolean,
  school_aware boolean,
  storage_compliant boolean,
  administration_correct boolean,
  recorded_promptly boolean,
  issues_found jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  next_review_date date,
  notes text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_medication_effectiveness_review ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "medication_effectiveness_review_home" ON cs_medication_effectiveness_review;
CREATE POLICY "medication_effectiveness_review_home" ON cs_medication_effectiveness_review
  FOR ALL USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'migration 223 idempotent: %', SQLERRM;
END $$;
