-- Migration: cs_staff_lone_working
-- Tracks lone working risk assessments and safety measures

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_staff_lone_working (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  lone_working_scenario text NOT NULL DEFAULT 'night_shift_solo',
  risk_level text NOT NULL DEFAULT 'medium',
  check_in_frequency text NOT NULL DEFAULT 'hourly',
  authorisation_level text NOT NULL DEFAULT 'manager_approved',
  assessment_date date NOT NULL DEFAULT now(),
  staff_name text NOT NULL DEFAULT '',
  risk_assessed boolean,
  manager_authorised boolean,
  communication_plan boolean,
  emergency_contacts_available boolean,
  phone_charged boolean,
  check_in_protocol_agreed boolean,
  buddy_system_available boolean NOT NULL DEFAULT false,
  panic_alarm_available boolean NOT NULL DEFAULT false,
  first_aid_trained boolean,
  medication_trained boolean,
  safeguarding_trained boolean,
  lone_working_policy_read boolean,
  issues_found jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions_taken jsonb NOT NULL DEFAULT '[]'::jsonb,
  assessed_by text NOT NULL DEFAULT '',
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_staff_lone_working_home ON cs_staff_lone_working(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_staff_lone_working_date ON cs_staff_lone_working(assessment_date);

ALTER TABLE cs_staff_lone_working ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cs_staff_lone_working_home_isolation ON cs_staff_lone_working;
CREATE POLICY cs_staff_lone_working_home_isolation ON cs_staff_lone_working
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'cs_staff_lone_working migration: %', SQLERRM;
END $$;
