-- Migration: 314_home_water_hygiene_management
-- Domain: Home Water Hygiene Management
-- Tracks water temperature monitoring, flushing schedules, HSG274 compliance

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_home_water_hygiene_management (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id       uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,

  check_date       date        NOT NULL,
  checker_name     text        NOT NULL,

  check_type       text        NOT NULL CHECK (check_type IN ('Temperature Monitoring','Weekly Flushing','Monthly Flushing','Quarterly Review','Showerhead Descale','TMV Service','Dead Leg Check','Water Sampling','Annual Review')),
  location         text        NOT NULL,

  hot_water_temp   numeric(4,1) NULL,
  cold_water_temp  numeric(4,1) NULL,
  return_temp      numeric(4,1) NULL,

  hot_temp_compliant  boolean NOT NULL DEFAULT true,
  cold_temp_compliant boolean NOT NULL DEFAULT true,

  flushing_completed    boolean NOT NULL DEFAULT false,
  tmv_functioning       boolean NULL,
  showerhead_descaled   boolean NULL,
  dead_legs_identified  boolean NOT NULL DEFAULT false,

  sample_taken          boolean NOT NULL DEFAULT false,
  sample_result         text    NULL CHECK (sample_result IS NULL OR sample_result IN ('Clear','Legionella Detected','Elevated Count','Acceptable')),

  next_check_date      date    NULL,
  compliance_status    text    NOT NULL CHECK (compliance_status IN ('Compliant','Non-Compliant','Action Required','Overdue')),
  notes                text    NULL,

  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE cs_home_water_hygiene_management ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation" ON cs_home_water_hygiene_management;
CREATE POLICY "Tenant isolation" ON cs_home_water_hygiene_management
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_home_water_hygiene_home
  ON cs_home_water_hygiene_management(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_home_water_hygiene_date
  ON cs_home_water_hygiene_management(check_date DESC);

EXCEPTION WHEN duplicate_table THEN NULL;
END $$;
