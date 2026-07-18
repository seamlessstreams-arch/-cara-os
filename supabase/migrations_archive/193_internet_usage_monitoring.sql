-- Internet Usage Monitoring — CHR 2015 Reg 12, Reg 7, Reg 13
DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_internet_usage_monitoring (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  device_type text NOT NULL DEFAULT 'shared_device',
  usage_purpose text NOT NULL DEFAULT 'education',
  concern_level text NOT NULL DEFAULT 'no_concerns',
  monitoring_level text NOT NULL DEFAULT 'periodic_checks',
  monitoring_date date NOT NULL DEFAULT CURRENT_DATE,
  child_name text NOT NULL,
  child_id uuid REFERENCES children(id) ON DELETE SET NULL,
  monitored_by text NOT NULL,
  parental_controls_active boolean NOT NULL DEFAULT true,
  age_appropriate_content boolean NOT NULL DEFAULT true,
  screen_time_within_limits boolean NOT NULL DEFAULT true,
  privacy_settings_checked boolean NOT NULL DEFAULT true,
  social_media_reviewed boolean NOT NULL DEFAULT true,
  contact_list_checked boolean NOT NULL DEFAULT true,
  online_safety_discussed boolean NOT NULL DEFAULT true,
  digital_literacy_supported boolean NOT NULL DEFAULT true,
  consent_current boolean NOT NULL DEFAULT true,
  care_plan_linked boolean NOT NULL DEFAULT false,
  social_worker_informed boolean NOT NULL DEFAULT false,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  screen_time_minutes integer NOT NULL DEFAULT 0,
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_internet_usage_monitoring ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cs_internet_usage_monitoring_home ON cs_internet_usage_monitoring;
CREATE POLICY cs_internet_usage_monitoring_home ON cs_internet_usage_monitoring
  USING (home_id = get_my_home_id());

EXCEPTION WHEN duplicate_table THEN NULL;
END $$;
