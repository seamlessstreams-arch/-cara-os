-- 211: Child Digital Wellbeing
-- CHR 2015 Reg 12 (health and wellbeing), Reg 11 (duty to secure welfare)

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_child_digital_wellbeing (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id      uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  device_type  text NOT NULL DEFAULT 'smartphone',
  online_safety_rating text NOT NULL DEFAULT 'good',
  screen_time_compliance text NOT NULL DEFAULT 'within_guidelines',
  digital_literacy_level text NOT NULL DEFAULT 'developing',
  assessment_date date NOT NULL DEFAULT now(),
  child_name   text NOT NULL DEFAULT '',
  child_id     uuid REFERENCES children(id) ON DELETE SET NULL,
  assessed_by  text NOT NULL DEFAULT '',
  parental_controls_active boolean,
  age_appropriate_content boolean,
  online_safety_educated boolean,
  cyberbullying_screened boolean,
  social_media_monitored boolean,
  gaming_monitored boolean,
  privacy_settings_reviewed boolean,
  digital_agreement_signed boolean,
  care_plan_reflects boolean,
  screen_time_discussed boolean,
  sleep_impact_assessed boolean,
  recorded_promptly boolean,
  issues_found jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  next_review_date date,
  notes text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_child_digital_wellbeing ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "child_digital_wellbeing_home" ON cs_child_digital_wellbeing;
CREATE POLICY "child_digital_wellbeing_home" ON cs_child_digital_wellbeing
  FOR ALL USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'migration 211 idempotent: %', SQLERRM;
END $$;
