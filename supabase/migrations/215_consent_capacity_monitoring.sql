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
  child_views_sought boolean NOT NULL DEFAULT true,
  information_provided boolean NOT NULL DEFAULT true,
  age_appropriate_explanation boolean NOT NULL DEFAULT true,
  advocacy_offered boolean NOT NULL DEFAULT true,
  parent_consulted boolean NOT NULL DEFAULT true,
  social_worker_informed boolean NOT NULL DEFAULT true,
  best_interest_documented boolean NOT NULL DEFAULT true,
  decision_respected boolean NOT NULL DEFAULT true,
  review_date_set boolean NOT NULL DEFAULT true,
  care_plan_updated boolean NOT NULL DEFAULT true,
  legal_framework_followed boolean NOT NULL DEFAULT true,
  recorded_promptly boolean NOT NULL DEFAULT true,
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
