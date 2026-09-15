-- 215: Consent & Capacity Monitoring
-- CHR 2015 Reg 14 (care planning — child participation), Reg 7 (children's wishes — meaningful consent)

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_consent_capacity_monitoring (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id      uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  consent_area text NOT NULL DEFAULT 'medical_treatment',
  capacity_level text NOT NULL DEFAULT 'full_capacity',
  decision_type text NOT NULL DEFAULT 'consent_given',
  competence_assessment text NOT NULL DEFAULT 'age_appropriate',
  assessment_date date NOT NULL DEFAULT now(),
  child_name   text NOT NULL DEFAULT '',
  child_id     uuid REFERENCES children(id) ON DELETE SET NULL,
  assessed_by  text NOT NULL DEFAULT '',
  child_views_sought boolean,
  information_provided boolean,
  age_appropriate_explanation boolean,
  advocacy_offered boolean,
  parent_consulted boolean,
  social_worker_informed boolean,
  best_interest_documented boolean,
  decision_respected boolean,
  review_date_set boolean,
  care_plan_updated boolean,
  legal_framework_followed boolean,
  recorded_promptly boolean,
  issues_found jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  next_review_date date,
  notes text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_consent_capacity_monitoring ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "consent_capacity_monitoring_home" ON cs_consent_capacity_monitoring;
CREATE POLICY "consent_capacity_monitoring_home" ON cs_consent_capacity_monitoring
  FOR ALL USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'migration 215 idempotent: %', SQLERRM;
END $$;
