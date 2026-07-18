-- Migration: 322_staff_lone_working_risk
-- Domain: Staff Lone Working Risk Assessment
-- Tracks lone worker policy, risk assessment, check-in compliance, personal alarms

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_staff_lone_working_risks (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id       uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,

  assessment_date   date        NOT NULL,
  assessor_name     text        NOT NULL,
  staff_name        text        NOT NULL,

  lone_working_type text       NOT NULL CHECK (lone_working_type IN ('Night Shift','Sleep-In','Home Visit','Transport','Community Outing','Office Alone','Emergency Cover','Other')),
  risk_level        text        NOT NULL CHECK (risk_level IN ('Low','Medium','High','Unacceptable')),

  risk_assessment_completed boolean NOT NULL DEFAULT false,
  check_in_protocol_agreed  boolean NOT NULL DEFAULT false,
  check_in_frequency        text    NULL CHECK (check_in_frequency IS NULL OR check_in_frequency IN ('Hourly','2-Hourly','4-Hourly','Start/End','On Demand')),
  personal_alarm_issued     boolean NOT NULL DEFAULT false,
  mobile_phone_available    boolean NOT NULL DEFAULT true,
  emergency_procedures_known boolean NOT NULL DEFAULT true,
  training_completed        boolean NOT NULL DEFAULT false,

  incident_during_lone_work boolean NOT NULL DEFAULT false,
  near_miss_reported        boolean NOT NULL DEFAULT false,

  next_review_date     date    NULL,
  compliance_status    text    NOT NULL CHECK (compliance_status IN ('Compliant','Non-Compliant','Action Required','Suspended')),
  notes                text    NULL,

  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE cs_staff_lone_working_risks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation" ON cs_staff_lone_working_risks;
CREATE POLICY "Tenant isolation" ON cs_staff_lone_working_risks
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_staff_lone_working_home
  ON cs_staff_lone_working_risks(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_staff_lone_working_date
  ON cs_staff_lone_working_risks(assessment_date DESC);

EXCEPTION WHEN duplicate_table THEN NULL;
END $$;
