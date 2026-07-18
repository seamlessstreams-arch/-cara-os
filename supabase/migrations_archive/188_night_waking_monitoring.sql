-- Night Waking Monitoring — CHR 2015 Reg 12, Reg 7, Reg 6
DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_night_waking_monitoring (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  waking_reason text NOT NULL DEFAULT 'unknown',
  child_emotional_state text NOT NULL DEFAULT 'calm',
  staff_response text NOT NULL DEFAULT 'verbal_reassurance',
  sleep_return_time text NOT NULL DEFAULT 'within_30_minutes',
  waking_date date NOT NULL DEFAULT CURRENT_DATE,
  waking_time text NOT NULL DEFAULT '00:00',
  child_name text NOT NULL,
  child_id uuid REFERENCES children(id) ON DELETE SET NULL,
  staff_on_duty text NOT NULL,
  child_comforted boolean NOT NULL DEFAULT true,
  environment_checked boolean NOT NULL DEFAULT true,
  temperature_appropriate boolean NOT NULL DEFAULT true,
  drink_offered boolean NOT NULL DEFAULT true,
  night_light_available boolean NOT NULL DEFAULT true,
  door_preference_respected boolean NOT NULL DEFAULT true,
  gp_referral_considered boolean NOT NULL DEFAULT false,
  sleep_plan_followed boolean NOT NULL DEFAULT true,
  pattern_identified boolean NOT NULL DEFAULT false,
  parent_informed boolean NOT NULL DEFAULT false,
  social_worker_informed boolean NOT NULL DEFAULT false,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  waking_duration_minutes integer NOT NULL DEFAULT 0,
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_night_waking_monitoring ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cs_night_waking_monitoring_home ON cs_night_waking_monitoring;
CREATE POLICY cs_night_waking_monitoring_home ON cs_night_waking_monitoring
  USING (home_id = get_my_home_id());

EXCEPTION WHEN duplicate_table THEN NULL;
END $$;
