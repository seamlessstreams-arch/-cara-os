-- 217: Physical Activity Tracking
-- CHR 2015 Reg 12 (health and wellbeing — physical health), Reg 9 (leisure activities — active lifestyle)

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_physical_activity_tracking (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id      uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  activity_type text NOT NULL DEFAULT 'team_sport',
  participation_level text NOT NULL DEFAULT 'willing',
  fitness_assessment text NOT NULL DEFAULT 'average',
  enjoyment_rating text NOT NULL DEFAULT 'neutral',
  activity_date date NOT NULL DEFAULT now(),
  child_name   text NOT NULL DEFAULT '',
  child_id     uuid REFERENCES children(id) ON DELETE SET NULL,
  supervised_by text NOT NULL DEFAULT '',
  child_choice_offered boolean,
  age_appropriate boolean,
  health_needs_considered boolean,
  risk_assessed boolean,
  inclusive_activity boolean,
  peer_interaction_positive boolean,
  equipment_suitable boolean,
  safeguarding_considered boolean,
  achievement_celebrated boolean,
  care_plan_reflects boolean,
  social_worker_informed boolean,
  recorded_promptly boolean,
  issues_found jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  next_review_date date,
  notes text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_physical_activity_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "physical_activity_tracking_home" ON cs_physical_activity_tracking;
CREATE POLICY "physical_activity_tracking_home" ON cs_physical_activity_tracking
  FOR ALL USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'migration 217 idempotent: %', SQLERRM;
END $$;
