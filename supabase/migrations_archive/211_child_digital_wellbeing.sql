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
  parental_controls_active boolean NOT NULL DEFAULT true,
  age_appropriate_content boolean NOT NULL DEFAULT true,
  online_safety_educated boolean NOT NULL DEFAULT true,
  cyberbullying_screened boolean NOT NULL DEFAULT true,
  social_media_monitored boolean NOT NULL DEFAULT true,
  gaming_monitored boolean NOT NULL DEFAULT true,
  privacy_settings_reviewed boolean NOT NULL DEFAULT true,
  digital_agreement_signed boolean NOT NULL DEFAULT true,
  care_plan_reflects boolean NOT NULL DEFAULT true,
  screen_time_discussed boolean NOT NULL DEFAULT true,
  sleep_impact_assessed boolean NOT NULL DEFAULT true,
  recorded_promptly boolean NOT NULL DEFAULT true,
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
