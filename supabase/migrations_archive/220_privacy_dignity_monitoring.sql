-- 220: Privacy & Dignity Monitoring
-- CHR 2015 Reg 21 (privacy and dignity), Reg 10 (contact with family — private communications)

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_privacy_dignity_monitoring (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id      uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  privacy_area text NOT NULL DEFAULT 'bedroom_privacy',
  dignity_rating text NOT NULL DEFAULT 'good',
  intrusion_type text NOT NULL DEFAULT 'none',
  response_quality text NOT NULL DEFAULT 'good',
  monitoring_date date NOT NULL DEFAULT now(),
  child_name   text NOT NULL DEFAULT '',
  child_id     uuid REFERENCES children(id) ON DELETE SET NULL,
  monitored_by text NOT NULL DEFAULT '',
  child_views_sought boolean NOT NULL DEFAULT true,
  knock_before_entry boolean NOT NULL DEFAULT true,
  personal_space_respected boolean NOT NULL DEFAULT true,
  confidentiality_maintained boolean NOT NULL DEFAULT true,
  complaints_process_explained boolean NOT NULL DEFAULT true,
  staff_awareness_adequate boolean NOT NULL DEFAULT true,
  care_plan_reflects boolean NOT NULL DEFAULT true,
  social_worker_informed boolean NOT NULL DEFAULT true,
  intimate_care_policy_followed boolean NOT NULL DEFAULT true,
  cctv_compliant boolean NOT NULL DEFAULT true,
  dignity_in_language boolean NOT NULL DEFAULT true,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  next_review_date date,
  notes text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_privacy_dignity_monitoring ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "privacy_dignity_monitoring_home" ON cs_privacy_dignity_monitoring;
CREATE POLICY "privacy_dignity_monitoring_home" ON cs_privacy_dignity_monitoring
  FOR ALL USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'migration 220 idempotent: %', SQLERRM;
END $$;
