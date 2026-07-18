-- ═══════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — PEST CONTROL
-- CHR 2015 Reg 25 (premises — health and safety),
-- Reg 36 (fitness of premises), Reg 15 (quality standards).
-- ═══════════════════════════════════════════════════════════════════════════

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_pest_control (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id       uuid NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,

  inspection_type         text NOT NULL DEFAULT 'routine_inspection',
  inspection_date         date NOT NULL DEFAULT CURRENT_DATE,
  pest_type               text NOT NULL DEFAULT 'none_found',
  treatment_outcome       text NOT NULL DEFAULT 'no_treatment_needed',
  risk_level              text NOT NULL DEFAULT 'no_risk',

  location_in_home        text NOT NULL DEFAULT '',
  contractor_name         text,
  contractor_certified    boolean NOT NULL DEFAULT true,

  children_informed       boolean NOT NULL DEFAULT true,
  children_relocated      boolean NOT NULL DEFAULT false,
  chemicals_used          boolean NOT NULL DEFAULT false,
  chemical_safety_sheet_obtained boolean NOT NULL DEFAULT false,
  area_ventilated         boolean NOT NULL DEFAULT true,
  food_areas_affected     boolean NOT NULL DEFAULT false,
  entry_points_sealed     boolean NOT NULL DEFAULT false,
  prevention_measures_implemented boolean NOT NULL DEFAULT false,

  follow_up_required      boolean NOT NULL DEFAULT false,
  follow_up_date          date,
  follow_up_completed     boolean NOT NULL DEFAULT false,
  environmental_health_notified boolean NOT NULL DEFAULT false,

  issues_found            text[] NOT NULL DEFAULT '{}',
  actions_taken           text[] NOT NULL DEFAULT '{}',

  inspected_by            text NOT NULL DEFAULT '',
  notes                   text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_pest_control ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pc_home_isolation ON cs_pest_control;
CREATE POLICY pc_home_isolation ON cs_pest_control
  USING  (home_id = get_my_home_id())
  WITH CHECK (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_pc_home_date ON cs_pest_control(home_id, inspection_date DESC);

EXCEPTION WHEN others THEN
  RAISE NOTICE 'Migration 156 (pest_control) idempotent skip: %', SQLERRM;
END $$;
