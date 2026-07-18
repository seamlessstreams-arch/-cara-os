-- Migration: 317_home_pest_control_management
-- Domain: Home Pest Control Management
-- Tracks pest inspections, treatment methods, CIEH standards, re-inspection schedules

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_home_pest_control_management (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id       uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,

  inspection_date   date        NOT NULL,
  inspector_name    text        NOT NULL,

  pest_type         text        NOT NULL CHECK (pest_type IN ('Rodents','Cockroaches','Bed Bugs','Ants','Flies','Wasps','Moths','Birds','Fleas','Stored Product Insects','Other')),
  location          text        NOT NULL,
  severity          text        NOT NULL CHECK (severity IN ('None Found','Low','Moderate','High','Infestation')),

  treatment_required  boolean NOT NULL DEFAULT false,
  treatment_method    text    NULL CHECK (treatment_method IS NULL OR treatment_method IN ('Baiting','Trapping','Spray Treatment','Fumigation','Heat Treatment','Proofing','Environmental Control','Monitoring Only')),
  treatment_date      date    NULL,
  treatment_completed boolean NOT NULL DEFAULT false,

  proofing_adequate     boolean NOT NULL DEFAULT true,
  hygiene_satisfactory  boolean NOT NULL DEFAULT true,
  food_storage_adequate boolean NOT NULL DEFAULT true,
  waste_management_ok   boolean NOT NULL DEFAULT true,

  re_inspection_required boolean NOT NULL DEFAULT false,
  re_inspection_date     date    NULL,

  compliance_status    text    NOT NULL CHECK (compliance_status IN ('Clear','Active Issue','Under Treatment','Resolved','Re-Inspection Due')),
  notes                text    NULL,

  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE cs_home_pest_control_management ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation" ON cs_home_pest_control_management;
CREATE POLICY "Tenant isolation" ON cs_home_pest_control_management
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_home_pest_control_home
  ON cs_home_pest_control_management(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_home_pest_control_date
  ON cs_home_pest_control_management(inspection_date DESC);

EXCEPTION WHEN duplicate_table THEN NULL;
END $$;
