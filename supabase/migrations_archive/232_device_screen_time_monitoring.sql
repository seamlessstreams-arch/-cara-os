-- Migration: 232_device_screen_time_monitoring
-- Service: device-screen-time-monitoring-service
-- CHR 2015 Reg 12(2)(b) (online safety), Reg 11(2)(a) (healthy technology)

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_device_screen_time_monitoring (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  device_type text NOT NULL CHECK (device_type IN ('smartphone','tablet','laptop','desktop','games_console','smart_tv','smart_speaker','wearable','shared_device','other')),
  usage_category text NOT NULL CHECK (usage_category IN ('educational','social_media','gaming','streaming','communication','creative','browsing','mixed','inappropriate','other')),
  compliance_level text NOT NULL CHECK (compliance_level IN ('fully_compliant','mostly_compliant','partially_compliant','non_compliant','refused_limits')),
  wellbeing_impact text NOT NULL CHECK (wellbeing_impact IN ('positive','neutral','mild_concern','moderate_concern','significant_concern')),
  monitoring_date date NOT NULL DEFAULT CURRENT_DATE,
  child_name text NOT NULL,
  child_id uuid,
  monitored_by text NOT NULL,
  limits_agreed boolean NOT NULL DEFAULT true,
  age_appropriate_content boolean NOT NULL DEFAULT true,
  parental_controls_active boolean NOT NULL DEFAULT true,
  night_time_limits boolean NOT NULL DEFAULT true,
  social_media_supervised boolean NOT NULL DEFAULT true,
  privacy_settings_checked boolean NOT NULL DEFAULT true,
  care_plan_reflects boolean NOT NULL DEFAULT true,
  social_worker_informed boolean NOT NULL DEFAULT true,
  parent_informed boolean NOT NULL DEFAULT true,
  online_safety_discussed boolean NOT NULL DEFAULT true,
  healthy_alternatives_offered boolean NOT NULL DEFAULT true,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions_taken jsonb NOT NULL DEFAULT '[]'::jsonb,
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_device_screen_time_home ON cs_device_screen_time_monitoring(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_device_screen_time_date ON cs_device_screen_time_monitoring(monitoring_date DESC);
CREATE INDEX IF NOT EXISTS idx_cs_device_screen_time_device ON cs_device_screen_time_monitoring(device_type);

ALTER TABLE cs_device_screen_time_monitoring ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cs_device_screen_time_monitoring_home_isolation" ON cs_device_screen_time_monitoring;
CREATE POLICY "cs_device_screen_time_monitoring_home_isolation" ON cs_device_screen_time_monitoring
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'Migration 232 device_screen_time_monitoring: %', SQLERRM;
END $$;
