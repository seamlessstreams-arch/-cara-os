-- Migration: 321_child_online_safety_monitoring
-- Domain: Child Online Safety Monitoring
-- Tracks internet filtering, social media risks, device checks, KCSIE 2023

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_child_online_safety_monitoring (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id       uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,

  check_date       date        NOT NULL,
  checker_name     text        NOT NULL,
  child_name       text        NOT NULL,

  check_type       text        NOT NULL CHECK (check_type IN ('Device Check','Internet Filter Review','Social Media Audit','App Review','Screen Time Review','Online Incident','Education Session','Policy Review')),
  risk_level       text        NOT NULL CHECK (risk_level IN ('No Identified Risk','Low','Medium','High','Critical')),

  filtering_active      boolean NOT NULL DEFAULT true,
  age_appropriate       boolean NOT NULL DEFAULT true,
  parental_controls     boolean NOT NULL DEFAULT true,
  social_media_reviewed boolean NOT NULL DEFAULT false,
  harmful_content_found boolean NOT NULL DEFAULT false,
  online_contact_risk   boolean NOT NULL DEFAULT false,
  cyberbullying_identified boolean NOT NULL DEFAULT false,

  action_taken          boolean NOT NULL DEFAULT false,
  child_educated        boolean NOT NULL DEFAULT false,
  parent_carer_notified boolean NOT NULL DEFAULT false,

  next_review_date     date    NULL,
  compliance_status    text    NOT NULL CHECK (compliance_status IN ('Compliant','Non-Compliant','Action Required','Under Review')),
  notes                text    NULL,

  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE cs_child_online_safety_monitoring ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation" ON cs_child_online_safety_monitoring;
CREATE POLICY "Tenant isolation" ON cs_child_online_safety_monitoring
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_child_online_safety_home
  ON cs_child_online_safety_monitoring(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_child_online_safety_date
  ON cs_child_online_safety_monitoring(check_date DESC);

EXCEPTION WHEN duplicate_table THEN NULL;
END $$;
