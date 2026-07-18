-- Migration: 205_home_environment_inspection
-- Tracks regular inspections of home environment quality

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_home_environment_inspection (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id),
  inspection_area text NOT NULL DEFAULT 'other',
  condition_rating text NOT NULL DEFAULT 'satisfactory',
  hazard_level text NOT NULL DEFAULT 'none',
  compliance_status text NOT NULL DEFAULT 'not_assessed',
  inspection_date date NOT NULL DEFAULT now(),
  inspected_by text NOT NULL,
  cleanliness_acceptable boolean NOT NULL DEFAULT true,
  fire_safety_checked boolean NOT NULL DEFAULT true,
  electrical_safety_checked boolean NOT NULL DEFAULT true,
  water_safety_checked boolean NOT NULL DEFAULT true,
  ventilation_adequate boolean NOT NULL DEFAULT true,
  lighting_adequate boolean NOT NULL DEFAULT true,
  maintenance_up_to_date boolean NOT NULL DEFAULT true,
  child_friendly boolean NOT NULL DEFAULT true,
  accessibility_adequate boolean NOT NULL DEFAULT true,
  security_adequate boolean NOT NULL DEFAULT true,
  pest_free boolean NOT NULL DEFAULT true,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_home_environment_inspection ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cs_home_environment_inspection_home ON cs_home_environment_inspection;
CREATE POLICY cs_home_environment_inspection_home ON cs_home_environment_inspection
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'migration 205 idempotent: %', SQLERRM;
END $$;
