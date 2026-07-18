-- Migration: 323_home_emergency_lighting
-- Domain: Home Emergency Lighting Testing
-- Tracks BS 5266 compliance, monthly/annual testing, battery condition, escape routes

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_home_emergency_lighting (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id       uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,

  test_date        date        NOT NULL,
  tester_name      text        NOT NULL,

  test_type        text        NOT NULL CHECK (test_type IN ('Monthly Function Test','Annual Duration Test','Quarterly Inspection','Post-Fault Retest','Commissioning','Replacement')),
  location         text        NOT NULL,
  luminaire_type   text        NOT NULL CHECK (luminaire_type IN ('Self-Contained','Central Battery','Maintained','Non-Maintained','Combined','Exit Sign')),

  test_result      text        NOT NULL CHECK (test_result IN ('Pass','Fail','Partial','Not Tested')),
  battery_condition text       NOT NULL CHECK (battery_condition IN ('Good','Fair','Poor','Failed','Replaced','N/A')),
  duration_minutes integer     NULL,
  illumination_adequate boolean NOT NULL DEFAULT true,

  escape_route_covered  boolean NOT NULL DEFAULT true,
  signage_visible       boolean NOT NULL DEFAULT true,
  fault_identified      boolean NOT NULL DEFAULT false,
  fault_rectified       boolean NOT NULL DEFAULT false,

  next_test_date       date    NULL,
  compliance_status    text    NOT NULL CHECK (compliance_status IN ('Compliant','Non-Compliant','Remedial Required','Overdue')),
  notes                text    NULL,

  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE cs_home_emergency_lighting ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation" ON cs_home_emergency_lighting;
CREATE POLICY "Tenant isolation" ON cs_home_emergency_lighting
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_home_emergency_lighting_home
  ON cs_home_emergency_lighting(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_home_emergency_lighting_date
  ON cs_home_emergency_lighting(test_date DESC);

EXCEPTION WHEN duplicate_table THEN NULL;
END $$;
