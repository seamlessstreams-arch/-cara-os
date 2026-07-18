-- Garden Horticulture Activities
-- CHR 2015 Reg 9 (enjoyment and achievement), Reg 12 (promoting good health)

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_garden_horticulture_activities (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id      uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  activity_type text NOT NULL DEFAULT 'other',
  skill_level   text NOT NULL DEFAULT 'developing',
  engagement_level text NOT NULL DEFAULT 'engaged',
  health_benefit   text NOT NULL DEFAULT 'some_benefit',
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  child_name   text NOT NULL,
  child_id     uuid REFERENCES children(id) ON DELETE SET NULL,
  supported_by text NOT NULL,
  age_appropriate          boolean NOT NULL DEFAULT true,
  risk_assessment_done     boolean NOT NULL DEFAULT true,
  tools_safe               boolean NOT NULL DEFAULT true,
  supervision_adequate     boolean NOT NULL DEFAULT true,
  child_chose_activity     boolean NOT NULL DEFAULT true,
  care_plan_reflects       boolean NOT NULL DEFAULT true,
  social_worker_informed   boolean NOT NULL DEFAULT true,
  parent_informed          boolean NOT NULL DEFAULT true,
  therapeutic_value_noted  boolean NOT NULL DEFAULT true,
  seasonal_learning        boolean NOT NULL DEFAULT true,
  organic_methods_used     boolean NOT NULL DEFAULT true,
  recorded_promptly        boolean NOT NULL DEFAULT true,
  issues_found  jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  next_review_date date,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_garden_horticulture_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "garden_horticulture_activities_home" ON cs_garden_horticulture_activities;
CREATE POLICY "garden_horticulture_activities_home" ON cs_garden_horticulture_activities
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_garden_horticulture_activities_home ON cs_garden_horticulture_activities(home_id);

EXCEPTION WHEN others THEN RAISE NOTICE 'garden_horticulture_activities migration: %', SQLERRM;
END $$;
